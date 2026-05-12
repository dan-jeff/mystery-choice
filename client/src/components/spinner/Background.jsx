// Sunburst rays radiating from the centre of the screen behind the wheel.
// Pure SVG, no images. Subtle (low alpha) so it doesn't fight the wheel.
const RAY_COUNT = 24;

export default function Background() {
  const rays = Array.from({ length: RAY_COUNT }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Warm gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-200 via-orange-200 to-rose-200" />

      {/* Sunburst rays */}
      <svg
        viewBox="-100 -100 200 200"
        className="absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 opacity-30"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.0" />
            <stop offset="40%" stopColor="#fbbf24" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {rays.map((i) => {
          const angle = (i / RAY_COUNT) * 360;
          return (
            <polygon
              key={i}
              points="-3,0 3,0 1,-100 -1,-100"
              fill="url(#ray)"
              transform={`rotate(${angle})`}
            />
          );
        })}
      </svg>
    </div>
  );
}
