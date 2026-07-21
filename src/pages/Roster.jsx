import { useEffect, useState } from 'react';
import { useStore, totalPot } from '../state/store.jsx';
import {
  Button, Card, Eyebrow, Title, Caption, Money, TrustBadge, Pill,
} from '../components/kit.jsx';

function useCountdown(frequency) {
  const days = frequency === 'monthly' ? 30 : frequency === 'biweekly' ? 14 : 7;
  const [left, setLeft] = useState(days * 86400 - 3 * 3600 - 42 * 60);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
}

export default function Roster({ go }) {
  const store = useStore();
  const { circle, members, joined, me, round, isOrganizer } = store;
  const countdown = useCountdown(circle?.frequency);
  const collector = joined.find((m) => m.position === round);
  const paid = joined.filter((m) => m.funded).length;

  if (!circle || members.length === 0) {
    return (
      <div className="space-y-6">
        <Title className="text-4xl">{circle ? 'This circle needs people' : 'Nothing saving yet'}</Title>
        <Card className="p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-[3px] border-ink font-display text-2xl font-extrabold text-ink">1</div>
          <Caption className="mt-4">
            {circle
              ? 'Add the first person and you will see their payment record straight away.'
              : 'Name the circle, set the amount, add the people. About a minute.'}
          </Caption>
          <Button size="lg" tone="mango" className="mt-5 w-full"
            onClick={() => go(circle ? 'invite' : 'create')}>
            {circle ? 'Add the first member' : 'Create a circle'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>Round {round} of {joined.length}</Eyebrow>
        <Title className="mt-1 truncate text-4xl">{circle.name}</Title>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-5">
          <Eyebrow>Pot this round</Eyebrow>
          <Money value={totalPot(store)} className="mt-1 block font-display text-2xl" />
          <Caption className="mt-1 text-xs">{paid} of {joined.length} paid in</Caption>
        </Card>
        <Card className="p-5">
          <Eyebrow>Next round in</Eyebrow>
          <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{countdown}</p>
          <Caption className="mt-1 text-xs"><Money value={circle.amount} /> {circle.frequency}</Caption>
        </Card>
      </div>

      {collector && (
        <Card className="flex items-center justify-between gap-4 bg-mango px-6 py-5">
          <div className="min-w-0">
            <Eyebrow>Collecting this round</Eyebrow>
            <p className="truncate font-display text-2xl font-extrabold">
              {collector.name}{collector.id === me?.id && ' — you'}
            </p>
          </div>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-card font-display text-xl font-extrabold">
            {collector.position}
          </span>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="border-b-[3px] border-ink px-5 py-4">
          <Eyebrow>Everyone in the circle</Eyebrow>
        </div>
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => go('trust', m)}
            className="flex w-full items-center gap-4 border-b-[3px] border-ink px-5 py-4 text-left last:border-b-0 hover:bg-paper focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-mango"
          >
            <span className={[
              'grid h-9 w-9 shrink-0 place-items-center rounded-full font-display font-extrabold',
              m.position === round ? 'border-[3px] border-ink bg-mango' : 'border-[3px] border-ink text-ink',
            ].join(' ')}>
              {m.position}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-body font-bold">
                {m.name}{m.id === me?.id && <span className="text-mute"> · you</span>}
              </span>
              <span className="block font-body text-xs text-mute">
                {m.state === 'invited' ? 'Invited — waiting for them to join'
                  : m.position === round ? 'Collecting this round'
                    : `Collects in round ${m.position}`}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1.5">
              <TrustBadge trust={m.trust} motionOff size="sm" />
              {m.state === 'joined' && <Pill tone={m.funded ? 'palm' : 'quiet'}>{m.funded ? 'Paid' : 'Not yet'}</Pill>}
            </span>
          </button>
        ))}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => go('fund')}>Pay in</Button>
        {isOrganizer
          ? <Button onClick={() => go('invite')}>Invite a member</Button>
          : <Button onClick={() => go('order')}>Payout order</Button>}
      </div>
    </div>
  );
}
