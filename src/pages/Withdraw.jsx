import { useState, useEffect } from 'react';
import { useStore } from '../state/store.jsx';
import {
  Button, Card, Field, inputClass, Eyebrow, Title, Caption, Money, Stamp, Checking, Pill,
} from '../components/kit.jsx';

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank' },
  { code: '050', name: 'Ecobank' },
  { code: '084', name: 'Fidelity Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank' },
  { code: '058', name: 'GTBank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '221', name: 'Stanbic IBTC' },
  { code: '232', name: 'Sterling Bank' },
  { code: '032', name: 'Union Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
];

export default function Withdraw({ go }) {
  const { me, api, dispatch, motionOff, withdrawals } = useStore();
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [validating, setValidating] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  
  const balance = me?.balance || 0;
  const myWithdrawals = withdrawals.filter((w) => w.memberId === me?.id);

  async function validateAccount() {
    if (accountNumber.length < 10) {
      setError('Enter a valid account number (10 digits)');
      return;
    }
    if (!bankCode) {
      setError('Select your bank');
      return;
    }
    
    setValidating(true);
    setError('');
    try {
      const result = await api.validateBankAccount(accountNumber, bankCode);
      setValidationResult(result);
      setAccountName(result.accountName);
    } catch (e) {
      setError(e.message || 'Could not validate account. Check the details and try again.');
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  }

  async function withdraw() {
    if (!validationResult || !accountName) {
      setError('Please validate your account first');
      return;
    }
    if (balance <= 0) {
      setError('No balance to withdraw');
      return;
    }
    
    setWithdrawing(true);
    setError('');
    try {
      const withdrawal = await api.withdrawToBank({
        memberId: me.id,
        amount: balance,
        accountNumber,
        bankCode,
        accountName,
      });
      dispatch({ type: 'addWithdrawal', withdrawal });
      dispatch({ type: 'patchMember', id: me.id, patch: { balance: 0 } });
      setAccountNumber('');
      setBankCode('');
      setAccountName('');
      setValidationResult(null);
    } catch (e) {
      setError(e.message || 'Withdrawal failed. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  }

  // Poll for withdrawal status updates
  useEffect(() => {
    const pendingWithdrawals = myWithdrawals.filter((w) => w.status === 'processing' || w.status === 'sent');
    if (pendingWithdrawals.length === 0) return;
    
    const interval = setInterval(async () => {
      for (const w of pendingWithdrawals) {
        try {
          const status = await api.getWithdrawalStatus(w.withdrawalId);
          if (status.status !== w.status) {
            dispatch({ 
              type: 'updateWithdrawal', 
              withdrawalId: w.withdrawalId, 
              updates: { status: status.status } 
            });
          }
        } catch (e) {
          console.error('Failed to check withdrawal status:', e);
        }
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [myWithdrawals, api, dispatch]);

  function getStatusColor(status) {
    switch (status) {
      case 'processing': return 'mango';
      case 'sent': return 'adire';
      case 'completed': return 'palm';
      default: return 'quiet';
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'processing': return 'Processing';
      case 'sent': return 'Sent';
      case 'completed': return 'Completed';
      default: return status;
    }
  }

  return (
    <div className="space-y-6">
      <Button size="sm" onClick={() => go('home')}>← Back</Button>

      <header>
        <Eyebrow>Withdraw funds</Eyebrow>
        <Title className="mt-1 text-4xl">Your balance</Title>
        <Money value={balance} className="mt-2 block font-display text-5xl" />
      </header>

      {/* Withdrawal form */}
      {balance > 0 && (
        <Card className="space-y-5 p-6">
          <Eyebrow>Withdraw to your bank account</Eyebrow>
          
          <Field id="bank" label="Select your bank">
            <select
              id="bank"
              className={inputClass}
              value={bankCode}
              onChange={(e) => { setBankCode(e.target.value); setValidationResult(null); setError(''); }}
              disabled={withdrawing}
            >
              <option value="">Choose your bank</option>
              {NIGERIAN_BANKS.map((bank) => (
                <option key={bank.code} value={bank.code}>{bank.name}</option>
              ))}
            </select>
          </Field>

          <Field id="accountNumber" label="Account number" error={error}>
            <input
              id="accountNumber"
              inputMode="numeric"
              maxLength={10}
              className={inputClass + ' tabular-nums tracking-wide'}
              placeholder="1234567890"
              value={accountNumber}
              onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, '')); setValidationResult(null); setError(''); }}
              disabled={withdrawing}
            />
          </Field>

          {!validationResult ? (
            <Button 
              className="w-full" 
              onClick={validateAccount} 
              disabled={validating || !accountNumber || !bankCode}
            >
              {validating ? 'Validating account…' : 'Validate account'}
            </Button>
          ) : (
            <>
              <div className="rounded-chunk border-[3px] border-ink bg-paper p-4">
                <p className="font-body text-sm text-mute">Account name</p>
                <p className="font-body font-bold">{accountName}</p>
                <Stamp tone="palm" motionOff={motionOff} className="mt-2">✓ Account verified</Stamp>
              </div>
              
              <Button 
                size="lg" 
                tone="mango" 
                className="w-full" 
                onClick={withdraw}
                disabled={withdrawing}
              >
                {withdrawing ? 'Processing withdrawal…' : `Withdraw ₦${balance.toLocaleString('en-NG')}`}
              </Button>
            </>
          )}

          {validating && <Checking label="Verifying account details" />}
        </Card>
      )}

      {/* Withdrawal history */}
      {myWithdrawals.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b-[3px] border-ink px-5 py-4">
            <Eyebrow>Withdrawal history</Eyebrow>
          </div>
          {myWithdrawals.map((w) => (
            <div
              key={w.withdrawalId}
              className="flex items-center justify-between gap-3 border-b-[3px] border-ink px-5 py-4 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-body font-bold">
                  <Money value={w.amount} />
                </p>
                <Caption className="mt-0.5">
                  {w.accountNumber} · {NIGERIAN_BANKS.find((b) => b.code === w.bankCode)?.name || 'Unknown Bank'}
                </Caption>
              </div>
              <Pill tone={getStatusColor(w.status)}>{getStatusLabel(w.status)}</Pill>
            </div>
          ))}
        </Card>
      )}

      {balance === 0 && myWithdrawals.length === 0 && (
        <Card className="p-8 text-center">
          <p className="font-display text-xl font-extrabold">No balance to withdraw</p>
          <Caption className="mt-2">
            Your balance will appear here when it's your turn to collect.
          </Caption>
        </Card>
      )}

      <Card className="p-6">
        <p className="font-body font-bold leading-snug">
          Withdrawals are processed within 1-2 business days.
        </p>
        <Caption className="mt-1">
          We validate the account name before processing to ensure your money goes to the right place.
        </Caption>
      </Card>
    </div>
  );
}
