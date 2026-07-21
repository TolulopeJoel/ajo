import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import {
  Button, Card, Field, inputClass, Eyebrow, Title, Caption, Stamp, Pill,
} from '../components/kit.jsx';

export default function Settings({ go }) {
  const { currentUser, api, dispatch, motionOff, me } = useStore();
  const [next, setNext] = useState('');
  const [codeState, setCodeState] = useState('idle');
  const [codeError, setCodeError] = useState('');
  
  // Card management state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardState, setCardState] = useState('idle');
  const [cardError, setCardError] = useState('');
  
  const user = me || currentUser;
  const savedCard = user?.card || null;

  async function changeCode() {
    setCodeState('busy');
    try {
      await api.changePassword({ phone: user.phone, next });
      setCodeState('done');
    } catch (e) {
      setCodeError(e.message);
      setCodeState('idle');
    }
  }

  async function addCard() {
    if (cardNumber.length < 16) {
      setCardError('Enter a valid card number');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setCardError('Enter expiry as MM/YY');
      return;
    }
    if (cardCvv.length < 3) {
      setCardError('Enter a valid CVV');
      return;
    }
    
    setCardState('busy');
    setCardError('');
    try {
      const card = await api.addCard({ number: cardNumber, expiry: cardExpiry, cvv: cardCvv });
      dispatch({ 
        type: 'set', 
        payload: { currentUser: { ...user, card } } 
      });
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCardState('done');
    } catch (e) {
      setCardError(e.message);
      setCardState('idle');
    }
  }

  async function removeCard() {
    if (!savedCard) return;
    setCardState('busy');
    try {
      await api.removeCard(savedCard.id);
      dispatch({ 
        type: 'set', 
        payload: { currentUser: { ...user, card: null } } 
      });
      setCardState('idle');
    } catch (e) {
      setCardState('idle');
    }
  }

  async function toggleAutoPay() {
    if (!me) return;
    const newState = !me.autoPay;
    try {
      await api.authorizeAutoPay(me.id);
      dispatch({ type: 'patchMember', id: me.id, patch: { autoPay: newState } });
    } catch (e) {
      console.error('Failed to toggle auto-pay:', e);
    }
  }

  return (
    <div className="space-y-6">
      <Button size="sm" onClick={() => go('home')}>← Back</Button>

      <header>
        <Eyebrow>{user?.phone}</Eyebrow>
        <Title className="mt-1 text-4xl">Settings</Title>
      </header>

      {/* Password change */}
      <Card className="space-y-5 p-6">
        <Field id="next" label="New 4-digit code"
          hint="This replaces the code you use to sign in." error={codeError}>
          <input id="next" inputMode="numeric" maxLength={4} type="password"
            className={inputClass + ' tabular-nums tracking-[0.4em]'}
            placeholder="••••" value={next}
            disabled={codeState === 'done'}
            onChange={(e) => { setNext(e.target.value.replace(/\D/g, '')); setCodeError(''); }} />
        </Field>

        {codeState === 'done' ? (
          <Stamp tone="palm" motionOff={motionOff}>✓ Code changed</Stamp>
        ) : (
          <Button className="w-full" onClick={changeCode} disabled={codeState === 'busy' || next.length < 4}>
            {codeState === 'busy' ? 'Changing code…' : 'Change code'}
          </Button>
        )}
      </Card>

      {/* Card management for auto-pay */}
      <Card className="space-y-5 p-6">
        <Eyebrow>Card for auto-pay</Eyebrow>
        
        {savedCard ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 border-b-[3px] border-ink pb-4">
              <div>
                <p className="font-body font-bold">{savedCard.brand} •••• {savedCard.last4}</p>
                <Caption>Expires {savedCard.expiry}</Caption>
              </div>
              <Button size="sm" onClick={removeCard} disabled={cardState === 'busy'}>
                {cardState === 'busy' ? 'Removing…' : 'Remove'}
              </Button>
            </div>
            
            {me && (
              <div className="flex items-center justify-between gap-3 pt-2">
                <div>
                  <p className="font-body font-bold">Auto-pay each round</p>
                  <Caption>
                    {me.autoPay 
                      ? 'Your contribution will be charged automatically' 
                      : 'You will need to transfer manually each round'}
                  </Caption>
                </div>
                <Button 
                  size="sm" 
                  tone={me.autoPay ? 'palm' : 'mango'}
                  onClick={toggleAutoPay}
                >
                  {me.autoPay ? 'On' : 'Off'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Caption>
              Add a card to enable automatic contributions each round instead of manual transfers.
            </Caption>
            
            <Field id="cardNumber" label="Card number" error={cardError}>
              <input
                id="cardNumber"
                inputMode="numeric"
                maxLength={16}
                className={inputClass + ' tabular-nums tracking-wide'}
                placeholder="4242424242424242"
                value={cardNumber.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()}
                onChange={(e) => { setCardNumber(e.target.value.replace(/\D/g, '')); setCardError(''); }}
                disabled={cardState === 'busy' || cardState === 'done'}
              />
            </Field>
            
            <div className="grid grid-cols-2 gap-3">
              <Field id="expiry" label="Expiry (MM/YY)">
                <input
                  id="expiry"
                  inputMode="numeric"
                  maxLength={5}
                  className={inputClass + ' tabular-nums tracking-wide'}
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '');
                    if (v.length >= 2) {
                      setCardExpiry(v.slice(0, 2) + '/' + v.slice(2, 4));
                    } else {
                      setCardExpiry(v);
                    }
                    setCardError('');
                  }}
                  disabled={cardState === 'busy' || cardState === 'done'}
                />
              </Field>
              
              <Field id="cvv" label="CVV">
                <input
                  id="cvv"
                  inputMode="numeric"
                  maxLength={3}
                  className={inputClass + ' tabular-nums tracking-wide'}
                  placeholder="123"
                  value={cardCvv}
                  onChange={(e) => { setCardCvv(e.target.value.replace(/\D/g, '')); setCardError(''); }}
                  disabled={cardState === 'busy' || cardState === 'done'}
                />
              </Field>
            </div>
            
            {cardState === 'done' ? (
              <Stamp tone="palm" motionOff={motionOff}>✓ Card added</Stamp>
            ) : (
              <Button className="w-full" onClick={addCard} disabled={cardState === 'busy'}>
                {cardState === 'busy' ? 'Adding card…' : 'Add card'}
              </Button>
            )}
          </div>
        )}
      </Card>

      <Button className="w-full"
        onClick={() => { dispatch({ type: 'reset' }); go('landing'); }}
      >
        Sign out
      </Button>
    </div>
  );
}
