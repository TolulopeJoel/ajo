/* Mock implementation of the Ajo service interface.
   Every fake value in the app enters through this file. */
import {
  MOCK_BANKS, MOCK_TRUST_RECORDS, NEW_MEMBER_NAMES,
  MOCK_PASSWORDS, MOCK_SMS_CODE,
} from './mockData.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Outstanding deposit timers, so the demo panel can fire them early. */
const pendingDeposits = new Map();
const mockAccounts = new Map();

/* ---- session -----------------------------------------------------------
   One "current user" for the whole app. Organizer is never a stored role:
   it is derived on the fly from currentUser.id === circle.createdBy.
   ---------------------------------------------------------------------- */
let currentUser = null;
const passwords = { ...MOCK_PASSWORDS };

const STORAGE_KEY = 'ajo_session';

function saveSession(user, circle, members) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, circle, members }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {}
}

function trustFrom(record) {
  const history = record.history;
  const missed = history.filter((paid) => !paid).length;
  const missedRounds = history.map((paid, i) => (paid ? 0 : i + 1)).filter(Boolean);
  return {
    status: missed === 0 ? 'clean' : missed >= 2 ? 'flagged' : 'watch',
    history, missed, rounds: history.length, missedRounds,
    circlesCompleted: record.circlesCompleted,
    note: record.lastSeen,
  };
}

function profileFor(phone) {
  const record = MOCK_TRUST_RECORDS[phone];
  if (record) return { id: 'm_' + phone, phone, name: record.name, trust: trustFrom(record), needsName: false };
  return {
    id: 'm_' + phone,
    phone,
    name: 'Member ' + phone.slice(-4),
    needsName: true,
    trust: {
      status: 'new', history: [], missed: 0, rounds: 0, missedRounds: [],
      circlesCompleted: 0, note: 'First circle on Ajo',
    },
  };
}

export const mockApi = {
  name: 'mock',

  /* ---- session ---- */
  getCurrentUser: () => currentUser,
  setCurrentUser(user, circle, members) {
    currentUser = user;
    saveSession(user, circle, members);
    return currentUser;
  },
  clearSession() {
    currentUser = null;
    saveSession(null);
  },
  async restoreSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        currentUser = parsed.user || null;
        return parsed;
      }
    } catch (e) {}
    currentUser = null;
    return null;
  },

  async signIn({ phone, password }) {
    await wait(900);
    if (passwords[phone] !== password) {
      throw new Error('That phone number and code do not match. Check both and try again.');
    }
    currentUser = { ...profileFor(phone), verified: true };
    saveSession(currentUser);
    return currentUser;
  },

  async updateProfile({ name }) {
    await wait(400);
    if (!currentUser) throw new Error('Not signed in');
    currentUser = { ...currentUser, name, needsName: false };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const members = (parsed.members || []).map((m) =>
          m.id === currentUser.id || m.phone === currentUser.phone
            ? { ...m, name, state: 'joined' }
            : m
        );
        saveSession(currentUser, parsed.circle, members);
        return currentUser;
      }
    } catch (e) {}
    saveSession(currentUser);
    return currentUser;
  },

  async changePassword({ phone, next }) {
    await wait(800);
    if (!/^\d{4}$/.test(next)) throw new Error('Your code is 4 digits.');
    passwords[phone] = next;
    return { changed: true };
  },

  /* ---- sign-up ---- */
  async sendCode(phone) {
    await wait(700);
    return { sent: true, to: phone, hint: MOCK_SMS_CODE };
  },

  async confirmCode({ phone, code }) {
    await wait(1100);
    if (code !== MOCK_SMS_CODE) {
      throw new Error('That code is not right. Check your messages, or send a new one.');
    }
    return { phoneConfirmed: true, phone };
  },

  async verifyIdentity({ name, phone, bvn }) {
    await wait(1500);
    if (!/^\d{11}$/.test(bvn)) {
      throw new Error('A BVN is 11 digits. Check the number and enter it again.');
    }
    passwords[phone] = MOCK_SMS_CODE;
    currentUser = { ...profileFor(phone), name: name || profileFor(phone).name, verified: true };
    saveSession(currentUser);
    return currentUser;
  },

  /* ---- members and trust ---- */
  async lookupMember(phone) {
    await wait(rand(700, 1200));
    return profileFor(phone);
  },

  /* ---- circles ---- */
  async createCircle(details) {
    await wait(500);
    return {
      ...details,
      id: 'circle_' + Date.now(),
      createdBy: details.createdBy ?? currentUser?.id ?? null,
      createdAt: Date.now(),
    };
  },

  async createVirtualAccount(memberName, circleName, memberId) {
    if (memberId && mockAccounts.has(memberId)) {
      return mockAccounts.get(memberId);
    }
    await wait(900);
    const acct = {
      accountNumber: String(rand(1000000000, 9999999999)),
      bankName: MOCK_BANKS[rand(0, MOCK_BANKS.length - 1)],
      accountName: `${memberName} / AJO / ${String(circleName || 'CIRCLE').toUpperCase().slice(0, 15)}`,
    };
    if (memberId) mockAccounts.set(memberId, acct);
    return acct;
  },

  /* ---- money movement ---- */
  watchDeposit(memberId, onReceived) {
    const timer = setTimeout(() => {
      pendingDeposits.delete(memberId);
      onReceived({ memberId, at: Date.now() });
    }, rand(2000, 4000));
    pendingDeposits.set(memberId, () => {
      clearTimeout(timer);
      pendingDeposits.delete(memberId);
      onReceived({ memberId, at: Date.now() });
    });
    return () => { clearTimeout(timer); pendingDeposits.delete(memberId); };
  },

  /** Demo control: land every outstanding transfer now. */
  settleAllDeposits() {
    [...pendingDeposits.values()].forEach((fire) => fire());
  },

  async authorizeAutoPay(memberId) {
    await wait(1300);
    return { memberId, autoPay: true, at: Date.now() };
  },

  async addCard(cardDetails) {
    await wait(1200);
    return {
      id: 'card_' + Date.now(),
      last4: cardDetails.number.slice(-4),
      brand: cardDetails.number.startsWith('4') ? 'Visa' : cardDetails.number.startsWith('5') ? 'Mastercard' : 'Card',
      expiry: cardDetails.expiry,
    };
  },

  async removeCard(cardId) {
    await wait(800);
    return { removed: true };
  },

  async depositCollateral(memberId, amount) {
    await wait(2000);
    return { memberId, amount, held: true, at: Date.now() };
  },

  async sendPayout({ memberId, amount }) {
    await wait(2200);
    return { memberId, amount, paidOut: true, at: Date.now() };
  },

  async validateBankAccount(accountNumber, bankCode) {
    await wait(1000);
    // Mock validation - returns a random name for demo purposes
    const names = ['Adaeze Nwosu', 'Tunde Bakare', 'Chinelo Okafor', 'Musa Danjuma', 'Blessing Etim'];
    return {
      valid: true,
      accountName: names[Math.floor(Math.random() * names.length)],
      accountNumber,
    };
  },

  async withdrawToBank({ memberId, amount, accountNumber, bankCode, accountName }) {
    await wait(2500);
    return {
      withdrawalId: 'wd_' + Date.now(),
      memberId,
      amount,
      accountNumber,
      bankCode,
      accountName,
      status: 'processing',
      createdAt: Date.now(),
    };
  },

  async getWithdrawalStatus(withdrawalId) {
    await wait(500);
    // Mock status progression
    const now = Date.now();
    const idNum = parseInt(withdrawalId.replace('wd_', ''));
    const age = now - idNum;
    
    if (age < 3000) return { status: 'processing' };
    if (age < 6000) return { status: 'sent' };
    return { status: 'completed' };
  },

  async advanceRound(circleId) {
    await wait(800);
    return { circleId, nextRound: true, at: Date.now() };
  },
};
