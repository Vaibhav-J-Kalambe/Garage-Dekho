# GarageDekho - App Publishing Plan
# Play Store + App Store + Windows

Publishing both the Customer App and the Garage Management Portal as native apps across Android, iOS, and Windows using Capacitor (wrapping the existing Next.js web app).

---

## Overview

| App | Package Name | Platforms |
|-----|-------------|-----------|
| GarageDekho (Customer) | com.garagedekho.app | Android, iOS, Windows |
| GarageDekho Portal (Garage) | com.garagedekho.portal | Android, iOS, Windows |

**Approach:** Capacitor - wraps your existing Next.js/React web app in a native shell. You keep all your current code. No rewrite needed.

---

## Why Capacitor (Not React Native)

| Factor | Capacitor | React Native |
|--------|-----------|-------------|
| Reuse existing code | Yes - wrap as-is | No - rewrite in RN |
| Dev time | 1–2 weeks | 3–6 months |
| Cost | Low | High |
| Performance | Good (WebView) | Better (native) |
| Plugins (GPS, Push) | Yes | Yes |
| Play Store / App Store | Yes | Yes |
| Windows (MSIX) | Yes via Electron | Partial |

For your stage, Capacitor is the right call. You can always migrate to React Native later when you have funding.

---

## Phase 1: Prepare Your Web App (Before Packaging)

These changes are needed in your Next.js project before building the apps.

### 1.1 Add PWA Manifest

Create `public/manifest.json`:

```json
{
  "name": "GarageDekho",
  "short_name": "GarageDekho",
  "description": "Find trusted garages and get roadside help",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#D32F2F",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-1024.png", "sizes": "1024x1024", "type": "image/png" }
  ]
}
```

Add to `app/layout.js` head:
```js
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#D32F2F" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

### 1.2 Create App Icons

You need icons at these sizes. Use a tool like Figma, Canva, or https://icon.kitchen:

| Size | Used For |
|------|---------|
| 1024x1024 | Source (generate all from this) |
| 512x512 | PWA manifest |
| 192x192 | PWA manifest |
| 180x180 | Apple Touch Icon |
| 48x48 – 512x512 | Android adaptive icon |

Place all in `public/icons/`.

### 1.3 Export as Static Build

Capacitor needs a static export of your Next.js app.

In `next.config.js`:
```js
const nextConfig = {
  output: "export",       // Add this
  trailingSlash: true,    // Add this
  images: { unoptimized: true }, // Add this (required for static export)
};
```

Then build:
```bash
npm run build
# This outputs to /out folder
```

> Note: Static export disables API routes. Your API calls to Supabase from the client still work. But Next.js `/api/*` routes won't run - move any remaining server logic to Supabase Edge Functions or keep them on Vercel separately.

---

## Phase 2: Capacitor Setup

Do this twice - once for the customer app, once for the portal app.

### 2.1 Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npx cap init
```

When prompted:
- App name: `GarageDekho` (or `GarageDekho Portal`)
- App ID: `com.garagedekho.app` (or `com.garagedekho.portal`)
- Web dir: `out`

### 2.2 Add Platforms

```bash
npx cap add android
npx cap add ios       # Mac only
```

### 2.3 Sync Web Build to Native

Every time you make changes to the web app:
```bash
npm run build
npx cap sync
```

### 2.4 Install Required Plugins

```bash
# Push notifications
npm install @capacitor/push-notifications

# Geolocation (GPS) - replaces navigator.geolocation in some cases
npm install @capacitor/geolocation

# Status bar styling
npm install @capacitor/status-bar

# Splash screen
npm install @capacitor/splash-screen

# App (handle back button, etc.)
npm install @capacitor/app
```

---

## Phase 3: Android (Google Play Store)

### 3.1 Build the APK / AAB

Requirements:
- Android Studio installed (free)
- Java JDK 17+

```bash
npx cap open android
```

This opens Android Studio. From there:
- Build → Generate Signed Bundle/APK
- Choose **Android App Bundle (.aab)** - required for Play Store
- Create a keystore file (keep this safe - you need it for every update)

### 3.2 Google Play Console Setup

1. Go to play.google.com/console
2. Pay the **one-time $25 registration fee**
3. Create two apps:
   - "GarageDekho" (customer)
   - "GarageDekho Portal" (garage)
4. For each app, fill in:
   - Store listing (name, description, screenshots)
   - Content rating questionnaire
   - Privacy policy URL (required - host a simple page on your site)
   - Target audience
5. Upload the `.aab` file
6. Submit for review

**Review time:** 3–7 days for new apps.

### 3.3 Screenshots Required (Android)

| Type | Size | Count |
|------|------|-------|
| Phone screenshots | 1080x1920 or similar | Min 2, Max 8 |
| 7-inch tablet | Optional | - |
| 10-inch tablet | Optional | - |
| Feature graphic | 1024x500 | 1 (required) |

Use your browser (Chrome DevTools device mode) to take screenshots at the right size.

---

## Phase 4: iOS (Apple App Store)

> Requires a Mac with Xcode installed. If you don't have a Mac, you'll need to either buy one, rent a Mac in the cloud (MacStadium ~$50/month), or hire someone with a Mac for this step only.

### 4.1 Apple Developer Account

1. Go to developer.apple.com
2. Enroll in the Apple Developer Program
3. Pay **$99/year** (~₹8,300/year)

### 4.2 Build the IPA

```bash
npx cap open ios
```

This opens Xcode. From there:
- Set your Team (Apple Developer account)
- Product → Archive
- Distribute App → App Store Connect

### 4.3 App Store Connect Setup

1. Go to appstoreconnect.apple.com
2. Create two apps (customer + portal)
3. Fill in:
   - App name, subtitle, description
   - Keywords (for search)
   - Screenshots (see below)
   - Privacy policy URL (required)
   - App category
4. Submit for review

**Review time:** 1–3 days (Apple is faster than Google now).

### 4.4 Screenshots Required (iOS)

| Device | Size | Count |
|--------|------|-------|
| iPhone 6.9" (required) | 1320x2868 | Min 1 |
| iPhone 6.5" (required) | 1242x2688 | Min 1 |
| iPad Pro 12.9" (if supporting iPad) | 2048x2732 | Min 1 |

Use a simulator in Xcode or an iPhone to take these.

---

## Phase 5: Windows

Two approaches - choose based on your needs.

### Option A: PWA on Microsoft Store (Easiest)

Microsoft Store accepts PWAs directly. No code changes needed beyond the manifest you already made.

1. Go to partner.microsoft.com/dashboard
2. Pay **$19 one-time** for a developer account (~₹1,600)
3. Submit your PWA URL (e.g. `garagedekho.com` and `garagedekho.com/portal`)
4. Microsoft wraps it automatically
5. Review and publish

**This is the recommended Windows approach.**

### Option B: Electron App (Full Desktop App)

If you want a proper installable `.exe` / MSIX package:

```bash
npm install --save-dev electron electron-builder
```

Create `electron/main.js`:
```js
const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { nodeIntegration: false },
  });
  win.loadURL("https://garagedekho.com"); // or local build
}

app.whenReady().then(createWindow);
```

Build MSIX for Windows Store:
```bash
npx electron-builder --win
```

> Electron adds ~120MB to the app size. For a garage portal used on a desktop, this is acceptable. For the customer app, PWA is better.

---

## Phase 6: Push Notifications

Push notifications are needed so garages get alerted to new SOS requests even when the portal is closed.

### Setup: Firebase Cloud Messaging (FCM)

1. Go to console.firebase.google.com
2. Create a project "GarageDekho"
3. Add your Android app (package name: `com.garagedekho.portal`)
4. Add your iOS app (bundle ID: `com.garagedekho.portal`)
5. Download `google-services.json` → place in `android/app/`
6. Download `GoogleService-Info.plist` → place in `ios/App/App/`

### In your app:

```js
import { PushNotifications } from "@capacitor/push-notifications";

// Request permission and get token
await PushNotifications.requestPermissions();
await PushNotifications.register();

PushNotifications.addListener("registration", (token) => {
  // Save token to Supabase against this garage's record
  supabase.from("portal_garages").update({ fcm_token: token.value }).eq("id", garageId);
});

PushNotifications.addListener("pushNotificationReceived", (notification) => {
  // Show in-app notification
});
```

### Trigger from Supabase (when new SOS comes in):

Use a Supabase Database Webhook or Edge Function to call FCM when a new SOS is inserted:

```js
// Supabase Edge Function: notify-garages
const response = await fetch("https://fcm.googleapis.com/fcm/send", {
  method: "POST",
  headers: {
    Authorization: `key=${FCM_SERVER_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    to: garage.fcm_token,
    notification: {
      title: "New SOS Alert!",
      body: `${issueType} - ${distance} km away`,
    },
  }),
});
```

**Cost:** FCM is free. Supabase Edge Functions: free tier (500K calls/month).

---

## Two-App Strategy: Customer vs Portal

You have two separate apps to publish. Handle this by maintaining **two separate builds** of the same codebase.

### Approach: Environment Variable to Switch Apps

In `.env.local`:
```
NEXT_PUBLIC_APP_MODE=customer   # or "portal"
```

In your root layout or nav:
```js
const isPortal = process.env.NEXT_PUBLIC_APP_MODE === "portal";
```

- Customer build: shows customer nav, hides `/portal/*` routes
- Portal build: shows portal nav, opens directly to `/portal/login`

Then:
```bash
# Build customer app
NEXT_PUBLIC_APP_MODE=customer npm run build
npx cap sync
# → open in Android Studio → build customer APK

# Build portal app
NEXT_PUBLIC_APP_MODE=portal npm run build
npx cap sync
# → open in Android Studio → build portal APK
```

---

## Cost Summary

### One-Time Costs

| Item | Cost (INR) | Cost (USD) |
|------|-----------|-----------|
| Google Play Developer account | ₹2,100 | $25 |
| Apple Developer Program (year 1) | ₹8,300 | $99 |
| Microsoft Store developer account | ₹1,600 | $19 |
| App icon design (DIY with Figma/Canva) | ₹0 | $0 |
| Screenshot design (DIY) | ₹0 | $0 |
| **Total one-time** | **~₹12,000** | **~$143** |

### If You Need a Mac for iOS

| Option | Cost |
|--------|------|
| MacStadium cloud Mac (monthly) | ~$50/month |
| Hire someone with Mac (one-time) | ₹3,000–8,000 |
| Buy used Mac Mini | ₹30,000–50,000 |

### Recurring Costs

| Item | Monthly (INR) | Notes |
|------|--------------|-------|
| Apple Developer Program | ₹700 | Billed yearly (₹8,300/year) |
| Vercel (hosting web app) | ₹0–1,700 | Free tier likely enough |
| Supabase | ₹0–2,100 | Free tier: 500MB DB |
| Firebase (push) | ₹0 | Free tier easily enough |
| **Total monthly** | **₹700–4,500** | |

### Development Time Estimate

| Task | Time |
|------|------|
| PWA manifest + icons | 1 day |
| Capacitor setup + Android build | 2–3 days |
| iOS build (if you have a Mac) | 1–2 days |
| Windows PWA submission | Half a day |
| Push notification integration | 1–2 days |
| Store listings + screenshots | 1 day |
| **Total** | **~1–2 weeks** |

---

## Step-by-Step Execution Order

```
Week 1
 ├── Day 1: Create icons (1024x1024 source), generate all sizes
 ├── Day 1: Add manifest.json, update next.config.js for static export
 ├── Day 2: Install Capacitor, add Android platform
 ├── Day 2: Test in Android emulator
 ├── Day 3: Fix any mobile-specific UI issues
 ├── Day 4: Build signed AAB for customer app
 ├── Day 4: Build signed AAB for portal app
 └── Day 5: Submit both to Google Play Console

Week 2
 ├── Day 1: Set up Firebase, integrate push notifications in portal app
 ├── Day 2: Write Supabase Edge Function to send push on new SOS
 ├── Day 3: iOS build (Mac required) - customer app
 ├── Day 4: iOS build - portal app
 ├── Day 5: Submit both to App Store Connect
 └── Day 5: Submit PWAs to Microsoft Store

Week 3
 ├── Respond to any Play Store / App Store review feedback
 ├── Fix any rejection issues
 └── Launch!
```

---

## Privacy Policy (Required by All Stores)

All stores require a privacy policy URL. Create a simple page at `garagedekho.com/privacy` covering:

- What data you collect (location, email, phone)
- How it's used (matching mechanics to customers)
- Who it's shared with (garage/mechanic for SOS only)
- How users can delete their data (email you)

This can be a simple static HTML or Next.js page. Required before any store will approve your app.

---

## Common Rejection Reasons (Avoid These)

| Store | Common Issue | Fix |
|-------|-------------|-----|
| Play Store | No privacy policy | Add `/privacy` page |
| Play Store | Location permission not explained | Add permission rationale dialog |
| App Store | App looks like a website (not native enough) | Ensure no horizontal scrollbars, tap targets are large enough |
| App Store | Crashes on launch | Test thoroughly in simulator |
| All | Placeholder content / test data visible | Use real garage data in screenshots |

---

## After Launch: Updates

Whenever you update the app:

```bash
# Make changes to your web code
npm run build
npx cap sync

# Android
npx cap open android
# → Build → Generate Signed Bundle → upload to Play Console

# iOS
npx cap open ios
# → Archive → Distribute → upload to App Store Connect
```

Play Store updates go live in a few hours. App Store updates take 1–3 days review.

---

## Tools You'll Need

| Tool | Purpose | Cost |
|------|---------|------|
| Android Studio | Build Android APK/AAB | Free |
| Xcode (Mac only) | Build iOS IPA | Free (need Mac) |
| Figma or Canva | Design icons + screenshots | Free |
| icon.kitchen | Generate all icon sizes from one image | Free |
| Firebase Console | Push notifications | Free |
| play.google.com/console | Android publishing | $25 one-time |
| appstoreconnect.apple.com | iOS publishing | $99/year |
| partner.microsoft.com | Windows PWA publishing | $19 one-time |

---

*GarageDekho - One codebase, three platforms.*
