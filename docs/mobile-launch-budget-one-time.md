# Mobile launch budget — one-time allocation (150,000 KES)

**Purpose:** Ship **WYA** (Capacitor + Vite + React + Supabase) to **Google Play** and **Apple App Store**, with **push notifications** (FCM + Supabase), using **paid** tooling only (no reliance on free tiers for CI/Mac access).

**Budget ceiling:** **150,000 KES** (Kenyan Shillings)

**FX reference used in this document:** **1� 133 KES** (replace with your card/bank rate when you pay; totals may shift slightly).

---

## Summary table — what you pay and what it does

| # | Item | What it does | Amount (KES) | Ref (USD) | Pay all at once? |
|---|------|----------------|-------------|-----------|------------------|
| 1 | **Apple Developer Program** | Lets you **sign iOS builds**, use **TestFlight**, and **publish on the App Store**. Required for any iPhone/iPad store app. | **13,200** | ~99 | **Yes** — single payment to Apple for a **1-year** membership (membership lasts12 months; you pay once now). |
| 2 | **Google Play developer registration** | One-time **Play Console** fee so you can upload **Android** builds (internal testing → production). | **3,300** | ~25 | **Yes** — one-time to Google. |
| 3 | **Bitrise Starter (mobile CI/CD)** | **Cloud builds** from your Git repo: install deps, `vite build`, `cap sync`, **Android (Gradle)** and **iOS (Xcode)** without owning a Mac for day-to-day builds. **Starter** is a **paid** plan (not the free Hobby tier). | **39,500** | ~297 | **Effectively once** — budget here = **three monthly invoices** (~$99/mo). Bitrise bills **per month**; to “pay everything at once” in practice: use one card and **pre-authorize**, or **pay month 1 now** and keep **~26,300 KES** on the same card for months 2–3 (see § Lump-sum note below). |
| 4 | **MacinCloud Dedicated** | **Remote Mac** with **admin access** for **Xcode**, signing, profiles, and debugging when **CI alone** is not enough. | **19,500** | ~147 | **Effectively once** — budget = **three months** at ~$49/mo. MacinCloud typically bills **per cycle**; **quarterly checkout** (if offered) = **one charge** for 3 months — confirm at checkout. |
| 5 | **Google Cloud (Firebase / FCM)** | **Firebase Cloud Messaging** delivers **push** to Android + iOS (via your app + Apple push setup). **Billing account** + **budget cap** so spend stays predictable; this line = **starting usage credit**. | **13,200** | ~99 | **Yes** — you can **add a payment method** and set **budget alerts**; initial draw is usage-based. Top up **~$99** equivalent as your first “bucket”. |
| 6 | **Test device (Android) + accessories** | **Real phone** for installs, push, and Play testing; cables/power. (iPhone: borrow or add later — Apple TestFlight needs a device eventually.) | **35,000** | ~263 | **Yes** — retail / used market, **one purchase**. |
| 7 | **Store listing creative** | **App icons** (all sizes), **screenshots**, optional short preview; keeps **review friction** lower and looks professional. | **16,500** | ~124 | **Yes** — pay designer/tooling **once** per major store refresh. |
| 8 | **Contingency buffer** | **CI overages**, **extra Mac month**, **FX drift**, **store rejection** fixes (signing, privacy text, push capability). | **9,800** | ~74 | **Held** on your card/account — spend only if needed. |
| | **TOTAL** | | **150,000** | ~**1,127** | |

---

## What each piece does (plain language)

### Apple Developer Program

- **You get:** Ability to create **distribution certificates**, **App IDs**, **provisioning profiles**, use **TestFlight**, and submit to the **App Store**.
- **You do not get:** A Mac — that’s separate (CI + MacinCloud below).
- **Renews:** Every **year** (Apple’s rule); this doc still treats the **fee you pay today** as a **single upfront** cost for year 1.

### Google Play developer registration

- **You get:** A **Play Console** account to upload **AAB/APK**, manage testers, and go to production.
- **One-time** fee (not annual).

### Bitrise Starter (paid CI/CD)

- **You get:** Hosted runners that run your **pipeline** on every push or tag: dependency install, web build, Capacitor sync, native Android/iOS compile, artifacts for stores.
- **Why Starter:** Avoids the **free Hobby** tier — matches “no free tiers” for your **main** CI path.
- **Caveat:** Pricing is **per month** on the vendor side; your **150k plan** **sets aside** three months so you are not surprised by renewals.

### MacinCloud Dedicated

- **You get:** A **remote Mac** (VNC/SSH) with **sudo**, **Xcode**, **Transporter** — for tasks that are painful headless: **first-time signing**, **capability** toggles, **provisioning** mismatches.
- **Why Dedicated:** **Managed** plans often lack **full admin**; **Dedicated** matches real iOS troubleshooting.

### Google Cloud + Firebase (FCM)

- **You get:** **FCM** to send **push** payloads; your **Supabase Edge Function** (or backend) calls FCM using a **service account**; the app uses **Capacitor Push Notifications** + stores tokens in Supabase.
- **You set:** **Budget alerts** and caps so this line doesn’t run away.

### Test device + accessories

- **You get:** Confidence that **Play builds**, **push**, and **deep links** work on real hardware — not only emulators.

### Store creative

- **You get:** Assets that meet **store screenshot** and **icon** requirements so review teams and users see a **finished** product.

### Contingency

- **You get:** Room for **one extra CI month**, **currency movement**, or **small fixes** without breaking the overall plan.

---

## Lump-sum payment (pay “everything at once”) — honest mechanics

Some vendors **only** bill **monthly**. This table is a **financial plan** that **allocates** 150,000 KES so **nothing is forgotten**; **true single invoice** is possible for every line **only where the vendor allows it**.

| Category | Single-charge possible? | Practical approach |
|----------|-------------------------|---------------------|
| Apple | Yes | One checkout in Apple Developer. |
| Google Play | Yes | One Play registration payment. |
| Bitrise | Usually **monthly** | Pay **month 1** at signup; keep **reserved KES** (from row 3 total) for months 2–3 **on the same payment method**, or ask Bitrise sales about **prepaid/annual** if you change policy. |
| MacinCloud | **Often yes** for longer cycles | If checkout offers **quarterly**, you pay **one** amount covering3 months — best match for “once”. |
| Google Cloud | Yes (card on file) | Add billing; fund **usage**; set **budget**. |
| Device + creative | Yes | One-time purchases. |
| Contingency | N/A | Keep as **cash buffer**, not a vendor. |

**If you require literally one bank withdrawal today:** pay **Apple + Google + device + creative + first month Bitrise + first month MacinCloud + GCP setup** in one banking session, and move the **remaining KES** into a **dedicated mobile sub-account** labeled **“Bitrise/MacinCloud months 2–3 + contingency”** so the **full150,000** is **spoken for** in one plan.

---

## Technical context (this repo)

- **Web:** Vite + React + TypeScript  
- **Backend:** Supabase (auth, DB, Edge Functions)  
- **Mobile shell:** Capacitor 7 (Android present in repo; iOS to be added)  
- **Notifications today:** In-app `notifications` table — **device push** requires **FCM + tokens + sender** (not yet in repo as of this document)

---

## Document control

| Field | Value |
|--------|--------|
| Created for | WYA mobile launch planning |
| Budget |150,000 KES |
| FX assumption | 1 USD �� 133 KES |

Update this file when **vendor prices**, **your FX**, or **scope** (e.g. extra iOS device) changes.
