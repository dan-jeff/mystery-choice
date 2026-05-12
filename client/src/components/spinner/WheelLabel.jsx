/**
 * Single-line label rendered directly below the wheel.
 *
 *   idle      → "Press SPIN"
 *   spinning  → current top-slot app name (flickers as the wheel rotates)
 *   result    → winner's name with a ★ marker
 *
 * Fixed height (h-12) prevents the surrounding layout from jumping when
 * a short word ("Hades") is followed by a long one ("Pokémon GO").
 */
export default function WheelLabel({ state, game }) {
  const isIdle = state === 'idle';
  const isResult = state === 'result';

  let body;
  if (isIdle) {
    body = (
      <span className="font-display text-sm font-bold uppercase tracking-widest text-[#1f1147]/60">
        Press SPIN
      </span>
    );
  } else if (isResult) {
    body = (
      <span className="font-display text-2xl font-bold text-[#1f1147]">
        {game?.appName ?? '—'}
        <span className="ml-2 text-amber-500">★</span>
      </span>
    );
  } else {
    // spinning — show the slot under the pointer, no truncation glide so
    // the natural rapid changes give the "flicker" feel.
    body = (
      <span className="font-display text-xl font-bold text-[#1f1147] tabular-nums">
        {game?.appName ?? ' '}
      </span>
    );
  }

  return (
    <div
      className="flex h-12 items-center justify-center px-2 text-center"
      aria-live="polite"
    >
      <div className="max-w-full truncate">{body}</div>
    </div>
  );
}
