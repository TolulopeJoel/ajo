import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { IS_MOCK } from '../services/index.js';
import { MOCK_PASSWORDS, DEMO_SEEDS } from '../services/mockData.js';
import { ConfirmPhone } from './SignUp.jsx';
import {
  Button, Card, Field, inputClass, Eyebrow, Title, Caption, Checking,
} from '../components/kit.jsx';

export default function Login({ go }) {
  const { dispatch, api, circle } = useStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resetting, setResetting] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [fullName, setFullName] = useState('');

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const user = await api.signIn({ phone, password });
      const requiresName = user?.needsName || !user?.name || user.name === user.phone || user.name.startsWith('Member ');
      if (requiresName) {
        setPendingUser(user);
      } else {
        const circleToLoad = user?.circle || circle;
        dispatch({ type: 'signIn', user, circle: user?.circle, members: user?.members });
        if (user.id) {
          dispatch({ type: 'patchMember', id: user.id, patch: { state: 'joined' } });
        }
        go(circleToLoad ? 'home' : 'create');
      }
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  async function saveName() {
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      let updatedUser = pendingUser;
      if (api.updateProfile) {
        updatedUser = await api.updateProfile({ name: fullName.trim(), phone: pendingUser.phone });
      } else {
        updatedUser = { ...pendingUser, name: fullName.trim(), needsName: false };
      }
      const circleToLoad = updatedUser?.circle || circle;
      dispatch({ type: 'signIn', user: updatedUser, circle: updatedUser?.circle, members: updatedUser?.members });
      if (pendingUser.id) {
        dispatch({ type: 'patchMember', id: pendingUser.id, patch: { name: fullName.trim(), state: 'joined' } });
      }
      go(circleToLoad ? 'home' : 'create');
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  if (pendingUser) {
    return (
      <div className="space-y-6">
        <header>
          <Eyebrow>Welcome to Ajo</Eyebrow>
          <Title className="mt-1 text-4xl">What is your name?</Title>
          <Caption className="mt-2">
            Enter your full name as it appears on your bank account so circle members recognize you.
          </Caption>
        </header>

        <Card className="space-y-5 p-6">
          <Field id="fullName" label="Full name" error={error}>
            <input
              id="fullName"
              autoComplete="name"
              className={inputClass}
              placeholder="e.g. Amina Bello"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); }}
            />
          </Field>

          {busy && <Checking label="Saving your profile" />}

          <Button size="lg" className="w-full" onClick={saveName} disabled={busy || !fullName.trim()}>
            {busy ? 'Saving…' : 'Continue'}
          </Button>
        </Card>
      </div>
    );
  }


  if (resetting) {
    return (
      <ConfirmPhone
        phone={phone}
        title="Confirm your phone"
        onBack={() => setResetting(false)}
        onDone={() => { setResetting(false); go('settings'); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>Welcome back</Eyebrow>
        <Title className="mt-1 text-4xl">Sign in</Title>
      </header>

      <Card className="space-y-5 p-6">
        <Field id="phone" label="Phone number">
          <input id="phone" inputMode="numeric" maxLength={11} autoComplete="tel"
            className={inputClass + ' tabular-nums tracking-wide'}
            placeholder="08031234567" value={phone}
            onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }} />
        </Field>
        <Field id="code" label="Your 4-digit code" error={error}>
          <input id="code" inputMode="numeric" maxLength={4} type="password"
            autoComplete="current-password"
            className={inputClass + ' tabular-nums tracking-[0.4em]'}
            placeholder="••••" value={password}
            onChange={(e) => { setPassword(e.target.value.replace(/\D/g, '')); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
        </Field>

        {busy && <Checking label="Signing you in" />}

        <Button size="lg" className="w-full" onClick={submit} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>

        <Button size="sm" className="w-full"
          onClick={() => {
            if (phone.length !== 11) { setError('Enter your phone number first.'); return; }
            setResetting(true);
          }}
        >
          Forgot your code?
        </Button>
      </Card>

      <Button className="w-full" onClick={() => go('signup')}>
        Create an account instead
      </Button>

      {/* {IS_MOCK && (
        <Card className="p-5">
          <Eyebrow>Demo sign-in</Eyebrow>
          <Caption className="mt-2">
            {DEMO_SEEDS.organizer} · code {MOCK_PASSWORDS[DEMO_SEEDS.organizer]}
          </Caption>
        </Card>
      )} */}
    </div>
  );
}
