export default function WeightSlider({ label, value, onChange, color = 'fuchsia' }) {
  const colorClass = {
    fuchsia: 'accent-rose-500',
    cyan: 'accent-cyan-400',
    amber: 'accent-amber-400',
    emerald: 'accent-emerald-400',
  }[color] ?? 'accent-rose-500';

  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-[#1f1147]">{label}</span>
        <span className="text-sm tabular-nums text-[#1f1147]/60">{Math.round(value)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-2 w-full cursor-pointer appearance-none rounded-full bg-amber-200 ${colorClass}`}
      />
    </label>
  );
}
