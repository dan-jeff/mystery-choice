export default function EmptyState({ onRescan }) {
  return (
    <div className="w-full max-w-sm rounded-3xl border-2 border-[#1f1147] bg-white p-6 text-center shadow-chunky">
      <h2 className="font-display text-xl font-bold text-[#1f1147]">No games found</h2>
      <p className="mt-2 text-sm text-stone-700">
        Mystery Choice could not detect any installed games on this device. Install some, or grant
        the app full visibility into your installed apps and try again.
      </p>
      <button
        type="button"
        onClick={onRescan}
        className="font-display mt-5 w-full rounded-2xl border-2 border-[#1f1147] bg-amber-300 px-4 py-2.5 text-base font-bold uppercase tracking-wide text-[#1f1147] shadow-chunky-sm active:translate-y-0.5 active:shadow-none"
      >
        Rescan
      </button>
    </div>
  );
}
