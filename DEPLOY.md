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

---

# Phase 2 — My Dashboard (visible UI)

This is the first feature you'll actually see. A new **My Dashboard**
tab in the sidebar (right under Overview) lets a signed-in user save:

- **Medications** (name + optional dose/frequency)
- **Allergies** (substance + optional reaction)
- **Reminders** (title + optional note)
- **Favorite drugs** (name, with a one-click "Analyze" button that jumps
  straight into Drug analysis)

Everything is stored in the `users/{uid}` subcollections from Phase 1 —
no new backend work was needed, just the UI on top of it.

## What to check after deploying

1. Push these files, log in on the live site.
2. Click **My Dashboard** — if signed in, you'll see four cards with
   add-forms; if signed out, you'll see a "Sign in to use your
   dashboard" prompt instead.
3. Add a medication, refresh the page, click My Dashboard again — it
   should still be there (it's reading from Firestore, not local
   storage).
4. In the Firebase console → Firestore → Data, open your `users/{uid}`
   doc and you should now see `medications`, `allergies`, `reminders`,
   and/or `favorites` subcollections with the entries you added.

## Updating the live site (automatic PWA updates)

The installed web app is configured to check for a new deployment whenever it
opens or returns to the foreground. HTML, JavaScript, and CSS use a
network-first strategy with the previous copy retained only as an offline
fallback. The service-worker registration also uses `updateViaCache: 'none'`,
and a new worker takes control and reloads the running app once.

You therefore **do not need to manually bump a cache number or clear users'
caches** for normal deployments. Users who open/return to the installed app
will receive the deployed files automatically when they are online. A device
that is completely offline cannot receive a server-side update until it
regains connectivity and opens/foregrounds the app.

  first. If Firestore rejects or can't be reached, the data is kept in this
  browser (per signed-in user), the UI keeps working, and it is synced to the
  account automatically once Firestore is reachable (no duplicates: the
  research doc id is the medicine key; counters sync as increments).
- A small neutral note appears on the dashboard while cloud sync is unavailable.
- Requests time out after 8 s instead of leaving the button on "Adding…".
- The button keeps its "✓ In Research" state after the 5-minute auto-refresh.

## Deploy checklist (do all three)

1. Upload/push your changed site files. No manual PWA cache-version bump is required; the service worker checks for the new deployment automatically.
2. **Publish the rules** in this folder:
   `firebase deploy --only firestore:rules`
   (or paste `firestore.rules` into Firebase console → Firestore → Rules → Publish).
   The console copy must allow `users/{uid}/{anything}/{doc}` for the owner.
3. **App Check**: Firebase console → App Check → Apps → confirm the web app is
   registered with **reCAPTCHA Enterprise**, and that Firestore → Metrics shows
   *Verified* requests before/while enforcement is on. The reCAPTCHA Enterprise
   key must list `pharmasafe.site` (and `www.pharmasafe.site`) as allowed domains.

If step 2 or 3 is missing the app still works (data stays on the device and shows
the sync note); it just won't be stored in the account until they're done.

## Tests

`tests/run.js` runs the real `app.js` data layer against a fake Firestore
(healthy, permission-denied, hanging, recovering) — `node tests/run.js`.
