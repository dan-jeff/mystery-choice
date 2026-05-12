import { useSettings } from '../../hooks/useSettings.js';

export default function FeedbackSettings() {
  const { settings, setSetting } = useSettings();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-semibold text-[#1f1147]">Feedback</h2>
        <p className="text-xs text-[#1f1147]/60">
          Sensory feedback when the spinner lands.
        </p>
      </header>

      <ToggleRow
        label="Haptic feedback"
        description="Buzz on spin start and result."
        value={!!settings.hapticEnabled}
        onChange={(v) => setSetting('hapticEnabled', v)}
      />
      <ToggleRow
        label="Sound"
        description="Play a sound when the spinner lands."
        value={!!settings.soundEnabled}
        onChange={(v) => setSetting('soundEnabled', v)}
      />
    </section>
  );
}

function ToggleRow({ label, description, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[#1f1147]/30 bg-amber-100 p-4">
      <div>
        <div className="text-sm font-medium text-[#1f1147]">{label}</div>
        <div className="text-xs text-[#1f1147]/60">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-rose-500"
      />
    </label>
  );
}
