import { useSettings } from './useSettings.js';
import { ENGINE_KEYS } from '../services/settings-defaults.js';

/**
 * Thin selector returning only the engine-relevant settings. Consumers
 * (useSpin, the engine itself) pass this object straight to pickGame().
 */
export function useEngineSettings() {
  const { settings } = useSettings();
  const engine = {};
  for (const k of ENGINE_KEYS) engine[k] = settings[k];
  return engine;
}
