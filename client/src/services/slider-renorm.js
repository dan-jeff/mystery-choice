// Slider re-normalisation for the four engine weights.
//
// When the user drags one slider to a new value, the other three scale
// proportionally to preserve their existing ratios and keep the sum at 100.
// Pure function so it is trivially testable.

const KEYS = ['recencyWeight', 'frequencyWeight', 'durationWeight', 'randomWeight'];

/**
 * @param {object} weights  current weights, all four keys must be present, sum ≈ 100
 * @param {string} changedKey  one of KEYS
 * @param {number} newValue   in [0, 100]
 * @returns {object} new weights with the same keys, sum 100 (within float epsilon)
 */
export function renormalise(weights, changedKey, newValue) {
  if (!KEYS.includes(changedKey)) {
    throw new Error(`renormalise: unknown key ${changedKey}`);
  }
  const clampedNew = Math.max(0, Math.min(100, newValue));
  const others = KEYS.filter((k) => k !== changedKey);
  const remaining = 100 - clampedNew;
  const oldOtherSum = others.reduce((acc, k) => acc + weights[k], 0);

  const out = { ...weights, [changedKey]: clampedNew };

  if (oldOtherSum <= 0) {
    // All other sliders were at 0; spread the remainder equally.
    const share = remaining / others.length;
    for (const k of others) out[k] = share;
    return out;
  }

  const scale = remaining / oldOtherSum;
  for (const k of others) {
    out[k] = weights[k] * scale;
  }
  return out;
}
