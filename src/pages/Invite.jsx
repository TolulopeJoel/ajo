import { useState, useRef, useEffect } from 'react';
import { useStore } from '../state/store.jsx';
import { DEMO_SEEDS } from '../services/mockData.js';
import {
  Button, Card, Field, inputClass, Eyebrow, Title, Caption, Pill,
  TrustBadge, RoundPattern, trustHeadline, Checking, Explain,
} from '../components/kit.jsx';

function MemberCard({ entry, motionOff, onRemove, onOpen }) {
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

      <div className="flex items-center justify-between gap-2 border-t-[3px] border-ink px-5 py-4">
        <Pill>{member.state === 'joined' ? 'Joined' : 'Invited — waiting for them to join'}</Pill>
        <div className="flex gap-2">
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
      dispatch({
        type: 'addMember',
        member: { ...found, state: 'invited', funded: false, autoPay: false, collateral: 0, collected: false },
      });
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

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t-[3px] border-ink pt-4">
          <Eyebrow className="mr-1">Try one</Eyebrow>
          <Button size="sm" onClick={() => add(DEMO_SEEDS.clean)}>Clean record</Button>
          <Button size="sm" onClick={() => add(DEMO_SEEDS.flagged)}>Flagged record</Button>
        </div>
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
