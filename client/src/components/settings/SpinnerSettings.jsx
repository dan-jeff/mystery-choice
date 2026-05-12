import { useSettings } from '../../hooks/useSettings.js';
import { renormalise } from '../../services/slider-renorm.js';
import WeightSlider from './WeightSlider.jsx';
import PresetButtons from './PresetButtons.jsx';

const KEYS = ['recencyWeight', 'frequencyWeight', 'durationWeight', 'randomWeight'];

export default function SpinnerSettings() {
  const { settings, setSetting } = useSettings();

  const weights = {
    recencyWeight: settings.recencyWeight,
    frequencyWeight: settings.frequencyWeight,
    durationWeight: settings.durationWeight,
    randomWeight: settings.randomWeight,
  };

  const updateWeight = (key, value) => {
    const next = renormalise(weights, key, value);
    for (const k of KEYS) setSetting(k, next[k]);
  };

  const applyPreset = (preset) => {
    for (const k of KEYS) setSetting(k, preset[k]);
  };

  return (
    <section className="flex flex-col gap-5">
      <header>
        <h2 className="text-lg font-semibold text-[#1f1147]">Weighting</h2>
        <p className="text-xs text-[#1f1147]/60">
          How the spinner picks. Higher recency favours neglected games. Sliders re-balance to sum to 100.
        </p>
      </header>

      <PresetButtons onApply={applyPreset} currentWeights={weights} />

      <div className="flex flex-col gap-4">
        <WeightSlider
          label="Recency"
          color="fuchsia"
          value={settings.recencyWeight}
          onChange={(v) => updateWeight('recencyWeight', v)}
        />
        <WeightSlider
          label="Frequency"
          color="cyan"
          value={settings.frequencyWeight}
          onChange={(v) => updateWeight('frequencyWeight', v)}
        />
        <WeightSlider
          label="Duration"
          color="amber"
          value={settings.durationWeight}
          onChange={(v) => updateWeight('durationWeight', v)}
        />
        <WeightSlider
          label="Random"
          color="emerald"
          value={settings.randomWeight}
          onChange={(v) => updateWeight('randomWeight', v)}
        />
      </div>

      <div className="rounded-xl border border-[#1f1147]/30 bg-amber-100 p-4">
        <label className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-[#1f1147]">Prevent immediate repeat</div>
            <div className="text-xs text-[#1f1147]/60">
              Skip the most recent winner on the next spin.
            </div>
          </div>
          <input
            type="checkbox"
            checked={!!settings.preventRepeat}
            onChange={(e) => setSetting('preventRepeat', e.target.checked)}
            className="h-5 w-5 accent-rose-500"
          />
        </label>
      </div>

      <div className="rounded-xl border border-[#1f1147]/30 bg-amber-100 p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-sm font-medium text-[#1f1147]">Cooldown</div>
            <div className="text-xs text-[#1f1147]/60">
              Don&apos;t spin the same game within this many hours.
            </div>
          </div>
          <span className="text-sm tabular-nums text-[#1f1147]/80">
            {settings.cooldownHours}h
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="168"
          step="1"
          value={settings.cooldownHours}
          onChange={(e) => setSetting('cooldownHours', Number(e.target.value))}
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-amber-200 accent-rose-500"
        />
      </div>
    </section>
  );
}
