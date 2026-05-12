import { describe, it, expect } from 'vitest';
import { pointAt, wedgePath, iconCenter, iconRotationDeg, WEDGE_COLORS } from './wheel-geometry.js';

describe('pointAt', () => {
  it('returns top point for angle 0', () => {
    const p = pointAt(0, 100);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(-100, 6);
  });

  it('returns right point for angle π/2', () => {
    const p = pointAt(Math.PI / 2, 100);
    expect(p.x).toBeCloseTo(100, 6);
    expect(p.y).toBeCloseTo(0, 6);
  });

  it('returns bottom point for angle π', () => {
    const p = pointAt(Math.PI, 100);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(100, 6);
  });
});

describe('iconCenter', () => {
  it('slot 0 of 8 sits at the top', () => {
    const c = iconCenter(0, 8, 50);
    expect(c.x).toBeCloseTo(0, 6);
    expect(c.y).toBeCloseTo(-50, 6);
  });

  it('slot 2 of 8 sits at 3 o\'clock', () => {
    const c = iconCenter(2, 8, 50);
    expect(c.x).toBeCloseTo(50, 6);
    expect(c.y).toBeCloseTo(0, 6);
  });
});

describe('wedgePath', () => {
  it('emits a valid M / L / A / Z path string', () => {
    const d = wedgePath(0, 8, 100);
    expect(d).toMatch(/^M 0 0 L .* A 100 100 0 \d 1 .* Z$/);
  });
});

describe('iconRotationDeg', () => {
  it('top slot has 0 rotation', () => {
    expect(iconRotationDeg(0, 8)).toBe(0);
  });

  it('opposite slot has 180 rotation', () => {
    expect(iconRotationDeg(4, 8)).toBe(180);
  });
});

describe('WEDGE_COLORS', () => {
  it('has at least 8 distinct colours', () => {
    const set = new Set(WEDGE_COLORS);
    expect(set.size).toBeGreaterThanOrEqual(8);
  });
});
