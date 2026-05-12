import { useState } from 'react';
import { initials } from '../../utils/format.js';

export default function ResultCard({ game, onLaunch, onSpinAgain, fallbackUsed }) {
  const [busy, setBusy] = useState(false);
  const [launchError, setLaunchError] = useState(null);

  if (!game) return null;

  const launch = async () => {
    setBusy(true);
    setLaunchError(null);
    try {
      const result = await onLaunch();
      if (result && result.success === false) {
        setLaunchError(result.error ?? 'Launch failed');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-3xl border-2 border-[#1f1147] bg-white p-4 shadow-chunky">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-[#1f1147] bg-amber-200 font-display text-base font-bold text-[#1f1147]">
          {game.iconBase64 ? (
            <img
              src={`data:image/png;base64,${game.iconBase64}`}
              alt={game.appName}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <span>{initials(game.appName)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[10px] uppercase tracking-widest text-rose-600">
            Your pick
          </div>
          <div className="truncate font-display text-xl font-bold text-[#1f1147]">
            {game.appName}
          </div>
          {fallbackUsed ? (
            <div className="mt-0.5 text-[11px] text-amber-700">
              No game matched your filters — picked at random.
            </div>
          ) : null}
        </div>
      </div>

      {launchError ? (
        <div className="mt-3 rounded-lg border border-rose-300 bg-rose-100 px-3 py-2 text-sm text-rose-800">
          {launchError}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={launch}
          disabled={busy}
          className="font-display rounded-2xl border-2 border-[#1f1147] bg-emerald-400 px-4 py-2.5 text-base font-bold uppercase tracking-wide text-[#1f1147] shadow-chunky-sm transition active:translate-y-0.5 active:shadow-none disabled:bg-stone-300"
        >
          {busy ? '…' : 'Launch'}
        </button>
        <button
          type="button"
          onClick={onSpinAgain}
          className="font-display rounded-2xl border-2 border-[#1f1147] bg-white px-4 py-2.5 text-base font-bold uppercase tracking-wide text-[#1f1147] shadow-chunky-sm transition active:translate-y-0.5 active:shadow-none"
        >
          Spin again
        </button>
      </div>
    </div>
  );
}
