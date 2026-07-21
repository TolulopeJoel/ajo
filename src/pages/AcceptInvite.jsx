import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import {
  Button, Card, Eyebrow, Title, Caption, Money, Stamp, Explain, Pill,
} from '../components/kit.jsx';

export default function AcceptInvite({ go, invite }) {
  const { circle, members, dispatch, motionOff } = useStore();
  const [state, setState] = useState('idle');

  const member = members.find((m) => m.id === invite?.memberId);

  if (!circle || !member) {
    return (
      <Card className="p-6 text-center">
        <p className="font-display text-xl font-extrabold">No invite open</p>
        <Caption className="mt-2">Trigger one from the demo panel to see this screen.</Caption>
        <Button className="mt-5" onClick={() => go('demo')}>Open the demo panel</Button>
      </Card>
    );
  }

  const early = member.position <= 2;
  const collateral = Math.round(circle.amount * 0.5);

  if (state === 'joined') {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <Stamp tone="palm" motionOff={motionOff}>✓ Joined</Stamp>
          <p className="mt-3 font-display text-2xl font-extrabold leading-tight">
            You're in {circle.name}
          </p>
          <Caption className="mt-1">Position {member.position} of {members.length}.</Caption>
        </Card>
        <Button size="lg" tone="mango" className="w-full" onClick={() => go('home')}>
          Go to my circle
        </Button>
      </div>
    );
  }

  if (state === 'declined') {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="font-display text-2xl font-extrabold">Invite declined</p>
          <Caption className="mt-1">Nothing was charged and your record is unchanged.</Caption>
        </Card>
        <Button className="w-full" onClick={() => go('landing')}>Done</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>You've been invited</Eyebrow>
        <Title className="mt-1 text-4xl">{circle.name}</Title>
        <Caption className="mt-2">Read this before you agree to anything.</Caption>
      </header>

      <Card className="divide-y divide-ink">
        {[
          ['You pay', <Money value={circle.amount} />, circle.frequency],
          ['You collect', <Money value={circle.amount * circle.size} />, `in round ${member.position}`],
          ['Circle runs for', `${circle.size} rounds`, `${circle.size} members`],
        ].map(([label, value, sub]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 px-6 py-4">
            <span className="font-body text-sm text-mute">{label}</span>
            <span className="text-right">
              <span className="block font-body font-extrabold">{value}</span>
              <span className="block font-body text-xs text-mute">{sub}</span>
            </span>
          </div>
        ))}
      </Card>

      {early && (
        <Card className="p-6">
          <Pill tone="mango">Before you accept</Pill>
          <p className="mt-3 font-body font-extrabold leading-snug">
            Position {member.position} collects early, so you hold{' '}
            <Money value={collateral} /> until the circle finishes.
          </p>
          <Caption className="mt-2">
            <Explain>
              You take the pot before you have paid most of it in. The collateral is
              returned in full on the day the last member collects.
            </Explain>
          </Caption>
        </Card>
      )}

      {!early && (
        <Caption>
          Your contribution leaves your account automatically each round.{' '}
          <Explain label="What does that mean?">
            You approve it once. Ajo takes <Money value={circle.amount} /> {circle.frequency},
            and stops when the circle ends. You can cancel with your bank at any time.
          </Explain>
        </Caption>
      )}

      <div className="space-y-3">
        <Button
          size="lg" className="w-full"
          onClick={() => {
            dispatch({ type: 'patchMember', id: member.id, patch: { state: 'joined' } });
            setState('joined');
          }}
        >
          Join circle
        </Button>
        <Button className="w-full" onClick={() => setState('declined')}>
          Not now
        </Button>
      </div>
    </div>
  );
}
