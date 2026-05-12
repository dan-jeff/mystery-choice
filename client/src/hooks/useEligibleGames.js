import { useMemo } from 'react';
import { useGames } from './useGames.js';
import { useExclusions } from './useExclusions.js';

/**
 * Combines `useGames` (002, currently stubbed) with `useExclusions` (008)
 * to return the pool that the engine and spinner draw from.
 *
 * Category filter (009) will chain here when it lands.
 */
export function useEligibleGames() {
  const { games, isLoading, rescan } = useGames();
  const { excluded } = useExclusions();

  const eligible = useMemo(
    () => games.filter((g) => !excluded.has(g.packageName)),
    [games, excluded],
  );

  return { eligible, isLoading, rescan };
}
