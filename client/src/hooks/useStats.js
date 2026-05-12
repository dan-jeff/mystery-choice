import { useQuery } from '@tanstack/react-query';
import { getStats } from '../services/history.js';

export function useStats(range = {}) {
  return useQuery({
    queryKey: ['stats', range.fromMs ?? null, range.toMs ?? null],
    queryFn: () => getStats(range),
    staleTime: 30_000,
  });
}
