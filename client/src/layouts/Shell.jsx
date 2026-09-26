import { Outlet, useLocation } from 'react-router-dom';
import { Bell, UserRound } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/Auth';

/**
 * App shell: sidebar + a persistent top bar + the active page via <Outlet />.
 * The top bar is global (hostel identity, notifications, account) and stays
 * fixed while each page's own title/subtitle/actions render just below it
 * via <TopBar /> inside <Page />.
 */
export default function Shell() {
  const location = useLocation();
  const { hostel } = useAuth();

  return (
    <div className="min-h-screen bg-sarva-bg">
      <Sidebar />

      <div className="min-h-screen lg:ml-64">
        <header className="sarva-topbar sticky top-0 z-20 flex items-center justify-between border-b border-sarva-border px-4 py-3 sm:px-6 lg:px-8">
          <div className="text-sm font-semibold text-sarva-text">
            {hostel?.name || 'SARVA Hostel'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full p-2 text-sarva-muted transition hover:bg-sarva-primarySoft hover:text-sarva-primary"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-sarva-primarySoft text-sarva-primary transition hover:bg-sarva-primary hover:text-white"
              aria-label="Account"
            >
              <UserRound size={17} />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
