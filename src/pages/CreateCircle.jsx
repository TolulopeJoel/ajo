import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { Button, Card, Field, inputClass, Eyebrow, Title, Caption, Money } from '../components/kit.jsx';

const AMOUNTS = [5000, 10000, 20000, 50000];
const FREQS = [
  ['weekly', 'Every week'],
  ['biweekly', 'Every two weeks'],
  ['monthly', 'Every month'],
];

function Chip({ active, children, ...props }) {
  return (
    <button
      {...props}
      type="button"
      className={[
        'rounded-chunk border-[3px] border-ink px-3 py-2 font-body text-sm font-extrabold',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-mango',
        active ? 'bg-adire text-white shadow-stampsm' : 'bg-card',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export default function CreateCircle({ go }) {
  const { dispatch, api, currentUser } = useStore();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(20000);
  const [custom, setCustom] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [size, setSize] = useState(5);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const finalAmount = custom ? Number(custom) : amount;

  async function submit() {
    if (!name.trim()) { setError('Give the circle a name your members will recognise.'); return; }
    if (!finalAmount || finalAmount < 500) { setError('Set a contribution of at least ₦500.'); return; }
    setError(''); setSaving(true);
    const circle = await api.createCircle({
      name: name.trim(), amount: finalAmount, frequency, size, createdBy: currentUser?.id,
    });
    dispatch({ type: 'set', payload: { circle } });
    // The creator holds a seat in their own circle.
    if (currentUser) {
      dispatch({
        type: 'addMember',
        member: { ...currentUser, state: 'joined', funded: false, autoPay: false, collateral: 0, collected: false },
      });
    }
    setSaving(false);
    go('invite');
  }

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>New circle</Eyebrow>
        <Title className="mt-1 text-4xl">Start a circle</Title>
      </header>

      <Card className="space-y-7 p-6">
        <Field id="name" label="Circle name" hint="Something the group already calls itself.">
          <input id="name" className={inputClass} placeholder="Alaba Traders Weekly"
            value={name} onChange={(e) => { setName(e.target.value); setError(''); }} />
        </Field>

        <div className="space-y-3">
          <p className="font-body text-sm font-bold">Each person pays</p>
          <div className="flex flex-wrap gap-2">
            {AMOUNTS.map((a) => (
              <Chip key={a} active={!custom && amount === a}
                onClick={() => { setAmount(a); setCustom(''); setError(''); }}>
                ₦{a.toLocaleString('en-NG')}
              </Chip>
            ))}
          </div>
          <input aria-label="Another amount" inputMode="numeric"
            className={inputClass + ' tabular-nums'} placeholder="Another amount"
            value={custom} onChange={(e) => { setCustom(e.target.value.replace(/\D/g, '')); setError(''); }} />
        </div>

        <div className="space-y-3">
          <p className="font-body text-sm font-bold">How often</p>
          <div className="flex flex-wrap gap-2">
            {FREQS.map(([key, label]) => (
              <Chip key={key} active={frequency === key} onClick={() => setFrequency(key)}>{label}</Chip>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-body text-sm font-bold">How many people</p>
          <div className="flex flex-wrap gap-2">
            {[3, 4, 5, 6, 8, 10, 12].map((n) => (
              <Chip key={n} active={size === n} onClick={() => setSize(n)}>{n}</Chip>
            ))}
          </div>
        </div>

        {error && <p role="alert" className="font-body text-sm font-bold text-kola">{error}</p>}
      </Card>

      <Card className="bg-mango p-4">
        <Eyebrow>What this adds up to</Eyebrow>
        <p className="mt-1 font-body text-[15px] font-bold leading-snug">
          {size} people paying <Money value={finalAmount || 0} /> {FREQS.find(f => f[0] === frequency)[1].toLowerCase()}.
          Whoever collects takes <Money value={(finalAmount || 0) * size} />, and the circle
          runs for {size} rounds.
        </p>
      </Card>

      <Button tone="ink" size="lg" className="w-full" onClick={submit} disabled={saving}>
        {saving ? 'Creating circle…' : 'Create circle'}
      </Button>
    </div>
  );
}
