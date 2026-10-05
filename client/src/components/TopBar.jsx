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
      className={`flex flex-col gap-4 pb-5 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-semibold sm:text-2xl tracking-tight text-sarva-text">{title}</h1>
          {badge && (
            <Badge tone="muted">
              {String(badge).toUpperCase()}
            </Badge>
          )}
        </div>
        {subtitle && <p className="max-w-2xl text-xs leading-relaxed text-sarva-muted sm:text-sm">{subtitle}</p>}
      </div>

      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
