import { useState } from 'react';
import { setSetting } from '../services/settings.js';
import { useQueryClient } from '@tanstack/react-query';

const ACK_KEY = 'permissions_acknowledged_v1';

export default function PermissionsExplainer({ onContinue }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      await setSetting(ACK_KEY, true);
      qc.invalidateQueries({ queryKey: ['settings'] });
      onContinue?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="flex min-h-full flex-col items-center justify-center bg-amber-100 px-6 pb-10 text-center text-[#1f1147]"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2.5rem)' }}
    >
      <div className="max-w-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2 l9 4 v6 c0 5-3.6 9.5-9 10 -5.4-.5-9-5-9-10 V6 z" />
            <path d="M9 12 l2 2 l4-4" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-[#1f1147]">A quick heads-up</h1>
        <p className="mt-3 text-sm text-[#1f1147]/80">
          Mystery Choice needs to see the list of apps installed on your phone so it can find your
          games. We use that list only to populate the spinner.
        </p>
        <ul className="mt-5 space-y-2 text-left text-sm text-[#1f1147]/80">
          <Bullet>Nothing leaves your device. Ever.</Bullet>
          <Bullet>No account, no cloud, no tracking.</Bullet>
          <Bullet>You can mark any app as a game (or not) later.</Bullet>
        </ul>
        <button
          type="button"
          onClick={onClick}
          disabled={busy}
          className="font-display mt-8 w-full rounded-full border-2 border-[#1f1147] bg-rose-500 px-6 py-3 text-base font-bold uppercase tracking-wide text-white shadow-chunky active:translate-y-1 active:shadow-chunky-sm disabled:bg-stone-300"
        >
          {busy ? 'Continuing…' : 'Continue'}
        </button>
      </div>
    </main>
  );
}

function Bullet({ children }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden="true" className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
      <span>{children}</span>
    </li>
  );
}
