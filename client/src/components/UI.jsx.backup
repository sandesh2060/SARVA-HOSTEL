import React from 'react';
import { ChevronDown, ChevronRight, RefreshCw, X } from 'lucide-react';
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
    <section className={`card rounded-[1.75rem] bg-sarva-surface p-4 sm:p-5 ${hover ? 'card-hover' : ''} ${className}`}>
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
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sarva-primarySoft text-sarva-primary">
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
    <div className="card-hover rounded-[1.5rem] bg-sarva-surface p-4 shadow-premium-sm transition">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-sarva-muted">{label}</div>
        {Icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-full ${t.bg} ${t.text}`}>
            <Icon size={15} />
          </span>
        )}
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-sarva-text">{value}</div>
    </div>
  );
}

/**
 * Horizontal entity row -- shared list-item pattern for Students, Payments,
 * Rooms, Staff, etc. Whole row is clickable; no separate action button
 * needed. Only pass what you actually have -- no field is invented here,
 * callers must supply real data.
 *
 * Props:
 *  - avatarUrl / avatarFallback: photo or single-character fallback
 *  - title: primary line (e.g. student name)
 *  - subtitle: secondary line (e.g. "STU-001 \u00b7 9841234567")
 *  - meta: array of { label, value } shown as stacked mini-columns
 *  - status: { tone, label } rendered as a Badge
 *  - onClick
 */
export function EntityRow({ avatarUrl, avatarFallback, title, subtitle, meta = [], status, onClick }) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(e); } : undefined}
      className={`flex min-w-0 items-center gap-3 rounded-[1.5rem] bg-sarva-surface p-3.5 sm:gap-4 sm:p-4 shadow-premium-sm transition ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-premium focus:outline-none focus:ring-2 focus:ring-sarva-primary/40' : ''
      }`}
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-sarva-primary to-sarva-primaryDark">
        {avatarUrl ? (
          <img src={avatarUrl} alt={title} className="h-full w-full object-cover object-top" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-lg font-semibold text-white/90">
            {avatarFallback}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-sarva-text">{title}</div>
        {subtitle && <div className="truncate text-xs text-sarva-muted">{subtitle}</div>}
      </div>

      {meta.map((m, i) => (
        <div key={i} className="hidden shrink-0 text-right sm:block">
          <div className="text-sm font-bold text-sarva-text">{m.value}</div>
          <div className="text-[11px] text-sarva-muted">{m.label}</div>
        </div>
      ))}

      {status && (
        <span className="shrink-0">
          <Badge tone={status.tone}>{status.label}</Badge>
        </span>
      )}

      {onClick && <ChevronRight size={18} className="shrink-0 text-sarva-muted" />}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-rose-50 p-4 text-sm text-sarva-danger">
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-sarva-danger shadow-premium-sm hover:opacity-90"
        >
          <RefreshCw size={13} /> Retry
        </button>
      )}
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

export function PillTabs({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
            value === v
              ? 'bg-sarva-primary text-white shadow-premium-sm'
              : 'bg-sarva-bg text-sarva-muted hover:bg-sarva-primarySoft hover:text-sarva-primary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const BUTTON_STYLES = {
  primary: 'bg-sarva-primary text-white shadow-premium-sm hover:bg-sarva-primaryHover hover:-translate-y-0.5 hover:shadow-premium',
  gold: 'bg-sarva-gold text-white shadow-premium-sm hover:opacity-90 hover:-translate-y-0.5 hover:shadow-premium',
  ghost: 'bg-sarva-primarySoft text-sarva-primary hover:bg-sarva-primary hover:text-white',
  danger: 'bg-sarva-danger text-white hover:opacity-90',
};

export const Button = ({ className = '', variant = 'primary', loading = false, disabled, children, ...p }) => (
  <button
    {...p}
    disabled={disabled || loading}
    className={`inline-flex flex-row flex-nowrap items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold
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

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-2 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className={`relative z-10 max-h-[90vh] w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} overflow-y-auto rounded-[1.75rem] bg-sarva-surface p-6 shadow-premium animate-fade-in`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-sarva-text">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-sarva-muted hover:bg-sarva-primarySoft hover:text-sarva-primary">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Switch({ checked, onChange, label, help, disabled = false }) {
  return (
    <label className={`flex items-center justify-between gap-4 py-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <span>
        {label && <span className="block text-sm font-medium text-sarva-text">{label}</span>}
        {help && <span className="block text-xs text-sarva-muted">{help}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-sarva-primary' : 'bg-sarva-border'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}
