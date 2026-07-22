import { useState, useRef, useEffect } from 'react';
import { useStore } from '../state/store.jsx';
import { DEMO_SEEDS } from '../services/mockData.js';
import {
  Button, Card, Field, inputClass, Eyebrow, Title, Caption, Pill,
  TrustBadge, RoundPattern, trustHeadline, Checking, Explain,
} from '../components/kit.jsx';

function buildWhatsAppLink(phone, circleName, amount, frequency) {
  const digits = String(phone).replace(/\D/g, ''); // strip everything non-digit
  let intl = digits;
  
  if (intl.startsWith('0')) {
    intl = '234' + intl.slice(1);
  } else if (intl.length === 10) { // rare case
    intl = '234' + intl;
  } else if (!intl.startsWith('234')) {
    intl = '234' + intl;
  }
  
  const msg = `You've been invited to join *${circleName}* on Ajo — ` +
    `a savings circle where each member contributes ₦${Number(amount).toLocaleString('en-NG')} ${frequency}. ` +
    `Your payment history from past circles has been checked.\n\n` +
    `Open Ajo to accept your seat: https://useajo.app`;
  
  return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
}

function MemberCard({ entry, motionOff, onRemove, onOpen, circleName, circleAmount, circleFrequency }) {
  const { status, member, error, phone } = entry;

  if (status === 'checking') {
    return (
      <Card className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-body font-extrabold tabular-nums tracking-wide">{phone}</span>
          <Eyebrow>Reading the ledger</Eyebrow>
        </div>
        <div className="mt-4"><Checking /></div>
        <div className="mt-4 flex gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="h-7 w-7 animate-dots rounded-md bg-line"
              style={{ animationDelay: i * 130 + 'ms' }} />
          ))}
        </div>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="p-5">
        <p className="font-body font-extrabold tabular-nums">{phone}</p>
        <p className="mt-1 font-body text-sm text-kola">{error}</p>
        <Button size="sm" className="mt-4" onClick={onRemove}>Remove and retry</Button>
      </Card>
    );
  }

  const t = member.trust;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-extrabold leading-tight">{member.name}</p>
          <p className="font-body text-sm tabular-nums tracking-wide text-mute">{member.phone}</p>
        </div>
        <TrustBadge trust={t} motionOff={motionOff} />
      </div>

      <div className="border-t-[3px] border-ink px-5 py-5">
        <p className="font-body font-bold leading-snug">{trustHeadline(t)}</p>
        <div className="mt-4"><RoundPattern history={t.history} /></div>
        <Caption className="mt-3">{t.note}</Caption>
      </div>

      <div className="flex flex-col gap-3 border-t-[3px] border-ink px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Pill>{member.state === 'joined' ? 'Joined' : 'Invited — waiting for them to join'}</Pill>
        <div className="flex flex-wrap gap-2">
          {circleName && member.state !== 'joined' && (
            <a
              href={buildWhatsAppLink(member.phone, circleName, circleAmount, circleFrequency)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share invite for ${member.name} on WhatsApp`}
              className={
                'inline-flex items-center justify-center gap-1.5 rounded-chunk border-[3px] border-ink ' +
                'bg-palm px-3 py-2 font-body text-sm font-extrabold text-white shadow-stampsm ' +
                'transition-transform duration-100 active:translate-x-[3px] active:translate-y-[4px] active:shadow-press ' +
                'focus:outline-none focus-visible:ring-4 focus-visible:ring-mango'
              }
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true" className="shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          )}
          <Button size="sm" onClick={onOpen}>Record</Button>
          <Button size="sm" onClick={onRemove}>Remove</Button>
        </div>
      </div>
    </Card>
  );
}

export default function Invite({ go }) {
  const { members, circle, motionOff, dispatch, api } = useStore();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState([]);
  const inputRef = useRef(null);
  const liveRef = useRef(null);

  const seats = circle?.size || 5;
  const filled = members.length;

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function add(raw) {
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length !== 11) {
      setError('Nigerian numbers are 11 digits, e.g. 08031234567.');
      return;
    }
    if (members.some((m) => m.phone === digits) || pending.some((p) => p.phone === digits)) {
      setError('That number is already in this circle.'); return;
    }
    if (filled + pending.length >= seats) {
      setError(`This circle holds ${seats} people.`); return;
    }
    setError(''); setPhone('');
    const id = 'm_' + digits;
    setPending((p) => [...p, { id, phone: digits, status: 'checking' }]);

    try {
      const found = await api.lookupMember(digits);
      setPending((p) => p.filter((x) => x.id !== id));
      const newMember = { ...found, state: 'invited', funded: false, autoPay: false, collateral: 0, collected: false };
      dispatch({
        type: 'addMember',
        member: newMember,
      });
      if (circle?.id && api.addMember) {
        api.addMember(circle.id, newMember).catch(() => {});
      }
      if (liveRef.current) liveRef.current.textContent = `${found.name} invited. ${trustHeadline(found.trust)}.`;

    } catch {
      setPending((p) => p.map((x) => (x.id === id
        ? { ...x, status: 'error', error: 'That check did not go through. Try the number again.' } : x)));
    }
  }

  const cards = [
    ...pending.map((p) => ({ ...p, key: p.id })),
    ...[...members].reverse().map((m) => ({ key: m.id, id: m.id, phone: m.phone, status: 'done', member: m })),
  ];

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>{circle?.name}</Eyebrow>
        <Title className="mt-1 text-4xl">Who is in the circle?</Title>
        <Caption className="mt-2">
          You see how they paid in past circles before you agree to save with them.{' '}
          <Explain label="Where does this come from?">
            Every completed round on Ajo is recorded against the member's verified BVN.
            Nobody can edit their own record.
          </Explain>
        </Caption>
      </header>

      <Card className="p-5">
        <Field id="phone" label="Their phone number" error={error}>
          <div className="flex gap-2">
            <input
              ref={inputRef} id="phone" inputMode="numeric" autoComplete="tel" maxLength={11}
              className={inputClass + ' tabular-nums tracking-wide'}
              placeholder="08031234567" value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') add(phone); }}
            />
            <Button className="shrink-0" onClick={() => add(phone)}>Check</Button>
          </div>
        </Field>

        {/* <div className="mt-5 flex flex-wrap items-center gap-2 border-t-[3px] border-ink pt-4">
          <Eyebrow className="mr-1">Try one</Eyebrow>
          <Button size="sm" onClick={() => add(DEMO_SEEDS.clean)}>Clean record</Button>
          <Button size="sm" onClick={() => add(DEMO_SEEDS.flagged)}>Flagged record</Button>
        </div> */}
      </Card>

      <div className="flex items-center justify-between">
        <Eyebrow>{filled} of {seats} seats filled</Eyebrow>
        <div className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: seats }).map((_, i) => (
            <span key={i} className={'h-2.5 w-2.5 rounded-full ' + (i < filled ? 'bg-ink' : 'bg-line')} />
          ))}
        </div>
      </div>

      <p ref={liveRef} aria-live="polite" className="sr-only" />

      {cards.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-display text-xl font-extrabold">Nobody added yet</p>
          <Caption className="mt-2">Start with the person you trust most.</Caption>
        </Card>
      ) : (
        <div className="space-y-4">
          {cards.map((c) => (
            <MemberCard
              key={c.key} entry={c} motionOff={motionOff}
              circleName={circle?.name}
              circleAmount={circle?.amount}
              circleFrequency={circle?.frequency}
              onOpen={() => go('trust', c.member)}
              onRemove={() => {
                if (c.status === 'done') dispatch({ type: 'removeMember', id: c.id });
                else setPending((p) => p.filter((x) => x.id !== c.id));
              }}
            />
          ))}
        </div>
      )}

      {filled >= 2 && (
        <Button size="lg" tone="mango" className="w-full" onClick={() => go('order')}>
          Set the payout order
        </Button>
      )}
    </div>
  );
}
