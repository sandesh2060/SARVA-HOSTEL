import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bell, UserRound, QrCode, X } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/Auth';

/**
 * Floating round button, fixed to the bottom-right of the viewport on every
 * page. Only renders once a payment QR image actually exists (uploaded on
 * Settings > Payment Methods) -- no placeholder shown otherwise.
 */
function PaymentQrFab() {
  const { hostel } = useAuth();
  const [open, setOpen] = useState(false);
  const qr = hostel?.settings?.manualQrImage;

  if (!qr) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40 sm:right-6 lg:bottom-6 flex flex-col items-end gap-3">
      {open && (
        <div className="w-64 animate-fade-in overflow-hidden rounded-[1.5rem] bg-sarva-surface p-4 shadow-premium">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-sarva-muted">Payment QR</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-sarva-muted transition hover:bg-sarva-primarySoft hover:text-sarva-primary"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="aspect-square w-full overflow-hidden rounded-2xl bg-white">
            <img src={qr} alt="Payment QR" className="h-full w-full object-contain" />
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-sarva-primary text-white shadow-premium transition hover:-translate-y-0.5 hover:bg-sarva-primaryHover"
        aria-label="Show payment QR"
      >
        <QrCode size={22} />
      </button>
    </div>
  );
}

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

      <div className="min-h-screen pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:ml-64 lg:pb-0">
        <header className="sarva-topbar sticky top-[49px] z-20 hidden lg:flex flex items-center justify-between border-b border-sarva-border px-4 py-3 sm:px-6 lg:px-8">
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

        <main className="w-full min-w-0 px-3 py-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full min-w-0 max-w-7xl" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>

      <PaymentQrFab />
    </div>
  );
}
