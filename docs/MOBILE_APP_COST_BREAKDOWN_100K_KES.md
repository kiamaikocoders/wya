# Mobile App Cost Breakdown: Web/PWA → Android & iOS  
**Budget cap: 100,000 KES**

This breakdown covers taking **WYA** from your existing webapp + PWA to **published Android and iOS apps**, using your current stack (React, Vite, Capacitor).  
*Exchange rate used: 1 USD ≈ 130 KES.*

---

## Current state

- **Web app**: React + Vite, Supabase, maps (MapLibre/Mapbox).
- **PWA**: `site.webmanifest`, favicon setup.
- **Android**: Capacitor already integrated (`@capacitor/android`), `android/` project and build scripts exist.
- **iOS**: Not yet added (no `@capacitor/ios`, no `ios/` project).

So the main work is: **finish Android for store release** and **add and ship iOS** using the same Capacitor wrap.

---

## Cost breakdown (all figures in KES)

### 1. Store & developer accounts (required)

| Item | USD | KES (≈130/USD) | Notes |
|------|-----|----------------|-------|
| **Google Play Developer** | $25 one-time | **3,250** | One-time; needed to publish on Play Store. |
| **Apple Developer Program** | $99/year | **12,870** | Yearly; required for App Store. |
| **Subtotal** | | **16,120** | |

---

### 2. iOS build environment (you need a Mac for iOS)

You must build and sign the iOS app on macOS. Options:

| Option | Approx. cost (KES) | Notes |
|--------|--------------------|--------|
| **A. Use a Mac you already have** | **0** | Best if you have access to any Mac (personal, office, friend). |
| **B. Rent a cloud Mac (1 month)** | **6,500 – 13,000** | e.g. MacStadium, AWS EC2 Mac, or similar; build and submit, then cancel. |
| **C. Buy a used Mac Mini** | ~50,000+ | One-time; overkill if you only need to build once a year. |

**Recommendation:** A or B. If you have no Mac, budget **~10,000 KES** for one month of cloud Mac.

**Budget line (assuming no Mac):** **10,000 KES**

---

### 3. Development work (Android polish + add iOS)

Your repo already has Android; iOS is “add Capacitor iOS + build + fix config.”

| Task | DIY (KES) | Outsourced (KES) | Notes |
|------|-----------|------------------|--------|
| Android: signing, store listing, first upload | 0 | 5,000 – 15,000 | You can do signing and listing yourself with ANDROID_BUILD_GUIDE.md. |
| Add Capacitor iOS, sync, fix config | 0 | 10,000 – 25,000 | Straightforward if you follow Capacitor docs. |
| Icons, splash, screenshots for both stores | 0 | 3,000 – 8,000 | Can use existing PWA assets + free tools. |
| Bug fixes / store rejection fixes (buffer) | 0 | 5,000 – 15,000 | Small buffer for 1–2 review cycles. |

**If you do everything yourself:** **0 KES** (only time).  
**If you outsource the lot (conservative):** **23,000 – 63,000 KES**.  
**Budget line (mid outsourcing):** **35,000 KES**

---

### 4. Assets and listing (optional spend)

| Item | Low cost | Notes |
|------|----------|--------|
| App icons & splash | 0 | Use existing PWA assets; Capacitor can resize. |
| Store screenshots | 0 | Emulator + device frames (e.g. Figma, Canva). |
| Copy / translation | 0 – 5,000 | Optional; English-only is fine to start. |

**Budget line:** **2,000 KES** (optional).

---

### 5. Testing (minimal cost)

| Item | Cost | Notes |
|------|------|--------|
| Android testing | 0 | Android Studio emulator. |
| iOS testing | 0 | Xcode Simulator (on Mac). |
| Physical device | 0 | Use your own phone if available. |

**Budget line:** **0 KES**

---

## Total summary (under 100,000 KES)

| Category | Amount (KES) |
|----------|--------------|
| Store accounts (Google + Apple) | 16,120 |
| Mac access (1 month cloud, if no Mac) | 10,000 |
| Development (mid outsourcing) | 35,000 |
| Assets / listing (optional) | 2,000 |
| **Total** | **63,120** |

With a **~15% buffer** (9,500 KES): **~72,600 KES**.

---

## Two scenarios

### Scenario A: DIY (you do dev + you have Mac access)

| Item | KES |
|------|-----|
| Google Play | 3,250 |
| Apple Developer | 12,870 |
| Mac | 0 |
| Dev / assets | 0 |
| **Total** | **16,120** |

Well under 100,000 KES.

---

### Scenario B: No Mac + outsource most work

| Item | KES |
|------|-----|
| Google Play | 3,250 |
| Apple Developer | 12,870 |
| Cloud Mac (1 month) | 10,000 |
| Development + assets | 37,000 |
| Buffer (15%) | ~9,500 |
| **Total** | **~72,600** |

Still under 100,000 KES.

---

## What to do next (no extra cost)

1. **Android**
   - Follow `ANDROID_BUILD_GUIDE.md` to sign the app and upload to Play Console.
   - Use existing icons/splash; add store listing and screenshots (emulator is enough).

2. **iOS**
   - Add Capacitor iOS:  
     `npm install @capacitor/ios` then `npx cap add ios`.
   - Open `ios/App/App.xcworkspace` in Xcode (on a Mac), set team/signing, then Archive and upload to App Store Connect.
   - Reuse the same `dist/` and config you use for Android; only native project and store metadata differ.

3. **Budget**
   - Reserve **16,120 KES** for the two store accounts.
   - If you have no Mac, add **~10,000 KES** for one month of cloud Mac.
   - Keep the rest for outsourcing or buffer; total can stay under **100,000 KES** easily.

---

## Summary

- **Minimum (DIY + Mac access):** **~16,120 KES** (stores only).  
- **Typical (no Mac + some outsourcing):** **~72,600 KES** (under 100,000 KES).  
- **Upper bound (full outsourcing + buffer):** **~85,000–95,000 KES** (still under 100,000 KES).

All figures are in Kenyan Shillings and assume a single iOS and Android release using your existing Capacitor + web stack.
