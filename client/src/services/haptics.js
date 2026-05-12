import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { getSetting } from './settings.js';
import { DEFAULTS } from './settings-defaults.js';

async function impact(style) {
  if (Capacitor.getPlatform() === 'web') return;
  const enabled = await getSetting('hapticEnabled', DEFAULTS.hapticEnabled);
  if (!enabled) return;
  try {
    await Haptics.impact({ style });
  } catch {
    // Capacitor plugin not available (e.g. older device) — no-op.
  }
}

export const haptic = {
  spinStart: () => impact(ImpactStyle.Light),
  spinLand: () => impact(ImpactStyle.Heavy),
  launchSuccess: () => impact(ImpactStyle.Light),
};
