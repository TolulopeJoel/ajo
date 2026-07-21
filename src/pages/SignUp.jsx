import { useState, useRef, useEffect } from 'react';
import { useStore } from '../state/store.jsx';
import { IS_MOCK } from '../services/index.js';
import { MOCK_SMS_CODE } from '../services/mockData.js';
import {
  Button, Card, Field, inputClass, Eyebrow, Title, Caption, Stamp, Checking, Explain,
} from '../components/kit.jsx';

const mask = (phone) => phone.slice(0, 4) + '•••' + phone.slice(-4);

/* Step 2 — confirming the member owns the number. Also reused by
   "Forgot password" on the login screen, so it lives on its own. */
export function ConfirmPhone({ phone, onDone, onBack, title = 'Confirm your phone' }) {
  const { api } = useStore();
  const [code, setCode] = useState('');
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function check(value) {
    setState('checking');
    try {
      await api.confirmCode({ phone, code: value });
      setState('done');
      setTimeout(() => onDone(), 700);
    } catch (e) {
      setError(e.message);
      setState('idle');
    }
  }

  async function resend() {
    await api.sendCode(phone);
    setCooldown(30);
    setError('');
  }

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>Step 2 of 3</Eyebrow>
        <Title className="mt-1 text-4xl">{title}</Title>
        <Caption className="mt-2">Enter the code we sent to {mask(phone)}.</Caption>
      </header>

      <Card className="space-y-5 p-6">
        <Field id="code" label="Your 4-digit code" error={error}>
          <input
            ref={ref}
            id="code"
            inputMode="numeric"
            maxLength={4}
            autoComplete="one-time-code"
            disabled={state !== 'idle'}
            className={inputClass + ' text-center text-3xl font-extrabold tabular-nums tracking-[0.5em]'}
            placeholder="••••"
            value={code}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              setCode(v); setError('');
              if (v.length === 4) check(v);
            }}
          />
        </Field>

        {state === 'checking' && <Checking label="Checking the code" />}
        {state === 'done' && <Stamp tone="palm">✓ Phone confirmed</Stamp>}

        <div className="flex items-center justify-between gap-3">
          <Button size="sm" onClick={resend} disabled={cooldown > 0}>
            {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
          </Button>
          {onBack && (
            <Button size="sm" onClick={onBack}>Change number</Button>
          )}
        </div>

        <Caption className="border-t-[3px] border-ink pt-4">
          This code is also how you sign back in.{' '}
          <Explain label="Can I change it?">
            Yes — Settings, any time. It is a 4-digit code, not a long password.
          </Explain>
        </Caption>

        {IS_MOCK && (
          <Caption className="text-xs">Demo build: the code is {MOCK_SMS_CODE}.</Caption>
        )}
      </Card>
    </div>
  );
}

export default function SignUp({ go }) {
  const { dispatch, api, motionOff } = useStore();
  const [step, setStep] = useState('details'); // details → code → bvn → done
  const [form, setForm] = useState({ name: '', phone: '', bvn: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => {
    const v = k === 'name' ? e.target.value : e.target.value.replace(/\D/g, '');
    setForm((f) => ({ ...f, [k]: v }));
    setError('');
  };

  async function sendCode() {
    if (!form.name.trim()) { setError('Enter your name as your bank has it.'); return; }
    if (form.phone.length !== 11) { setError('Nigerian numbers are 11 digits.'); return; }
    setBusy(true);
    await api.sendCode(form.phone);
    setBusy(false);
    setStep('code');
  }

  async function verifyBvn() {
    setBusy(true);
    try {
      const user = await api.verifyIdentity(form);
      dispatch({ type: 'signIn', user });
      setStep('done');
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  if (step === 'code') {
    return (
      <ConfirmPhone
        phone={form.phone}
        onBack={() => setStep('details')}
        onDone={() => setStep('bvn')}
      />
    );
  }

  if (step === 'done') {
    return (
      <div className="space-y-6">
        <header>
          <Eyebrow>Step 3 of 3</Eyebrow>
          <Title className="mt-1 text-4xl">You're verified</Title>
        </header>
        <Card className="p-6">
          <Stamp tone="palm" motionOff={motionOff}>✓ Verified</Stamp>
          <p className="mt-3 font-body font-extrabold">{form.name}</p>
          <Caption className="mt-1">You can start a circle or join one you were invited to.</Caption>
        </Card>
        <Button size="lg" tone="mango" className="w-full" onClick={() => go('create')}>
          Start a circle
        </Button>
      </div>
    );
  }

  if (step === 'bvn') {
    return (
      <div className="space-y-6">
        <header>
          <Eyebrow>Step 3 of 3</Eyebrow>
          <Title className="mt-1 text-4xl">Add your BVN</Title>
          <Caption className="mt-2">
            This is what makes a payment record worth reading.{' '}
            <Explain>
              Ajo checks your name against your bank record. We never see your account
              balance and we cannot move money without your say-so.
            </Explain>
          </Caption>
        </header>
        <Card className="space-y-5 p-6">
          <Field id="bvn" label="BVN" hint="Dial *565*0# on your registered line to see yours." error={error}>
            <input
              id="bvn" inputMode="numeric" maxLength={11}
              className={inputClass + ' tabular-nums tracking-wide'}
              placeholder="22123456789" value={form.bvn} onChange={set('bvn')}
              disabled={busy}
            />
          </Field>
          {busy && <Checking label="Verifying with your bank" />}
          <Button size="lg" className="w-full" onClick={verifyBvn} disabled={busy}>
            {busy ? 'Verifying…' : 'Verify'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>Step 1 of 3</Eyebrow>
        <Title className="mt-1 text-4xl">Create your account</Title>
      </header>

      <Card className="space-y-5 p-6">
        <Field id="name" label="Your name">
          <input id="name" className={inputClass} autoComplete="name"
            placeholder="Adaeze Nwosu" value={form.name} onChange={set('name')} />
        </Field>
        <Field id="phone" label="Phone number"
          hint="We send a code to this number." error={error}>
          <input id="phone" inputMode="numeric" maxLength={11} autoComplete="tel"
            className={inputClass + ' tabular-nums tracking-wide'}
            placeholder="08031234567" value={form.phone} onChange={set('phone')} />
        </Field>
        <Button size="lg" className="w-full" onClick={sendCode} disabled={busy}>
          {busy ? 'Sending code…' : 'Send me a code'}
        </Button>
      </Card>

      <Button className="w-full" onClick={() => go('login')}>
        I already have an account
      </Button>
    </div>
  );
}
