import os
import shutil

ROOT = "client/src"

def write(path, content, label):
    full = path
    if os.path.exists(full):
        shutil.copy(full, full + ".bak_premiumui")
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    print(f"\u2714 Wrote {full}  ({label})")


# ---------------------------------------------------------------------------
# tailwind.config.js
# ---------------------------------------------------------------------------
TAILWIND_CONFIG = """export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sarva: {
          primary: '#5C2A3D',
          primaryHover: '#4A2231',
          primaryDark: '#3A1A26',
          primarySoft: '#F4E9EC',
          gold: '#C99A3B',
          goldSoft: '#FBF3E1',
          bg: '#F7F5F6',
          surface: '#FFFFFF',
          border: '#E7DEE1',
          text: '#241318',
          muted: '#7A6670',
          success: '#1F8A5F',
          warning: '#B7791F',
          danger: '#B3261E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(36,19,24,0.04), 0 1px 3px 0 rgba(36,19,24,0.06)',
        premium: '0 20px 40px -12px rgba(36,19,24,0.18)',
        'premium-sm': '0 8px 20px -8px rgba(36,19,24,0.14)',
      },
    },
  },
  plugins: [],
}
"""

# ---------------------------------------------------------------------------
# index.css
# ---------------------------------------------------------------------------
INDEX_CSS = """@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --sarva-primary: #5C2A3D;
  --sarva-primary-hover: #4A2231;
  --sarva-primary-dark: #3A1A26;
  --sarva-primary-soft: #F4E9EC;
  --sarva-gold: #C99A3B;
  --sarva-gold-soft: #FBF3E1;
  --sarva-bg: #F7F5F6;
  --sarva-surface: #FFFFFF;
  --sarva-border: #E7DEE1;
  --sarva-text: #241318;
  --sarva-muted: #7A6670;
  --sarva-success: #1F8A5F;
  --sarva-warning: #B7791F;
  --sarva-danger: #B3261E;
}

html { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }

body {
  background-color: var(--sarva-bg);
  background-image: radial-gradient(circle at top right, rgba(201,154,59,0.06), transparent 45%);
  color: var(--sarva-text);
  -webkit-font-smoothing: antialiased;
}

.font-display { font-family: 'Fraunces', ui-serif, Georgia, serif; }

input, select, textarea {
  @apply w-full rounded-xl px-3 py-2 text-sm outline-none transition;
  border: 1px solid var(--sarva-border);
  background-color: #ffffff;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--sarva-primary);
  box-shadow: 0 0 0 3px rgba(92, 42, 61, 0.14);
}
select { appearance: none; -webkit-appearance: none; background-image: none; }

button { @apply rounded-xl px-4 py-2 font-medium transition; }

table { @apply w-full text-sm; }
th { @apply text-left font-medium py-3; color: var(--sarva-muted); }
td { @apply py-3; border-top: 1px solid var(--sarva-border); }

.card {
  @apply rounded-2xl p-5;
  border: 1px solid var(--sarva-border);
  background-color: var(--sarva-surface);
  box-shadow: 0 1px 2px 0 rgba(36, 19, 24, 0.04), 0 1px 3px 0 rgba(36, 19, 24, 0.06);
}

.bg-sarva-bg { background-color: var(--sarva-bg); }
.bg-sarva-surface { background-color: var(--sarva-surface); }
.bg-sarva-primary { background-color: var(--sarva-primary); }
.bg-sarva-primaryDark { background-color: var(--sarva-primary-dark); }
.bg-sarva-danger { background-color: var(--sarva-danger); }
.bg-sarva-primarySoft { background-color: var(--sarva-primary-soft); }
.bg-sarva-goldSoft { background-color: var(--sarva-gold-soft); }
.bg-sarva-primarySoft\\/40 { background-color: rgba(244, 233, 236, 0.4); }
.bg-sarva-gold { background-color: var(--sarva-gold); }

.text-sarva-text { color: var(--sarva-text); }
.text-sarva-muted { color: var(--sarva-muted); }
.text-sarva-primary { color: var(--sarva-primary); }
.text-sarva-gold { color: var(--sarva-gold); }
.text-sarva-success { color: var(--sarva-success); }
.text-sarva-warning { color: var(--sarva-warning); }
.text-sarva-danger { color: var(--sarva-danger); }

.border-sarva-border { border-color: var(--sarva-border); }
.divide-sarva-border > :not([hidden]) ~ :not([hidden]) { border-color: var(--sarva-border); }

.hover\\:bg-sarva-primaryHover:hover { background-color: var(--sarva-primary-hover); }
.hover\\:bg-sarva-primarySoft:hover { background-color: var(--sarva-primary-soft); }
.hover\\:text-sarva-primary:hover { color: var(--sarva-primary); }
.focus\\:border-sarva-primary:focus { border-color: var(--sarva-primary); }
.focus\\:ring-sarva-primary\\/20:focus { box-shadow: 0 0 0 2px rgba(92, 42, 61, 0.2); }

@media (prefers-reduced-motion: no-preference) {
  @keyframes sarva-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes sarva-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
  @keyframes sarva-spin { to { transform: rotate(360deg); } }

  .animate-fade-in { animation: sarva-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .animate-fade-in-delay-0 { animation: sarva-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .animate-fade-in-delay-1 { animation: sarva-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.06s; }
  .animate-fade-in-delay-2 { animation: sarva-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.12s; }
  .animate-fade-in-delay-3 { animation: sarva-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.18s; }
  .animate-fade-in-delay-4 { animation: sarva-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.24s; }

  .skeleton {
    background: linear-gradient(90deg, var(--sarva-border) 25%, #f2eaee 37%, var(--sarva-border) 63%);
    background-size: 400px 100%;
    animation: sarva-shimmer 1.4s ease-in-out infinite;
    border-radius: 0.75rem;
  }
  .sarva-spinner {
    display: inline-block; width: 14px; height: 14px; border-radius: 999px;
    border: 2px solid currentColor; border-top-color: transparent; opacity: 0.9;
    animation: sarva-spin 0.6s linear infinite;
  }
}

::selection { background: var(--sarva-primary-soft); color: var(--sarva-primary); }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--sarva-border); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: var(--sarva-muted); }

a, button, input, select, textarea, .nav-link {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.12s ease;
}
button:active:not(:disabled) { transform: scale(0.97); }

.card { transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease; }
.card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 28px -10px rgba(36, 19, 24, 0.16); border-color: var(--sarva-primary-soft); }

.sarva-table tbody tr { transition: background-color 0.15s ease; }
.sarva-table tbody tr:hover { background-color: var(--sarva-primary-soft); }
"""

# ---------------------------------------------------------------------------
# components/UI.jsx
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
      <div className="mt-2 text-2xl font-bold text-sarva-text">{value}</div>
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
    <div className="card-hover rounded-2xl border border-sarva-border bg-sarva-surface p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-sarva-muted">{label}</div>
        {Icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.bg} ${t.text}`}>
            <Icon size={15} />
          </span>
        )}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-sarva-text">{value}</div>
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
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold
                disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_STYLES[variant] || BUTTON_STYLES.primary} ${className}`}
  >
    {loading && <span className="sarva-spinner" aria-hidden="true" />}
    <span className={loading ? 'opacity-80' : ''}>{children}</span>
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
# pages/Students.jsx
# ---------------------------------------------------------------------------
STUDENTS_JSX = """import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Page, Card, Input, Select, Button, Badge, Empty, StatCard, money } from '../components/UI';
import { useAuth } from '../context/Auth';
import { Search, Plus, Users, UserCheck, Clock, LogOut as LogOutIcon } from 'lucide-react';

const STATUS_TONE = {
  active: 'success',
  on_leave: 'warning',
  on_hold: 'muted',
  suspended: 'danger',
  checked_out: 'muted',
};

const STATUS_LABEL = {
  active: 'Active',
  on_leave: 'On leave',
  on_hold: 'On hold',
  suspended: 'Suspended',
  checked_out: 'Checked out',
};

const STATUS_FILTERS = [
  ['all', 'All'],
  ['active', 'Active'],
  ['on_leave', 'On leave'],
  ['on_hold', 'On hold'],
  ['suspended', 'Suspended'],
  ['checked_out', 'Checked out'],
];

export default function Students() {
  const { hostel } = useAuth();
  const nav = useNavigate();

  const [rows, setRows] = useState([]);
  const [beds, setBeds] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (q = '') => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/students', { params: q ? { q } : {} });
      setRows(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const [rooms, setRooms] = useState([]);

  const loadRooms = useCallback(async () => {
    try {
      const { data } = await api.get('/rooms/overview');
      setRooms(data.rooms || []);
      setBeds(data.beds || []);
    } catch {
      // Room management may be disabled -- Room/Bed column simply won't render.
    }
  }, []);

  useEffect(() => {
    void load();
    void loadRooms();
  }, [load, loadRooms]);

  const roomById = useMemo(() => {
    const map = new Map();
    for (const r of rooms) map.set(r._id, r);
    return map;
  }, [rooms]);

  const bedByStudent = useMemo(() => {
    const map = new Map();
    for (const b of beds) {
      if (b.studentId) map.set(b.studentId._id || b.studentId, b);
    }
    return map;
  }, [beds]);

  const roomLabel = (bed) => {
    if (!bed) return null;
    const roomIdValue = bed.roomId?._id || bed.roomId;
    const room = roomById.get(roomIdValue);
    const name = room ? [room.building, room.floor, room.name].filter(Boolean).join(' \\u00b7 ') : null;
    return name ? `${name} \\u00b7 ${bed.label}` : `Bed ${bed.label}`;
  };

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return rows;
    return rows.filter((s) => s.status === statusFilter);
  }, [rows, statusFilter]);

  const counts = useMemo(() => {
    const c = { total: rows.length, active: 0, on_leave: 0, checked_out: 0 };
    for (const s of rows) {
      if (s.status === 'active') c.active++;
      if (s.status === 'on_leave') c.on_leave++;
      if (s.status === 'checked_out') c.checked_out++;
    }
    return c;
  }, [rows]);

  const openStudent = (id) => nav(`/students/${id}`);

  return (
    <Page
      title="Students"
      subtitle="Manage hostel students and records."
      action={
        <Button onClick={() => nav('/students/new')}>
          <Plus size={16} /> Add Student
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total students" value={counts.total} icon={Users} tone="primary" />
        <StatCard label="Active" value={counts.active} icon={UserCheck} tone="success" />
        <StatCard label="On leave" value={counts.on_leave} icon={Clock} tone="warning" />
        <StatCard label="Checked out" value={counts.checked_out} icon={LogOutIcon} tone="gold" />
      </div>

      <Card className="mt-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <form className="relative flex-1" onSubmit={(e) => { e.preventDefault(); load(query); }}>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sarva-muted" />
            <Input
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, student ID, phone or email\\u2026"
            />
          </form>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-48">
            {STATUS_FILTERS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="mt-4">
        {error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-sarva-danger">{error}</div>}

        {loading ? (
          <div className="py-8 text-center text-sm text-sarva-muted">Loading\\u2026</div>
        ) : !filtered.length ? (
          rows.length ? (
            <Empty>No students match your search.</Empty>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-sarva-text">No students yet</p>
              <p className="mt-1 text-sm text-sarva-muted">Register your first student to start managing billing, rooms and hostel records.</p>
              <Button className="mt-4" onClick={() => nav('/students/new')}>
                <Plus size={16} /> Register Student
              </Button>
            </div>
          )
        ) : (
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 260px))' }}
          >
            {filtered.map((s) => {
              const bed = bedByStudent.get(s._id);
              const fee = money(s.monthlyFee?.$numberDecimal ?? s.monthlyFee, hostel?.currency || 'NPR');
              const roomText = bed ? roomLabel(bed) : 'Not assigned';
              return (
                <div
                  key={s._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openStudent(s._id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') openStudent(s._id); }}
                  className="group cursor-pointer overflow-hidden rounded-3xl border border-sarva-border bg-sarva-surface shadow-premium-sm transition hover:-translate-y-1 hover:shadow-premium focus:outline-none focus:ring-2 focus:ring-sarva-primary/40"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-sarva-primarySoft to-sarva-goldSoft">
                    {s.photo?.url ? (
                      <img
                        src={s.photo.url}
                        alt={s.name}
                        className="absolute inset-0 h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sarva-primary to-sarva-primaryDark">
                        <span className="font-display text-6xl font-semibold text-white/90">
                          {s.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                    <span className="absolute right-3 top-3">
                      <Badge tone={STATUS_TONE[s.status] || 'muted'}>{STATUS_LABEL[s.status] || s.status}</Badge>
                    </span>

                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="font-display text-lg font-semibold leading-tight text-white">{s.name}</div>
                      <div className="text-xs tracking-wide text-white/70">{s.studentCode}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-sarva-border border-b border-sarva-border text-center">
                    <div className="px-2 py-3">
                      <div className="text-sm font-bold text-sarva-text">{fee}</div>
                      <div className="text-[11px] text-sarva-muted">Monthly fee</div>
                    </div>
                    <div className="px-2 py-3">
                      <div className="truncate text-sm font-bold text-sarva-text">{roomText}</div>
                      <div className="text-[11px] text-sarva-muted">Room</div>
                    </div>
                  </div>

                  <div className="p-3">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openStudent(s._id); }}
                      className="w-full rounded-full bg-sarva-primary py-2.5 text-sm font-semibold text-white shadow-premium-sm transition hover:bg-sarva-primaryHover hover:shadow-premium"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </Page>
  );
}
"""

# ---------------------------------------------------------------------------
# layouts/Sidebar.jsx
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
        <nav className="flex-1 space-y-4 overflow-y-auto">
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
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <NavItems visible={visibleFlat} dense />
        </nav>
      </div>
    </>
  );
}
"""

write(f"{ROOT}/../tailwind.config.js", TAILWIND_CONFIG, "colors, display font, premium shadows")
write(f"{ROOT}/index.css", INDEX_CSS, "Fraunces font, select reset, gradient bg")
write(f"{ROOT}/components/UI.jsx", UI_JSX, "premium Select, StatCard, lifted Button")
write(f"{ROOT}/pages/Students.jsx", STUDENTS_JSX, "auto-fill grid, unified avatar, StatCard row")
write(f"{ROOT}/layouts/Sidebar.jsx", SIDEBAR_JSX, "grouped nav sections")

print("\\nDone. Backups saved alongside each file as *.bak_premiumui")
print("Run: cd client && npm run dev")