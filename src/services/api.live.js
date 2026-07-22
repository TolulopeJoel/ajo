/* Live implementation — same interface as api.mock.js.
   Wiring Monnify in happens here and nowhere else.
   No keys in this repo: they belong on the server that fronts these calls. */
const BASE = import.meta.env?.VITE_API_BASE ?? '/api';

const call = async (path, options = {}) => {
  const res = await fetch(BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Request failed');
  return res.json();
};
const post = (path, body) => call(path, { method: 'POST', body: JSON.stringify(body ?? {}) });

let currentUser = null;

export const liveApi = {
  name: 'live',

  getCurrentUser: () => currentUser,
  setCurrentUser(user) { currentUser = user; return currentUser; },
  clearSession() { currentUser = null; post('/session/end'); },

  async signIn(creds) { currentUser = await post('/session', creds); return currentUser; },
  changePassword: (payload) => post('/session/password', payload),

  sendCode: (phone) => post('/phone/code', { phone }),
  confirmCode: (payload) => post('/phone/confirm', payload),
  async verifyIdentity(payload) { currentUser = await post('/identity/verify', payload); return currentUser; },

  lookupMember: (phone) => call('/members/' + phone + '/trust'),

  createCircle: (details) => post('/circles', details),
  addMember: (circleId, member) => post('/circles/' + circleId + '/members', { member }),
  getUserCircle: () => call('/user/circle'),
  createVirtualAccount: (memberName, circleName) => post('/circles/account', { memberName, circleName }),


  watchDeposit(memberId, onReceived) {
    const source = new EventSource(BASE + '/deposits/' + memberId + '/stream');
    source.onmessage = (e) => onReceived(JSON.parse(e.data));
    return () => source.close();
  },
  settleAllDeposits() {},

  authorizeAutoPay: (memberId) => post('/members/' + memberId + '/autopay'),
  addCard: (cardDetails) => post('/cards', cardDetails),
  removeCard: (cardId) => post('/cards/' + cardId + '/remove'),
  depositCollateral: (memberId, amount) => post('/members/' + memberId + '/collateral', { amount }),
  sendPayout: (payload) => post('/payouts', payload),
  validateBankAccount: (accountNumber, bankCode) => post('/bank/validate', { accountNumber, bankCode }),
  withdrawToBank: (payload) => post('/withdrawals', payload),
  getWithdrawalStatus: (withdrawalId) => call('/withdrawals/' + withdrawalId + '/status'),
  advanceRound: (circleId) => post('/circles/' + circleId + '/next-round'),
};
