import { useEffect, useState, useRef } from 'react';
import { useStore, totalPot } from '../state/store.jsx';
import {
  Button, Card, Eyebrow, Title, Caption, Stamp, Money, AccountNumber, Checking, Pill, Explain,
} from '../components/kit.jsx';

function MemberRow({ member, amount, motionOff, isMe, isOrganizer, onCopyAccount }) {
  const [justLanded, setJustLanded] = useState(false);
  const wasFunded = useRef(member.funded);

  useEffect(() => {
    if (member.funded && !wasFunded.current) {
      setJustLanded(true);
      const t = setTimeout(() => setJustLanded(false), 1600);
      wasFunded.current = true;
      return () => clearTimeout(t);
    }
    wasFunded.current = member.funded;
  }, [member.funded]);

  const canViewAccount = isMe || isOrganizer;

  return (
    <div className={[
      'flex items-center justify-between gap-3 border-b-[3px] border-ink px-5 py-4 last:border-b-0',
      justLanded && !motionOff ? 'animate-rowflash' : '',
    ].join(' ')}>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body font-bold">
          {member.name}{isMe && <span className="text-mute"> · you</span>}
        </p>
        <Money value={amount} className="text-sm text-mute" />
        {member.account && canViewAccount && (
          <p className="mt-1 font-body text-xs text-mute">
            {member.account.accountNumber} · {member.account.bankName}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {member.account && canViewAccount && !member.funded && member.state === 'joined' && (
          <Button size="sm" onClick={() => onCopyAccount(member.account.accountNumber)}>
            Copy
          </Button>
        )}
        {member.state === 'invited'
          ? <Pill>Invited — not joined yet</Pill>
          : member.funded
            ? <Stamp tone="palm" motionOff={motionOff}>✓ Received</Stamp>
            : <Pill>Awaiting transfer</Pill>}
      </div>
    </div>
  );
}

export default function Fund({ go }) {
  const store = useStore();
  const { circle, members, joined, me, motionOff, dispatch, api, isOrganizer } = store;
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const amount = circle?.amount || 0;
  const received = joined.filter((m) => m.funded).length;

  // Create per-member accounts if they don't exist
  useEffect(() => {
    let alive = true;
    const membersWithoutAccounts = joined.filter((m) => !m.account);
    
    if (membersWithoutAccounts.length > 0 && circle) {
      setCreating(true);
      Promise.all(membersWithoutAccounts.map(async (m) => {
        const acct = await api.createVirtualAccount(m.name, circle.name, m.id);

        return { memberId: m.id, account: acct };
      })).then((results) => {
        if (!alive) return;
        setCreating(false);
        results.forEach(({ memberId, account }) => {
          dispatch({ type: 'patchMember', id: memberId, patch: { account } });
        });
      }).catch(() => {
        if (alive) setCreating(false);
      });
    }
    return () => { alive = false; };
  }, [joined, circle, api, dispatch]);

  // Watch deposits for unfunded members
  useEffect(() => {
    const stops = joined.filter((m) => !m.funded && m.account).map((m) =>
      api.watchDeposit(m.id, () => dispatch({ type: 'patchMember', id: m.id, patch: { funded: true } })));
    return () => stops.forEach((stop) => stop && stop());
  }, [joined, api, dispatch]);

  async function copy(accountNumber) {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(accountNumber);
      setTimeout(() => setCopied(false), 2000);
    } catch { setCopied(false); }
  }

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>{circle?.name}</Eyebrow>
        <Title className="mt-1 text-4xl">Pay in</Title>
        <Caption className="mt-2">
          Transfer <Money value={amount} /> to your personal account.{' '}
          <Explain label="Why your own account?">
            Each member has their own dedicated account number. This makes payments
            unambiguous — we know exactly who deposited without manual reconciliation.
          </Explain>
        </Caption>
      </header>

      {/* Show current user's account if they're a member */}
      {me && me.account && (
        <Card className="overflow-hidden">
          <div className="px-6 py-6">
            <Eyebrow>Your account</Eyebrow>
            <div className="mt-2"><AccountNumber value={me.account.accountNumber} /></div>
            <p className="mt-2 font-body text-sm font-bold">{me.account.bankName}</p>
            <Caption>{me.account.accountName}</Caption>
            <Button size="sm" className="mt-5" onClick={() => copy(me.account.accountNumber)}>
              {copied === me.account.accountNumber ? 'Number copied' : 'Copy your account number'}
            </Button>
          </div>
        </Card>
      )}

      {creating && joined.some((m) => !m.account) && (
        <Card className="p-5">
          <Checking label="Opening member accounts" />
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-ink px-5 py-4">
          <Eyebrow>{received} of {joined.length} paid in</Eyebrow>
          <Money value={received * amount} />
        </div>
        {members.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="font-display text-xl font-extrabold">No members yet</p>
            <Caption className="mt-2">Add people and their status shows up here.</Caption>
            <Button className="mt-5" onClick={() => go('invite')}>Add members</Button>
          </div>
        ) : (
          members.map((m) => (
            <MemberRow 
              key={m.id} 
              member={m} 
              amount={amount} 
              motionOff={motionOff} 
              isMe={m.id === me?.id}
              isOrganizer={isOrganizer}
              onCopyAccount={copy}
            />
          ))
        )}
      </Card>

      <div className="flex items-baseline justify-between px-1">
        <Eyebrow>Pot this round</Eyebrow>
        <span>
          <Money value={received * amount} className="font-display text-2xl" />
          <span className="font-body text-sm text-mute"> of <Money value={totalPot(store)} /></span>
        </span>
      </div>

      <Button size="lg" tone="mango" className="w-full" onClick={() => go('home')}>
        Back to my circle
      </Button>
    </div>
  );
}
