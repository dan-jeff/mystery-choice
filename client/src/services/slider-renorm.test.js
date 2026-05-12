import { describe, it, expect } from 'vitest';
import { renormalise } from './slider-renorm.js';

const SMART = {
  recencyWeight: 40,
  frequencyWeight: 30,
  durationWeight: 20,
  randomWeight: 10,
};

function sum(w) {
  return w.recencyWeight + w.frequencyWeight + w.durationWeight + w.randomWeight;
}

describe('renormalise', () => {
  it('always keeps the sum at 100', () => {
    for (let v = 0; v <= 100; v += 5) {
      const out = renormalise(SMART, 'recencyWeight', v);
      expect(sum(out)).toBeCloseTo(100, 8);
    }
  });

  it('sets the dragged slider to the requested value', () => {
    const out = renormalise(SMART, 'durationWeight', 50);
    expect(out.durationWeight).toBe(50);
  });

  it('preserves ratios among the untouched sliders', () => {
    // SMART has recency:frequency:random = 40:30:10. After moving duration
    // to 50, the remaining 50 should split as 40:30:10 → 25:18.75:6.25.
    const out = renormalise(SMART, 'durationWeight', 50);
    expect(out.recencyWeight / out.frequencyWeight).toBeCloseTo(40 / 30, 8);
    expect(out.recencyWeight / out.randomWeight).toBeCloseTo(40 / 10, 8);
    expect(out.recencyWeight).toBeCloseTo(25, 8);
    expect(out.frequencyWeight).toBeCloseTo(18.75, 8);
    expect(out.randomWeight).toBeCloseTo(6.25, 8);
  });

  it('clamps the new value to [0, 100]', () => {
    expect(renormalise(SMART, 'recencyWeight', -10).recencyWeight).toBe(0);
    expect(renormalise(SMART, 'recencyWeight', 150).recencyWeight).toBe(100);
  });

  it('when all other sliders are 0, distributes the remainder equally', () => {
    const concentrated = {
      recencyWeight: 100,
      frequencyWeight: 0,
      durationWeight: 0,
      randomWeight: 0,
    };
    const out = renormalise(concentrated, 'recencyWeight', 40);
    expect(out.recencyWeight).toBe(40);
    expect(out.frequencyWeight).toBeCloseTo(20, 8);
    expect(out.durationWeight).toBeCloseTo(20, 8);
    expect(out.randomWeight).toBeCloseTo(20, 8);
  });

  it('handles dragging a slider to 100 (everything else → 0)', () => {
    const out = renormalise(SMART, 'recencyWeight', 100);
    expect(out.recencyWeight).toBe(100);
    expect(out.frequencyWeight).toBeCloseTo(0, 8);
    expect(out.durationWeight).toBeCloseTo(0, 8);
    expect(out.randomWeight).toBeCloseTo(0, 8);
  });

  it('throws on an unknown key', () => {
    expect(() => renormalise(SMART, 'notAKey', 50)).toThrow();
  });
});
