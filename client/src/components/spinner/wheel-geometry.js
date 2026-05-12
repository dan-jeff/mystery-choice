// Pure geometry helpers for the wheel. Tested separately from the React
// rendering so the math is easy to verify.

export const WEDGE_COLORS = [
  '#ef4444', // red
  '#fb923c', // orange
  '#fbbf24', // amber
  '#34d399', // mint
  '#38bdf8', // sky
  '#a78bfa', // violet
  '#f472b6', // pink
  '#fb7185', // rose
];

const TAU = Math.PI * 2;

/**
 * Cartesian point on a circle of radius `r`, centered at origin, at the
 * given angle from 12-o'clock measured clockwise (in radians).
 * SVG y grows downward, so we negate cos.
 */
export function pointAt(angleFromTop, r) {
  return {
    x: r * Math.sin(angleFromTop),
    y: -r * Math.cos(angleFromTop),
  };
}

/**
 * SVG path for one wedge of `slots` total, centered on slot index `i`,
 * outer radius `r`. The wedge runs from (i - 0.5)/slots to (i + 0.5)/slots
 * of a full turn so the slot's icon sits in the middle of its wedge.
 */
export function wedgePath(i, slots, r) {
  const a1 = ((i - 0.5) / slots) * TAU;
  const a2 = ((i + 0.5) / slots) * TAU;
  const p1 = pointAt(a1, r);
  const p2 = pointAt(a2, r);
  const largeArc = a2 - a1 > Math.PI ? 1 : 0;
  return `M 0 0 L ${p1.x.toFixed(3)} ${p1.y.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${p2.x.toFixed(3)} ${p2.y.toFixed(3)} Z`;
}

/**
 * Where the icon for slot `i` sits, at radius `iconR`.
 */
export function iconCenter(i, slots, iconR) {
  return pointAt((i / slots) * TAU, iconR);
}

/**
 * SVG-degree rotation for the icon tile in slot `i` so its bottom points
 * toward the wheel's centre (i.e. the icon stands "on" the wedge).
 */
export function iconRotationDeg(i, slots) {
  return (i / slots) * 360;
}
