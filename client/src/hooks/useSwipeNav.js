import { useNavigate, useLocation } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';

// Horizontal swipe nav between Spin and History only. Settings is reached
// via the bottom nav tab (vertical swipes felt clashy with normal scroll).
const ROUTES = {
  '/': { left: '/history' },
  '/history': { right: '/' },
};

function lookup(pathname) {
  if (pathname.startsWith('/history')) return ROUTES['/history'];
  if (pathname === '/' || pathname === '') return ROUTES['/'];
  return null;
}

export function useSwipeNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const go = (dir) => () => {
    const target = lookup(pathname)?.[dir];
    if (target) navigate(target);
  };

  return useSwipeable({
    onSwipedLeft: go('left'),
    onSwipedRight: go('right'),
    delta: 60,
    swipeDuration: 500,
    trackTouch: true,
    trackMouse: false,
    preventScrollOnSwipe: false,
  });
}
