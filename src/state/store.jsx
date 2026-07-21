import { createContext, useContext, useMemo, useReducer } from 'react';
import { api } from '../services/index.js';

const StoreContext = createContext(null);

const EMPTY = {
  currentUser: null,   // set by sign-up, login, or the demo panel's member switch. May include card info for auto-pay
  circle: null,        // { id, name, amount, frequency, size, createdBy }
  members: [],         // { id, name, phone, trust, position, state, funded, autoPay, collateral, collected, account, paymentHistory, balance, missedRounds, collateralForfeited }
  round: 1,
  pendingReorder: null, // { byId, byName, members: [ids] }
  orderLocked: false,  // order locks once first round payments start
  withdrawals: [],     // track withdrawal requests and their status
  motionOff: false,
};

function reindex(list) {
  return list.map((m, i) => ({ ...m, position: i + 1 }));
}

function reducer(state, action) {
  switch (action.type) {
    case 'reset':
      api.clearSession();
      return { ...EMPTY, motionOff: state.motionOff };
    case 'set':
      return { ...state, ...action.payload };
    case 'signIn':
      api.setCurrentUser(action.user);
      return { ...state, currentUser: action.user };
    case 'addMember':
      if (state.members.some((m) => m.phone === action.member.phone)) return state;
      return { ...state, members: reindex([...state.members, action.member]) };
    case 'removeMember':
      return { ...state, members: reindex(state.members.filter((m) => m.id !== action.id)) };
    case 'patchMember':
      let shouldLockOrder = false;
      const updatedMembers = state.members.map((m) => {
        if (m.id === action.id) {
          const updated = { ...m, ...action.patch };
          // Record payment when funded status changes to true
          if (action.patch.funded === true && !m.funded && m.state === 'joined') {
            const history = m.paymentHistory || [];
            updated.paymentHistory = [
              ...history,
              { round: state.round, amount: state.circle?.amount || 0, at: Date.now(), status: 'paid' },
            ];
            // Lock order after first payment in round 1
            if (state.round === 1 && !state.orderLocked) {
              shouldLockOrder = true;
            }
          }
          return updated;
        }
        return m;
      });
      return {
        ...state,
        members: updatedMembers,
        orderLocked: shouldLockOrder ? true : state.orderLocked,
      };
    case 'reorder':
      return { ...state, members: reindex(action.members), pendingReorder: null };
    case 'requestReorder':
      return { ...state, pendingReorder: action.request };
    case 'clearReorder':
      return { ...state, pendingReorder: null };
    case 'addWithdrawal':
      return { ...state, withdrawals: [...state.withdrawals, action.withdrawal] };
    case 'updateWithdrawal':
      return {
        ...state,
        withdrawals: state.withdrawals.map((w) =>
          w.withdrawalId === action.withdrawalId ? { ...w, ...action.updates } : w
        ),
      };
    case 'nextRound':
      return {
        ...state,
        round: state.round + 1,
        members: state.members.map((m) => ({
          ...m,
          funded: false,
          collected: false,
        })),
      };
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, EMPTY);

  const value = useMemo(() => {
    const joined = state.members.filter((m) => m.state === 'joined');
    const me = state.members.find((m) => m.id === state.currentUser?.id) || null;
    return {
      ...state,
      dispatch,
      api,
      joined,
      me,
      /* Derived, never stored: there is no organizer account type. */
      isOrganizer: Boolean(state.currentUser && state.circle
        && state.currentUser.id === state.circle.createdBy),
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
};

export const totalPot = (s) =>
  (s.circle?.amount || 0) * s.members.filter((m) => m.state === 'joined' && m.funded).length;
