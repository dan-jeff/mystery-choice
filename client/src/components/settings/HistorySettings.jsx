import { useSettings } from '../../hooks/useSettings.js';

export default function HistorySettings() {
  const { settings, setSetting } = useSettings();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-semibold text-[#1f1147]">History</h2>
        <p className="text-xs text-[#1f1147]/60">
          How many past spins to keep on the device.
        </p>
      </header>

      <div className="rounded-xl border border-[#1f1147]/30 bg-amber-100 p-4">
        <div className="flex items-baseline justify-between">
          <div className="text-sm font-medium text-[#1f1147]">Retention</div>
          <span className="text-sm tabular-nums text-[#1f1147]/80">
            {settings.historyLength} spins
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="1000"
          step="10"
          value={settings.historyLength}
          onChange={(e) => setSetting('historyLength', Number(e.target.value))}
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-amber-200 accent-rose-500"
        />
        <div className="mt-1 flex justify-between text-[10px] text-[#1f1147]/50">
          <span>10</span>
          <span>1000</span>
        </div>
      </div>
    </section>
  );
}
