import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/Auth';
import api from '../services/api';
import {
  LayoutDashboard, Users, WalletCards, BadgeDollarSign, ReceiptText, Package, BedDouble,
  ClipboardCheck, UserRoundCog, Bell, ChartNoAxesCombined, FileText, Settings, LogOut,
  CalendarRange, Send, History, Menu, X, Plus, UserPlus, CreditCard, Inbox,
} from 'lucide-react';

const groups = [
  { label: null, items: [
    ['/', 'Dashboard', 'dashboard', LayoutDashboard],
  ]},
  { label: 'People', items: [
    ['/students', 'Students', 'students', Users],
    ['/admissions', 'Admission Requests', 'students', Inbox],
    ['/staff', 'Staff', 'staff', UserRoundCog],
    ['/attendance', 'Attendance', 'attendance', ClipboardCheck],
  ]},
  { label: 'Finance', items: [
    ['/payments', 'Payments', 'payments', WalletCards],
    ['/billing', 'Billing', 'payments', CalendarRange],
    ['/credits', 'Credits', 'credit', BadgeDollarSign],
    ['/expenses', 'Expenses', 'expenses', ReceiptText],
    ['/salary', 'Salary', 'salary', BadgeDollarSign],
  ]},
  { label: 'Operations', items: [
    ['/stock', 'Stock', 'stock', Package],
    ['/rooms', 'Rooms & Beds', 'rooms', BedDouble],
    ['/broadcast', 'Broadcast', 'broadcast', Send],
    ['/notifications', 'Notifications', 'email_notifications', Bell],
  ]},
  { label: 'Insights', items: [
    ['/analytics', 'Analytics', 'operational_analytics', ChartNoAxesCombined],
    ['/reports', 'Reports', 'reports', FileText],
    ['/audit', 'Activity', 'dashboard', History],
  ]},
  { label: null, items: [
    ['/settings', 'Settings', 'settings', Settings],
  ]},
];

const allItems = groups.flatMap((g) => g.items);

function NavItems({ visible, dense = false }) {
  return visible.map(([to, label, , Icon]) => (
    <NavLink
      end={to === '/'}
      key={to}
      to={to}
      className={({ isActive }) =>
        `nav-link group flex items-center gap-3 rounded-xl text-sm ${dense ? 'shrink-0 px-3 py-2 text-xs' : 'px-3 py-2.5'} ${
          isActive
            ? 'bg-white font-semibold text-sarva-primary shadow-sm'
            : 'text-white/75 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      <Icon size={dense ? 14 : 17} className="shrink-0" />
      {label}
    </NavLink>
  ));
}

/**
 * Real-data hostel status widget. Every number here comes from an actual
 * API response -- if a capability is off or a call fails, that line is
 * simply omitted rather than showing a placeholder number.
 */
function HostelStatusPanel({ caps }) {
  const [activeCount, setActiveCount] = useState(null);
  const [occupancy, setOccupancy] = useState(null); // { pct, occupied, available }

  useEffect(() => {
    let cancelled = false;

    if (caps.includes('students')) {
      api.get('/students', { params: { status: 'active' } })
        .then(({ data }) => { if (!cancelled) setActiveCount(Array.isArray(data) ? data.length : null); })
        .catch(() => { if (!cancelled) setActiveCount(null); });
    }

    if (caps.includes('rooms')) {
      api.get('/rooms/overview')
        .then(({ data }) => {
          if (cancelled) return;
          const beds = data.beds || [];
          const total = beds.length;
          const occupied = beds.filter((b) => b.studentId).length;
          if (total > 0) {
            setOccupancy({ pct: Math.round((occupied / total) * 100), occupied, available: total - occupied });
          }
        })
        .catch(() => { if (!cancelled) setOccupancy(null); });
    }

    return () => { cancelled = true; };
  }, [caps]);

  if (activeCount === null && !occupancy) return null;

  return (
    <div className="mb-4 rounded-2xl bg-black/15 p-4">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        Hostel Status
      </div>

      {activeCount !== null && (
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-sm text-white/80">Active</span>
          <span className="ml-auto text-lg font-bold tabular-nums text-white">{activeCount}</span>
        </div>
      )}

      {occupancy && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-white/60">
            <span>Occupancy</span>
            <span className="font-bold tabular-nums text-sarva-gold">{occupancy.pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-sarva-gold" style={{ width: `${occupancy.pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-white/50">
            <span>{occupancy.occupied} Occupied</span>
            <span>{occupancy.available} Available</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * App navigation sidebar: desktop fixed aside + mobile top drawer.
 * Reads capabilities from the authenticated hostel to filter nav items.
 */
export default function Sidebar() {
  const { hostel, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const caps = hostel?.capabilities || [];
  const visibleOf = (items) => items.filter((x) => x[2] === 'dashboard' || caps.includes(x[2]));

  // Keep the mobile navigation intentionally small. The most-used hostel
  // workflows stay one tap away; everything else lives in the More sheet.
  const mobilePrimaryPaths = ['/', '/students', '/payments'];
  const mobilePrimary = visibleOf(allItems).filter((x) => mobilePrimaryPaths.includes(x[0]));
  const mobileMore = visibleOf(allItems).filter((x) => !mobilePrimaryPaths.includes(x[0]));

  return (
    <>
      <aside className="fixed inset-y-0 hidden w-64 flex-col bg-sarva-primary p-5 text-white lg:flex">
        <div className="mb-7"><Logo /></div>
        <nav className="no-scrollbar flex-1 space-y-3 overflow-y-auto">
          {groups.map((g, gi) => {
            const visible = visibleOf(g.items);
            if (!visible.length) return null;
            return (
              <div key={gi}>
                {g.label && <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">{g.label}</div>}
                <div className="space-y-1"><NavItems visible={visible} /></div>
              </div>
            );
          })}
        </nav>
        <HostelStatusPanel caps={caps} />
        <button onClick={logout} className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2.5 text-sm hover:bg-black/30">
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      {/* Mobile brand bar. Navigation is at thumb level in the bottom bar. */}
      <div className="sarva-mobile-brandbar sticky top-0 z-30 border-b border-white/10 bg-sarva-primary px-4 text-white lg:hidden">
        <div className="mx-auto flex min-h-[58px] max-w-lg items-center justify-between">
          <Logo size={27} />
          <div className="min-w-0 pl-3 text-right">
            <div className="max-w-[180px] truncate text-xs font-semibold">{hostel?.name || 'SARVA Hostel'}</div>
            <div className="text-[10px] text-white/55">Hostel management</div>
          </div>
        </div>
      </div>

      <nav className="sarva-mobile-bottom lg:hidden" aria-label="Mobile navigation">
        <div className="sarva-mobile-bottom-inner">
          <NavLink end to="/" className={({ isActive }) => `sarva-mobile-tab ${isActive ? 'is-active' : ''}`}>
            <span className="sarva-mobile-tab-icon"><LayoutDashboard size={21} strokeWidth={2.15} /></span>
            <span>Home</span>
          </NavLink>
          {mobilePrimary.find(([to]) => to === '/students') && (
            <NavLink to="/students" className={({ isActive }) => `sarva-mobile-tab ${isActive ? 'is-active' : ''}`}>
              <span className="sarva-mobile-tab-icon"><Users size={21} strokeWidth={2.15} /></span>
              <span>Students</span>
            </NavLink>
          )}
          <button type="button" onClick={() => setQuickOpen(true)} className="sarva-mobile-tab sarva-mobile-tab--quick" aria-label="Open quick actions" aria-expanded={quickOpen}>
            <span className="sarva-mobile-quick-button"><Plus size={25} strokeWidth={2.4} /></span>
            <span>Quick</span>
          </button>
          {mobilePrimary.find(([to]) => to === '/payments') ? (
            <NavLink to="/payments" className={({ isActive }) => `sarva-mobile-tab ${isActive ? 'is-active' : ''}`}>
              <span className="sarva-mobile-tab-icon"><WalletCards size={21} strokeWidth={2.15} /></span>
              <span>Payments</span>
            </NavLink>
          ) : <span />}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={`sarva-mobile-tab ${mobileMore.some(([to]) => to !== '/' && location.pathname.startsWith(to)) ? 'is-active' : ''}`}
            aria-label="Open more navigation"
            aria-expanded={mobileMenuOpen}
          >
            <span className="sarva-mobile-tab-icon"><Menu size={21} strokeWidth={2.15} /></span>
            <span>More</span>
          </button>
        </div>
      </nav>


      {quickOpen && (
        <div className="fixed inset-0 z-[65] lg:hidden" role="dialog" aria-modal="true" aria-label="Quick actions">
          <button className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setQuickOpen(false)} aria-label="Close quick actions" />
          <div className="sarva-mobile-sheet absolute inset-x-0 bottom-0 bg-white shadow-2xl animate-fade-in">
            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-sarva-border" />
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <div><div className="font-display text-lg font-semibold text-sarva-text">Quick actions</div><div className="text-xs text-sarva-muted">Common hostel tasks</div></div>
              <button onClick={() => setQuickOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-sarva-bg p-0 text-sarva-muted" aria-label="Close"><X size={19} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
              {caps.includes('students') && <button className="sarva-quick-action" onClick={() => { setQuickOpen(false); navigate('/students/new'); }}><UserPlus size={21}/><span><b>Add student</b><small>Create admission</small></span></button>}
              {caps.includes('payments') && <button className="sarva-quick-action" onClick={() => { setQuickOpen(false); navigate('/payments'); }}><CreditCard size={21}/><span><b>Record payment</b><small>Open payments</small></span></button>}
              {caps.includes('attendance') && <button className="sarva-quick-action" onClick={() => { setQuickOpen(false); navigate('/attendance'); }}><ClipboardCheck size={21}/><span><b>Attendance</b><small>Mark today</small></span></button>}
              {caps.includes('expenses') && <button className="sarva-quick-action" onClick={() => { setQuickOpen(false); navigate('/expenses'); }}><ReceiptText size={21}/><span><b>Add expense</b><small>Record spending</small></span></button>}
            </div>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
          <button className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" />
          <div className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-hidden rounded-t-[2rem] bg-white shadow-2xl animate-fade-in">
            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-sarva-border" />
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <div><div className="font-display text-lg font-semibold text-sarva-text">More</div><div className="text-xs text-sarva-muted">All hostel tools</div></div>
              <button onClick={() => setMobileMenuOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-sarva-bg text-sarva-muted" aria-label="Close"><X size={19} /></button>
            </div>
            <div className="no-scrollbar max-h-[calc(82dvh-88px)] overflow-y-auto px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
              <div className="grid grid-cols-3 gap-2">
                {mobileMore.map(([to, label, , Icon]) => (
                  <NavLink key={to} to={to} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center text-xs font-semibold ${isActive ? 'bg-sarva-primary text-white' : 'bg-sarva-bg text-sarva-text'}`}>
                    <Icon size={22} /><span>{label}</span>
                  </NavLink>
                ))}
              </div>
              <button onClick={logout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-700"><LogOut size={17} /> Sign out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
