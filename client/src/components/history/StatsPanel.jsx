import { useStats } from '../../hooks/useStats.js';

export default function StatsPanel() {
  const { data } = useStats();
  const stats = data ?? { total: 0, mostSpun: [], leastSpun: [], last7Days: 0 };

  return (
    <section className="mb-4 rounded-2xl border border-[#1f1147]/20 bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Total spins" value={stats.total} />
        <KpiCard label="Last 7 days" value={stats.last7Days} />
      </div>

      <TopList title="Most spun" rows={stats.mostSpun} empty="No spins yet." />
    </section>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="rounded-xl bg-amber-100 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-[#1f1147]/60">{label}</div>
      <div className="text-xl font-semibold tabular-nums text-[#1f1147]">{value}</div>
    </div>
  );
}

function TopList({ title, rows, empty }) {
  return (
    <div className="mt-4">
      <div className="text-[10px] uppercase tracking-wide text-[#1f1147]/60">{title}</div>
      {rows.length === 0 ? (
        <div className="mt-1 text-xs text-[#1f1147]/50">{empty}</div>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {rows.map((r) => (
            <li
              key={r.packageName}
              className="flex items-center justify-between text-sm"
            >
              <span className="truncate text-[#1f1147]">{r.appName}</span>
              <span className="tabular-nums text-[#1f1147]/60">{r.spins}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
