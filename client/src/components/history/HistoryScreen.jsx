import { useHistory } from '../../hooks/useHistory.js';
import StatsPanel from './StatsPanel.jsx';
import HistoryList from './HistoryList.jsx';

export default function HistoryScreen() {
  const { spins, hasNextPage, isFetchingNextPage, fetchNextPage } = useHistory();

  return (
    <main className="min-h-full bg-amber-100 text-[#1f1147]">
      <header
        className="sticky top-0 z-10 border-b border-[#1f1147]/20 bg-amber-100/90 px-5 pb-4 backdrop-blur"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <h1 className="font-display text-xl font-bold">History</h1>
      </header>
      <div className="mx-auto max-w-md px-5 py-6">
        <StatsPanel />
        <HistoryList
          spins={spins}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onFetchNextPage={fetchNextPage}
        />
      </div>
    </main>
  );
}
