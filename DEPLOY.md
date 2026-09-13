# PharmaSafe — Backend Foundation (Phase 1)

This phase turns the existing Firebase Auth login into a real per-user
backend: every account now gets a Firestore profile doc, secured so a
user can only ever read/write their own data. This is the foundation
every later feature (Personalized Dashboard, Pharmacist Workspace, AI
Copilot history, reminders) will be built on — no UI changes ship in
this phase.

## What changed

- **`firestore.rules`** — new. Locks `/users/{uid}` and everything under
  it to the matching signed-in user only. Leaves the existing public
  `/ratings` collection exactly as it worked before.
- **`firebase.json` / `firestore.indexes.json`** — new. Lets the Firebase
  CLI deploy those rules.
- **`app.js`** — new `ensureUserProfile()`, `getUserProfile()`,
  `addUserItem()`, `getUserItems()`, `deleteUserItem()` functions. Every
  sign-in (email, Google, or a returning session) now creates or
  refreshes a `users/{uid}` document automatically.

Nothing about login itself changed — same forms, same Google button,
same behavior if a user skips sign-in.

## One-time setup

**1. Enable Firestore** (skip if you already did this for ratings):
Firebase console → your project → Build → Firestore Database → Create
database → production mode → pick a region.

**2. Install the Firebase CLI** (once, on your machine):
```
npm install -g firebase-tools
firebase login
```

**3. Deploy the rules** from this project folder:
```
firebase use pharmasafe-ac4f6
firebase deploy --only firestore:rules
```

That's it — no server to run, no separate database to provision. Every
user who logs in from now on gets a profile doc automatically.

## Verifying it worked

1. Open the live site, sign up or log in.
2. Firebase console → Firestore Database → Data tab.
3. You should see a `users` collection with one document per account,
   containing `uid`, `email`, `displayName`, `plan: "free"`,
   `createdAt`, `lastLoginAt`.
4. Try reading another user's doc from the browser console while signed
   in as someone else — it should be denied. That's the rules working.

## Data model reference (for building on top of this)

```
users/{uid}
  uid, email, displayName, plan, createdAt, lastLoginAt

users/{uid}/medications/{docId}   ← not built yet, ready to use
users/{uid}/allergies/{docId}     ← not built yet, ready to use
users/{uid}/reminders/{docId}     ← not built yet, ready to use
users/{uid}/favorites/{docId}     ← not built yet, ready to use
```

Any of those four (or a new subcollection name) works immediately with
the generic helpers already in `app.js` — no rules change needed:

```js
await addUserItem('medications', {name:'Atorvastatin', dose:'20mg'});
const meds = await getUserItems('medications');
await deleteUserItem('medications', meds[0].id);
```

`plan` on the profile doc is the field to check before gating any future
paid feature (e.g. AI Copilot query limits) — it's `'free'` for everyone
right now; nothing bills or enforces limits yet.

## What this phase deliberately does not include

- No UI for medications/allergies/reminders yet (that's the Personalized
  Dashboard phase — the data layer above is what it will call).
- No billing/subscription enforcement — `plan` exists but nothing reads
  it yet.
- No AI Copilot, drug interaction data, or multi-country database — each
  needs its own data-licensing and hosting decision before building.
