import { formatTimestamp, initials } from '../../utils/format.js';

export default function HistoryRow({ spin }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-[#1f1147]/20 bg-white px-3 py-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-200 text-xs font-semibold text-[#1f1147]">
        {initials(spin.appName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[#1f1147]">{spin.appName}</div>
        <div className="text-[11px] text-[#1f1147]/60">{formatTimestamp(spin.spunAtMs)}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {spin.fallbackUsed ? (
          <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
            fallback
          </span>
        ) : null}
        {spin.launched ? (
          <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
            launched
          </span>
        ) : null}
      </div>
    </li>
  );
}
