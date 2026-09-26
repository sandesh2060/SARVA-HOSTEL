import React from 'react';
import SarvaMark from './SarvaMark';

/**
 * SARVA brand mark + wordmark.
 *
 * Props:
 *  - showWordmark: whether to render "SARVA Hostel" text next to the mark (default true)
 *  - size: pixel size of the mark (default 36)
 *  - animated: pass through to SarvaMark's reveal animation (default false)
 *  - className: extra classes for the outer wrapper
 */
export default function Logo({ showWordmark = true, size = 36, animated = false, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <SarvaMark
        animated={animated}
        className="shrink-0 text-sarva-gold"
        style={{ width: size, height: size }}
      />

      {showWordmark && (
        <span className="text-xl font-bold leading-none text-white">
          SARVA <span className="text-sarva-gold">Hostel</span>
        </span>
      )}
    </div>
  );
}
