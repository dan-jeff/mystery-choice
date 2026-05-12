import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';
import { useSwipeNav } from '../../hooks/useSwipeNav.js';

export default function AppShell() {
  const swipe = useSwipeNav();
  return (
    <div className="flex h-full flex-col bg-amber-50 text-[#1f1147]">
      <div {...swipe} className="flex-1 overflow-y-auto touch-pan-y">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
