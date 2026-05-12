// Single source of truth for every persisted scalar. Each key is read via
// getSetting(key, DEFAULTS[key]) so a missing row transparently falls back
// to the default.

export const DEFAULTS = {
  // engine
  recencyWeight: 40,
  frequencyWeight: 30,
  durationWeight: 20,
  randomWeight: 10,
  preventRepeat: true,
  cooldownHours: 24,
  historyLength: 100,
  durationAvailable: false, // flips true after PACKAGE_USAGE_STATS opt-in

  // UI
  hapticEnabled: true,
  soundEnabled: false,
};

export const ENGINE_KEYS = [
  'recencyWeight',
  'frequencyWeight',
  'durationWeight',
  'randomWeight',
  'preventRepeat',
  'cooldownHours',
  'historyLength',
  'durationAvailable',
];

export const UI_KEYS = ['hapticEnabled', 'soundEnabled'];
