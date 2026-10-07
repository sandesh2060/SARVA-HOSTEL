import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, ChevronDown, LogOut, QrCode, Settings, UserRound, X } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/Auth';
import api from '../services/api';

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
    <div className="sarva-payment-qr-fab fixed bottom-24 right-4 z-40 sm:right-6 lg:bottom-6 flex flex-col items-end gap-3">
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
  const { hostel, user, logout } = useAuth();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const close = (event) => { if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false); };
    const escape = (event) => { if (event.key === 'Escape') setAccountOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, []);

  // Keep an active user's API session warm and detect a sleeping/degraded API.
  // This is deliberately visibility-aware: it avoids background battery/network
  // waste and is not a substitute for an always-on production Render plan.
  useEffect(() => {
    let timer;
    const ping = () => {
      if (document.visibilityState === 'visible') {
        api.get('/health', { timeout: 12000 }).catch(() => undefined);
      }
    };
    ping();
    timer = window.setInterval(ping, 10 * 60 * 1000);
    document.addEventListener('visibilitychange', ping);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', ping);
    };
  }, []);

  return (
    <div className="min-h-screen bg-sarva-bg">
      <Sidebar />

      <div className="min-h-screen pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:ml-64 lg:pb-0">
        <header className="sarva-topbar sticky top-0 z-20 hidden lg:flex items-center justify-between border-b border-sarva-border px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sarva-muted">SARVA Hostel</div>
            <div className="truncate text-sm font-semibold text-sarva-text">{hostel?.name || 'Hostel workspace'}</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-sarva-border bg-white text-sarva-muted transition hover:-translate-y-0.5 hover:text-sarva-primary hover:shadow-premium-sm" aria-label="Notifications"><Bell size={18} /></button>
            <button type="button" onClick={() => navigate('/settings')} className="flex h-10 w-10 items-center justify-center rounded-xl border border-sarva-border bg-white text-sarva-muted transition hover:-translate-y-0.5 hover:text-sarva-primary hover:shadow-premium-sm" aria-label="Settings"><Settings size={18} /></button>
            <div className="relative" ref={accountRef}>
              <button type="button" onClick={() => setAccountOpen(v => !v)} className="flex items-center gap-2 rounded-2xl border border-sarva-border bg-white py-1.5 pl-1.5 pr-3 text-left shadow-premium-sm transition hover:-translate-y-0.5 hover:shadow-premium" aria-expanded={accountOpen}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sarva-primarySoft text-sm font-bold text-sarva-primary">
                  {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display='none'; }} /> : (user?.name?.[0]?.toUpperCase() || <UserRound size={17} />)}
                </span>
                <span className="hidden max-w-40 xl:block"><span className="block truncate text-sm font-semibold text-sarva-text">{user?.name || 'Account'}</span><span className="block text-[11px] capitalize text-sarva-muted">{user?.role || 'user'}</span></span>
                <ChevronDown size={15} className="text-sarva-muted" />
              </button>
              {accountOpen && <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-sarva-border bg-white p-2 shadow-premium">
                <div className="border-b border-sarva-border px-3 py-2"><div className="truncate text-sm font-semibold text-sarva-text">{user?.name}</div><div className="truncate text-xs text-sarva-muted">{user?.email}</div></div>
                <button onClick={() => {setAccountOpen(false);navigate('/settings')}} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-sarva-text hover:bg-sarva-primarySoft"><Settings size={16}/>Hostel settings</button>
                <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-sarva-danger hover:bg-red-50"><LogOut size={16}/>Sign out</button>
              </div>}
            </div>
          </div>
        </header>

        <main className="w-full min-w-0 px-3 py-4 sm:px-5 sm:py-6 lg:p-8">
          <div className="mx-auto w-full min-w-0 max-w-[1440px]" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>

      <div className="sarva-calendar-fab fixed bottom-[9.5rem] right-4 z-40 sm:right-6 lg:bottom-24">
        <button type="button" onClick={() => navigate('/calendar')} className="flex h-12 w-12 items-center justify-center rounded-full border border-sarva-border bg-white text-sarva-primary shadow-premium transition hover:-translate-y-0.5 hover:bg-sarva-primarySoft" aria-label="Open smart calendar"><CalendarDays size={20}/></button>
      </div>
      <PaymentQrFab />
    </div>
  );
}
