import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getRecentSpins } from '../services/history.js';

const PAGE_SIZE = 50;

/**
 * Paginated spin history, newest first.
 *
 *   const { spins, fetchNextPage, hasNextPage, isFetching } = useHistory();
 */
export function useHistory() {
  const query = useInfiniteQuery({
    queryKey: ['history'],
    queryFn: ({ pageParam = 0 }) => getRecentSpins(PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
  });

  const spins = (query.data?.pages ?? []).flat();
  return { ...query, spins };
}

/**
 * Imperative invalidation, called after a new spin is recorded. Bust both
 * the user-visible paginated history and the engine's recent-N read so the
 * cooldown filter sees the latest spin immediately.
 */
export function useInvalidateHistory() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['history'] });
    qc.invalidateQueries({ queryKey: ['engine-history'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
  };
}
