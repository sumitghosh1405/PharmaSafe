# PharmaSafe — installable app (PWA)

This turns PharmaSafe into an app you can install on the home screen of
**both** Android and iOS: full-screen, no browser bar, its own icon, and
an offline app shell that opens instantly.

## Hosting

This is live on **GitHub Pages** at `https://pharmasafe.site/`.
Phones only allow "install to home screen" from a page served over
**https://**, not a file opened directly on the device — GitHub Pages
already satisfies that.

To redeploy after making changes: commit and push the updated files to
the repo's default branch (or the `gh-pages` branch, whichever this repo
is configured to serve from) — GitHub Pages rebuilds automatically within
a minute or two of a push. No build step or CLI tool is required.

Once it's live, open that URL on your phone.

## Installing

**Android (Chrome):** a banner appears automatically offering to install.
Or: menu (⋮) → **Install app**.

**iOS (Safari — must be Safari, not Chrome):** tap the **Share** icon →
**Add to Home Screen**. The app also shows this instruction itself on iOS.

After installing, it launches like a normal app: its own icon, full
screen, no address bar.

## What still needs the internet

The app shell (layout, styling, navigation) caches offline and opens
instantly every time. But every actual FDA data query — drug analysis,
signal detection, trends, etc. — is a live call to `api.fda.gov` and
needs an active connection, same as before.

## Files

- `index.html` — the app
- `manifest.json` — tells the OS the app's name, icon, and colors
- `sw.js` — service worker; caches the shell, never caches live FDA data
- `icons/` — home-screen icons at the sizes each OS expects

## If you want a real native app (Play Store / App Store)

A PWA installs and runs like an app but isn't a compiled `.apk`/`.ipa`
and isn't listed on the app stores. To get there, the usual next step is
wrapping this same code with **Capacitor** (capacitorjs.com):

1. `npm install @capacitor/core @capacitor/cli`
2. `npx cap init`, then `npx cap add android` / `npx cap add ios`
3. Build the Android app in **Android Studio** (Windows/Mac/Linux, free)
4. Build the iOS app in **Xcode** — this step requires a **Mac** and a
   free or paid Apple Developer account; Xcode cannot run on Windows/Linux

That packaging and signing step has to happen on your own machine — it's
outside what can be done in this chat.

## Feedback and one-time ratings

- A visitor is automatically given a Firebase Anonymous Authentication identity when Firebase is configured.
- A signed-in account also has its own Firebase UID.
- The `ratings/{uid}` Firestore document allows one rating per UID. Ratings cannot be updated or deleted.
- Written feedback is **not stored in Firestore** and is unlimited. Every feedback submission attempts to open the installed Gmail app addressed to `pharmasafe.info@gmail.com`; there is intentionally no Gmail website fallback.
- The Gmail subject is `PharmaSafe feedback`, and the email body contains **only the text typed by the user**. It does not include the star rating, page URL, email address, or other metadata.
- Gmail requires the user to tap **Send**; a normal website cannot silently send mail through the user's Gmail account.

### Firebase setup required

In Firebase Console:

1. Authentication → Sign-in method → enable **Anonymous**.
2. Keep **Email/Password** enabled if you want users to create accounts and log in.
3. Firestore Database → Rules → replace the existing rules with the contents of `firestore.rules`, then **Publish**.

The rating collection uses the authenticated Firebase UID as the document ID, so the client cannot choose another user's rating document.


### Gmail app-only behavior
The website uses the Gmail iOS app URL scheme only. It does not open `mail.google.com` or `workspace.google.com` as a fallback. If Gmail is not installed or iOS cannot handle the app scheme, the website cannot open Gmail; the user should install/open the Gmail app.
