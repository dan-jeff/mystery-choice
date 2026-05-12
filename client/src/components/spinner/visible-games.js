import { MAX_VISIBLE_SLOTS } from './config.js';

/**
 * Pick which games appear on the wheel for one spin. The winner is always
 * included; if the eligible pool is larger than MAX_VISIBLE_SLOTS, the rest
 * of the slots are filled with random other games. Pure function so that
 * the actual selection (engine) stays decoupled from the visualisation.
 *
 * @param {Array} eligible        full eligible pool from useEligibleGames()
 * @param {object} winner         the game returned by pickGame()
 * @param {() => number} [rand]   for tests
 * @returns {Array}               length min(eligible.length, MAX_VISIBLE_SLOTS)
 */
export function buildVisibleGames(eligible, winner, rand = Math.random) {
  if (!Array.isArray(eligible) || eligible.length === 0) return [];
  if (!winner) return eligible.slice(0, MAX_VISIBLE_SLOTS);

  if (eligible.length <= MAX_VISIBLE_SLOTS) {
    return shuffle(eligible.slice(), rand);
  }

  const pool = eligible.filter((g) => g.packageName !== winner.packageName);
  const sample = shuffle(pool.slice(), rand).slice(0, MAX_VISIBLE_SLOTS - 1);
  return shuffle([winner, ...sample], rand);
}

function shuffle(arr, rand) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
