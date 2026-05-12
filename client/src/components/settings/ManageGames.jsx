import { useMemo, useState } from 'react';
import { useAllInstalled } from '../../hooks/useAllInstalled.js';
import { initials } from '../../utils/format.js';

export default function ManageGames() {
  const { all, isLoading, setIsGame } = useAllInstalled();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('games'); // 'games' | 'all'

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((g) => (filter === 'games' ? g.isGame : true))
      .filter((g) => (q ? g.appName.toLowerCase().includes(q) : true));
  }, [all, query, filter]);

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-semibold text-[#1f1147]">Manage games</h2>
        <p className="text-xs text-[#1f1147]/60">
          Toggle which apps the spinner can land on. Mistaken matches can be flipped off; non-game
          apps you want in the pool can be flipped on.
        </p>
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter('games')}
          className={`font-display flex-1 rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide ${
            filter === 'games'
              ? 'bg-rose-500 text-white'
              : 'bg-amber-200 text-[#1f1147]/70 hover:bg-amber-300'
          }`}
        >
          Games only
        </button>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`font-display flex-1 rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide ${
            filter === 'all'
              ? 'bg-rose-500 text-white'
              : 'bg-amber-200 text-[#1f1147]/70 hover:bg-amber-300'
          }`}
        >
          All apps
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search…"
        className="rounded-xl border border-[#1f1147]/30 bg-white px-3 py-2 text-sm text-[#1f1147] placeholder:text-[#1f1147]/40"
      />

      {isLoading ? (
        <div className="text-sm text-[#1f1147]/60">Loading…</div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-[#1f1147]/20 bg-amber-100 px-3 py-6 text-center text-sm text-[#1f1147]/60">
          {query ? 'No matches.' : 'No apps detected yet.'}
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {list.map((g) => (
            <GameRow
              key={g.packageName}
              game={g}
              onToggle={(value) => setIsGame(g.packageName, value)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function GameRow({ game, onToggle }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-[#1f1147]/20 bg-white px-3 py-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#1f1147]/20 bg-amber-100">
        {game.iconBase64 ? (
          <img
            src={`data:image/png;base64,${game.iconBase64}`}
            alt={game.appName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-display text-xs font-bold text-[#1f1147]">
            {initials(game.appName)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[#1f1147]">{game.appName}</div>
        <div className="truncate text-[10px] text-[#1f1147]/50">{game.packageName}</div>
      </div>
      <label className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          checked={game.isGame}
          onChange={(e) => onToggle(e.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-amber-200 transition peer-checked:bg-rose-500" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </label>
    </li>
  );
}
