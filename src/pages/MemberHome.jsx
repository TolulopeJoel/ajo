import { useState, useEffect } from 'react';
import { useStore, totalPot } from '../state/store.jsx';
import {
  Button, Card, Eyebrow, Title, Caption, Money, Stamp,
  TrustBadge, RotationRing, trustSummary, Explain,
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

export default function MemberHome({ go }) {
  const store = useStore();
  const { circle, members, joined, me, round, motionOff, dispatch, api } = store;
  const [sending, setSending] = useState(false);
  const countdown = useCountdown(circle?.frequency);

  if (!circle || !me) {
    return (
      <div className="space-y-6">
        <Title className="text-4xl">No circle open</Title>
        <Card className="p-6 text-center">
          <p className="font-display text-xl font-extrabold">Wait for an invite to a circle</p>
          <Caption className="mt-2">You need to be invited to join an ajo circle.</Caption>
        </Card>
      </div>
    );
  }

  const paid = joined.filter((m) => m.funded).length;
  const myTurn = me.position === round;
  const potReady = paid === joined.length && joined.length > 0;
  const pot = totalPot(store);
  const roundsUntilMyTurn = me.position - round;
  const hasCollected = me.position < round;

  async function collect() {
    setSending(true);
    const currentBalance = me.balance || 0;
    dispatch({ type: 'patchMember', id: me.id, patch: { balance: currentBalance + pot, collected: true } });
    setSending(false);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>Round {round} of {joined.length} · {circle.name}</Eyebrow>
          <Title className="mt-1 text-4xl">Hello, {me.name.split(' ')[0]}</Title>
        </div>
        <button
          onClick={() => go('settings')}
          aria-label="Settings"
          className="shrink-0 rounded-pill border-[3px] border-ink bg-card px-3 py-2 font-body text-xs font-extrabold text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-mango"
        >
          Settings
        </button>
      </header>

      {/* Progress overview */}
      <Card className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <Eyebrow>Circle progress</Eyebrow>
            <span className="font-body text-sm font-bold">
              {round - 1}/{joined.length} rounds completed
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full border-[2px] border-ink bg-card">
            <div 
              className="h-full bg-mango transition-all duration-500"
              style={{ width: `${((round - 1) / joined.length) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Caption>Next round in</Caption>
            <p className="font-display text-xl font-extrabold tabular-nums">{countdown}</p>
          </div>
          <div>
            <Caption>Current pot</Caption>
            <Money value={paid * circle.amount} className="font-display text-xl font-extrabold" />
          </div>
        </div>
      </Card>

      {/* Your turn status */}
      {myTurn ? (
        <Card className="overflow-hidden">
          <div className="bg-mango px-6 py-6">
            <Eyebrow>Your turn</Eyebrow>
            <p className="mt-1 font-display text-3xl font-extrabold leading-tight">
              {me.collected ? 'Funds moved to your account' : 'Your payout is ready'}
            </p>
            <Money value={pot} className="mt-2 block font-display text-4xl" />
            {!me.collected && (
              <Caption className="mt-2 text-ink/70">
                {potReady ? 'Everyone has paid in.' : `${paid} of ${joined.length} have paid in so far.`}
              </Caption>
            )}
          </div>
          <div className="p-5">
            {me.collected ? (
              <>
                <Stamp tone="palm" motionOff={motionOff}>✓ Balance credited</Stamp>
                <Caption className="mt-3">
                  Your balance is now <Money value={me.balance || 0} />. Withdraw to your bank account anytime.
                </Caption>
                <Button size="lg" tone="ink" className="mt-4 w-full" onClick={() => go('withdraw')}>
                  Withdraw to bank
                </Button>
              </>
            ) : (
              <Button
                size="lg" tone="ink" className="w-full"
                disabled={!potReady || sending}
                onClick={collect}
              >
                {sending ? 'Processing…' : 'Move to your balance'}
              </Button>
            )}
            {!potReady && !me.collected && (
              <Caption className="mt-3">Ajo releases the pot once the last person pays in.</Caption>
            )}
          </div>
        </Card>
      ) : hasCollected ? (
        /* Already collected */
        <Card className="p-6">
          <Eyebrow>You collected in round {me.position}</Eyebrow>
          <p className="mt-1 font-display text-2xl font-extrabold">
            Your balance: <Money value={me.balance || 0} />
          </p>
          <Caption className="mt-1">
            {joined.length - round + 1} round{joined.length - round + 1 !== 1 ? 's' : ''} remaining in this circle
          </Caption>
          <Button size="lg" className="mt-4 w-full" onClick={() => go('withdraw')}>
            Withdraw to bank
          </Button>
        </Card>
      ) : (
        /* This round: have I paid? */
        <Card className="p-6">
          <Eyebrow>
            {roundsUntilMyTurn === 1 ? 'You collect next round' : `${roundsUntilMyTurn} rounds until your turn`}
          </Eyebrow>
          {me.funded ? (
            <>
              <p className="mt-1 font-display text-2xl font-extrabold">You have paid this round</p>
              <Caption className="mt-1">
                <Money value={circle.amount} /> received. Nothing else to do this round.
              </Caption>
            </>
          ) : (
            <>
              <p className="mt-1 font-display text-2xl font-extrabold leading-tight">
                You owe <Money value={circle.amount} className="font-display text-2xl" />
              </p>
              <Caption className="mt-1">
                {me.autoPay ? 'Auto-pay will take it before the round closes.' : 'Transfer to the circle account to be counted.'}
              </Caption>
              <Button size="lg" className="mt-5 w-full" onClick={() => go('fund')}>
                Pay your contribution
              </Button>
            </>
          )}
        </Card>
      )}

      {/* Your position in rotation */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Eyebrow>Your position</Eyebrow>
            <p className="mt-1 font-display text-2xl font-extrabold leading-tight">
              {myTurn ? 'You collect this round'
                : hasCollected ? `You collected in round ${me.position}`
                  : `You collect in round ${me.position} (${roundsUntilMyTurn} round${roundsUntilMyTurn !== 1 ? 's' : ''} away)`}
            </p>
            <Caption className="mt-1">
              {me.position <= 2 && me.collateral > 0 && <><Money value={me.collateral} /> held as collateral. </>}
              {me.autoPay && 'Auto-pay is on. '}
              <Explain label="How positions work">
                Order is set when the circle starts. Ask the person who created it to move
                you — everyone sees the change before it takes effect.
              </Explain>
            </Caption>
          </div>
        </div>
        <div className="mt-5">
          <RotationRing members={joined} round={round} highlightId={me.id} size={230} compact />
        </div>
      </Card>

      {/* Your standing */}
      <Card className="flex items-center justify-between gap-4 p-6">
        <div className="min-w-0">
          <Eyebrow>Your standing</Eyebrow>
          <p className="mt-1 font-body font-extrabold">{trustSummary(me.trust)}</p>
        </div>
        <TrustBadge trust={me.trust} motionOff />
      </Card>

      {/* Group overview */}
      <Card className="flex items-center justify-between gap-4 p-6">
        <div>
          <p className="font-body font-extrabold">
            {paid} of {joined.length} members have paid this round
          </p>
          <Caption className="mt-0.5">Pot so far <Money value={paid * circle.amount} /></Caption>
        </div>
        <Button size="sm" className="shrink-0" onClick={() => go('roster')}>
          See everyone
        </Button>
      </Card>
    </div>
  );
}
