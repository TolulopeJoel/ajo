# Ajo — Feature Breakdown

**One-liner:** A digital trust-circle app for rotating group savings (ajo/esusu),
built on Monnify APIs, that makes contribution history visible and enforces
accountability with real financial mechanisms instead of relying on social
pressure after someone's already been burned.

---

## Core user features

### Circle setup
- Create a circle: name, contribution amount, frequency, number of members
- Invite members by phone number
- **Signature feature:** the instant a member is added, a live trust badge
  appears — clean history (green) or flagged, with the actual pattern shown
  ("missed 2 of 5 last contributions"), not just a label
- BVN identity verification at signup, tying contribution/default history to
  a real identity rather than an anonymous phone number

### Payments
- **Per-member dedicated virtual account** (not one shared account) — each
  member gets their own real account number to deposit into, so payments are
  unambiguous and reconcile automatically via webhook
- **Individual payment history** — each member sees their own past
  contributions (date, amount, status)
- **Card-based auto-pay (optional)** — a Settings page lets a member add a
  card and toggle "auto-charge each round" instead of manual bank transfer,
  for members who prefer that over cash/transfer

### Payout order & anti-fraud mechanics
- Payout order is **reorderable** (drag or up/down arrows) before the circle's
  first round begins
- Moving into position 1 or 2 triggers a **collateral deposit requirement** —
  the classic "first person collects and stops paying" risk is priced where
  it actually lives, instead of being addressed only after the fact
- Members in later positions instead authorize a **standing Direct Debit
  mandate**, so contributions are auto-pulled rather than relying on manual
  follow-through
- Once the first round's payments start, order **locks** — any change after
  that requires confirmation from affected members ("waiting on 2 of 4")
  rather than applying instantly

### Payout & withdrawal
- When it's a member's turn, the round's collected contributions are credited
  to their **internal balance** — shown in the UI as "funds moved to your
  account"
- From there, they can **withdraw to an external bank account** — requires a
  destination account, a name-validation check before the transfer fires, and
  a realistic status progression ("Processing" → "Sent"), or they can simply
  leave the balance sitting in-app until they choose to withdraw

### The member experience (not just the organizer's)
- **Member Home** is the default screen every member lands on: their own
  payment status this round, where they sit in the rotation, a prominent
  "your payout is ready" banner when it's their turn, their own trust badge
  and history summary, and one aggregate line on the group ("4 of 5 paid")
- The full member-by-member roster (status, position, whose turn, pot total)
  is one tap away, not the front door — transparency stays fully available,
  it's just not the first thing rendered
- No separate organizer console — whoever created the circle sees the same
  personalized view, with a couple of extra actions (invite, approve a
  reorder request) surfaced conditionally within it

### Nice-to-have (build only if time allows)
- Member trust profile: cross-circle history and completion streak
- A demo/judge control panel: buttons to instantly seed a clean member and a
  flagged member, and trigger mocked events on command, so presenters aren't
  waiting on timers live

---

## Trust & accountability model (the actual thesis of the app)
- Doesn't claim to remove the need for trust at the point of collection —
  claims to make betrayal **visible and provable** afterward, which is
  strictly better than word-of-mouth reputation, not a magic fix
- Real money mechanisms (collateral, mandates) do the enforcement; the trust
  badge and history do the transparency

## Cash-to-digital bridge (adoption story)
- Doesn't ask traders to change behavior — the person who already collects
  cash from the group makes one lump-sum deposit into the circle's virtual
  account via the agent-banking network (POS agents) that's already
  ubiquitous, rather than requiring individual members to go digital

## Monetization
- A small completion fee per finished circle — replaces the cut an informal
  ajo collector traditionally already takes, not new friction
- Paid tier for things members already want: verified identity, priority
  payout position, cross-group reputation
- Deliberately not pitched: earning interest/float on pooled funds — real,
  but invites a licensing question not worth opening in a hackathon Q&A

## Technical architecture
- **Built mock-first:** every Monnify call (virtual accounts, webhooks, BVN
  verification, mandates, collateral, account validation, disbursement) sits
  behind a swappable mock/live service layer, so the UI isn't blocked by
  backend progress
