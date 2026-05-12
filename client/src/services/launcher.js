import { Capacitor, registerPlugin } from '@capacitor/core';
import { haptic } from './haptics.js';
import { markLaunched } from './history.js';

// Real Launcher plugin lands in 005. Register a lazy reference so that on
// native Android the binding resolves; on web (Vite dev), we hit the
// `web !== 'android'` branch and fall back to a no-op stub.
const Launcher = registerPlugin('Launcher', {
  web: () => ({
    async launch(_opts) {
      console.info('[launcher stub] would launch', _opts?.packageName);
      return { success: false, error: 'Launch is only available on Android (web stub).' };
    },
  }),
});

export async function launchGame(game, spinId) {
  const platform = Capacitor.getPlatform();
  if (platform !== 'android') {
    console.info('[launcher stub] would launch', game.packageName);
    return { success: false, error: 'Launch is only available on Android.' };
  }

  const { success, error } = await Launcher.launch({ packageName: game.packageName });
  if (success) {
    haptic.launchSuccess();
    if (spinId != null) {
      await markLaunched(spinId).catch(() => {});
    }
  }
  return { success, error };
}
