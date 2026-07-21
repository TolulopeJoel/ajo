# Ajo

Rotating savings circles (ajo / esusu / adashe) with the risk made visible.

**The problem:** once someone has collected the pot, nothing makes them keep
contributing — and until they miss, the rest of the circle has no way to see it
coming.

**What Ajo does:** shows each member's payment record from past circles before
you let them in, holds collateral on positions 1 and 2, and puts everyone else
on standing auto-pay.

## Run it

```bash
npm install
npm run dev
```

## Mock vs live

The whole UI runs against a mock service layer, so the front end demos without a
backend.

```
src/services/
  index.js       ← the swap point (USE_MOCK flag / VITE_USE_MOCK env)
  api.mock.js    ← mock implementation, incl. the demo session
  api.live.js    ← Monnify-backed implementation, same interface
  mockData.js    ← every fixture in the app, in one file
```

**No secrets in this repo.** `api.live.js` calls a server route (`/api/...`);
Monnify keys stay on that server, never in the browser bundle.

### What the mocks simulate

| Call | Behaviour |
|---|---|
| `createVirtualAccount` | Realistic NUBAN + bank name, ~0.9s |
| `watchDeposit` | 2–4s delay, then status flips to Received |
| `sendCode` / `confirmCode` | Instant "sent", ~1.1s to accept the code (`4821`) |
| `verifyIdentity` | ~1.5s, then Verified (rejects a non-11-digit BVN) |
| `signIn` / `changePassword` | Credential check against the fixture set |
| `lookupMember` | Seeded records: clean, watch, flagged, and unknown |
| `authorizeAutoPay` | ~1.3s, then Authorized |
| `depositCollateral` | ~2.0s, then Held |
| `sendPayout` | ~2.2s, then Paid out |

## Roles

There is no organizer account type. Each circle carries `createdBy`, the service
layer holds one `currentUser`, and organizer status is derived on the fly:

```js
isOrganizer = currentUser.id === circle.createdBy
```

Invite Members and Create Circle are the only organizer-gated pages (plus
approving a reorder request, which appears as a section of Member Home). Anyone
reaching them without being the creator is redirected to Member Home.

## Demo panel

Header → **Demo**. Seed a full circle, switch the active member between the
creator and a regular member live, simulate an invite arriving, land every
pending transfer instantly, raise a reorder request, or clear state.

Demo sign-in: `08031234567`, code `4821`.

## Design

**Weight tiers.** Bold treatment — 3px ink border, lift shadow, saturated block —
is reserved for navigation chrome, primary buttons, and the trust badge. Cards,
list rows, inputs, money and supporting text sit on a 1.5px hairline over the
cream base, with no shadow.

- **Palette** — ink `#141210`, mute `#6B6257`, line `#E0D5C1`, paper `#F5EEE1`,
  card `#FFFCF6`, adire `#3A34C4`, mango `#FFB627`, palm `#12784F`,
  kola `#C81E2B`. Defined once in `tailwind.config.js`.
- **Type** — Bricolage Grotesque (display, sparing) + Plus Jakarta Sans (body,
  tabular figures for money and account numbers).
- **Signature** — the ledger stamp: every confirmation lands like a collector
  marking a paid round in a notebook.
- **Disclosure** — explanations sit behind a small inline affordance
  (`<Explain>`) rather than at full weight by default.
- Motion can be switched off in the header, and `prefers-reduced-motion` is
  respected automatically.
