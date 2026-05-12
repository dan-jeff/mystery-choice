export default function SpinButton({ state, onClick, disabled }) {
  const isSpinning = state === 'spinning';
  const isResult = state === 'result';

  let label = 'SPIN';
  if (isSpinning) label = 'SPINNING…';
  else if (isResult) label = 'SPIN AGAIN';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isSpinning}
      className="font-display w-full max-w-xs rounded-full border-2 border-[#1f1147] bg-red-500 px-8 py-4 text-2xl font-bold uppercase tracking-wide text-white shadow-chunky transition active:translate-y-1 active:shadow-chunky-sm disabled:cursor-not-allowed disabled:bg-stone-400 disabled:shadow-none"
    >
      {label}
    </button>
  );
}
