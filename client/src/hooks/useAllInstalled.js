import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllInstalled, setUserIsGame } from '../services/game-detection.js';

const QUERY_KEY = ['games-all'];

/**
 * Returns every installed app the GameDetector scan found (games and
 * non-games), with a mutator for setting the per-app user override.
 *
 * Used by the Manage Games screen so users can mark a non-game app as a
 * game (or vice versa). Invalidating ['games'] keeps the spinner in sync.
 */
export function useAllInstalled() {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllInstalled,
    staleTime: 30_000,
  });

  const setMut = useMutation({
    mutationFn: ({ packageName, value }) => setUserIsGame(packageName, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['games'] });
    },
  });

  return {
    all: data,
    isLoading,
    setIsGame: (packageName, value) => setMut.mutate({ packageName, value }),
  };
}
