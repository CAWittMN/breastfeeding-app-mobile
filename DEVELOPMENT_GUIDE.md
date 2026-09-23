# Development Guide — The Boob App

This is an [Expo](https://expo.dev) (React Native + TypeScript) project using [Expo Router](https://docs.expo.dev/router/introduction/) for navigation and [RevenueCat](https://www.revenuecat.com/) for subscriptions.

---

## 1. Prerequisites

Install once on your machine:

| Tool | Notes |
|---|---|
| **Node.js 20 LTS** | Use [nvm](https://github.com/nvm-sh/nvm): `nvm install 20 && nvm use 20` |
| **npm** | Bundled with Node. (Yarn/pnpm also fine.) |
| **Git** | You already have it. |
| **Expo Go app** (recommended for early dev) | iOS App Store / Google Play. Lets you run JS-only changes on a real phone with no native build. |
| **Watchman** (macOS only, optional) | `brew install watchman` — improves file watching. |

For full native builds (required once you add RevenueCat purchases — see §5):

- **iOS**: macOS + Xcode 15+ (`xcode-select --install` for command-line tools)
- **Android**: [Android Studio](https://developer.android.com/studio) + an emulator OR a USB-connected device with USB debugging enabled
- **EAS CLI** (Expo's cloud build service): `npm install -g eas-cli`

---

## 2. First-time setup

```bash
cd /home/casey-wittrock/personal/boob-app
npm install
cp .env.example .env
```

Open `.env` and leave `EXPO_PUBLIC_BYPASS_PAYWALL=1` for now — this skips the paywall during development so you can iterate on the main UI without configuring RevenueCat. The RevenueCat keys can stay as `REPLACE_ME` until you're ready to test purchases (§5).

---

## 3. Running locally

### Option A — Expo Go (fastest, no native build)

This works for **everything except real subscription purchases** (RevenueCat needs native modules not present in Expo Go).

```bash
npm start
```

Then:
- Press `i` to launch the iOS simulator (macOS only)
- Press `a` to launch an Android emulator
- Or scan the QR code with the **Expo Go** app on your phone

Hot reload is automatic on save. Shake the device (or press `m` in the terminal) to open the dev menu.

### Option B — Development build (required for purchases)

A "development build" is your own custom build of the app that includes all native modules but still connects to the Metro dev server for fast JS reload. You need this to test RevenueCat purchases.

```bash
# One-time login
eas login

# One-time per platform: build a dev client
eas build --profile development --platform ios       # produces a .ipa
eas build --profile development --platform android   # produces an .apk

# Then run as usual:
npm start
```

Install the resulting build on your device/simulator once. After that, all JS changes hot-reload over the dev server like Expo Go.

> **Note**: First-time iOS dev builds require an Apple Developer account ($99/yr). EAS will walk you through provisioning automatically.

---

## 4. Project structure

```
boob-app/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx         # Root stack + RevenueCat init
│   ├── index.tsx           # Main screen (gated behind subscription)
│   ├── paywall.tsx         # Subscription paywall
│   └── settings.tsx        # Restore / manage / reset / legal links
├── src/
│   ├── components/
│   │   └── ChestIllustration.tsx   # Placeholder cartoon SVG
│   ├── services/
│   │   └── purchases.ts            # RevenueCat wrapper + useSubscription hook
│   └── state/
│       └── feedState.ts            # Persisted left/right/both state
├── assets/                 # Icons, splash, illustrations (add later)
├── app.json                # Expo config (name, bundle IDs, plugins)
├── .env.example            # Template for env vars
└── package.json
```

The path alias `@/*` resolves to `src/*` (configured in `tsconfig.json`).

---

## 5. Configuring subscriptions for testing

You only need this when you want to test real purchase flows. For day-to-day UI work, leave `EXPO_PUBLIC_BYPASS_PAYWALL=1` in `.env`.

### One-time setup

1. **Create a [RevenueCat](https://app.revenuecat.com/) account** (free).
2. **Create a project** in RevenueCat called "The Boob App". Add two app entries: one iOS, one Android.
3. **In App Store Connect** ($99/yr Apple Developer account required):
   - Create the app shell with bundle ID `com.yourcompany.boobapp` (update in `app.json` to your real reverse-domain ID).
   - Create a Subscription Group called "BoobApp Pro".
   - Add two products to the group:
     - `boobapp_monthly_499` — $4.99 / month — 7-day free trial
     - `boobapp_annual_3999` — $39.99 / year — 7-day free trial
4. **In Google Play Console** ($25 one-time):
   - Create the app with package `com.yourcompany.boobapp`.
   - Under Monetize → Subscriptions, create one subscription with two base plans (monthly + annual) with 7-day free trial offers.
5. **In RevenueCat**:
   - Paste the App Store shared secret and Google service account JSON (the dashboard guides you).
   - Create an **Entitlement** named `pro`.
   - Create products that map to the store products above and attach them to the `pro` entitlement.
   - Create an **Offering** called "default" with two packages: `$rc_monthly` and `$rc_annual`.
6. **Copy public API keys** from RevenueCat → Project Settings → API keys, paste into `.env`:
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxx
   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxx
   EXPO_PUBLIC_BYPASS_PAYWALL=0
   ```
7. **Make a development build** (§3 Option B) and install it.

### Sandbox / test purchases

- **iOS**: App Store Connect → Users and Access → Sandbox Testers → create one. On your iPhone, sign out of the App Store and sign back in with the sandbox account when prompted during purchase. Sandbox subscriptions auto-renew on accelerated timelines (1 month = 5 minutes).
- **Android**: Google Play Console → Setup → License testing → add your Google account as a tester. Internal testing track installs let you make test purchases that don't actually charge you.

No real money changes hands in either sandbox.

---

## 6. Common commands

```bash
npm start              # Metro bundler + dev menu
npm run ios            # Open in iOS simulator
npm run android        # Open in Android emulator
npm run typecheck      # tsc --noEmit
```

---

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| "Unable to resolve module @/..." | Run `npm install`, then restart Metro with `npm start --clear`. |
| Reanimated errors on launch | Make sure `react-native-reanimated/plugin` is the **last** plugin in `babel.config.js` (it is). Then `npm start --clear`. |
| Paywall shows even though I'm subscribed | Sign in with the same Apple/Google account you purchased with. Tap "Restore purchases" in Settings. |
| Purchase fails in dev build | Verify the bundle ID in `app.json` matches App Store Connect / Play Console exactly. Verify products are "Ready to Submit" in App Store Connect. |
| Expo Go shows a blank screen on the paywall | Expected — `react-native-purchases` doesn't run in Expo Go. Use `EXPO_PUBLIC_BYPASS_PAYWALL=1` or a dev build. |

---

## 8. What's not done yet

- **Real illustrations**: `ChestIllustration.tsx` is a placeholder. Replace with final SVGs (or Lottie animations) once available.
- **App icon + splash screen**: Drop final PNGs into `assets/` and they'll be picked up by `app.json`.
- **Privacy policy + Terms URLs**: Currently `https://example.com/...` — replace in `app/paywall.tsx` and `app/settings.tsx`.
- **Bundle ID**: Update `com.yourcompany.boobapp` in `app.json` to your real reverse-domain identifier before any store submission.
