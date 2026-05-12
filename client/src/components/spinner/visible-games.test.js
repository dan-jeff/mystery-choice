import { describe, it, expect } from 'vitest';
import { buildVisibleGames } from './visible-games.js';
import { MAX_VISIBLE_SLOTS } from './config.js';
import { mulberry32 } from '../../services/seeded-rng.js';

function mkGames(n) {
  return Array.from({ length: n }, (_, i) => ({
    packageName: `pkg.${i}`,
    appName: `Game ${i}`,
  }));
}

describe('buildVisibleGames', () => {
  it('returns the whole pool (shuffled) when eligible <= MAX_VISIBLE_SLOTS', () => {
    const games = mkGames(5);
    const winner = games[2];
    const out = buildVisibleGames(games, winner, mulberry32(1));
    expect(out).toHaveLength(5);
    expect(out.find((g) => g.packageName === winner.packageName)).toBeDefined();
  });

  it('returns exactly MAX_VISIBLE_SLOTS when eligible > MAX_VISIBLE_SLOTS', () => {
    const games = mkGames(40);
    const winner = games[7];
    const out = buildVisibleGames(games, winner, mulberry32(1));
    expect(out).toHaveLength(MAX_VISIBLE_SLOTS);
  });

  it('always includes the winner', () => {
    const games = mkGames(40);
    const winner = games[33];
    const out = buildVisibleGames(games, winner, mulberry32(2));
    expect(out.find((g) => g.packageName === winner.packageName)).toBeDefined();
  });

  it('contains no duplicates', () => {
    const games = mkGames(40);
    const winner = games[12];
    const out = buildVisibleGames(games, winner, mulberry32(3));
    const names = new Set(out.map((g) => g.packageName));
    expect(names.size).toBe(out.length);
  });

  it('returns empty array when eligible is empty', () => {
    const out = buildVisibleGames([], { packageName: 'x', appName: 'X' }, mulberry32(4));
    expect(out).toEqual([]);
  });

  it('handles missing winner gracefully (returns first N)', () => {
    const games = mkGames(20);
    const out = buildVisibleGames(games, null, mulberry32(5));
    expect(out).toHaveLength(MAX_VISIBLE_SLOTS);
  });
});
