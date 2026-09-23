# The Boob App

A tiny, single-purpose mobile app that answers one question every breastfeeding parent
asks at 3 a.m.: **"Which side did I use last?"**

Tap the side you just fed from and the app remembers which breast is full next. That's
the whole product — deliberately simple, offline-first, and fast to open.

Built with [Expo](https://expo.dev) (React Native + TypeScript), [Expo Router](https://docs.expo.dev/router/introduction/)
for navigation, and [RevenueCat](https://www.revenuecat.com/) for subscriptions.

---

## Features

- **One-tap feed tracking** — tap the left or right side to record which breast you
  just used; the other is highlighted as "full next."
- **Persistent state** — the current side and last-fed time are saved locally with
  AsyncStorage, so it survives app restarts (no account, no network required).
- **Relative "last fed" timestamp** — e.g. `just now`, `45 min ago`, `3h 20m ago`.
- **Reset** — mark both sides full again from the home screen or Settings.
- **Subscription paywall** — the main screen is gated behind a `pro` entitlement,
  powered by RevenueCat (monthly / annual plans with a free trial).
- **Restore & manage** — restore purchases and jump to the store subscription page
  from Settings.
- **Dev paywall bypass** — a single env flag skips the paywall so you can iterate on
  the UI without configuring RevenueCat.

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | Expo SDK 51, React Native 0.74, React 18 |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| State / storage | React hooks + `@react-native-async-storage/async-storage` |
| Subscriptions | `react-native-purchases` (RevenueCat) |
| Graphics | `react-native-svg` |
| Animation | `react-native-reanimated`, `react-native-gesture-handler` |

---

## Project structure

```
boob-app/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx         # Root stack + RevenueCat init
│   ├── index.tsx           # Main tracker screen (gated behind subscription)
│   ├── paywall.tsx         # Subscription paywall (modal)
│   └── settings.tsx        # Restore / manage / reset / legal links
├── src/
│   ├── components/
│   │   └── ChestIllustration.tsx   # Tappable SVG illustration (placeholder)
│   ├── services/
│   │   └── purchases.ts            # RevenueCat wrapper + useSubscription hook
│   └── state/
│       └── feedState.ts            # Persisted left/right/both feed state
├── app.json                # Expo config (name, bundle IDs, plugins)
├── .env.example            # Template for env vars
└── package.json
```

The path alias `@/*` resolves to `src/*` (configured in `tsconfig.json`).

---

## Getting started

### Prerequisites

- **Node.js 20 LTS** (`nvm install 20 && nvm use 20`)
- **npm** (bundled with Node)
- **Expo Go** app on your phone (for JS-only development), or an iOS simulator /
  Android emulator

### Setup

```bash
git clone https://github.com/CAWittMN/breastfeeding-app-mobile.git
cd breastfeeding-app-mobile
npm install
cp .env.example .env
```

Leave `EXPO_PUBLIC_BYPASS_PAYWALL=1` in `.env` for now — this skips the paywall during
development so you can work on the main UI without configuring RevenueCat. The
`EXPO_PUBLIC_REVENUECAT_*` keys can stay as `REPLACE_ME` until you're ready to test
purchases.

### Run

```bash
npm start
```

Then press `i` (iOS simulator), `a` (Android emulator), or scan the QR code with the
Expo Go app. Changes hot-reload on save.

> **Note:** Real subscription purchases require a native development build — `react-native-purchases`
> does not run in Expo Go. See the [Development Guide](DEVELOPMENT_GUIDE.md) for how
> to create one with EAS.

---

## Environment variables

Configured in `.env` (see `.env.example`):

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat public SDK key for iOS |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | RevenueCat public SDK key for Android |
| `EXPO_PUBLIC_BYPASS_PAYWALL` | Set to `1` to skip the paywall during development |

These are public client keys and safe to ship in the app bundle. The `.env` file
itself is gitignored.

---

## Scripts

```bash
npm start              # Metro bundler + dev menu
npm run ios            # Open in iOS simulator
npm run android        # Open in Android emulator
npm run web            # Run in the browser
npm run typecheck      # tsc --noEmit
```

---

## Documentation

- **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** — full local setup, development
  builds, and configuring RevenueCat subscriptions for testing.
- **[CI_CD_UPDATES.md](CI_CD_UPDATES.md)** — how OTA and native store updates work,
  plus the EAS + GitHub Actions release pipeline.

---

## Roadmap / not done yet

- Replace the placeholder `ChestIllustration` with final artwork.
- Add the app icon and splash screen assets.
- Replace the `https://example.com/...` privacy, terms, and support links.
- Update the `com.yourcompany.boobapp` bundle ID to a real reverse-domain identifier
  before store submission.

---

## License

See [LICENSE](LICENSE).
