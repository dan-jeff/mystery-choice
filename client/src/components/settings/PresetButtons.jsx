import { PRESETS } from '../../services/engine-presets.js';

export default function PresetButtons({ onApply, currentWeights }) {
  const isActive = (preset) => {
    const keys = ['recencyWeight', 'frequencyWeight', 'durationWeight', 'randomWeight'];
    return keys.every((k) => Math.round(currentWeights[k]) === preset[k]);
  };

  const presets = [
    { id: 'smart', label: 'Smart', preset: PRESETS.smart },
    { id: 'pureRandom', label: 'Pure Random', preset: PRESETS.pureRandom },
  ];

  return (
    <div className="flex gap-2">
      {presets.map(({ id, label, preset }) => {
        const active = isActive(preset);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onApply(preset)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
              active
                ? 'bg-rose-500 text-[#1f1147] '
                : 'bg-amber-200 text-[#1f1147] hover:bg-stone-300'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
