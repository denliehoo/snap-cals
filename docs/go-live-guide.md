# Snap Cals — Go-Live Guide

A step-by-step guide to take Snap Cals from local development to production. Covers server deployment, database, third-party services, OAuth, RevenueCat, app store submissions, and the final production build.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Database (Neon)](#2-database-neon)
3. [Email Service (Resend)](#3-email-service-resend)
4. [AI Service (Gemini)](#4-ai-service-gemini)
5. [Google OAuth](#5-google-oauth)
6. [Server Deployment (Render)](#6-server-deployment-render)
7. [Update Mobile API URL](#7-update-mobile-api-url)
8. [RevenueCat & Store Products](#8-revenuecat--store-products)
9. [EAS Build & App Store Submission](#9-eas-build--app-store-submission)
10. [Post-Launch](#10-post-launch)
11. [Environment Variables Reference](#11-environment-variables-reference)
12. [Go-Live Checklist](#12-go-live-checklist)

---

## 1. Prerequisites

**Accounts you need (create these first):**

| Account                      | Cost         | URL                              |
| ---------------------------- | ------------ | -------------------------------- |
| Neon (Postgres)              | Free         | https://neon.tech                |
| Render (server hosting)      | Free         | https://render.com               |
| Resend (email)               | Free tier    | https://resend.com               |
| Google AI Studio (Gemini)    | Free tier    | https://aistudio.google.com      |
| Google Cloud Console (OAuth) | Free         | https://console.cloud.google.com |
| Expo / EAS                   | Free         | https://expo.dev                 |
| Apple Developer Program      | $99/year     | https://developer.apple.com      |
| Google Play Console          | $25 one-time | https://play.google.com/console  |
| RevenueCat                   | Free         | https://www.revenuecat.com       |

**Tools to install:**

```bash
npm install -g eas-cli
eas login
```

---

## 2. Database (Neon)

### 2.1 Create production database

1. Go to [neon.tech](https://neon.tech) → create a project (e.g., "snap-cals-prod")
2. Copy the **pooled connection string** → this is your `DATABASE_URL`
3. Copy the **direct (non-pooled) connection string** → this is your `DIRECT_URL`
   - Prisma needs `DIRECT_URL` for migrations, `DATABASE_URL` for queries

### 2.2 Run migrations

```bash
cd apps/server
DATABASE_URL="your-prod-connection-string" npx prisma migrate deploy
```

### 2.3 (Optional) Seed test account

```bash
cd apps/server
DATABASE_URL="your-prod-connection-string" npx ts-node -r tsconfig-paths/register prisma/seed.ts
```

This creates `test@example.com` / `password123`. Skip this for a clean production database.

---

## 3. Email Service (Resend)

### 3.1 Get API key

1. Go to [resend.com](https://resend.com) → sign up → API Keys → create a key
2. Copy it → this is your `RESEND_API_KEY`

### 3.2 Configure sender domain

**For testing (immediate, sends only to your Resend account email):**

```
EMAIL_FROM="Snap Cals <onboarding@resend.dev>"
```

**For production (sends to any email):**

1. In Resend dashboard → Domains → Add Domain (e.g., `yourdomain.com`)
2. Add the DNS records Resend gives you (TXT for SPF, CNAME for DKIM)
3. Wait for verification (usually a few minutes)
4. Then use:

```
EMAIL_FROM="Snap Cals <noreply@yourdomain.com>"
```

---

## 4. AI Service (Gemini)

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create an API key
3. Copy it → this is your `GEMINI_API_KEY`

---

## 5. Google OAuth

### 5.1 Create Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Go to **APIs & Services → OAuth consent screen**
   - Choose "External"
   - Fill in app name ("Snap Cals"), user support email, developer email
   - Add scopes: `email`, `profile`, `openid`
   - Save

### 5.2 Create OAuth credentials

Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**

**iOS client:**

- Application type: iOS
- Bundle ID: `com.snapcals.app` (must match `app.json` → `ios.bundleIdentifier`)
- Copy the **Client ID** → this is your `GOOGLE_IOS_CLIENT_ID` (server) and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (mobile)

**Android client:**

- Application type: Android
- Package name: `com.snapcals.app` (must match `app.json` → `android.package`)
- SHA-1 certificate fingerprint: get this from your EAS build (see section 9) or use the Expo Go fingerprint for dev: `B5:E7:CF:2F:C1:C0:6B:6D:2E:7B:88:E2:8D:97:D2:3C:2C:AB:40:4E`
- Copy the **Client ID** → this is your `GOOGLE_ANDROID_CLIENT_ID` (server) and `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (mobile)

**You do NOT need the client secret for either — mobile OAuth uses PKCE.**

### 5.3 Publish OAuth consent screen

While in "Testing" mode, only accounts listed as test users can sign in (up to 100). To allow any Google account:

1. Go to **OAuth consent screen → Publish App**
2. Google may require a review (usually quick for basic scopes like email/profile)

---

## 6. Server Deployment (Render)

### 6.1 Create web service

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Configure:
   - **Name:** `snap-cals-api`
   - **Root Directory:** `apps/server`
   - **Build Command:** `cd ../.. && pnpm install && pnpm --filter @snap-cals/shared build && cd apps/server && npx prisma generate && pnpm build`
   - **Start Command:** `node dist/index.js`
   - **Environment:** Node
   - **Plan:** Free (or Starter for always-on)

### 6.2 Set environment variables

In Render dashboard → Environment, add all server env vars:

| Variable                    | Value                                                               |
| --------------------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`              | Your Neon pooled connection string                                  |
| `DIRECT_URL`                | Your Neon direct connection string                                  |
| `JWT_SECRET`                | A strong random string (e.g., `openssl rand -hex 32`)               |
| `PORT`                      | `3000` (or let Render assign)                                       |
| `GEMINI_API_KEY`            | From step 4                                                         |
| `RESEND_API_KEY`            | From step 3                                                         |
| `EMAIL_FROM`                | `Snap Cals <noreply@yourdomain.com>`                                |
| `GOOGLE_IOS_CLIENT_ID`      | From step 5                                                         |
| `GOOGLE_ANDROID_CLIENT_ID`  | From step 5                                                         |
| `REVENUECAT_WEBHOOK_SECRET` | A strong random string you choose (must match RevenueCat dashboard) |

### 6.3 Deploy and verify

After deploy, test the health endpoint:

```bash
curl https://snap-cals-api.onrender.com/api/health
```

Save this URL — you'll need it for the mobile app and RevenueCat webhook.

---

## 7. Update Mobile API URL

The mobile app currently points to `localhost` for production. Update it to your Render URL.

In `apps/mobile/src/services/api.ts`, change:

```typescript
const API_URL = __DEV__
  ? `http://${DEV_HOST}:3000/api`
  : "https://snap-cals-api.onrender.com/api"; // ← your Render URL
```

---

## 8. RevenueCat & Store Products

### 8.1 App Store Connect (iOS)

1. Log in to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. My Apps → "+" → New App
   - Platform: iOS
   - Name: Snap Cals
   - Bundle ID: `com.snapcals.app`
   - SKU: `snapcals`
3. Go to the app → **Subscriptions**
   - Create a Subscription Group (e.g., "Snap Cals Pro")
   - Add a subscription: Reference Name "Pro Monthly", Product ID `snapcals_pro_monthly`, Duration "1 Month", Price $4.99
4. Go to **Users and Access → Integrations → App Store Connect API**
   - Generate an **In-App Purchase Key** (type: In-App Purchase)
   - Download the `.p8` file — you'll upload this to RevenueCat

### 8.2 Google Play Console (Android)

1. Log in to [play.google.com/console](https://play.google.com/console)
2. Create app → "Snap Cals"
3. Go to **Monetize → Products → Subscriptions**
   - Create subscription: Product ID `snapcals_pro_monthly`
   - Add a base plan: "Monthly", billing period 1 month, price $4.99
4. Go to **Setup → API access**
   - Link or create a Google Cloud project
   - Create a service account with "Service Account User" role
   - Grant it access to the Play Console (Admin → Invite user → add the service account email with "Finance" permission)
   - Create a JSON key for the service account — you'll upload this to RevenueCat

### 8.3 RevenueCat dashboard

1. Go to [app.revenuecat.com](https://app.revenuecat.com) → create project "Snap Cals"

2. **Add iOS app:**
   - Platform: App Store
   - App name: Snap Cals
   - Bundle ID: `com.snapcals.app`
   - Upload the App Store Connect In-App Purchase Key (`.p8` file)
   - Fill in the Key ID and Issuer ID (from App Store Connect → Integrations)

3. **Add Android app:**
   - Platform: Play Store
   - App name: Snap Cals
   - Package name: `com.snapcals.app`
   - Upload the service account JSON credentials

4. **Create products:**
   - Go to Products → New → add `snapcals_pro_monthly` for both iOS and Android
   - Map each to the store product ID you created

5. **Create entitlement:**
   - Go to Entitlements → New → name it `pro`
   - Attach both the iOS and Android `snapcals_pro_monthly` products

6. **Create offering:**
   - Go to Offerings → New → identifier `default`
   - Add a package: identifier `$rc_monthly`, attach the `snapcals_pro_monthly` product

7. **Get API keys:**
   - Go to **API Keys** (in the iOS app settings)
   - Copy the **Public app-specific API key** → this is your `EXPO_PUBLIC_RC_IOS_API_KEY`
   - Switch to the Android app settings
   - Copy the **Public app-specific API key** → this is your `EXPO_PUBLIC_RC_ANDROID_API_KEY`

8. **Configure webhook:**
   - Go to **Integrations → Webhooks → New**
   - URL: `https://snap-cals-api.onrender.com/api/webhooks/revenuecat`
   - Authorization header: `Bearer <your-REVENUECAT_WEBHOOK_SECRET>` (the same value you set in Render env vars)

### 8.4 Update mobile .env

```
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID="your-ios-client-id.apps.googleusercontent.com"
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID="your-android-client-id.apps.googleusercontent.com"
EXPO_PUBLIC_RC_IOS_API_KEY="your-revenuecat-ios-public-key"
EXPO_PUBLIC_RC_ANDROID_API_KEY="your-revenuecat-android-public-key"
```

---

## 9. EAS Build & App Store Submission

### 9.1 Configure EAS

```bash
cd apps/mobile
eas build:configure  # if not already done
```

### 9.2 Get Android SHA-1 for Google OAuth

After your first Android build, get the signing certificate SHA-1:

```bash
eas credentials --platform android
```

Go back to Google Cloud Console and update your Android OAuth client with this SHA-1.

### 9.3 Build for testing

```bash
# iOS Simulator (for local testing)
eas build --profile ios-simulator --platform ios

# Physical iOS device (requires Apple Developer account)
eas build --profile development --platform ios

# Physical Android device
eas build --profile development --platform android
```

Install the build:

- **iOS Simulator:** Download the `.tar.gz`, extract, drag `.app` onto Simulator
- **Physical device:** EAS provides a QR code / install link

Then run the dev server (without `--go`):

```bash
cd apps/mobile
npx expo start
```

### 9.4 Test in-app purchases

**iOS sandbox testing:**

1. In App Store Connect → Users and Access → Sandbox → Sandbox Testers
2. Create a sandbox Apple ID (use a real email you can access)
3. On your test device, sign out of the App Store, sign in with the sandbox account
4. Open the app → Paywall → Subscribe → the sandbox purchase sheet appears

**Android testing:**

1. In Google Play Console → Settings → License testing
2. Add your test Gmail address
3. Upload an APK/AAB to internal testing track
4. Open the app → Paywall → Subscribe → test purchase flow

### 9.5 Production build

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

### 9.6 Submit to stores

```bash
# iOS — submits to App Store Connect for review
eas submit --platform ios

# Android — submits to Google Play Console
eas submit --platform android
```

**Before submitting iOS:**

1. In App Store Connect, fill in app metadata: description, screenshots, keywords, privacy policy URL, support URL
2. Set the price (free with in-app purchases)
3. Add the subscription info in the "Subscriptions" section

**Before submitting Android:**

1. In Google Play Console, complete the store listing: description, screenshots, feature graphic
2. Complete the content rating questionnaire
3. Set up pricing (free with in-app purchases)
4. Fill in the Data Safety section

---

## 10. Post-Launch

### 10.1 Monitor

- **Render dashboard** — server logs, uptime, response times
- **Neon dashboard** — database metrics, connection count
- **RevenueCat dashboard** — subscription metrics, revenue, churn
- **App Store Connect / Google Play Console** — crash reports, reviews, downloads

### 10.2 Render free tier caveats

The free Render tier spins down after 15 minutes of inactivity. First request after spin-down takes ~30 seconds. Options:

- Upgrade to Starter ($7/month) for always-on
- Use a cron service (e.g., UptimeRobot) to ping `/api/health` every 14 minutes

### 10.3 Database backups

Neon free tier includes 7-day point-in-time recovery. For extra safety, set up periodic `pg_dump` exports.

---

## 11. Environment Variables Reference

### Server (`apps/server/.env`)

| Variable                    | Source                                         | Description                                  |
| --------------------------- | ---------------------------------------------- | -------------------------------------------- |
| `DATABASE_URL`              | Neon dashboard (pooled)                        | Postgres connection string for queries       |
| `DIRECT_URL`                | Neon dashboard (direct)                        | Postgres connection string for migrations    |
| `JWT_SECRET`                | You generate (`openssl rand -hex 32`)          | Signs JWT tokens                             |
| `PORT`                      | `3000` or Render assigns                       | Server port                                  |
| `GEMINI_API_KEY`            | Google AI Studio                               | Gemini API for food estimation               |
| `RESEND_API_KEY`            | Resend dashboard                               | Email sending                                |
| `EMAIL_FROM`                | Your verified domain                           | Sender address for emails                    |
| `GOOGLE_IOS_CLIENT_ID`      | Google Cloud Console                           | Validates iOS Google OAuth tokens            |
| `GOOGLE_ANDROID_CLIENT_ID`  | Google Cloud Console                           | Validates Android Google OAuth tokens        |
| `REVENUECAT_WEBHOOK_SECRET` | You generate (must match RevenueCat dashboard) | Authenticates webhook requests               |
| `DATABASE_URL_TEST`         | Neon dashboard (test branch)                   | Test database (dev only, not needed in prod) |

### Mobile (`apps/mobile/.env`)

| Variable                               | Source                             | Description            |
| -------------------------------------- | ---------------------------------- | ---------------------- |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`     | Google Cloud Console               | iOS Google sign-in     |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google Cloud Console               | Android Google sign-in |
| `EXPO_PUBLIC_RC_IOS_API_KEY`           | RevenueCat dashboard (iOS app)     | RevenueCat iOS SDK     |
| `EXPO_PUBLIC_RC_ANDROID_API_KEY`       | RevenueCat dashboard (Android app) | RevenueCat Android SDK |

---

## 12. Go-Live Checklist

### Accounts & Services

- [ ] Neon account created, production database provisioned
- [ ] Resend account created, API key generated
- [ ] Resend sender domain verified (for production emails)
- [ ] Google AI Studio account, Gemini API key generated
- [ ] Google Cloud Console project created
- [ ] Expo / EAS account created, `eas login` done
- [ ] Apple Developer Program enrolled ($99/year)
- [ ] Google Play Console account created ($25)
- [ ] RevenueCat account created

### Google OAuth

- [ ] OAuth consent screen configured and published
- [ ] iOS OAuth client created with bundle ID `com.snapcals.app`
- [ ] Android OAuth client created with package name `com.snapcals.app`
- [ ] Android OAuth client updated with production SHA-1 (after first EAS build)
- [ ] Client IDs added to both server and mobile env vars

### Store Products

- [ ] App Store Connect: app created, monthly subscription product added
- [ ] App Store Connect: in-app purchase key generated (`.p8`)
- [ ] Google Play Console: app created, monthly subscription product added
- [ ] Google Play Console: service account JSON key created

### RevenueCat

- [ ] iOS app added with App Store Connect credentials
- [ ] Android app added with Play Store credentials
- [ ] Products created and mapped to store products
- [ ] `pro` entitlement created, products attached
- [ ] `default` offering created with monthly package
- [ ] Webhook configured with server URL + auth header
- [ ] iOS and Android public API keys copied to mobile `.env`

### Server

- [ ] Production database migrations applied (`prisma migrate deploy`)
- [ ] Render web service created and connected to GitHub
- [ ] All server environment variables set in Render
- [ ] Health endpoint responds: `curl https://your-server.onrender.com/api/health`
- [ ] JWT_SECRET is a strong random value (not the dev default)

### Mobile App

- [ ] Production API URL updated in `apps/mobile/src/services/api.ts`
- [ ] All mobile `.env` values filled in
- [ ] Production build succeeds: `eas build --profile production --platform ios`
- [ ] Production build succeeds: `eas build --profile production --platform android`

### Testing

- [ ] Create account via email → verification email arrives → can verify and log in
- [ ] Google sign-in works
- [ ] Food entries CRUD works
- [ ] AI estimation works (text and image)
- [ ] AI goal coach works
- [ ] Usage limits enforced for free users
- [ ] Paywall shows real product with price from store
- [ ] Sandbox purchase completes → tier updates to Pro → limits removed
- [ ] Restore purchases works
- [ ] Webhook fires → server updates subscription tier in database
- [ ] Password reset email arrives and flow works

### App Store Submission

- [ ] App metadata filled in (description, screenshots, keywords)
- [ ] Privacy policy URL added
- [ ] Support URL added
- [ ] App submitted for review (iOS)
- [ ] App submitted for review (Android)
- [ ] App approved and live
