import { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './state/store.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import SignUp from './pages/SignUp.jsx';
import CreateCircle from './pages/CreateCircle.jsx';
import Invite from './pages/Invite.jsx';
import PayoutOrder from './pages/PayoutOrder.jsx';
import Fund from './pages/Fund.jsx';
import MemberHome from './pages/MemberHome.jsx';
import OrganizerHome from './pages/OrganizerHome.jsx';
import Roster from './pages/Roster.jsx';
import TrustProfile from './pages/TrustProfile.jsx';
import Withdraw from './pages/Withdraw.jsx';
import AcceptInvite from './pages/AcceptInvite.jsx';
import Settings from './pages/Settings.jsx';
import DemoPanel from './pages/DemoPanel.jsx';

/* Member Home is the front door once a circle is open.
   The full roster is one tap away, not the landing screen. */
const TABS = [
  ['home', 'My circle', '◎'],
  ['roster', 'Everyone', '＋'],
  ['order', 'Order', '↻'],
  ['fund', 'Pay in', '₦'],
];

const NO_NAV = new Set(['landing', 'login', 'signup', 'accept']);

/** Organizer-only pages. Organizer is derived, never a stored account type. */
const ORGANIZER_ONLY = new Set(['invite', 'create']);

function Shell() {
  const { motionOff, dispatch, isOrganizer, circle, currentUser } = useStore();
  const [route, setRoute] = useState('landing');
  const [payload, setPayload] = useState(null);

  const go = (next, data = null) => {
    setPayload(data);
    setRoute(next);
    window.scrollTo({ top: 0, behavior: motionOff ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dispatch({ type: 'set', payload: { motionOff: true } });
    }
  }, [dispatch]);

  /* Access check: anyone reaching an organizer-only page without being the
     circle's creator lands on Member Home instead of a broken screen. */
  const blocked = ORGANIZER_ONLY.has(route) && circle && !isOrganizer;
  useEffect(() => { if (blocked) setRoute('home'); }, [blocked]);

  const PAGES = {
    landing: <Landing go={go} />,
    login: <Login go={go} />,
    signup: <SignUp go={go} />,
    create: <CreateCircle go={go} />,
    invite: <Invite go={go} />,
    order: <PayoutOrder go={go} />,
    fund: <Fund go={go} />,
    home: isOrganizer ? <OrganizerHome go={go} /> : <MemberHome go={go} />,
    roster: <Roster go={go} />,
    trust: <TrustProfile go={go} member={payload} />,
    withdraw: <Withdraw go={go} />,
    accept: <AcceptInvite go={go} invite={payload} />,
    settings: <Settings go={go} />,
    demo: <DemoPanel go={go} />,
  };

  const showNav = !NO_NAV.has(route);

  return (
    <div className={'min-h-screen bg-paper text-ink ' + (motionOff ? 'motion-off' : '')}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-chunk focus:border-[3px] focus:border-ink focus:bg-mango focus:px-4 focus:py-2 focus:font-body focus:font-extrabold">
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
          <button
            onClick={() => go('landing')}
            className="flex items-center gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-mango"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full border-[3px] border-ink bg-mango font-display text-sm font-extrabold">A</span>
            <span className="font-display text-xl font-extrabold tracking-tight">Ajo</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch({ type: 'set', payload: { motionOff: !motionOff } })}
              aria-pressed={motionOff}
              className="rounded-pill border-[3px] border-ink bg-card px-3 py-1 font-body text-[11px] font-extrabold uppercase tracking-wide focus:outline-none focus-visible:ring-4 focus-visible:ring-mango"
            >
              {motionOff ? 'Motion off' : 'Motion on'}
            </button>
            <button
              onClick={() => go('demo')}
              className="rounded-pill border-[3px] border-ink bg-card px-3 py-1 font-body text-[11px] font-extrabold uppercase tracking-wide focus:outline-none focus-visible:ring-4 focus-visible:ring-mango"
            >
              Demo
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-md px-4 pb-28 pt-5">
        {PAGES[route]}
      </main>

      {showNav && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-ink bg-card">
          <div className="mx-auto grid max-w-md grid-cols-4">
            {TABS.map(([key, label, glyph]) => (
              <button
                key={key}
                onClick={() => go(key)}
                aria-current={route === key ? 'page' : undefined}
                className={[
                  'flex flex-col items-center gap-0.5 border-r-[3px] border-ink py-2.5 last:border-r-0',
                  'font-body text-[11px] font-extrabold uppercase tracking-wide',
                  'focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-mango',
                  route === key ? 'bg-mango' : 'bg-card',
                ].join(' ')}
              >
                <span aria-hidden="true" className="font-display text-lg leading-none">{glyph}</span>
                {label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
