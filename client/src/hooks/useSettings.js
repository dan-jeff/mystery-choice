import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  getAllSettings,
  setSetting,
  deleteSetting,
} from '../services/settings.js';
import { DEFAULTS } from '../services/settings-defaults.js';

const QUERY_KEY = ['settings'];

/**
 * Returns the full settings object (merged with DEFAULTS) plus mutators.
 *
 *   const { settings, setSetting, resetSetting } = useSettings();
 *
 * Writes are optimistic: the cache updates immediately and is rolled back
 * if the SQLite write fails. The engine and UI read from `settings` so a
 * change reflects on the next render.
 */
export function useSettings() {
  const qc = useQueryClient();

  const { data: stored = {} } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllSettings,
    staleTime: Infinity,
  });

  const settings = { ...DEFAULTS, ...stored };

  const setMut = useMutation({
    mutationFn: ({ key, value }) => setSetting(key, value),
    onMutate: async ({ key, value }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const prev = qc.getQueryData(QUERY_KEY) ?? {};
      qc.setQueryData(QUERY_KEY, { ...prev, [key]: value });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEY, ctx.prev);
    },
  });

  const resetMut = useMutation({
    mutationFn: (key) => deleteSetting(key),
    onMutate: async (key) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const prev = qc.getQueryData(QUERY_KEY) ?? {};
      const { [key]: _omit, ...rest } = prev;
      qc.setQueryData(QUERY_KEY, rest);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEY, ctx.prev);
    },
  });

  return {
    settings,
    setSetting: (key, value) => setMut.mutate({ key, value }),
    setSettingAsync: (key, value) => setMut.mutateAsync({ key, value }),
    resetSetting: (key) => resetMut.mutate(key),
  };
}
