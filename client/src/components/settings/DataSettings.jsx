import { useState } from 'react';
import { exportJson, exportCsv, clearAll as clearHistory } from '../../services/history.js';
import { getDb } from '../../services/database.js';
import { useQueryClient } from '@tanstack/react-query';

export default function DataSettings() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [status, setStatus] = useState(null);

  const downloadBlob = (filename, mime, content) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAs = async (format) => {
    setBusy(true);
    setStatus(null);
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      if (format === 'json') {
        const content = await exportJson();
        downloadBlob(`mystery-choice-history-${stamp}.json`, 'application/json', content);
      } else {
        const content = await exportCsv();
        downloadBlob(`mystery-choice-history-${stamp}.csv`, 'text/csv', content);
      }
      setStatus({ kind: 'ok', text: `Exported ${format.toUpperCase()}.` });
    } catch (err) {
      setStatus({ kind: 'error', text: err?.message ?? String(err) });
    } finally {
      setBusy(false);
    }
  };

  const deleteAll = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const db = await getDb();
      await db.run('DELETE FROM settings');
      await db.run('DELETE FROM excluded_games');
      await clearHistory();
      qc.invalidateQueries();
      setStatus({ kind: 'ok', text: 'All data deleted.' });
      setConfirmOpen(false);
      setConfirmInput('');
    } catch (err) {
      setStatus({ kind: 'error', text: err?.message ?? String(err) });
    } finally {
      setBusy(false);
    }
  };

  const resetHistory = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await clearHistory();
      qc.invalidateQueries({ queryKey: ['history'] });
      qc.invalidateQueries({ queryKey: ['engine-history'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      setStatus({ kind: 'ok', text: 'Spin history cleared. Cooldown reset.' });
    } catch (err) {
      setStatus({ kind: 'error', text: err?.message ?? String(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-semibold text-[#1f1147]">Data</h2>
        <p className="text-xs text-[#1f1147]/60">Export or wipe everything stored on this device.</p>
      </header>

      <div className="rounded-xl border border-[#1f1147]/30 bg-amber-100 p-4">
        <div className="text-sm font-medium text-[#1f1147]">Export history</div>
        <p className="mt-1 text-xs text-[#1f1147]/60">
          Saves a copy of every recorded spin.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => exportAs('json')}
            disabled={busy}
            className="rounded-lg bg-amber-200 px-3 py-2 text-sm font-medium text-[#1f1147] hover:bg-stone-300 disabled:bg-amber-200"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => exportAs('csv')}
            disabled={busy}
            className="rounded-lg bg-amber-200 px-3 py-2 text-sm font-medium text-[#1f1147] hover:bg-stone-300 disabled:bg-amber-200"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#1f1147]/30 bg-amber-100 p-4">
        <div className="text-sm font-medium text-[#1f1147]">Reset spin history</div>
        <p className="mt-1 text-xs text-[#1f1147]/60">
          Clears every past spin (and resets the cooldown filter). Keeps your games and settings.
        </p>
        <button
          type="button"
          onClick={resetHistory}
          disabled={busy}
          className="mt-3 w-full rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-[#1f1147] hover:bg-amber-400 disabled:bg-amber-200 disabled:text-[#1f1147]/40"
        >
          {busy ? 'Clearing…' : 'Reset history'}
        </button>
      </div>

      <div className="rounded-xl border-2 border-rose-400 bg-rose-50 p-4">
        <div className="text-sm font-semibold text-rose-700">Delete all data</div>
        <p className="mt-1 text-xs text-rose-700/80">
          Wipes settings, history, exclusions. Cannot be undone.
        </p>
        {confirmOpen ? (
          <div className="mt-3 flex flex-col gap-2">
            <label className="text-xs text-rose-700">
              Type <span className="font-mono font-bold">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="rounded-md border border-rose-400 bg-white px-3 py-2 text-sm text-[#1f1147]"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmInput('');
                }}
                className="rounded-lg bg-amber-200 px-3 py-2 text-sm text-[#1f1147]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteAll}
                disabled={confirmInput !== 'DELETE' || busy}
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-stone-300 disabled:text-stone-500"
              >
                {busy ? 'Deleting…' : 'Delete everything'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="mt-3 w-full rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Delete all data
          </button>
        )}
      </div>

      {status ? (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            status.kind === 'ok'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {status.text}
        </div>
      ) : null}
    </section>
  );
}
