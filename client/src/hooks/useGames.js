import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCachedGames, rescan } from '../services/game-detection.js';

const QUERY_KEY = ['games'];

/**
 * Cache-first reads of the on-device games list. On mount we kick off a
 * background rescan via the GameDetector Capacitor plugin (or the web
 * fixture) so the cache stays fresh. The spinner renders against the
 * cached list immediately.
 */
export function useGames() {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getCachedGames,
    staleTime: Infinity,
  });

  const rescanMut = useMutation({
    mutationFn: rescan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  // Background rescan once per mount. Constitution §1.5 says fail soft —
  // if the plugin errors we keep whatever we had cached.
  useEffect(() => {
    rescanMut.mutate(undefined, {
      onError: () => {
        // swallow; cached data still renders
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    games: data,
    isLoading,
    isRescanning: rescanMut.isPending,
    rescan: () => rescanMut.mutate(),
  };
}
