# CI/CD & App Updates — The Boob App

This doc explains how mobile app updates work in general, and the specific automated pipeline this project uses to push updates from GitHub to users' phones.

---

## 1. The two kinds of "updates" mobile apps can ship

This is the single most important concept to understand. Mobile updates split into two very different paths:

### 1a. **Native / store updates** (the slow path)

Anything that changes **native code, native dependencies, app permissions, the icon, the splash screen, the bundle ID, or the app version number** requires a full rebuild and a submission to Apple App Store Review and/or Google Play. Then users have to download the new version from the store.

- **Timeline**: Apple review is typically 24–48 hours; Google's is usually under 24 hours. First submission tends to be slower (3–7 days) and may bounce.
- **Frequency**: Most apps do this every 1–4 weeks.
- **What triggers it**: You bumped a native dependency (e.g., upgraded `react-native-purchases`), changed something in `app.json` that affects native config, or upgraded the Expo SDK.

### 1b. **Over-the-air (OTA) JavaScript updates** (the fast path)

Anything that's **purely JavaScript / TypeScript / images / styles** can be shipped instantly without going through the stores, using **Expo Updates** (formerly EAS Update). Users get the new bundle the next time they open the app — no download from the store, no review.

- **Timeline**: Seconds to minutes after you push.
- **Frequency**: Whenever you want. Bug fix? Push it. Wording tweak? Push it.
- **What you can NOT do this way**: Anything Apple/Google considers a material change to the app's purpose or that requires native code. Apple's guideline 4.5.6 is the relevant one — fine for bug fixes, layout changes, copy edits, new screens; not fine for replacing the entire app with a different product.

**This combo is the norm for React Native apps.** You'll do a full store submission maybe monthly, and OTA pushes for everything in between.

---

## 2. The toolchain we'll use

| Service | Role | Cost |
|---|---|---|
| **GitHub** | Source of truth, releases, Actions runner | Free |
| **EAS Build** (Expo) | Builds `.ipa` and `.aab` in the cloud | Free tier: ~30 builds/mo; paid plans from $19/mo |
| **EAS Submit** (Expo) | Uploads builds to App Store Connect & Google Play | Included with Expo account |
| **EAS Update** (Expo) | Hosts and serves OTA JS bundles | Free tier: 1k MAU; paid scales up |
| **App Store Connect** | Apple's release dashboard | Included with $99/yr Apple Developer |
| **Google Play Console** | Google's release dashboard | $25 one-time |

You'd alternatively self-host all of this with Fastlane + custom GitHub Actions, but EAS is dramatically simpler for an indie app and is the recommended path.

---

## 3. Branch & release strategy

```
main  ─────●────●─────●────●────●─────●─────►
           │         │         │
       (auto OTA  (auto OTA  (tag v1.2.0
        to prod    to prod    triggers full
        channel)   channel)   store build)
```

- **`main`** is always shippable.
- **Pushes to `main`** trigger an automatic OTA update to all subscribed users (via EAS Update on the `production` channel).
- **Creating a Git tag** like `v1.2.0` (or publishing a GitHub Release) triggers a full native build + automatic submission to TestFlight (iOS) and Google Play internal testing track.
- **Promotion to public release** is a manual one-click action in App Store Connect / Play Console — you don't want CI auto-pushing to all real users.

A safer variant for early days: push OTA updates to a `staging` channel automatically, and only manually run a workflow to promote to `production` after you've tested on a physical device. The workflows below include both.

---

## 4. One-time setup

### 4a. Versioning in `app.json`

```jsonc
{
  "expo": {
    "version": "1.0.0",          // The user-facing version (semver). Bump for releases.
    "ios":     { "buildNumber": "1" },
    "android": { "versionCode": 1 }
  }
}
```

EAS can auto-increment `buildNumber` and `versionCode` on every build (`autoIncrement: true` in `eas.json`), so you only manually edit `version` when cutting a release.

### 4b. Configure EAS

```bash
npm install -g eas-cli
eas login
eas init                      # creates the project on Expo's servers, adds projectId to app.json
eas build:configure           # creates eas.json (see §5)
eas update:configure          # adds the runtime/update plugin to app.json
```

### 4c. Create credentials EAS needs to submit to the stores

Run once — EAS prompts you and stores everything in their secure backend:

```bash
eas credentials                # interactive: configure iOS signing + Android keystore
```

For **App Store Connect** submissions, you'll generate an [App Store Connect API key](https://appstoreconnect.apple.com/access/integrations/api) (a `.p8` file) — give it the "App Manager" role.

For **Google Play** submissions, create a [service account JSON](https://docs.expo.dev/submit/android/) with Play Console access.

### 4d. Add secrets to GitHub repo

In GitHub → Settings → Secrets and variables → Actions, add:

| Secret | Source |
|---|---|
| `EXPO_TOKEN` | Generated at https://expo.dev/accounts/[you]/settings/access-tokens |

EAS itself stores the Apple/Google credentials, so you don't need to put `.p8` or service account JSON in GitHub.

---

## 5. `eas.json` — build profiles

Save this at the repo root (created by `eas build:configure`, then customize):

```jsonc
{
  "cli": { "version": ">= 7.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "staging",
      "ios":     { "autoIncrement": "buildNumber" },
      "android": { "autoIncrement": "versionCode" }
    },
    "production": {
      "channel": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "you@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      },
      "android": {
        "serviceAccountKeyPath": "./play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

The `channel` field is what links a build to an OTA update stream. A build on the `production` channel will only receive OTA updates published to the `production` channel.

---

## 6. GitHub Actions workflows

Create these two files:

### 6a. `.github/workflows/ota-update.yml` — fast path

Runs on every push to `main`. Publishes an OTA JS bundle to the `production` channel.

```yaml
name: OTA Update

on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npx tsc --noEmit
      - run: eas update --branch production --message "${{ github.event.head_commit.message }}"
```

### 6b. `.github/workflows/release.yml` — slow path

Runs when you create a Git tag like `v1.2.0`. Builds iOS + Android natively and submits to TestFlight + Play internal track.

```yaml
name: Native Release

on:
  push:
    tags: ['v*.*.*']

jobs:
  build-and-submit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      # Builds happen in EAS cloud — non-blocking submit follows them.
      - name: Build & submit iOS
        run: eas build --platform ios --profile production --non-interactive --auto-submit
      - name: Build & submit Android
        run: eas build --platform android --profile production --non-interactive --auto-submit
```

`--auto-submit` chains `eas submit` automatically once the build finishes. The build itself runs on Expo's servers (you can watch progress at https://expo.dev), not on the GitHub runner.

---

## 7. The release flow you'll actually use

### Day-to-day bug fixes / copy changes / UI tweaks

```bash
git checkout -b fix/paywall-typo
# edit code
git commit -am "Fix typo on paywall"
git push
# Open PR, merge to main
```

→ GitHub Actions runs `ota-update.yml` → users get the fix on their next app open. No store review.

### Cutting a real release (every few weeks)

```bash
# 1. Bump version in app.json (e.g., 1.0.0 -> 1.1.0)
# 2. Update CHANGELOG.md if you keep one
git commit -am "Release 1.1.0"
git push

# 3. Tag and push
git tag v1.1.0
git push origin v1.1.0
```

→ GitHub Actions runs `release.yml` → EAS builds both platforms → auto-submits to TestFlight and Play internal track.

You then:
1. Wait for the build emails (~10–25 min).
2. Test on your device via TestFlight / Play internal track.
3. In App Store Connect: promote build to "Ready for Submission" → submit for review.
4. In Play Console: promote from internal → production track.
5. Once approved by Apple/Google, the new native version is live.

### Hotfixing a bug in the live app

If the bug is in JS only: push to `main` → OTA fix is live in minutes.

If the bug is native: cut a `v1.1.1` tag → expedited review (Apple lets you flag a build as a critical bug fix for faster review).

---

## 8. Update strategy / rollback

EAS Update lets you:

- **Roll back** an OTA update by republishing the previous commit, or by running `eas update:rollback`.
- **Preview** updates on internal devices via the `staging` channel before promoting.
- **Automatic rollback** if a JS bundle crashes on startup — Expo Updates falls back to the previous good bundle automatically (the "embedded" bundle from the last native build is always a safe fallback).

For the native side, App Store Connect supports **phased release** (Apple rolls the update out to 1% → 2% → 5% → ... → 100% over 7 days). Enable it in App Store Connect; it's the safest default. Google Play has equivalent **staged rollouts**.

---

## 9. What this gets you

- **Push to `main`** → users get the JS update within minutes, no review.
- **Push a `v*` tag** → both stores get a new native build automatically and you just click "submit" in their dashboards.
- **No manual Xcode or Android Studio interaction** for routine releases.
- **Rollback in one command** if something breaks.

---

## 10. Things to revisit before launch

- [ ] Replace `1234567890` `ascAppId`, `appleTeamId`, and `appleId` placeholders in `eas.json` with real values from App Store Connect.
- [ ] Generate the Google Play service account JSON and store it via `eas credentials` (not in the repo).
- [ ] Add `EXPO_TOKEN` to GitHub secrets.
- [ ] Decide whether OTA pushes go straight to `production` or to `staging` first (recommend `staging` initially, switch later once you trust the pipeline).
- [ ] Consider adding a manual `workflow_dispatch` job to promote `staging` → `production` with one click.
- [ ] Set up Sentry (or equivalent) so you actually find out when an OTA update breaks something.
