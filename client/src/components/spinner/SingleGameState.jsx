import { useState } from 'react';
import { initials } from '../../utils/format.js';

export default function SingleGameState({ game, onLaunch }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const launch = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await onLaunch(game);
      if (result && result.success === false) setError(result.error ?? 'Launch failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-3xl border-2 border-[#1f1147] bg-white p-6 text-center shadow-chunky">
      <p className="font-display text-[10px] uppercase tracking-widest text-rose-600">
        Only one eligible game
      </p>
      <div className="mt-4 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-[#1f1147] bg-amber-200 font-display text-lg font-bold text-[#1f1147]">
          {initials(game.appName)}
        </div>
      </div>
      <div className="mt-3 font-display text-2xl font-bold text-[#1f1147]">{game.appName}</div>
      {error ? (
        <div className="mt-3 rounded-lg border border-rose-300 bg-rose-100 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      <button
        type="button"
        onClick={launch}
        disabled={busy}
        className="font-display mt-5 w-full rounded-2xl border-2 border-[#1f1147] bg-emerald-400 px-4 py-2.5 text-base font-bold uppercase tracking-wide text-[#1f1147] shadow-chunky-sm active:translate-y-0.5 active:shadow-none disabled:bg-stone-300"
      >
        {busy ? '…' : `Launch ${game.appName}`}
      </button>
    </div>
  );
}
