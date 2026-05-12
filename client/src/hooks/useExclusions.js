import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  exclude as excludeSvc,
  unexclude as unexcludeSvc,
  getExclusions,
  getExclusionsDetailed,
} from '../services/exclusions.js';

const QUERY_KEY = ['exclusions'];
const QUERY_KEY_DETAILED = ['exclusions-detailed'];

export function useExclusions() {
  const qc = useQueryClient();

  const { data: excluded = new Set() } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getExclusions,
    staleTime: 30_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: QUERY_KEY });
    qc.invalidateQueries({ queryKey: QUERY_KEY_DETAILED });
  };

  const excludeMut = useMutation({
    mutationFn: ({ packageName, reason }) => excludeSvc(packageName, reason),
    onSuccess: invalidate,
  });

  const unexcludeMut = useMutation({
    mutationFn: (packageName) => unexcludeSvc(packageName),
    onSuccess: invalidate,
  });

  return {
    excluded,
    isExcluded: (pkg) => excluded.has(pkg),
    exclude: (packageName, reason = null) => excludeMut.mutate({ packageName, reason }),
    unexclude: (packageName) => unexcludeMut.mutate(packageName),
  };
}

export function useExclusionsDetailed() {
  return useQuery({
    queryKey: QUERY_KEY_DETAILED,
    queryFn: getExclusionsDetailed,
    staleTime: 30_000,
  });
}
