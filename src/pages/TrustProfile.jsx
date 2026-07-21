import { useStore } from '../state/store.jsx';
import {
  Button, Card, Eyebrow, Title, Caption, Money,
  TrustBadge, RoundPattern, trustHeadline, trustSummary,
} from '../components/kit.jsx';

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function TrustProfile({ go, member }) {
  const { motionOff } = useStore();

  if (!member) {
    return (
      <Card className="p-8 text-center">
        <p className="font-display text-xl font-extrabold">No member picked</p>
        <Caption className="mt-2">Open a record from the circle list.</Caption>
        <Button className="mt-5" onClick={() => go('roster')}>See everyone</Button>
      </Card>
    );
  }

  const t = member.trust;
  const paymentHistory = member.paymentHistory || [];

  return (
    <div className="space-y-6">
      <Button size="sm" onClick={() => go('roster')}>← Back</Button>

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>Payment record</Eyebrow>
          <Title className="mt-1 text-4xl">{member.name}</Title>
          <Caption className="tabular-nums tracking-wide">{member.phone}</Caption>
        </div>
        <TrustBadge trust={t} motionOff={motionOff} />
      </header>

      <Card className="p-6">
        <p className="font-body font-bold leading-snug">{trustHeadline(t)}</p>
        <div className="mt-4"><RoundPattern history={t.history} /></div>
        <Caption className="mt-3 text-xs">Green: paid that round. Red: the money never came.</Caption>
      </Card>

      <Card className="divide-y divide-ink">
        {[
          ['Standing', trustSummary(t)],
          ['Position', `Round ${member.position}`],
          ['This round', member.state === 'invited' ? 'Not joined yet' : member.funded ? 'Paid in' : 'Not paid yet'],
          [member.position <= 2 ? 'Collateral' : 'Auto-pay',
            member.position <= 2
              ? (member.collateral ? <Money value={member.collateral} /> : 'Not set')
              : (member.autoPay ? 'On' : 'Not set')],
        ].map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 px-6 py-4">
            <span className="font-body text-sm text-mute">{k}</span>
            <span className="text-right font-body text-sm font-bold">{v}</span>
          </div>
        ))}
      </Card>

      {/* Payment History Section */}
      {paymentHistory.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b-[3px] border-ink px-5 py-4">
            <Eyebrow>Payment history</Eyebrow>
          </div>
          {paymentHistory.map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 border-b-[3px] border-ink px-5 py-4 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-body font-bold">Round {entry.round}</p>
                <Caption className="mt-0.5">{formatDate(entry.at)}</Caption>
              </div>
              <div className="flex items-center gap-3">
                <Money value={entry.amount} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {(t.status === 'flagged' || t.status === 'watch') && (
        <Card className="p-6">
          <p className="font-body font-extrabold">Think before you seat them early</p>
          <Caption className="mt-1">
            Missed rounds in position 1 or 2 is exactly the risk this app exists for.
          </Caption>
          <Button size="sm" className="mt-4" onClick={() => go('order')}>
            Change the payout order
          </Button>
        </Card>
      )}
    </div>
  );
}
