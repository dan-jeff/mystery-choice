import { useEffect, useRef, useState } from 'react';
import { SPIN_DURATION_MS, FULL_ROTATIONS } from './config.js';
import {
  WEDGE_COLORS,
  wedgePath,
  iconCenter,
  iconRotationDeg,
} from './wheel-geometry.js';
import { initials } from '../../utils/format.js';

const OUTER_R = 100;
const ICON_R = 78; // tiles sit close to the rim (centre at 78, edge at ~94, ~6 unit margin)
const TILE_SIZE = 32;

/**
 * Wheel-of-fortune. SVG pie wedges (alternating carnival colours), icon
 * tiles centred on each wedge, pointer at 12 o'clock. The whole wheel
 * group rotates via CSS transform; deceleration is ease-out-quad.
 */
export default function SpinnerWheel({ games, spinningTo, onSpinComplete, onTopSlotChange }) {
  const [angle, setAngle] = useState(0);
  const rafRef = useRef(null);
  const completedRef = useRef(false);
  const lastSlotRef = useRef(0);

  // Emit the slot currently under the pointer. Called every frame during a
  // spin so the parent label flickers in sync with the wheel. Idempotent —
  // fires only when the slot index actually changes.
  const emitTopSlot = (currentAngle, slots) => {
    if (slots === 0) return;
    const slotAngle = 360 / slots;
    const slot = ((Math.round(currentAngle / slotAngle) % slots) + slots) % slots;
    if (slot !== lastSlotRef.current) {
      lastSlotRef.current = slot;
      onTopSlotChange?.(slot);
    }
  };

  useEffect(() => {
    // Reset and announce slot 0 whenever the games array changes so the
    // parent's label resets correctly across rescans / spin-again cycles.
    if (games.length === 0) return;
    lastSlotRef.current = -1; // force re-emit
    emitTopSlot(angle, games.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games.length]);

  useEffect(() => {
    if (spinningTo == null || games.length === 0) return undefined;

    completedRef.current = false;
    const slots = games.length;
    const slotAngle = 360 / slots;
    const targetSlotOffset = spinningTo * slotAngle;
    const targetAngle = FULL_ROTATIONS * 360 + targetSlotOffset;

    const startAngle = angle;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = Math.min(1, (now - startTime) / SPIN_DURATION_MS);
      const eased = 1 - (1 - elapsed) ** 2;
      const current = startAngle + (targetAngle - startAngle) * eased;
      setAngle(current);
      emitTopSlot(current, slots);

      if (elapsed < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        const final = targetAngle % 360;
        setAngle(final);
        emitTopSlot(final, slots);
        if (!completedRef.current) {
          completedRef.current = true;
          onSpinComplete?.();
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinningTo, games.length]);

  if (games.length === 0) return null;

  const slots = games.length;

  return (
    <div className="relative mx-auto w-full max-w-[22rem]">
      <svg
        viewBox="-110 -110 220 220"
        className="block h-auto w-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
      >
        {/* Outer ring */}
        <circle cx="0" cy="0" r={OUTER_R + 6} fill="#1f1147" />
        <circle cx="0" cy="0" r={OUTER_R + 6} fill="none" stroke="#fbbf24" strokeWidth="4" />

        {/* Rotating wheel */}
        <g
          style={{
            transform: `rotate(${-angle}deg)`,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          {games.map((g, i) => {
            const fill = WEDGE_COLORS[i % WEDGE_COLORS.length];
            const center = iconCenter(i, slots, ICON_R);
            const rot = iconRotationDeg(i, slots);
            return (
              <g key={g.packageName}>
                <path
                  d={wedgePath(i, slots, OUTER_R)}
                  fill={fill}
                  stroke="#1f1147"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <g transform={`translate(${center.x.toFixed(3)} ${center.y.toFixed(3)}) rotate(${rot})`}>
                  <rect
                    x={-TILE_SIZE / 2}
                    y={-TILE_SIZE / 2}
                    width={TILE_SIZE}
                    height={TILE_SIZE}
                    rx="6"
                    fill="white"
                    stroke="#1f1147"
                    strokeWidth="2"
                  />
                  {g.iconBase64 ? (
                    <image
                      href={`data:image/png;base64,${g.iconBase64}`}
                      x={-TILE_SIZE / 2 + 2}
                      y={-TILE_SIZE / 2 + 2}
                      width={TILE_SIZE - 4}
                      height={TILE_SIZE - 4}
                    />
                  ) : (
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="11"
                      fontFamily="Fredoka, system-ui, sans-serif"
                      fontWeight="700"
                      fill="#1f1147"
                    >
                      {initials(g.appName)}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </g>

        {/* Hub */}
        <circle cx="0" cy="0" r="10" fill="#fef3c7" stroke="#1f1147" strokeWidth="2" />
        <circle cx="0" cy="0" r="4" fill="#1f1147" />
      </svg>

      {/* Pointer at 12 o'clock — outside the SVG so it doesn't rotate */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2"
      >
        <svg viewBox="0 0 24 28" className="h-7 w-6">
          <path
            d="M12 26 L2 6 Q12 0 22 6 Z"
            fill="#1f1147"
            stroke="#fef3c7"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
