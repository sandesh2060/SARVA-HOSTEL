import { BedDouble, Wallet, ArrowRight } from 'lucide-react';

const STATUS_DOT = {
  success: 'var(--sarva-success)',
  warning: 'var(--sarva-warning)',
  danger: 'var(--sarva-danger)',
  muted: 'var(--sarva-muted)',
};

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Compact currency, e.g. "NPR 10K" / "NPR 4K" / "NPR 0" -- keeps the bottom
// row short enough that it never wraps, regardless of the actual fee size.
function compactMoney(amount, currency = 'NPR') {
  const n = Number(amount) || 0;
  if (n === 0) return `${currency} 0`;
  const formatted = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
  return `${currency} ${formatted}`;
}

/**
 * @param {object} props
 * @param {object} props.student - raw student record (name, studentCode, phone, photo, status)
 * @param {string} props.roomText - already-formatted room/bed label, or "Not assigned"
 * @param {number} props.feeAmount - raw monthly fee amount (number)
 * @param {string} [props.currency] - currency code, defaults to "NPR"
 * @param {{tone: string, label: string}} props.status
 * @param {() => void} props.onClick
 */
export default function StudentCard({ student, roomText, feeAmount, currency = 'NPR', status, onClick }) {
  const photoUrl = student.photo?.url;
  const hasRoom = roomText && roomText !== 'Not assigned';
  // Show room + bed together (last two segments), not just the bed alone.
  const roomBedShort = hasRoom ? roomText.split(' \u00b7 ').slice(-2).join(' \u00b7 ') : 'No room';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Open profile for ${student.name}`}
      className="card-hover group relative w-full self-start overflow-hidden rounded-[1.75rem] cursor-pointer
                 shadow-[0_1px_2px_rgba(36,19,24,0.04),0_24px_48px_-20px_rgba(36,19,24,0.18)]
                 outline-none focus-visible:ring-2 focus-visible:ring-sarva-gold focus-visible:ring-offset-2
                 transition-transform duration-200"
      style={{ aspectRatio: '0.7' }}
    >
      {/* Photo / fallback background -- always fills the full card */}
      <div className="absolute inset-0">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Profile photo of ${student.name}`}
            loading="lazy"
            className="h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.025]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-sarva-primary to-sarva-primaryDark" />
        )}
      </div>

      {/* Fallback initials -- pinned to the TOP zone only, so they never
          collide with the bottom text block even when the name wraps to
          two lines. Never rendered when a real photo exists. */}
      {!photoUrl && (
        <div className="absolute inset-x-0 top-0 flex h-[56%] items-center justify-center">
          <span className="text-6xl font-semibold tracking-wide text-white/80">{initials(student.name)}</span>
        </div>
      )}

      {/* Readability gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.65) 75%, rgba(0,0,0,0.92) 100%)',
        }}
      />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[21px] font-semibold leading-tight text-white">
            {student.name}
          </h3>
          <span className="mt-1.5 flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-white/90">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: STATUS_DOT[status.tone] || STATUS_DOT.muted }}
            />
            {status.label}
          </span>
        </div>

        <div className="text-[13px] leading-snug text-white/75">
          <div className="truncate">{[student.studentCode, student.phone].filter(Boolean).join(' \u00b7 ')}</div>
          <div className="truncate">{roomText}</div>
        </div>

        <div className="h-px bg-white/15" />

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex min-w-0 items-center gap-2.5 text-[12px] font-medium text-white">
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap">
              <BedDouble size={13} />
              {roomBedShort}
            </span>
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap">
              <Wallet size={13} />
              {compactMoney(feeAmount, currency)}
            </span>
          </div>

          <span
            aria-hidden="true"
            className="flex shrink-0 items-center gap-1 rounded-full bg-white py-1.5 pl-3 pr-2 text-[12px] font-semibold text-sarva-text
                       transition-transform duration-200 group-hover:translate-x-0.5"
          >
            View
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}

export function StudentCardSkeleton() {
  return (
    <div className="skeleton relative w-full self-start overflow-hidden rounded-[1.75rem]" style={{ aspectRatio: '0.7' }} />
  );
}