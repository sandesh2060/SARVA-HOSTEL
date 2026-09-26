import os
import shutil

ROOT = "client/src"

def write(path, content, label):
    if os.path.exists(path):
        shutil.copy(path, path + ".bak_premiumui_v2")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
    print(f"\u2714 Wrote {path}  ({label})")


# ---------------------------------------------------------------------------
# index.css  -- add hidden-scrollbar utility + stronger resting card shadow
# ---------------------------------------------------------------------------
INDEX_CSS_APPEND = """

/* ==========================================================================
   PREMIUM PASS 2 -- hidden scrollbars, stronger resting card shadow
   ========================================================================== */
.no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
.no-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; }

.card {
  box-shadow: 0 2px 6px -2px rgba(36, 19, 24, 0.08), 0 10px 24px -14px rgba(36, 19, 24, 0.14);
  border-color: #DFD2D7;
}

.sarva-topbar {
  background-color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
}
"""

# ---------------------------------------------------------------------------
# layouts/Shell.jsx -- adds the persistent global top bar
# ---------------------------------------------------------------------------
SHELL_JSX = """import { Outlet, useLocation } from 'react-router-dom';
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
"""

# ---------------------------------------------------------------------------
# components/TopBar.jsx -- page-level header, no longer needs its own
# heavy border since the global topbar above already separates it;
# button row fixed so icon+label never wraps.
# ---------------------------------------------------------------------------
TOPBAR_JSX = """import React from 'react';
import { Badge } from './UI';

/**
 * Per-page header, rendered directly under the global app top bar.
 *
 * Props:
 *  - title:    main heading text (string or node)
 *  - badge:    optional short label shown next to the title
 *  - subtitle: secondary line under the title (string or node)
 *  - actions:  right-aligned content (buttons, selects, etc.)
 *  - className: extra classes for the outer wrapper
 */
export default function TopBar({ title, badge, subtitle, actions, className = '' }) {
  return (
    <div
      className={`flex flex-col gap-4 pb-5 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-sarva-text">{title}</h1>
          {badge && (
            <Badge tone="muted">
              {String(badge).toUpperCase()}
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-sm text-sarva-muted">{subtitle}</p>}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
"""

# ---------------------------------------------------------------------------
# components/UI.jsx -- fixed Button row-wrap, sans-numeral StatCard,
# stronger resting Card shadow.
# ---------------------------------------------------------------------------
UI_JSX = """import React from 'react';
import { ChevronDown } from 'lucide-react';
import TopBar from './TopBar';

export const money = (n, c = 'NPR') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: c, maximumFractionDigits: 2 }).format(Number(n || 0));

export function Page({ title, subtitle, action, children }) {
  return (
    <div className="animate-fade-in space-y-6">
      <TopBar title={title} subtitle={subtitle} actions={action} />
      {children}
    </div>
  );
}

export function Card({ title, children, className = '', hover = false }) {
  return (
    <section className={`card rounded-2xl border border-sarva-border bg-sarva-surface p-5 ${hover ? 'card-hover' : ''} ${className}`}>
      {title && <h2 className="mb-4 font-semibold text-sarva-text">{title}</h2>}
      {children}
    </section>
  );
}

export function KPI({ label, value, help, icon: Icon, className = '' }) {
  return (
    <Card hover className={className}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-sarva-muted">{label}</div>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sarva-primarySoft text-sarva-primary">
            <Icon size={16} />
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-sarva-text">{value}</div>
      {help && <div className="mt-1 text-xs text-sarva-muted">{help}</div>}
    </Card>
  );
}

export function StatCard({ label, value, icon: Icon, tone = 'primary' }) {
  const TONES = {
    primary: { bg: 'bg-sarva-primarySoft', text: 'text-sarva-primary' },
    success: { bg: 'bg-emerald-50', text: 'text-sarva-success' },
    warning: { bg: 'bg-amber-50', text: 'text-sarva-warning' },
    gold: { bg: 'bg-sarva-goldSoft', text: 'text-sarva-gold' },
  };
  const t = TONES[tone] || TONES.primary;
  return (
    <div className="card-hover rounded-2xl border border-sarva-border bg-sarva-surface p-4 shadow-premium-sm">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-sarva-muted">{label}</div>
        {Icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.bg} ${t.text}`}>
            <Icon size={15} />
          </span>
        )}
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-sarva-text">{value}</div>
    </div>
  );
}

export const Input = (p) => (
  <input
    {...p}
    className={`w-full rounded-xl border border-sarva-border bg-white px-3 py-2.5 text-sm outline-none
                focus:border-sarva-primary focus:ring-2 focus:ring-sarva-primary/20 ${p.className || ''}`}
  />
);

export const Select = ({ className = '', ...p }) => (
  <div className="relative">
    <select
      {...p}
      className={`w-full appearance-none rounded-xl border border-sarva-border bg-white px-3 py-2.5 pr-9 text-sm outline-none
                  focus:border-sarva-primary focus:ring-2 focus:ring-sarva-primary/20 ${className}`}
    />
    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sarva-muted" />
  </div>
);

const BUTTON_STYLES = {
  primary: 'bg-sarva-primary text-white shadow-premium-sm hover:bg-sarva-primaryHover hover:-translate-y-0.5 hover:shadow-premium',
  ghost: 'border border-sarva-border text-sarva-text hover:bg-sarva-primarySoft',
  danger: 'bg-sarva-danger text-white hover:opacity-90',
};

export const Button = ({ className = '', variant = 'primary', loading = false, disabled, children, ...p }) => (
  <button
    {...p}
    disabled={disabled || loading}
    className={`inline-flex flex-row flex-nowrap items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold
                disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_STYLES[variant] || BUTTON_STYLES.primary} ${className}`}
  >
    {loading && <span className="sarva-spinner shrink-0" aria-hidden="true" />}
    <span className={`flex items-center gap-2 ${loading ? 'opacity-80' : ''}`}>{children}</span>
  </button>
);

const BADGE_TONES = {
  muted: 'bg-sarva-primarySoft text-sarva-primary',
  success: 'bg-emerald-50 text-sarva-success',
  warning: 'bg-amber-50 text-sarva-warning',
  danger: 'bg-rose-50 text-sarva-danger',
};

export function Badge({ tone = 'muted', children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_TONES[tone] || BADGE_TONES.muted}`}>{children}</span>;
}

export function Empty({ children = 'No records found.' }) {
  return <div className="animate-fade-in py-12 text-center text-sm text-sarva-muted">{children}</div>;
}

export function Skeleton({ className = 'h-10 w-full' }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonRows({ rows = 3, className = 'h-10 w-full' }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  );
}

export function Table({ heads, children }) {
  return (
    <div className="sarva-table overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-sarva-border bg-sarva-primarySoft/40 text-xs uppercase text-sarva-muted">
          <tr>
            {heads.map((h) => (
              <th className="px-3 py-3" key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sarva-border">{children}</tbody>
      </table>
    </div>
  );
}
"""

# ---------------------------------------------------------------------------
# layouts/Sidebar.jsx -- hides the scrollbar thumb (nav still scrolls if
# content overflows a short viewport, it just no longer shows a visible bar)
# ---------------------------------------------------------------------------
SIDEBAR_JSX = """import { NavLink } from 'react-router-dom';
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
"""

write(f"{ROOT}/layouts/Shell.jsx", SHELL_JSX, "adds persistent global top bar")
write(f"{ROOT}/components/TopBar.jsx", TOPBAR_JSX, "fixed button row, display-font title, no double border")
write(f"{ROOT}/components/UI.jsx", UI_JSX, "sans tabular-nums stats, non-wrapping Button, stronger card shadow")
write(f"{ROOT}/layouts/Sidebar.jsx", SIDEBAR_JSX, "hidden scrollbar thumb")

# append to existing index.css rather than overwrite (keeps pass-1 styles)
css_path = f"{ROOT}/index.css"
if os.path.exists(css_path):
    shutil.copy(css_path, css_path + ".bak_premiumui_v2")
    with open(css_path, "a") as f:
        f.write(INDEX_CSS_APPEND)
    print(f"\u2714 Appended to {css_path}  (hidden scrollbar util, stronger card shadow, topbar blur)")
else:
    print(f"\u26a0 {css_path} not found -- run patch_premium_ui.py first")

print("\\nDone. Backups saved alongside each file as *.bak_premiumui_v2")
print("Run: cd client && npm run dev")