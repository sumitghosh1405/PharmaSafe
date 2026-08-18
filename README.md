# PharmaSafe — installable app (PWA)

This turns PharmaSafe into an app you can install on the home screen of
**both** Android and iOS: full-screen, no browser bar, its own icon, and
an offline app shell that opens instantly.

## Important: this needs to be hosted online first

Phones only allow "install to home screen" from a page served over
**https://** (or via a real hosting provider's preview) — not from a file
opened directly on the device. That's a security rule set by Apple and
Google, not something in this code.

The fastest free ways to get an https URL for this folder:

- **Netlify Drop** — go to app.netlify.com/drop and drag this whole folder in.
  You get a live https URL in ~10 seconds, no account required for a quick test.
- **GitHub Pages** — push this folder to a GitHub repo, enable Pages in
  Settings → Pages, and it's live at `https://<you>.github.io/<repo>/`.
- **Vercel / Firebase Hosting** — similar drag-and-deploy or CLI flow.

Once it's hosted, open that URL on your phone.

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
