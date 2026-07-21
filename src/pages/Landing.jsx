import {
  Button, Card, Eyebrow, Title, Caption, Money, Stamp, RoundPattern, Accordion,
} from '../components/kit.jsx';
import { useStore } from '../state/store.jsx';

const HOW = [
  ['See the record first', 'Add a phone number and their history from past circles loads before you agree to anything.'],
  ['Early seats put money down', 'Positions 1 and 2 hold collateral until the circle finishes.'],
  ['Everyone else signs up to auto-pay', 'The contribution leaves their account each round without anyone chasing.'],
  ['The turn goes round', 'One pot, one collector each round, until every person has had theirs.'],
];

const FAQ = [
  ['What happens if someone misses a payment?',
    'It is recorded against their name and every future circle sees it. If they are on auto-pay, the money is retried automatically. If they collected early, their collateral covers the shortfall.'],
  ['Where does my money actually sit?',
    'In a bank account that belongs to the circle, not to the organizer. Nobody can move it out except on payout day, to whoever\'s turn it is.'],
  ['Who decides the order?',
    'Whoever creates the circle sets it, and everyone sees it before the first payment. Any member can request a change; the creator approves it and the whole group sees the result.'],
  ['What does collateral mean in practice?',
    'Half a contribution, held aside, returned in full the day the last member collects. It only applies to positions 1 and 2 — the seats that take the pot before paying most of it in.'],
  ['Can I join a circle with people I do not know?',
    'You can, and the record is the reason it works. You see how a stranger paid in past circles before you say yes, and you can decline without explaining yourself.'],
  ['What if I want to leave?',
    'Before the first round, you leave freely. After it starts, leaving is a missed round and it goes on your record — the same as it would in a circle run on paper.'],
];

export default function Landing({ go }) {
  const { motionOff } = useStore();

  return (
    <div className="space-y-16 sm:space-y-20 lg:space-y-28">
      {/* ---- hero ---- */}
      <section className="grid items-center gap-10 md:grid-cols-2 lg:grid-cols-[1.1fr,0.9fr] lg:gap-16">
        <div className="space-y-6">
          <Eyebrow>Ajo · esusu · adashe</Eyebrow>
          <Title className="text-4xl leading-[0.95] sm:text-5xl md:text-6xl lg:text-7xl">
            The one who collects first stops paying.
          </Title>
          <p className="max-w-xl font-body text-base leading-relaxed text-mute sm:text-lg lg:text-xl">
            Once someone has taken the pot, nothing makes them keep contributing — and until
            they miss, the rest of the circle has no way to see it coming.
          </p>
          <p className="max-w-xl font-body text-base font-bold leading-snug sm:text-lg lg:text-xl">
            Ajo shows you each member's payment record from past circles before you let them
            in, holds collateral on the first two positions, and puts everyone else on
            standing auto-pay.
          </p>
          <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center pt-2">
            <Button size="lg" tone="mango" className="w-full sm:w-auto sm:px-8" onClick={() => go('signup')}>
              Start a circle
            </Button>
            <Button size="lg" tone="mango" className="w-full sm:w-auto" onClick={() => go('login')}>
              Sign in
            </Button>
          </div>
        </div>

        {/* the signature moment, shown rather than described */}
        <Card className="overflow-hidden shadow-stamplg transition-transform hover:-translate-y-1">
          <div className="border-b-[3px] border-ink bg-paper/50 px-6 py-4">
            <Eyebrow>What you see before you say yes</Eyebrow>
          </div>
          <div className="space-y-6 px-6 py-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl font-extrabold sm:text-2xl">Musa Danjuma</p>
                  <Caption>Six circles, never missed a round</Caption>
                </div>
                <Stamp tone="palm" motionOff={motionOff}>✓ Clean record</Stamp>
              </div>
              <div className="mt-4"><RoundPattern history={[true, true, true, true, true]} /></div>
            </div>
            <div className="border-t-[3px] border-ink pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl font-extrabold sm:text-2xl">Blessing Etim</p>
                  <Caption>Stopped paying after collecting in round 3</Caption>
                </div>
                <Stamp tone="kola" motionOff={motionOff}>⚑ Flagged</Stamp>
              </div>
              <div className="mt-4"><RoundPattern history={[true, true, true, false, false]} /></div>
            </div>
          </div>
        </Card>
      </section>

      {/* ---- how ---- */}
      <section className="space-y-6 sm:space-y-8">
        <div>
          <Eyebrow>How a circle runs</Eyebrow>
          <Title className="mt-1 text-2xl sm:text-3xl lg:text-4xl">Built for trust that holds up.</Title>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW.map(([title, body], i) => (
            <Card key={title} className="flex flex-col justify-between p-6 h-full transition-transform hover:-translate-y-1">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink bg-mango font-display text-lg font-extrabold">
                  {i + 1}
                </span>
                <p className="mt-4 font-body text-lg font-extrabold leading-snug">{title}</p>
                <Caption className="mt-2 text-sm leading-relaxed">{body}</Caption>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---- the numbers ---- */}
      <section className="grid items-center gap-8 rounded-chunk border-[3px] border-ink bg-card px-6 py-8 sm:px-10 sm:py-12 md:grid-cols-[1fr,auto] md:gap-10 lg:px-14 lg:py-14 shadow-stamplg">
        <div>
          <Title className="text-2xl sm:text-4xl lg:text-5xl leading-tight">
            Five traders, <Money value={20000} className="font-display text-2xl sm:text-4xl lg:text-5xl" /> a week,
            one collects <Money value={100000} className="font-display text-2xl sm:text-4xl lg:text-5xl" />.
          </Title>
          <Caption className="mt-4 max-w-xl text-base sm:text-lg">
            The same circle you already run — with the risk visible and the money in the
            circle's own account.
          </Caption>
        </div>
        <div className="w-full md:w-auto shrink-0">
          <Button size="lg" tone="mango" className="w-full md:w-auto md:px-10" onClick={() => go('signup')}>
            Start a circle
          </Button>
        </div>
      </section>

      {/* ---- faq ---- */}
      <section className="mx-auto w-full max-w-3xl space-y-6 sm:space-y-8">
        <div className="text-center sm:text-left">
          <Eyebrow>Before you join</Eyebrow>
          <Title className="mt-1 text-2xl sm:text-3xl lg:text-4xl">Frequently Asked Questions</Title>
        </div>
        <Accordion items={FAQ} />
      </section>

      <footer className="border-t-[3px] border-ink pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Caption className="text-xs text-center sm:text-left">
          Ajo runs on the Monnify payments API. This build uses mock data end to end.
        </Caption>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-body text-xs font-bold text-ink underline underline-offset-4 hover:text-adire focus:outline-none focus-visible:ring-4 focus-visible:ring-mango shrink-0"
        >
          Back to top ↑
        </button>
      </footer>
    </div>
  );
}
