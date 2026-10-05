import React from 'react';
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
      className={`sarva-page-header flex min-w-0 flex-col gap-3 pb-4 sm:gap-4 sm:pb-5 lg:flex-row lg:items-center lg:justify-between ${className}`}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="min-w-0 font-display text-xl font-semibold tracking-tight text-sarva-text sm:text-2xl">{title}</h1>
          {badge && (
            <Badge tone="muted">
              {String(badge).toUpperCase()}
            </Badge>
          )}
        </div>
        {subtitle && <p className="max-w-2xl text-xs leading-relaxed text-sarva-muted sm:text-sm">{subtitle}</p>}
      </div>

      {actions && (
        <div className="sarva-page-actions flex w-full min-w-0 flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
