import { useQuery } from '@tanstack/react-query';
import { getEngineHistory } from '../services/history.js';
import { useSettings } from './useSettings.js';

/**
 * Returns the recent N spins for the engine (recency / frequency / cooldown
 * computations). N is `max(historyLength, 200)` so the engine has more
 * context than the user-visible history retention.
 */
export function useEngineHistory() {
  const { settings } = useSettings();
  const n = Math.max(settings.historyLength ?? 100, 200);

  const { data = [] } = useQuery({
    queryKey: ['engine-history', n],
    queryFn: () => getEngineHistory(n),
    staleTime: 5_000,
  });

  return data;
}
