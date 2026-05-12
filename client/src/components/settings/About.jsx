export default function About() {
  // Slot for <TipJarEntry /> lands here from 010 T930 once Play Console is set up.

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-semibold text-[#1f1147]">About</h2>
      </header>

      <div className="rounded-xl border border-[#1f1147]/30 bg-amber-100 p-4">
        <div className="text-sm font-medium text-[#1f1147]">Mystery Choice</div>
        <div className="text-xs text-[#1f1147]/60">Version 0.1.0 (pre-release)</div>
        <p className="mt-3 text-xs text-[#1f1147]/80">
          On-device random game launcher. All your data stays on this device.
        </p>
      </div>

      <div className="rounded-xl border border-[#1f1147]/30 bg-amber-100 p-4">
        <div className="text-sm font-medium text-[#1f1147]">Support development</div>
        <p className="mt-1 text-xs text-[#1f1147]/60">
          The tip jar lands when the app ships on Play.
        </p>
      </div>
    </section>
  );
}
