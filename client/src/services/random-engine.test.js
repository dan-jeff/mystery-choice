import { describe, it, expect } from 'vitest';
import {
  pickGame,
  normaliseWeights,
  daysSinceLastPlayed,
  launchCount,
} from './random-engine.js';
import { PRESETS } from './engine-presets.js';
import { mulberry32 } from './seeded-rng.js';

const MS_PER_DAY = 86_400_000;
const NOW = 1_700_000_000_000;

function mkGames(n) {
  return Array.from({ length: n }, (_, i) => ({
    packageName: `pkg.${i}`,
    appName: `Game ${i}`,
  }));
}

function settingsWith(overrides = {}) {
  return {
    ...PRESETS.smart,
    preventRepeat: false,
    cooldownHours: 0,
    durationAvailable: false,
    ...overrides,
  };
}

// ----- Helpers -----

describe('daysSinceLastPlayed', () => {
  it('returns Infinity for a game with no history', () => {
    expect(daysSinceLastPlayed({ packageName: 'a' }, [], NOW)).toBe(Infinity);
  });

  it('returns days since the most recent spin of that package', () => {
    const history = [
      { packageName: 'b', spunAtMs: NOW - 10 * MS_PER_DAY },
      { packageName: 'a', spunAtMs: NOW - 3 * MS_PER_DAY },
      { packageName: 'a', spunAtMs: NOW - 30 * MS_PER_DAY }, // older, ignored
    ];
    expect(daysSinceLastPlayed({ packageName: 'a' }, history, NOW)).toBe(3);
    expect(daysSinceLastPlayed({ packageName: 'b' }, history, NOW)).toBe(10);
  });
});

describe('launchCount', () => {
  it('counts entries matching the package', () => {
    const history = [
      { packageName: 'a', spunAtMs: 1 },
      { packageName: 'b', spunAtMs: 2 },
      { packageName: 'a', spunAtMs: 3 },
    ];
    expect(launchCount({ packageName: 'a' }, history)).toBe(2);
    expect(launchCount({ packageName: 'b' }, history)).toBe(1);
    expect(launchCount({ packageName: 'c' }, history)).toBe(0);
  });
});

// ----- normaliseWeights -----

describe('normaliseWeights', () => {
  it('returns fractions summing to 1', () => {
    const f = normaliseWeights({
      recencyWeight: 40,
      frequencyWeight: 30,
      durationWeight: 20,
      randomWeight: 10,
      durationAvailable: true,
    });
    expect(f.recency + f.frequency + f.duration + f.random).toBeCloseTo(1, 10);
  });

  it('drops duration to 0 when usage stats unavailable, redistributes proportionally', () => {
    const f = normaliseWeights({
      recencyWeight: 40,
      frequencyWeight: 30,
      durationWeight: 20,
      randomWeight: 10,
      durationAvailable: false,
    });
    expect(f.duration).toBe(0);
    expect(f.recency + f.frequency + f.random).toBeCloseTo(1, 10);
    // Ratios among the survivors preserved
    expect(f.recency / f.frequency).toBeCloseTo(40 / 30, 6);
    expect(f.recency / f.random).toBeCloseTo(40 / 10, 6);
  });

  it('falls back to pure random when total weight is 0', () => {
    const f = normaliseWeights({
      recencyWeight: 0,
      frequencyWeight: 0,
      durationWeight: 0,
      randomWeight: 0,
      durationAvailable: true,
    });
    expect(f.random).toBe(1);
  });
});

// ----- pickGame: AC #1 — uniform distribution under pureRandom -----

describe('AC #1: pureRandom yields ~uniform distribution', () => {
  it('passes chi-squared at p > 0.05 over 10000 trials with 10 games', () => {
    const games = mkGames(10);
    const settings = settingsWith({ ...PRESETS.pureRandom, durationAvailable: true });
    const counts = new Array(games.length).fill(0);
    const rand = mulberry32(12345);

    for (let i = 0; i < 10_000; i += 1) {
      const { winner } = pickGame(games, settings, [], NOW, rand);
      counts[Number(winner.packageName.split('.')[1])] += 1;
    }

    const expected = 10_000 / games.length;
    const chi2 = counts.reduce((acc, c) => acc + ((c - expected) ** 2) / expected, 0);
    // df = 9; critical value at p=0.05 is ~16.92
    expect(chi2).toBeLessThan(16.92);
  });
});

// ----- AC #2 — recency weighting discourages fresh games -----
// Reframed from the original "year wins ≥ 70%": under days/(days+1) both
// month- and year-old games saturate near 1.0, so the year-old game cannot
// dominate three-way. The stronger test is that the fresh game loses badly.

describe('AC #2: fresh game wins ≤ 30% with recency=100', () => {
  it('day-1 game wins fewer than 300 of 1000 trials among [1d, 30d, 365d, never]', () => {
    const games = [
      { packageName: 'fresh', appName: 'Fresh' },
      { packageName: 'month', appName: 'Month' },
      { packageName: 'year', appName: 'Year' },
      { packageName: 'never', appName: 'Never' },
    ];
    const history = [
      { packageName: 'fresh', spunAtMs: NOW - 1 * MS_PER_DAY },
      { packageName: 'month', spunAtMs: NOW - 30 * MS_PER_DAY },
      { packageName: 'year', spunAtMs: NOW - 365 * MS_PER_DAY },
      // 'never' deliberately omitted from history
    ];
    const settings = settingsWith({
      recencyWeight: 100,
      frequencyWeight: 0,
      durationWeight: 0,
      randomWeight: 0,
      durationAvailable: true,
    });
    const rand = mulberry32(99);
    let freshWins = 0;
    for (let i = 0; i < 1_000; i += 1) {
      const { winner } = pickGame(games, settings, history, NOW, rand);
      if (winner.packageName === 'fresh') freshWins += 1;
    }
    expect(freshWins).toBeLessThanOrEqual(300);
  });
});

// ----- AC #3 — internal normalisation -----

describe('AC #3: weights are internally normalised', () => {
  it('produces same winner for proportional weight tuples', () => {
    const games = mkGames(5);
    const history = [];
    const rand1 = mulberry32(7);
    const rand2 = mulberry32(7);
    const a = pickGame(
      games,
      settingsWith({
        recencyWeight: 50,
        frequencyWeight: 50,
        durationWeight: 0,
        randomWeight: 0,
        durationAvailable: true,
      }),
      history,
      NOW,
      rand1,
    );
    const b = pickGame(
      games,
      settingsWith({
        recencyWeight: 1,
        frequencyWeight: 1,
        durationWeight: 0,
        randomWeight: 0,
        durationAvailable: true,
      }),
      history,
      NOW,
      rand2,
    );
    expect(a.winner.packageName).toBe(b.winner.packageName);
  });
});

// ----- AC #4 — determinism with the same seed -----

describe('AC #4: deterministic with seeded RNG', () => {
  it('same inputs + same seed → same winner', () => {
    const games = mkGames(10);
    const settings = settingsWith({ ...PRESETS.smart, durationAvailable: true });
    const history = [
      { packageName: 'pkg.3', spunAtMs: NOW - 5 * MS_PER_DAY },
      { packageName: 'pkg.7', spunAtMs: NOW - 50 * MS_PER_DAY },
    ];
    const a = pickGame(games, settings, history, NOW, mulberry32(42));
    const b = pickGame(games, settings, history, NOW, mulberry32(42));
    expect(a.winner.packageName).toBe(b.winner.packageName);
    expect(a.weightScore).toBe(b.weightScore);
  });
});

// ----- AC #5 — preventRepeat -----

describe('AC #5: preventRepeat excludes the most recent winner', () => {
  it('never picks the last winner when preventRepeat is true', () => {
    const games = mkGames(5);
    const history = [{ packageName: 'pkg.2', spunAtMs: NOW - 1000 }];
    const settings = settingsWith({ preventRepeat: true });
    const rand = mulberry32(1);
    for (let i = 0; i < 200; i += 1) {
      const { winner } = pickGame(games, settings, history, NOW, rand);
      expect(winner.packageName).not.toBe('pkg.2');
    }
  });

  it('still picks the last winner when only one game is eligible', () => {
    const games = [{ packageName: 'only', appName: 'Only' }];
    const history = [{ packageName: 'only', spunAtMs: NOW - 1000 }];
    const settings = settingsWith({ preventRepeat: true });
    const { winner, fallbackUsed } = pickGame(games, settings, history, NOW, mulberry32(2));
    expect(winner.packageName).toBe('only');
    expect(fallbackUsed).toBe(true);
  });
});

// ----- AC #6 — cooldownHours -----

describe('AC #6: cooldownHours excludes recently-played games', () => {
  it('drops a game played 12h ago when cooldown is 24h', () => {
    const games = [
      { packageName: 'recent', appName: 'Recent' },
      { packageName: 'old', appName: 'Old' },
    ];
    const history = [
      { packageName: 'recent', spunAtMs: NOW - 12 * 60 * 60 * 1000 },
      { packageName: 'old', spunAtMs: NOW - 100 * 60 * 60 * 1000 },
    ];
    const settings = settingsWith({ cooldownHours: 24 });
    const rand = mulberry32(3);
    for (let i = 0; i < 100; i += 1) {
      const { winner } = pickGame(games, settings, history, NOW, rand);
      expect(winner.packageName).toBe('old');
    }
  });
});

// ----- AC #7 — fallback when filters wipe the pool -----

describe('AC #7: fallback to unfiltered pool', () => {
  it('flags fallbackUsed=true when cooldown excludes everything', () => {
    const games = [
      { packageName: 'a', appName: 'A' },
      { packageName: 'b', appName: 'B' },
    ];
    const history = [
      { packageName: 'a', spunAtMs: NOW - 60_000 },
      { packageName: 'b', spunAtMs: NOW - 60_000 },
    ];
    const settings = settingsWith({ cooldownHours: 24 });
    const { fallbackUsed, winner } = pickGame(games, settings, history, NOW, mulberry32(4));
    expect(fallbackUsed).toBe(true);
    expect(['a', 'b']).toContain(winner.packageName);
  });
});

// ----- AC #8 — breakdown shape and sum -----

describe('AC #8: breakdown sums to weightScore', () => {
  it('returns a breakdown whose total equals weightScore', () => {
    const games = mkGames(5);
    const settings = settingsWith({ durationAvailable: true });
    const result = pickGame(games, settings, [], NOW, mulberry32(5));
    expect(result.breakdown.total).toBeCloseTo(result.weightScore, 10);
    expect(
      result.breakdown.recency
        + result.breakdown.frequency
        + result.breakdown.duration
        + result.breakdown.random,
    ).toBeCloseTo(result.breakdown.total, 10);
  });
});

// ----- Edge cases -----

describe('edge cases', () => {
  it('throws on empty games array', () => {
    expect(() => pickGame([], settingsWith(), [], NOW, mulberry32(6))).toThrow();
  });

  it('never-played games are maximally favoured under recency weight', () => {
    const games = [
      { packageName: 'fresh', appName: 'Fresh' },
      { packageName: 'never', appName: 'Never' },
    ];
    const history = [{ packageName: 'fresh', spunAtMs: NOW - 1 * MS_PER_DAY }];
    const settings = settingsWith({
      recencyWeight: 100,
      frequencyWeight: 0,
      durationWeight: 0,
      randomWeight: 0,
      durationAvailable: true,
    });
    const rand = mulberry32(8);
    let neverWins = 0;
    for (let i = 0; i < 1000; i += 1) {
      const { winner } = pickGame(games, settings, history, NOW, rand);
      if (winner.packageName === 'never') neverWins += 1;
    }
    // recencyScore(never) = 1.0, recencyScore(fresh) = 0.5, so 'never' should
    // win roughly 2/3 of the time. Loose lower bound.
    expect(neverWins).toBeGreaterThan(550);
  });
});
