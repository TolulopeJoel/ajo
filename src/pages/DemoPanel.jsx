import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { IS_MOCK } from '../services/index.js';
import { DEMO_SEEDS, MOCK_CIRCLE_TEMPLATE, DEMO_ROSTER } from '../services/mockData.js';
import {
  Button, Card, Eyebrow, Title, Caption, Pill, Row,
} from '../components/kit.jsx';

export default function DemoPanel({ go }) {
  const { dispatch, api, members, circle, currentUser, isOrganizer } = useStore();
  const [log, setLog] = useState([]);
  const note = (text) => setLog((l) => [text, ...l].slice(0, 6));

  async function seedCircle() {
    const organizer = await api.lookupMember(DEMO_SEEDS.organizer);
    const user = api.setCurrentUser({ ...organizer, verified: true });
    dispatch({ type: 'signIn', user });
    const c = await api.createCircle({ ...MOCK_CIRCLE_TEMPLATE, createdBy: user.id });
    dispatch({ type: 'set', payload: { circle: c } });
    for (const phone of DEMO_ROSTER) {
      const m = await api.lookupMember(phone);
      dispatch({
        type: 'addMember',
        member: { ...m, state: 'joined', funded: false, autoPay: false, collateral: 0, collected: false },
      });
    }
    note('Seeded ' + c.name + ' with ' + DEMO_ROSTER.length + ' members');
  }

  async function seed(phone, label) {
    const found = await api.lookupMember(phone);
    dispatch({
      type: 'addMember',
      member: { ...found, state: 'invited', funded: false, autoPay: false, collateral: 0, collected: false },
    });
    note(`${label} member invited: ${found.name}`);
  }

  function switchTo(member) {
    const user = api.setCurrentUser({ ...member, verified: true });
    dispatch({ type: 'signIn', user });
    note('Now viewing as ' + member.name);
    go('home');
  }

  function simulateInvite() {
    const invited = members.find((m) => m.state === 'invited');
    if (!invited) { note('Invite someone first — nobody is pending'); return; }
    const user = api.setCurrentUser({ ...invited, verified: true });
    dispatch({ type: 'signIn', user });
    go('accept', { memberId: invited.id });
  }

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>For presenters and judges</Eyebrow>
        <Title className="mt-1 text-4xl">Demo panel</Title>
        <Caption className="mt-2">
          Nothing here touches a real bank. Every value comes from the mock service layer.
        </Caption>
      </header>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={IS_MOCK ? 'mango' : 'palm'}>{IS_MOCK ? 'Mock data' : 'Live data'}</Pill>
          {currentUser && <Pill>{isOrganizer ? 'Viewing as creator' : 'Viewing as member'}</Pill>}
        </div>
        <Caption className="mt-3">
          {currentUser ? `Signed in as ${currentUser.name}.` : 'Nobody signed in.'} Swap mock
          for live in src/services/index.js — one flag.
        </Caption>
      </Card>

      <Card className="overflow-hidden">
        <Row><Eyebrow>Switch active member</Eyebrow></Row>
        {members.length === 0 ? (
          <Row><Caption>Seed a circle first.</Caption></Row>
        ) : members.map((m) => (
          <Row key={m.id} className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate font-body text-sm font-bold">{m.name}</span>
              <span className="block font-body text-xs text-mute">
                Position {m.position}
                {circle?.createdBy === m.id && ' · created this circle'}
              </span>
            </span>
            <Button size="sm" onClick={() => switchTo(m)}>
              {currentUser?.id === m.id ? 'Viewing' : 'View as'}
            </Button>
          </Row>
        ))}
      </Card>

      <Card className="space-y-3 p-5">
        <Eyebrow>Seed the demo</Eyebrow>
        <div className="grid gap-2">
          <Button onClick={seedCircle} disabled={!!circle}>
            Seed a full circle
          </Button>
          <Button onClick={() => seed(DEMO_SEEDS.clean, 'Clean')}>
            Invite a clean member
          </Button>
          <Button onClick={() => seed(DEMO_SEEDS.flagged, 'Flagged')}>
            Invite a flagged member
          </Button>
          <Button onClick={simulateInvite}>
            Simulate invite received
          </Button>
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <Eyebrow>Fire an event now</Eyebrow>
        <div className="grid gap-2">
          <Button onClick={() => { api.settleAllDeposits(); note('All pending transfers landed'); }}>
            Land every pending transfer
          </Button>
          <Button onClick={() => {
            members.forEach((m) => dispatch({ type: 'patchMember', id: m.id, patch: { funded: true, state: 'joined' } }));
            note('Everyone marked paid');
          }}>
            Mark everyone paid
          </Button>
          <Button onClick={() => {
            members.forEach((m) => dispatch({
              type: 'patchMember', id: m.id,
              patch: m.position <= 2
                ? { collateral: Math.round((circle?.amount || 20000) * 0.5) }
                : { autoPay: true },
            }));
            note('Collateral and auto-pay set across the circle');
          }}>
            Set collateral and auto-pay
          </Button>
          <Button onClick={() => {
            const other = members.find((m) => m.id !== circle?.createdBy);
            if (!other) { note('Need a second member'); return; }
            const next = [...members];
            [next[0], next[next.length - 1]] = [next[next.length - 1], next[0]];
            dispatch({ type: 'requestReorder', request: { byId: other.id, byName: other.name, members: next } });
            note(other.name + ' requested a reorder — approve it on Member Home as the creator');
          }}>
            Raise a reorder request
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <Eyebrow>Start over</Eyebrow>
        <Button tone="kola" className="mt-3 w-full"
          onClick={() => { dispatch({ type: 'reset' }); setLog([]); go('landing'); }}>
          Clear the demo
        </Button>
      </Card>

      {log.length > 0 && (
        <Card className="p-5">
          <Eyebrow>What just happened</Eyebrow>
          <ul className="mt-3 space-y-1.5 font-body text-sm text-mute">
            {log.map((l, i) => <li key={i}>· {l}</li>)}
          </ul>
        </Card>
      )}
    </div>
  );
}
