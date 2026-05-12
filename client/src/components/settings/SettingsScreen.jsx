import { NavLink, Outlet, useLocation } from 'react-router-dom';

const TABS = [
  { to: 'spinner', label: 'Weighting' },
  { to: 'games', label: 'Games' },
  { to: 'history', label: 'History' },
  { to: 'feedback', label: 'Feedback' },
  { to: 'data', label: 'Data' },
  { to: 'about', label: 'About' },
];

export default function SettingsScreen() {
  const location = useLocation();
  // /settings (no sub-route) → render the first tab
  const onIndex = location.pathname === '/settings' || location.pathname === '/settings/';

  return (
    <main className="relative flex min-h-full flex-col bg-amber-100 text-[#1f1147]">
      <header
        className="sticky top-0 z-10 border-b border-[#1f1147]/20 bg-amber-100/90 px-5 pb-4 backdrop-blur"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <h1 className="font-display text-xl font-bold">Settings</h1>
      </header>

      <nav className="border-b border-[#1f1147]/20 bg-white">
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `font-display whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition ${
                  isActive || (onIndex && t.to === 'spinner')
                    ? 'bg-rose-500 text-white'
                    : 'bg-amber-200 text-[#1f1147]/70 hover:bg-amber-300'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="flex-1 px-5 py-6">
        <div className="mx-auto max-w-md">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
