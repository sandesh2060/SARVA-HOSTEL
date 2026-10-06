import React from 'react';
import { Badge } from './UI';
import { LayoutDashboard, Users, WalletCards, BedDouble, Inbox, ChartNoAxesCombined, Settings, FileText, Bell, Package, ReceiptText, UserRoundCog, ClipboardCheck } from 'lucide-react';

const PAGE_ICONS = {
  Dashboard: LayoutDashboard, Students: Users, Payments: WalletCards, 'Rooms & Beds': BedDouble,
  'Admission Requests': Inbox, Analytics: ChartNoAxesCombined, Settings, Reports: FileText,
  Notifications: Bell, Stock: Package, Expenses: ReceiptText, Staff: UserRoundCog, Attendance: ClipboardCheck,
};

/**
 * Responsive per-page header.
 *
 * Mobile:
 *  - compact native-app hierarchy
 *  - title/badge remain readable on narrow screens
 *  - subtitle truncates cleanly instead of stretching the page
 *  - actions become a horizontally scrollable action rail
 *
 * Desktop:
 *  - preserves the existing title/subtitle + right actions layout
 */
export default function TopBar({ title, badge, subtitle, actions, className = '', icon: IconProp }) {
  const Icon = IconProp || PAGE_ICONS[title];
  return (
    <header
      className={`sarva-page-header min-w-0 pb-3 sm:pb-5 ${className}`}
    >
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="sarva-page-title-icon" aria-hidden="true">
              {Icon ? <Icon size={17} strokeWidth={2.1} /> : <span className="h-4 w-1 rounded-full bg-sarva-gold" />}
            </span>

            <h1 className="min-w-0 flex-1 truncate font-display text-[1.35rem] font-semibold leading-tight tracking-tight text-sarva-text sm:text-2xl">
              {title}
            </h1>

            {badge && (
              <div className="shrink-0">
                <Badge tone="muted">
                  {String(badge).toUpperCase()}
                </Badge>
              </div>
            )}
          </div>

          {subtitle && (
            <p className="mt-1.5 line-clamp-2 max-w-2xl pl-[3.15rem] text-[11px] leading-[1.45] text-sarva-muted sm:mt-2 sm:pl-0 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="-mx-1 min-w-0 lg:mx-0 lg:w-auto lg:shrink-0">
            <div className="sarva-page-actions no-scrollbar flex w-full min-w-0 items-center gap-2 overflow-x-auto px-1 pb-1 lg:w-auto lg:flex-wrap lg:justify-end lg:overflow-visible lg:px-0 lg:pb-0 [&>*]:shrink-0">
              {actions}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
