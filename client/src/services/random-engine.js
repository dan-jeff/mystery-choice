// Weighted random selection engine — pure function, no side effects.
//
// Algorithm overview (see specs/004-weighted-random-engine/plan.md):
//   1. Filter eligible games by preventRepeat + cooldownHours.
//   2. If filters wipe out the pool, fall back to pure-random over the
//      unfiltered list with fallbackUsed=true.
//   3. Normalise weights; redistribute duration weight when usage stats
//      are unavailable.
//   4. Score each game on four axes in [0, 1], combine with weights,
//      pick via cumulative-sum weighted sampling.
//
// NOTE on recencyScore = days / (days + 1):
//   Resolved 2026-05-11. The HLD originally wrote 1/(days+1) but described
//   it as "higher = played longer ago". We follow the English intent. A
//   never-played game has daysSinceLastPlayed=Infinity, so recencyScore→1.

const MS_PER_DAY = 86_400_000;

/**
 * @param {Array<{packageName:string,appName:string}>} games
 * @param {object} settings
 * @param {Array<{packageName:string,spunAtMs:number}>} history  most recent first
 * @param {number} now epoch ms
 * @param {() => number} [rand]
 * @returns {{winner:object,weightScore:number,breakdown:object,fallbackUsed:boolean}}
 */
export function pickGame(games, settings, history, now, rand = Math.random) {
  if (!Array.isArray(games) || games.length === 0) {
    throw new Error('pickGame: games must be a non-empty array');
  }

  const eligible = filterEligible(games, settings, history, now);
  const fallbackUsed = eligible.length === 0;
  const pool = fallbackUsed ? games : eligible;

  if (pool.length === 1) {
    return {
      winner: pool[0],
      weightScore: 1,
      breakdown: { recency: 0, frequency: 0, duration: 0, random: 0, total: 1 },
      fallbackUsed,
    };
  }

  // Pure-random shortcut when only the random axis matters (covers preset
  // pureRandom AND the fallback path so distribution stays uniform).
  if (fallbackUsed) {
    const winner = pool[Math.floor(rand() * pool.length)];
    return {
      winner,
      weightScore: 1 / pool.length,
      breakdown: { recency: 0, frequency: 0, duration: 0, random: 1, total: 1 / pool.length },
      fallbackUsed: true,
    };
  }

  const fractions = normaliseWeights(settings);
  const scored = pool.map((g) => scoreGame(g, history, now, fractions, rand));
  const winner = weightedSample(scored, rand);

  return {
    winner: winner.game,
    weightScore: winner.total,
    breakdown: winner.breakdown,
    fallbackUsed: false,
  };
}

// ---------- internals ----------

function filterEligible(games, settings, history, now) {
  const lastWinner = settings.preventRepeat ? history?.[0]?.packageName : undefined;
  const cooldownMs = (settings.cooldownHours || 0) * 60 * 60 * 1000;
  const lastSpunByPkg = mostRecentSpinByPackage(history);

  return games.filter((g) => {
    if (g.packageName === lastWinner) return false;
    if (cooldownMs > 0) {
      const lastMs = lastSpunByPkg.get(g.packageName);
      if (lastMs !== undefined && now - lastMs < cooldownMs) return false;
    }
    return true;
  });
}

/**
 * Returns weights as fractions of 1. When durationAvailable is false the
 * duration share is redistributed proportionally across recency/frequency/random,
 * preserving their existing ratios.
 */
export function normaliseWeights(settings) {
  let { recencyWeight: r, frequencyWeight: f, durationWeight: d, randomWeight: x } = settings;
  r = Math.max(0, r ?? 0);
  f = Math.max(0, f ?? 0);
  d = Math.max(0, d ?? 0);
  x = Math.max(0, x ?? 0);

  if (!settings.durationAvailable) {
    const otherSum = r + f + x;
    if (otherSum > 0) {
      const scale = (otherSum + d) / otherSum;
      r *= scale;
      f *= scale;
      x *= scale;
    } else {
      // All weight was on duration. Distribute equally across the survivors.
      const share = d / 3;
      r = f = x = share;
    }
    d = 0;
  }

  const total = r + f + d + x;
  if (total === 0) {
    return { recency: 0, frequency: 0, duration: 0, random: 1 };
  }
  return {
    recency: r / total,
    frequency: f / total,
    duration: d / total,
    random: x / total,
  };
}

function scoreGame(game, history, now, fractions, rand) {
  const days = daysSinceLastPlayed(game, history, now);
  const launches = launchCount(game, history);

  // Recency: days/(days+1) → 1 for never-played, 0 for fresh. Favours
  // neglected games (constitution §1.4).
  const recencyScore = days === Infinity ? 1 : days / (days + 1);
  const frequencyScore = 1 / (launches + 1);
  const durationScore = fractions.duration > 0 ? 0 : 0; // see avgSessionMinutes stub
  const randomScore = rand();

  const recency = recencyScore * fractions.recency;
  const frequency = frequencyScore * fractions.frequency;
  const duration = durationScore * fractions.duration;
  const random = randomScore * fractions.random;
  const total = recency + frequency + duration + random;

  return {
    game,
    breakdown: { recency, frequency, duration, random, total },
    total,
  };
}

function weightedSample(scored, rand) {
  const sum = scored.reduce((acc, s) => acc + s.total, 0);
  if (sum <= 0) return scored[Math.floor(rand() * scored.length)];

  const target = rand() * sum;
  let cumulative = 0;
  for (const s of scored) {
    cumulative += s.total;
    if (cumulative >= target) return s;
  }
  return scored[scored.length - 1]; // floating-point safety net
}

// ---------- helpers (exported for tests) ----------

export function daysSinceLastPlayed(game, history, now) {
  const lastSpunByPkg = mostRecentSpinByPackage(history);
  const last = lastSpunByPkg.get(game.packageName);
  if (last === undefined) return Infinity;
  return (now - last) / MS_PER_DAY;
}

export function launchCount(game, history) {
  if (!history) return 0;
  let n = 0;
  for (const h of history) if (h.packageName === game.packageName) n += 1;
  return n;
}

/**
 * Stubbed for MVP. Real implementation requires PACKAGE_USAGE_STATS; until
 * then we return 0, and `normaliseWeights` redistributes the duration share.
 */
export function avgSessionMinutes(_game) {
  return 0;
}

function mostRecentSpinByPackage(history) {
  const out = new Map();
  if (!history) return out;
  for (const h of history) {
    const existing = out.get(h.packageName);
    if (existing === undefined || h.spunAtMs > existing) {
      out.set(h.packageName, h.spunAtMs);
    }
  }
  return out;
}
