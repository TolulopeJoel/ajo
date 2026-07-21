/* ============================================================
   MOCK DATA — NOT REAL. Demo fixtures only.
   Nothing here is imported by api.live.js. Delete-safe.
   ============================================================ */

export const MOCK_BANKS = ['Wema Bank', 'Sterling Bank', 'Providus Bank'];

/** Contribution history is stored per round so the UI can show the actual
 *  pattern ("missed round 3 of 5"), not just a pass/fail label. */
export const MOCK_TRUST_RECORDS = {
  '08031234567': {
    name: 'Adaeze Nwosu',
    circlesCompleted: 4,
    history: [true, true, true, true, true],
    lastSeen: 'Finished a ₦20,000 circle in March',
  },
  '08149876543': {
    name: 'Tunde Bakare',
    circlesCompleted: 3,
    history: [true, true, false, true, true],
    lastSeen: 'Paid late twice in a ₦10,000 circle',
  },
  '07066554433': {
    name: 'Chinelo Okafor',
    circlesCompleted: 2,
    history: [true, false, false, true, true],
    lastSeen: 'Left a circle in round 4, February',
  },
  '09022113344': {
    name: 'Musa Danjuma',
    circlesCompleted: 6,
    history: [true, true, true, true, true],
    lastSeen: 'Six circles, never missed a round',
  },
  '08055667788': {
    name: 'Blessing Etim',
    circlesCompleted: 1,
    history: [true, true, true, false, false],
    lastSeen: 'Stopped paying after collecting in round 3',
  },
};

/** Used when a number has no record at all — a real and common case. */
export const NEW_MEMBER_NAMES = [
  'Ifeanyi Obi', 'Halima Yusuf', 'Segun Adeyemi', 'Ngozi Eze', 'Kabiru Sani',
];

/** Sign-in credentials. The password is the SMS code from sign-up until
 *  the member changes it in Settings. */
export const MOCK_PASSWORDS = {
  '08031234567': '4821',
  '09022113344': '4821',
  '08055667788': '4821',
};

export const DEMO_SEEDS = {
  clean: '09022113344',   // Musa Danjuma — six circles, spotless
  flagged: '08055667788', // Blessing Etim — collected then stopped
  organizer: '08031234567', // Adaeze Nwosu — creates the demo circle
};

/** The code the mock SMS step always accepts. Shown on screen in mock mode. */
export const MOCK_SMS_CODE = '4821';

export const MOCK_CIRCLE_TEMPLATE = {
  name: 'Alaba Traders Weekly',
  amount: 20000,
  frequency: 'weekly',
  size: 5,
};

/** A ready-made circle so the demo can start mid-story if needed. */
export const DEMO_ROSTER = [
  '08031234567', // organizer, position 1
  '09022113344',
  '08149876543',
  '08055667788',
  '07066554433',
];
