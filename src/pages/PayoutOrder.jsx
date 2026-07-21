import { useState } from 'react';
import { useStore, totalPot } from '../state/store.jsx';
import {
  Button, Card, Eyebrow, Title, Caption, Money, Stamp, TrustBadge,
  Explain, Pill,
} from '../components/kit.jsx';

export default function PayoutOrder({ go }) {
  const store = useStore();
  const { members, joined, circle, round, me, isOrganizer, motionOff, dispatch, api, pendingReorder, orderLocked } = store;
  const [selected, setSelected] = useState(members[0]?.id);
  const [busy, setBusy] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);
  const pot = totalPot(store);
  const collateralAmount = Math.round((circle?.amount || 0) * 0.5);

  const member = members.find((m) => m.id === selected) || members[0];
  const displayOrder = pendingOrder || members;

  async function lockCollateral(m) {
    setBusy(m.id);
    await api.depositCollateral(m.id, collateralAmount);
    dispatch({ type: 'patchMember', id: m.id, patch: { collateral: collateralAmount } });
    setBusy(null);
  }

  async function setAutoPay(m) {
    setBusy(m.id);
    await api.authorizeAutoPay(m.id);
    dispatch({ type: 'patchMember', id: m.id, patch: { autoPay: true } });
    setBusy(null);
  }

  function moveInPending(memberId, delta) {
    if (orderLocked) return;
    
    const currentOrder = pendingOrder || members;
    const i = currentOrder.findIndex((x) => x.id === memberId);
    const j = i + delta;
    if (j < 0 || j >= currentOrder.length) return;
    
    const next = [...currentOrder];
    [next[i], next[j]] = [next[j], next[i]];
    setPendingOrder(next);
  }

  function confirmOrder() {
    if (!pendingOrder) return;
    
    if (isOrganizer) {
      dispatch({ type: 'reorder', members: pendingOrder });
    } else {
      dispatch({
        type: 'requestReorder',
        request: { byId: me?.id, byName: me?.name || 'A member', members: pendingOrder },
      });
    }
    setPendingOrder(null);
  }

  function cancelOrder() {
    setPendingOrder(null);
  }

  if (!members.length) {
    return (
      <Card className="p-8 text-center">
        <p className="font-display text-xl font-extrabold">No order to set yet</p>
        <Caption className="mt-2">The order is built from the people in the circle.</Caption>
        <Button className="mt-5" onClick={() => go('invite')}>Add members</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>Who collects when</Eyebrow>
        <Title className="mt-1 text-4xl">The turn goes round</Title>
        <Caption className="mt-2">
          One person takes <Money value={pot} /> each round. Tap a seat.
        </Caption>
      </header>

      {orderLocked && (
        <Card className="p-5 bg-kola text-white">
          <p className="font-body font-bold">Order locked</p>
          <Caption className="text-white/80">
            Payments have started in round 1. The payout order is now locked to prevent fraud.
            Any changes require approval from all affected members.
          </Caption>
        </Card>
      )}

      {/* Position list with clear highlighting */}
      <Card className="overflow-hidden">
        <div className="border-b-[3px] border-ink px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Eyebrow>Payout order</Eyebrow>
              <Caption className="mt-1">
                Round {round} of {joined.length} · <Money value={pot} /> to collect
              </Caption>
            </div>
            {member && !orderLocked && member.id === me?.id && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => moveInPending(member.id, -1)}
                  disabled={displayOrder.findIndex((m) => m.id === member.id) === 0}
                >
                  ↑
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => moveInPending(member.id, 1)}
                  disabled={displayOrder.findIndex((m) => m.id === member.id) === displayOrder.length - 1}
                >
                  ↓
                </Button>
              </div>
            )}
          </div>
        </div>
        {displayOrder.map((m, index) => {
          const isMe = m.id === me?.id;
          const isCollector = index + 1 === round;
          const isSelected = m.id === selected;
          
          return (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={[
                'flex items-center gap-4 border-b-[3px] border-ink px-5 py-4 text-left w-full',
                'hover:bg-paper focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-mango',
                isCollector ? 'bg-mango' : isSelected ? 'bg-paper' : '',
              ].join(' ')}
            >
              <div className={[
                'grid h-10 w-10 shrink-0 place-items-center rounded-full font-display font-extrabold',
                isMe ? 'border-[3px] border-ink bg-ink text-paper' : 'border-[3px] border-ink bg-card text-ink',
                isCollector && !isMe ? 'bg-mango' : '',
              ].join(' ')}>
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body font-bold truncate">
                  {m.name}
                  {isMe && <span className="text-mute"> · you</span>}
                  {isCollector && <span className="ml-2">· collecting this round</span>}
                </p>
                <Caption className="mt-0.5">
                  {index + 1 <= 2 
                    ? (m.collateral ? `Collateral: ₦${m.collateral.toLocaleString()}` : 'Needs collateral')
                    : (m.autoPay ? 'Auto-pay on' : 'Needs auto-pay')
                  }
                </Caption>
              </div>
              <TrustBadge trust={m.trust} motionOff size="sm" />
            </button>
          );
        })}
      </Card>

      {/* Confirm/Cancel buttons when order is pending */}
      {pendingOrder && (
        <Card className="p-5 bg-mango">
          <p className="font-body font-bold">Order changes pending</p>
          <Caption className="mt-1">
            Confirm to apply these changes, or cancel to revert.
          </Caption>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={confirmOrder}>
              Confirm changes
            </Button>
            <Button size="sm" onClick={cancelOrder}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {pendingReorder && (
        <Card className="p-5">
          <Pill tone="mango">Waiting</Pill>
          <p className="mt-2 font-body font-bold">
            {pendingReorder.byName} asked to change the order. The circle's creator has to approve it.
          </p>
        </Card>
      )}

      <Button size="lg" tone="mango" className="w-full" onClick={() => go('fund')}>
        Open the circle account
      </Button>
    </div>
  );
}
