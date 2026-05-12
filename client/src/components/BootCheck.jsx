import { useEffect, useState } from 'react';
import { getDb } from '../services/database.js';
import { getSetting, setSetting } from '../services/settings.js';

const PING_KEY = '__boot_check_v1';

export default function BootCheck() {
  const [state, setState] = useState({ status: 'checking', detail: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const db = await getDb();
        const probe = await db.query('SELECT 1 as ok');
        const ok = probe.values?.[0]?.ok === 1;
        if (!ok) throw new Error('SELECT 1 did not return 1');

        const stamp = Date.now();
        await setSetting(PING_KEY, { stamp });
        const roundTrip = await getSetting(PING_KEY);
        if (!roundTrip || roundTrip.stamp !== stamp) {
          throw new Error('settings round-trip failed');
        }

        if (!cancelled) {
          setState({ status: 'ok', detail: new Date(stamp).toISOString() });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ status: 'error', detail: err?.message ?? String(err) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'checking') {
    return (
      <div className="text-slate-400 text-sm" role="status" aria-live="polite">
        Storage: checking…
      </div>
    );
  }

  if (state.status === 'ok') {
    return (
      <div className="space-y-2" role="status" aria-live="polite">
        <div className="text-emerald-400 text-lg font-medium">Storage: ok</div>
        <div className="text-xs text-slate-500 font-mono break-all">{state.detail}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2" role="alert">
      <div className="text-red-400 text-lg font-medium">Storage: error</div>
      <div className="text-xs text-slate-500 font-mono break-all">{state.detail}</div>
    </div>
  );
}
