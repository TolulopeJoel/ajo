import { useState, useId } from 'react';

/* ---------- primitives ---------------------------------------------- */

const TONE = {
  ink: 'bg-ink text-paper',
  adire: 'bg-adire text-white',
  mango: 'bg-mango text-ink',
  palm: 'bg-palm text-white',
  kola: 'bg-kola text-white',
  card: 'bg-card text-ink',
};

export function Button({ tone = 'mango', size = 'md', className = '', ...props }) {
  const pad = size === 'lg' ? 'px-6 py-4 text-lg' : size === 'sm' ? 'px-3 py-2 text-sm' : 'px-5 py-3 text-base';
  return (
    <button
      {...props}
      className={[
        'inline-flex items-center justify-center gap-2 font-body font-extrabold',
        'rounded-chunk border-[3px] border-ink shadow-stamp',
        'transition-transform duration-100 active:translate-x-[4px] active:translate-y-[5px] active:shadow-press',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-mango focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
        'disabled:opacity-50 disabled:pointer-events-none',
        TONE[tone], pad, className,
      ].join(' ')}
    />
  );
}

export function Card({ as: Tag = 'div', className = '', ...props }) {
  return (
    <Tag
      {...props}
      className={'rounded-chunk border-[3px] border-ink bg-card shadow-stamp ' + className}
    />
  );
}

export function Row({ className = '', ...props }) {
  return (
    <div
      {...props}
      className={['border-b-[3px] border-ink px-5 py-4 last:border-b-0', className].join(' ')}
    />
  );
}

export function Eyebrow({ children, className = '' }) {
  return (
    <p className={'font-body text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink/55 ' + className}>
      {children}
    </p>
  );
}

export function Title({ children, className = '' }) {
  return (
    <h1 className={'font-display font-extrabold leading-[0.95] tracking-tight ' + className}>
      {children}
    </h1>
  );
}

export function Caption({ children, className = '' }) {
  return <p className={'font-body text-sm leading-snug text-mute ' + className}>{children}</p>;
}

/* ---------- money and numbers: exact, never decorated ----------------- */

export function Money({ value, className = '', prefix = '₦' }) {
  return (
    <span className={'font-body font-extrabold tabular-nums tracking-tight ' + className}>
      {prefix}{Number(value || 0).toLocaleString('en-NG')}
    </span>
  );
}

export function AccountNumber({ value }) {
  return (
    <span className="font-body font-extrabold tabular-nums tracking-[0.18em] text-2xl sm:text-3xl">
      {value}
    </span>
  );
}

export const inputClass =
  'w-full rounded-chunk border-[3px] border-ink bg-card px-4 py-3 font-body text-base ' +
  'placeholder:text-ink/35 focus:outline-none focus-visible:ring-4 focus-visible:ring-mango ' +
  'focus-visible:border-adire';

export function Field({ label, hint, error, children, id }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-body font-bold text-sm">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-ink/60">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-bold text-kola">{error}</p>
      )}
    </div>
  );
}

/* ---------- progressive disclosure ------------------------------------ */

/** Explanation stays available, but quiet until asked for. */
export function Explain({ label = 'Why?', children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="inline-block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="rounded-pill border-[3px] border-ink px-2 py-0.5 font-body text-[11px] font-extrabold text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-mango"
      >
        {label}
      </button>
      {open && (
        <span id={id} className="mt-2 block font-body text-sm leading-snug text-ink">
          {children}
        </span>
      )}
    </span>
  );
}

export function Accordion({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="divide-y divide-ink overflow-hidden rounded-chunk border-[3px] border-ink bg-card">
      {items.map(([q, a], i) => (
        <div key={q}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-body font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-mango"
          >
            {q}
            <span aria-hidden="true" className="shrink-0 font-display text-xl text-ink">
              {open === i ? '−' : '+'}
            </span>
          </button>
          {open === i && (
            <p className="px-5 pb-5 font-body text-[15px] leading-snug text-ink">{a}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- the signature: the ledger stamp ------------------------- */

/** A chunky ink stamp that slams onto the page the way an ajo collector
 *  marks a paid round in the notebook. Used for every confirmation
 *  in the app so one gesture means one thing: it's recorded. */
export function Stamp({ tone = 'palm', children, motionOff = false, className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-pill border-[3px] border-ink px-3 py-1',
        'font-body text-xs font-extrabold uppercase tracking-wide shadow-stampsm',
        motionOff ? '' : 'animate-stampin',
        TONE[tone], className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

/* ---------- trust ------------------------------------------------------ */

export const TRUST_TONE = { clean: 'palm', watch: 'mango', flagged: 'kola', new: 'ink' };

export function trustHeadline(trust) {
  if (!trust) return '';
  if (trust.status === 'new') return 'No record yet';
  if (trust.status === 'clean') return 'No missed contributions';
  const list = trust.missedRounds.join(' and ');
  return `Missed ${trust.missed} of ${trust.rounds} last contributions`
    + (trust.missedRounds.length ? ` — round${trust.missedRounds.length > 1 ? 's' : ''} ${list}` : '');
}

export function trustSummary(trust) {
  if (!trust) return '';
  if (trust.status === 'new') return 'First circle on Ajo';
  const c = trust.circlesCompleted;
  return `${c} circle${c === 1 ? '' : 's'} completed, `
    + (trust.missed ? `${trust.missed} missed round${trust.missed > 1 ? 's' : ''}` : 'no missed rounds');
}

/** The actual pattern, round by round. Filled = paid, hollow with a slash = missed. */
export function RoundPattern({ history, size = 'md' }) {
  const box = size === 'sm' ? 'h-5 w-5 text-[9px]' : 'h-7 w-7 text-[11px]';
  if (!history.length) {
    return <p className="font-body text-sm text-ink/60">Nothing to show yet — this is their first circle.</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-hidden="true">
      {history.map((paid, i) => (
        <span
          key={i}
          className={[
            'grid place-items-center rounded-md border-[2.5px] border-ink font-body font-extrabold',
            box,
            paid ? 'bg-palm text-white' : 'bg-kola text-white',
          ].join(' ')}
          title={`Round ${i + 1}: ${paid ? 'paid' : 'missed'}`}
        >
          {paid ? '✓' : '✕'}
        </span>
      ))}
    </div>
  );
}

export function TrustBadge({ trust, motionOff, size = 'md' }) {
  const tone = TRUST_TONE[trust.status];
  const label =
    trust.status === 'clean' ? 'Clean record'
      : trust.status === 'flagged' ? 'Flagged'
        : trust.status === 'watch' ? 'Watch'
          : 'New';
  return (
    <Stamp tone={tone} motionOff={motionOff} className={size === 'sm' ? 'px-2 py-0.5 text-[10px]' : ''}>
      <span aria-hidden="true">{trust.status === 'clean' ? '✓' : trust.status === 'new' ? '★' : '⚑'}</span>
      {label}
    </Stamp>
  );
}

/* ---------- states ----------------------------------------------------- */

export function Pill({ tone = 'quiet', children, className = '' }) {
  const skin = tone === 'quiet'
    ? 'border-[3px] border-ink bg-paper text-ink'
    : 'border-[3px] border-ink ' + TONE[tone];
  return (
    <span className={['rounded-pill px-2.5 py-1 font-body text-[11px] font-extrabold uppercase tracking-wide', skin, className].join(' ')}>
      {children}
    </span>
  );
}

export function Checking({ label = 'Checking their record' }) {
  return (
    <div className="flex items-center gap-2 font-body text-sm font-bold text-ink/70">
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-ink animate-dots"
            style={{ animationDelay: i * 160 + 'ms' }}
          />
        ))}
      </span>
      {label}
    </div>
  );
}

/* ---------- the rotation motif, shared by three screens --------------- */

export function RotationRing({ members, round, highlightId, onSelect, size = 300, compact = false }) {
  const n = Math.max(members.length, 1);
  const r = size / 2 - (compact ? 26 : 34);
  const seat = compact ? 'h-9 w-9 text-sm' : 'h-12 w-12 text-lg';

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: size, aspectRatio: '1 / 1' }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E0D5C1"
          strokeWidth="10" strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#141210"
          strokeWidth="2" strokeDasharray="4 10" strokeLinecap="round" />
      </svg>

      {members.map((m, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + (r / size) * 100 * Math.cos(angle);
        const y = 50 + (r / size) * 100 * Math.sin(angle);
        const isNow = m.position === round;
        const isMe = m.id === highlightId;
        const Tag = onSelect ? 'button' : 'div';
        return (
          <Tag
            key={m.id}
            {...(onSelect ? { onClick: () => onSelect(m.id), 'aria-label': `Position ${m.position}, ${m.name}` } : { 'aria-hidden': 'true' })}
            className={[
              'absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full',
              'font-display font-extrabold', seat,
              onSelect ? 'focus:outline-none focus-visible:ring-4 focus-visible:ring-mango' : '',
              isMe ? 'border-[3px] border-ink bg-ink text-paper shadow-stamp'
                : isNow ? 'border-[3px] border-ink bg-mango shadow-stamp'
                  : 'border-[3px] border-ink bg-card text-ink',
            ].join(' ')}
            style={{ left: x + '%', top: y + '%' }}
          >
            {m.position}
          </Tag>
        );
      })}
    </div>
  );
}
