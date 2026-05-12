import { useCallback, useState } from 'react';
import { pickGame } from '../services/random-engine.js';
import { recordSpin, markLaunched } from '../services/history.js';
import { haptic } from '../services/haptics.js';
import { useEligibleGames } from './useEligibleGames.js';
import { useEngineSettings } from './useEngineSettings.js';
import { useEngineHistory } from './useEngineHistory.js';
import { useInvalidateHistory } from './useHistory.js';
import { buildVisibleGames } from '../components/spinner/visible-games.js';

/**
 * State machine for one spin:
 *
 *   idle ─[spin()]─▶ spinning ─[onAnimationEnd()]─▶ result ─[spinAgain()]─▶ spinning
 *
 * The "winner" is computed at spin() time so the wheel can target it from
 * the moment the animation starts; recordSpin runs in parallel and the row
 * id is captured for later markLaunched() calls.
 */
export function useSpin() {
  const { eligible } = useEligibleGames();
  const settings = useEngineSettings();
  const history = useEngineHistory();
  const invalidateHistory = useInvalidateHistory();

  const [state, setState] = useState('idle'); // 'idle' | 'spinning' | 'result'
  const [winner, setWinner] = useState(null);
  const [visibleGames, setVisibleGames] = useState([]);
  const [spinResult, setSpinResult] = useState(null);
  const [spinId, setSpinId] = useState(null);

  const spin = useCallback(() => {
    if (eligible.length === 0) return;

    const result = pickGame(eligible, settings, history, Date.now());
    const slots = buildVisibleGames(eligible, result.winner);

    setSpinResult(result);
    setWinner(result.winner);
    setVisibleGames(slots);
    setState('spinning');
    haptic.spinStart();

    // Record asynchronously; we don't block on the row id.
    recordSpin(result).then((id) => {
      setSpinId(id);
      invalidateHistory();
    });
  }, [eligible, settings, history, invalidateHistory]);

  const onAnimationEnd = useCallback(() => {
    setState('result');
    haptic.spinLand();
  }, []);

  const spinAgain = useCallback(() => {
    setSpinId(null);
    setSpinResult(null);
    spin();
  }, [spin]);

  const markCurrentLaunched = useCallback(() => {
    if (spinId == null) return;
    markLaunched(spinId).then(invalidateHistory);
  }, [spinId, invalidateHistory]);

  return {
    state,
    winner,
    visibleGames,
    spinResult,
    spin,
    spinAgain,
    onAnimationEnd,
    markCurrentLaunched,
  };
}
