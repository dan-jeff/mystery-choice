import HistoryRow from './HistoryRow.jsx';

export default function HistoryList({ spins, hasNextPage, isFetchingNextPage, onFetchNextPage }) {
  if (spins.length === 0) {
    return (
      <div className="rounded-xl border border-[#1f1147]/20 bg-white px-4 py-8 text-center text-sm text-[#1f1147]/60">
        No spins yet. Tap Spin on the main screen to record your first.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {spins.map((s) => (
          <HistoryRow key={s.id} spin={s} />
        ))}
      </ul>
      {hasNextPage ? (
        <button
          type="button"
          onClick={onFetchNextPage}
          disabled={isFetchingNextPage}
          className="self-center rounded-full bg-amber-200 px-4 py-1.5 text-sm text-[#1f1147] hover:bg-amber-200 disabled:opacity-50"
        >
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      ) : null}
    </div>
  );
}
