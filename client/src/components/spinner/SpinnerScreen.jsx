import { useMemo, useState } from 'react';
import Background from './Background.jsx';
import SpinnerWheel from './SpinnerWheel.jsx';
import SpinButton from './SpinButton.jsx';
import ResultCard from './ResultCard.jsx';
import EmptyState from './EmptyState.jsx';
import SingleGameState from './SingleGameState.jsx';
import WheelLabel from './WheelLabel.jsx';
import { useSpin } from '../../hooks/useSpin.js';
import { useEligibleGames } from '../../hooks/useEligibleGames.js';
import { launchGame } from '../../services/launcher.js';

const SAFE_TOP = { paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' };

export default function SpinnerScreen() {
  const { eligible, isLoading, rescan } = useEligibleGames();
  const spin = useSpin();
  const [topSlot, setTopSlot] = useState(0);

  const winnerIndex = useMemo(() => {
    if (!spin.winner || spin.visibleGames.length === 0) return null;
    return spin.visibleGames.findIndex(
      (g) => g.packageName === spin.winner.packageName,
    );
  }, [spin.winner, spin.visibleGames]);

  // Don't flash the EmptyState while React Query is still resolving the
  // initial games fetch on first mount.
  if (isLoading) {
    return (
      <main
        className="relative flex min-h-full flex-col items-center justify-center px-6 pb-8"
        style={SAFE_TOP}
      >
        <Background />
      </main>
    );
  }

  if (eligible.length === 0) {
    return (
      <main
        className="relative flex min-h-full flex-col items-center justify-center px-6 pb-8"
        style={SAFE_TOP}
      >
        <Background />
        <EmptyState onRescan={rescan} />
      </main>
    );
  }

  if (eligible.length === 1) {
    return (
      <main
        className="relative flex min-h-full flex-col items-center justify-center px-6 pb-8"
        style={SAFE_TOP}
      >
        <Background />
        <SingleGameState game={eligible[0]} onLaunch={(g) => launchGame(g, null)} />
      </main>
    );
  }

  const showResult = spin.state === 'result' && spin.winner;
  const wheelGames =
    spin.visibleGames.length > 0 ? spin.visibleGames : eligible.slice(0, 12);
  const labelGame = wheelGames[topSlot];

  return (
    <main
      className="relative flex min-h-full flex-col items-center gap-3 px-5 pb-6"
      style={SAFE_TOP}
    >
      <Background />

      <header className="w-full text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#1f1147]">
          Mystery Choice
        </h1>
        <p className="mt-0.5 text-xs font-medium text-stone-700">
          {eligible.length} eligible games
        </p>
      </header>

      <SpinnerWheel
        games={wheelGames}
        spinningTo={spin.state === 'spinning' ? winnerIndex : null}
        onSpinComplete={spin.onAnimationEnd}
        onTopSlotChange={setTopSlot}
      />

      <WheelLabel state={spin.state} game={labelGame} />

      {showResult ? (
        <ResultCard
          game={spin.winner}
          fallbackUsed={spin.spinResult?.fallbackUsed}
          onLaunch={() => launchGame(spin.winner, null)}
          onSpinAgain={spin.spinAgain}
        />
      ) : null}

      <div className="mt-auto w-full flex justify-center">
        {!showResult ? (
          <SpinButton
            state={spin.state}
            onClick={spin.spin}
            disabled={eligible.length < 2}
          />
        ) : null}
      </div>
    </main>
  );
}
