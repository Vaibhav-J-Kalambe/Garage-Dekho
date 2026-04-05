# GarageDekho — App Publishing Guide

Guide to publishing GarageDekho as a mobile app on Google Play Store and Apple App Store using Capacitor.

> Since you are self-hosting on a **GoDaddy VPS**, the app and website can run **independently**.
> The app is built with **Capacitor** — the UI is bundled inside the app itself (not loaded from your website).
> Only database calls (Supabase) and payments (Razorpay) need the internet.
> If your website goes down, the app keeps working. ✓

**Complete `WEBSITE_HOSTING_GUIDE.md` and get the website live before starting this guide.**

---

## Table of Contents

1. [Understanding the Approach](#1-understanding-the-approach)
2. [PWA Prerequisites](#2-pwa-prerequisites)
3. [Google Play Store (Android)](#3-google-play-store-android)
4. [Apple App Store (iOS)](#4-apple-app-store-ios)
5. [App Store Checklist](#5-app-store-checklist)
6. [Updates After Publishing](#6-updates-after-publishing)
7. [Common Rejections & Fixes](#7-common-rejections--fixes)

---

## 1. Understanding the Approach

### What is a PWA?

A Progressive Web App is your website packaged and installed like a native app. Users get:
- App icon on home screen
- Fullscreen experience (no browser bar)
- Offline support (with service worker)
- Push notifications
- Works on Android and iOS

### How it gets into app stores

| Store | Method | Tool |
|-------|--------|-------|
| Google Play | TWA (Trusted Web Activity) | Bubblewrap / PWABuilder |
| Apple App Store | WKWebView wrapper | PWABuilder or Capacitor |

### Prerequisites

Your website **must be live on a public HTTPS URL** before you can publish to any app store. Complete `WEBSITE_HOSTING_GUIDE.md` first.

---

## 2. PWA Prerequisites

Before packaging for any store, verify your PWA is properly configured.

### Check your manifest

The `app/manifest.js` file generates `/manifest.json`. Verify it includes:

```js
// app/manifest.js — verify these fields are correct
export default function manifest() {
  return {
    name: "GarageDekho",
    short_name: "GarageDekho",
    description: "Find verified garages, book services, and get 24/7 roadside help",
    start_url: "/",
    display: "standalone",          // hides browser UI — required for app-like feel
    background_color: "#ffffff",
    theme_color: "#0056b7",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
```

### Verify icons exist

```
public/icons/icon-192.png   — must be exactly 192×192px, PNG
public/icons/icon-512.png   — must be exactly 512×512px, PNG
```

> If icons are missing or wrong size, generate them free at [realfavicongenerator.net](https://realfavicongenerator.net)

### Test PWA score

1. Open Chrome → visit your live site
2. DevTools → **Lighthouse** → select **Progressive Web App** → Run audit
3. Score must be **green (100)** before submitting to stores

### Check HTTPS

All pages must be served over HTTPS. Vercel does this automatically with a custom domain.

---

## 3. Google Play Store (Android)

### Method: PWABuilder (Easiest — free, no coding)

**Step 1: Go to PWABuilder**

1. Visit [pwabuilder.com](https://www.pwabuilder.com)
2. Enter your live website URL: `https://www.garagedekho.com`
3. Click **Start** — it will analyze your PWA score
4. Fix any issues it flags, then click **Next**

**Step 2: Generate Android package**

1. Click **Android** → **Generate Package**
2. Fill in the form:
   - **Package ID:** `com.garagedekho.app`
   - **App name:** `GarageDekho`
   - **App version:** `1` (increment for each update)
   - **Version name:** `1.0.0`
   - **Display mode:** `Standalone`
   - **Status bar color:** `#0056b7`
   - **Nav bar color:** `#ffffff`
   - **Signing key:** Generate a new one (save the keystore file — you'll need it for every future update)
3. Click **Generate** — downloads a `.zip` file

**Step 3: What's in the zip**

- `app-release-signed.aab` — upload this to Play Store
- `signing.keystore` — **keep this file safe** — losing it means you cannot update the app
- `assetlinks.json` — host this file on your website (see next step)

**Step 4: Host assetlinks.json**

This file proves to Android that your app owns your website.

1. Copy `assetlinks.json` from the zip
2. Host it at: `https://www.garagedekho.com/.well-known/assetlinks.json`
3. Create the file in your project:

```
public/.well-known/assetlinks.json
```

Paste the content from the generated file. It looks like:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.garagedekho.app",
    "sha256_cert_fingerprints": ["AA:BB:CC:..."]
  }
}]
```

4. Deploy to Vercel — verify it's accessible at the `.well-known` path.

**Step 5: Create Google Play Developer Account**

1. Go to [play.google.com/console](https://play.google.com/console)
2. Pay the one-time $25 registration fee
3. Complete account details and agree to policies

**Step 6: Create the app listing**

1. Play Console → **Create app**
2. App name: `GarageDekho`
3. Default language: `English (India)` or `Hindi`
4. App or Game: **App**
5. Free or Paid: **Free**

**Step 7: Fill in the store listing**

Required before submission:

| Field | Value |
|-------|-------|
| Short description | Find garages, book auto services & get 24/7 roadside SOS |
| Full description | (Write 200–500 words about the app features) |
| App icon | 512×512px PNG (no rounded corners — Play Store adds them) |
| Feature graphic | 1024×500px JPG or PNG (banner shown in store) |
| Screenshots | At least 2 phone screenshots (min 320px, max 3840px) |
| Category | Auto & Vehicles |
| Email | your-support@email.com |

**Step 8: Upload the AAB**

1. Play Console → **Release** → **Production** → **Create new release**
2. Upload `app-release-signed.aab`
3. Write release notes (what's new)
4. Click **Review release** → **Start rollout to Production**

**Step 9: Complete compliance forms**

Play Console will ask you to fill out:
- **Privacy policy URL** — add a privacy policy page to your site or use termsfeed.com to generate one free
- **Data safety form** — declare what data your app collects (email, location, payment info)
- **App content rating** — fill the questionnaire (GarageDekho is rated Everyone)

**Timeline:** Review takes 1–7 days for new apps.

---

## 4. Apple App Store (iOS)

### Method: PWABuilder (iOS package)

**Step 1: Apple Developer Account**

1. Go to [developer.apple.com](https://developer.apple.com)
2. Enroll in the **Apple Developer Program** — costs **$99/year**
3. Complete identity verification (takes 1–2 days)

**Step 2: Generate iOS package with PWABuilder**

1. Visit [pwabuilder.com](https://www.pwabuilder.com) → enter your URL
2. Click **iOS** → **Generate Package**
3. Fill in:
   - **Bundle ID:** `com.garagedekho.app`
   - **App name:** `GarageDekho`
   - **URL:** `https://www.garagedekho.com`
   - **Image URL:** Your 512×512 icon URL
4. Download the `.zip` — it contains an Xcode project

**Step 3: Build with Xcode (requires a Mac)**

1. Install **Xcode** from the Mac App Store (free)
2. Open the `.xcodeproj` file from the zip
3. Sign in with your Apple Developer account in Xcode → Preferences → Accounts
4. Set the Team to your developer account
5. Set Bundle Identifier to `com.garagedekho.app`
6. Connect an iPhone or use Simulator to test
7. **Product → Archive** to create a release build
8. **Distribute App → App Store Connect → Upload**

> If you don't have a Mac, use a cloud Mac service: [MacStadium](https://www.macstadium.com) or [MacInCloud](https://www.macincloud.com) — pay per hour.

**Step 4: App Store Connect**

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **+** → **New App**
3. Fill in:
   - Platform: **iOS**
   - Name: **GarageDekho**
   - Bundle ID: `com.garagedekho.app`
   - SKU: `garagedekho-ios-1`
   - Language: English

**Step 5: Store listing**

| Field | Requirement |
|-------|------------|
| App icon | 1024×1024px PNG, no transparency, no rounded corners |
| Screenshots | iPhone 6.5" and 5.5" sizes required |
| Description | Up to 4000 characters |
| Keywords | Comma-separated (garage, car repair, mechanic, SOS, auto service) |
| Support URL | Your website or a support page |
| Privacy policy URL | Required — must exist before submission |
| Category | **Navigation** or **Lifestyle** |
| Age rating | 4+ |
| Price | Free |

**Step 6: Submit for Review**

App Store Connect → your app → **Submit for Review**

**Timeline:** Apple reviews take 1–3 days. First submission often comes back with feedback — common requests are privacy policy, screenshots, and app description clarity.

---

## 5. App Store Checklist

Complete before submitting to either store:

### Content
- [ ] Privacy policy page exists and is linked
- [ ] App description is written (no placeholder text)
- [ ] Screenshots are real screenshots of the app (not mockups or illustrations)
- [ ] App icon is the correct size and has no transparency

### PWA
- [ ] `manifest.json` is accessible at `https://garagedekho.com/manifest.json`
- [ ] `assetlinks.json` is accessible at `https://garagedekho.com/.well-known/assetlinks.json` (Android only)
- [ ] Lighthouse PWA score is green
- [ ] App works on mobile browsers (test on real Android + iPhone before submitting)

### Functionality
- [ ] All main flows work without errors on mobile:
  - Customer can find and book a garage
  - Garage owner can register and log in
  - SOS request can be sent
  - Razorpay payment completes
- [ ] No broken pages or 404s
- [ ] No debug/test UI visible to users (no "test-db" buttons, no raw error messages)

### Compliance
- [ ] Data safety form completed (Play Store)
- [ ] Age rating questionnaire completed
- [ ] No misleading claims in the app description

---

## 6. Updates After Publishing

### Website update (most common)

Since the app is a TWA/PWA wrapper around your website, any change you deploy to Vercel is **automatically live** in the app — no new store submission needed.

This covers:
- UI changes
- New features
- Bug fixes
- Database changes

### When you MUST submit a new store version

Only needed if you change:
- App icon
- App name
- Bundle ID / Package ID
- Minimum OS version
- Native permissions (camera, notifications)

### Incrementing version for store updates

In PWABuilder, increment the version number:
- `App version` (integer): `1` → `2` → `3`
- `Version name` (string): `1.0.0` → `1.1.0` → `2.0.0`

---

## 7. Common Rejections & Fixes

### Google Play

| Rejection reason | Fix |
|-----------------|-----|
| "App does not meet core app quality" | Ensure app works fully offline or shows a clear offline message |
| "Policy violation: deceptive behavior" | Remove any placeholder "500+ garages live" if not yet true |
| "assetlinks.json not found" | Host the file at `/.well-known/assetlinks.json` and redeploy |
| "Target API level requirement" | PWABuilder generates correct `targetSdkVersion` — ensure you're using latest PWABuilder |

### Apple App Store

| Rejection reason | Fix |
|-----------------|-----|
| "Guideline 4.0 - Design" | App must function as more than a website wrapper — ensure core features work well on mobile |
| "Guideline 5.1.1 - Privacy policy" | Add a privacy policy URL to both the app listing and inside the app |
| "We found that your app collects user and device information" | Complete the privacy nutrition label in App Store Connect |
| Screenshots don't match the app | Take real screenshots on an iPhone simulator in Xcode |
| "Your app appears to be a web wrapper" | Add value-adds like push notifications or offline support |

---

## Key Differences: Web vs App

| | Website (Vercel) | App (Play / App Store) |
|--|-----------------|----------------------|
| Updates | Instant (push to git) | Instant for web changes; Store review only for native changes |
| Cost | Free (Vercel hobby) or $20/mo pro | $25 one-time (Google) + $99/yr (Apple) |
| Time to publish | Minutes | 1–7 days (review) |
| Reach | Anyone with a browser | Users who search Play/App Store |
| Offline support | Limited | Better (with service worker) |

---

## Tools & Resources

| Tool | Purpose | Link |
|------|---------|-------|
| PWABuilder | Generate Android & iOS packages | pwabuilder.com |
| Real Favicon Generator | Create all icon sizes | realfavicongenerator.net |
| Terms Feed | Generate privacy policy free | termsfeed.com |
| Lighthouse | Audit PWA score | Chrome DevTools → Lighthouse |
| Play Console | Manage Android app | play.google.com/console |
| App Store Connect | Manage iOS app | appstoreconnect.apple.com |
| MacInCloud | Mac in browser (for Xcode) | macincloud.com |
