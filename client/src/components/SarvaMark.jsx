// client/src/components/SarvaMark.jsx
//
// Traced 1:1 from the actual SARVA logo source file (potrace, direct
// threshold). Uses currentColor so it inherits whatever text/brand color
// is set on an ancestor or via className, same convention as any icon
// component. Single implementation — do not fork a copy elsewhere.
//
// VIEWBOX: computed at runtime via getBBox() rather than hand-authored,
// so the auto-computed square viewBox is centered on the real ink bounds
// of the 3 traced subpaths, not an estimate.

import { useEffect, useRef, useState } from 'react';

const FALLBACK_VIEWBOX = '-10 -5 89 89';
const PADDING_RATIO = 0.06; // 6% breathing room around the measured ink bounds

export default function SarvaMark({ className = '', animated = false, style }) {
  const [ready, setReady] = useState(!animated);
  const [viewBox, setViewBox] = useState(FALLBACK_VIEWBOX);
  const groupRef = useRef(null);
  const reduceMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (!animated) return;
    if (reduceMotion.current) {
      setReady(true); // instant, no stagger — accessibility, non-negotiable
      return;
    }
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, [animated]);

  const TRANSFORM = { tx: -47.6, ty: 58.032003, sx: 0.01, sy: -0.01 };

  useEffect(() => {
    if (!groupRef.current || typeof groupRef.current.getBBox !== 'function') return;
    try {
      const box = groupRef.current.getBBox();
      if (!box.width || !box.height) return;

      const corners = [
        [box.x, box.y],
        [box.x + box.width, box.y],
        [box.x, box.y + box.height],
        [box.x + box.width, box.y + box.height],
      ].map(([x, y]) => [TRANSFORM.sx * x + TRANSFORM.tx, TRANSFORM.sy * y + TRANSFORM.ty]);

      const xs = corners.map((c) => c[0]);
      const ys = corners.map((c) => c[1]);
      const minXRaw = Math.min(...xs);
      const maxXRaw = Math.max(...xs);
      const minYRaw = Math.min(...ys);
      const maxYRaw = Math.max(...ys);

      const width = maxXRaw - minXRaw;
      const height = maxYRaw - minYRaw;
      const side = Math.max(width, height) * (1 + PADDING_RATIO);
      const cx = minXRaw + width / 2;
      const cy = minYRaw + height / 2;
      const minX = cx - side / 2;
      const minY = cy - side / 2;

      setViewBox(`${minX} ${minY} ${side} ${side}`);
    } catch {
      // getBBox can throw if the element isn't rendered (e.g. display:none
      // ancestor) — keep the fallback viewBox in that case.
    }
  }, []);

  return (
    <svg
      viewBox={viewBox}
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <g
        ref={groupRef}
        transform="translate(-47.600000,58.032003) scale(0.010000,-0.010000)"
        fill="currentColor"
      >
        <path
          d="M4760 5512 l0 -292 384 0 c299 0 403 -3 472 -15 352 -61 675 -271
809 -526 174 -331 41 -769 -282 -933 -284 -143 -618 -1 -677 288 l-13 61 -273
3 -273 2 6 -122 c27 -530 205 -985 534 -1368 288 -335 656 -565 1082 -675 210
-54 214 -55 1559 -55 l1242 0 0 279 0 280 -1232 4 c-1320 5 -1283 3 -1483 56
-261 68 -509 219 -704 427 -70 75 -167 202 -160 208 2 2 38 -1 79 -5 44 -5
119 -5 182 1 313 29 591 192 794 464 323 431 337 1023 38 1474 -69 102 -220
262 -329 347 -190 148 -415 257 -663 320 -190 48 -272 55 -694 62 l-398 6 0
-291z"
          style={
            animated
              ? {
                  clipPath: ready ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
                  transition: 'clip-path 500ms cubic-bezier(0.16,1,0.3,1)',
                  transitionDelay: '0ms',
                }
              : undefined
          }
        />
        <path
          d="M6220 5796 c0 -3 45 -27 101 -56 218 -110 375 -232 540 -417 l91
-103 548 0 549 0 32 48 c124 183 378 418 537 495 23 12 42 25 42 29 0 5 -549
8 -1220 8 -671 0 -1220 -2 -1220 -4z"
          style={
            animated
              ? {
                  clipPath: ready ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
                  transition: 'clip-path 500ms cubic-bezier(0.16,1,0.3,1)',
                  transitionDelay: '120ms',
                }
              : undefined
          }
        />
        <path
          d="M9221 5789 c-94 -10 -207 -37 -313 -75 -392 -141 -735 -501 -873
-917 -61 -184 -85 -346 -85 -579 l0 -138 -372 -2 -371 -3 -23 -85 c-40 -151
-101 -293 -179 -415 -19 -30 -35 -57 -35 -60 0 -3 221 -5 490 -5 l490 0 0
-445 0 -445 280 0 279 0 4 923 3 922 23 80 c50 176 135 318 264 442 134 129
270 199 435 224 l82 12 2 261 c1 144 2 272 2 285 1 30 0 30 -103 20z"
          style={
            animated
              ? {
                  clipPath: ready ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
                  transition: 'clip-path 500ms cubic-bezier(0.16,1,0.3,1)',
                  transitionDelay: '240ms',
                }
              : undefined
          }
        />
      </g>
    </svg>
  );
}
