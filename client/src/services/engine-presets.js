// Engine weight presets. Constitution §1.4 requires "Pure Random" to always be
// one tap away. "Smart" is the default per HLD §5.

export const PRESETS = {
  smart: {
    recencyWeight: 40,
    frequencyWeight: 30,
    durationWeight: 20,
    randomWeight: 10,
  },
  pureRandom: {
    recencyWeight: 0,
    frequencyWeight: 0,
    durationWeight: 0,
    randomWeight: 100,
  },
};

export const DEFAULT_ENGINE_RULES = {
  preventRepeat: true,
  cooldownHours: 24,
  durationAvailable: false, // flips true after PACKAGE_USAGE_STATS opt-in
};
