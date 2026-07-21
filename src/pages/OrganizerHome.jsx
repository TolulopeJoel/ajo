import { useState } from 'react';
import { useStore, totalPot } from '../state/store.jsx';
import {
  Button, Card, Eyebrow, Title, Caption, Money, Stamp,
  TrustBadge, RotationRing, trustSummary, Explain,
} from '../components/kit.jsx';

export default function OrganizerHome({ go }) {
  const store = useStore();
  const { circle, members, joined, me, round, motionOff, dispatch, api, pendingReorder } = store;
  const [sending, setSending] = useState(false);

  if (!circle || !me) {
    return (
      <div className="space-y-6">
        <Title className="text-4xl">No circle open</Title>
        <Card className="p-6 text-center">
          <p className="font-display text-xl font-extrabold">Start one, or wait for an invite</p>
          <Caption className="mt-2">A circle needs a name, an amount, and people.</Caption>
          <Button className="mt-5 w-full" onClick={() => go('create')}>Create a circle</Button>
        </Card>
      </div>
    );
  }

  const paid = joined.filter((m) => m.funded).length;
  const myTurn = me.position === round;
  const potReady = paid === joined.length && joined.length > 0;
  const pot = totalPot(store);
  const allPaid = paid === joined.length && joined.length > 0;
  const canForceStart = paid > 0 && !allPaid; // Can force start if at least one person paid but not everyone
  
  // Find current collector
  const currentCollector = joined.find((m) => m.position === round);
  const collectorHasCollected = currentCollector?.collected || false;
  const canAdvanceRound = collectorHasCollected && round < joined.length;

  async function collect() {
    setSending(true);
    const currentBalance = me.balance || 0;
    dispatch({ type: 'patchMember', id: me.id, patch: { balance: currentBalance + pot, collected: true } });
    setSending(false);
  }

  async function advanceToNextRound(force = false) {
    setSending(true);
    try {
      await api.advanceRound(circle.id);
      dispatch({ type: 'nextRound' });
      
      // Mark unpaid members as having missed this round
      if (force) {
        joined.filter((m) => !m.funded).forEach((m) => {
          const collateralToForfeit = m.collateral || 0;
          const patch = {
            missedRounds: (m.missedRounds || 0) + 1,
            trust: {
              ...m.trust,
              status: m.trust.status === 'excellent' ? 'watch' : 'flagged',
              history: [...(m.trust.history || []), { round, paid: false, at: Date.now() }],
            }
          };
          
          // Forfeit collateral if they have it
          if (collateralToForfeit > 0) {
            patch.collateral = 0; // Remove collateral
            patch.collateralForfeited = (m.collateralForfeited || 0) + collateralToForfeit;
          }
          
          dispatch({ 
            type: 'patchMember', 
            id: m.id, 
            patch
          });
        });
      }
    } catch (e) {
      console.error('Failed to advance round:', e);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>Round {round} of {joined.length} · {circle.name}</Eyebrow>
          <Title className="mt-1 text-4xl">Hello, {me.name.split(' ')[0]}</Title>
          <Caption className="mt-1">You created this circle</Caption>
        </div>
        <button
          onClick={() => go('settings')}
          aria-label="Settings"
          className="shrink-0 rounded-pill border-[3px] border-ink bg-card px-3 py-2 font-body text-xs font-extrabold text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-mango"
        >
          Settings
        </button>
      </header>

      {/* Organizer-specific: Pending reorder approvals */}
      {pendingReorder && (
        <Card className="p-5 bg-mango">
          <p className="font-body font-extrabold">
            {pendingReorder.byName} asked to change the payout order
          </p>
          <Caption className="mt-1">Everyone keeps a turn — only the order moves.</Caption>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={() => dispatch({ type: 'reorder', members: pendingReorder.members })}>
              Approve the change
            </Button>
            <Button size="sm" onClick={() => dispatch({ type: 'clearReorder' })}>
              Keep it as it is
            </Button>
          </div>
        </Card>
      )}

      {/* Your turn to collect */}
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
      ) : (
        /* This round: have I paid? */
        <Card className="p-6">
          <Eyebrow>This round</Eyebrow>
          {me.funded ? (
            <>
              <p className="mt-1 font-display text-2xl font-extrabold">You have paid</p>
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
                : me.position < round ? `You collected in round ${me.position}`
                  : `You collect in round ${me.position}`}
            </p>
            <Caption className="mt-1">
              {me.position <= 2 && me.collateral > 0 && <><Money value={me.collateral} /> held as collateral. </>}
              {me.autoPay && 'Auto-pay is on. '}
              <Explain label="How positions work">
                Order is set when the circle starts. You can change it before payments begin.
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

      {/* Organizer actions */}
      <section className="space-y-3 border-t-[3px] border-ink pt-6">
        <Eyebrow>Organizer actions</Eyebrow>
        
        {/* Collector status */}
        {currentCollector && (
          <Card className="p-4">
            <p className="font-body font-bold">
              Round {round} collector: {currentCollector.name}
            </p>
            <Caption className="mt-1">
              {collectorHasCollected 
                ? `Collected ₦${pot.toLocaleString('en-NG')}` 
                : `Has not collected yet (pot: ₦${pot.toLocaleString('en-NG')})`}
            </Caption>
          </Card>
        )}

        <div className="grid gap-3">
          {canAdvanceRound && allPaid && (
            <Button 
              tone="mango" 
              className="w-full" 
              onClick={() => advanceToNextRound(false)}
              disabled={sending}
            >
              {sending ? 'Starting next round…' : 'Start round ' + (round + 1)}
            </Button>
          )}
          {canAdvanceRound && canForceStart && (
            <Card className="p-4 bg-kola text-white">
              <p className="font-body font-bold">
                {joined.length - paid} member{joined.length - paid !== 1 ? 's' : ''} haven't paid
              </p>
              <Caption className="text-white/80">
                Collector collected ₦{pot.toLocaleString('en-NG')}. You can force-start the next round. 
                Unpaid members will be marked as missed.
              </Caption>
              <Button 
                tone="ink" 
                className="mt-3 w-full" 
                onClick={() => advanceToNextRound(true)}
                disabled={sending}
              >
                {sending ? 'Starting next round…' : 'Force-start round ' + (round + 1)}
              </Button>
            </Card>
          )}
          {!collectorHasCollected && (
            <Card className="p-4 bg-kola text-white">
              <p className="font-body font-bold">
                Waiting for collector to collect
              </p>
              <Caption className="text-white/80">
                {currentCollector?.name} needs to collect ₦{pot.toLocaleString('en-NG')} before the next round can start.
              </Caption>
            </Card>
          )}
          <Button className="w-full" onClick={() => go('invite')}>
            Invite a member
          </Button>
          <Button className="w-full" onClick={() => go('order')}>
            Manage payout order
          </Button>
        </div>
      </section>
    </div>
  );
}
