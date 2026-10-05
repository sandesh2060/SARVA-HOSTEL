import { NavLink } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/Auth';
import {
  LayoutDashboard, Users, WalletCards, BadgeDollarSign, ReceiptText, Package, BedDouble,
  ClipboardCheck, UserRoundCog, Bell, ChartNoAxesCombined, FileText, Settings, LogOut,
  CalendarRange, Send, History,
} from 'lucide-react';

const groups = [
  { label: null, items: [
    ['/', 'Dashboard', 'dashboard', LayoutDashboard],
  ]},
  { label: 'People', items: [
    ['/students', 'Students', 'students', Users],
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
 * App navigation sidebar: desktop fixed aside + mobile top drawer.
 * Reads capabilities from the authenticated hostel to filter nav items.
 */
export default function Sidebar() {
  const { hostel, logout } = useAuth();
  const caps = hostel?.capabilities || [];
  const visibleOf = (items) => items.filter((x) => x[2] === 'dashboard' || caps.includes(x[2]));
  const visibleFlat = visibleOf(allItems);

  return (
    <>
      <aside className="fixed inset-y-0 hidden w-64 flex-col bg-sarva-primary p-5 text-white lg:flex">
        <div className="mb-7">
          <Logo />
        </div>
        <nav className="no-scrollbar flex-1 space-y-3 overflow-y-auto">
          {groups.map((g, gi) => {
            const visible = visibleOf(g.items);
            if (!visible.length) return null;
            return (
              <div key={gi}>
                {g.label && (
                  <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    {g.label}
                  </div>
                )}
                <div className="space-y-1">
                  <NavItems visible={visible} />
                </div>
              </div>
            );
          })}
        </nav>
        <button onClick={logout} className="mt-4 flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2.5 text-sm hover:bg-black/30">
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      <div className="border-b border-black/10 bg-sarva-primary px-4 py-3 text-white lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <Logo size={28} />
          </div>
          <button onClick={logout} className="rounded-lg bg-black/20 px-3 py-2 text-xs">Sign out</button>
        </div>
        <nav className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          <NavItems visible={visibleFlat} dense />
        </nav>
      </div>
    </>
  );
}
