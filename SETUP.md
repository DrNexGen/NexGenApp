# Anugiri Dental Clinic app — Setup & Free Hosting Guide

A dental clinic patient manager (PWA): patients, visits with fees and
automatic balance tracking, X-ray/report uploads, and full patient history.
100% free to run. No Google services anywhere.

Two login levels, both just passcodes:
- **Staff passcode** (assistants): patients, bookings/visits, dues,
  report uploads.
- **Admin passcode** (Dr. Revathi): everything above PLUS the Reports tab
  (collections today/month/6mo/12mo/all-time, monthly chart, by-treatment,
  by-payment-mode, top patients), per-patient 12-month earnings,
  full Excel/CSV export, and deletes.

**Total setup time: ~15 minutes.** Two free accounts: Supabase (database)
and Vercel (hosting). No credit card needed. Both sign-ups work from a
phone or any computer.

---

## Step 1 — Create the free database (Supabase)

1. Go to <https://supabase.com> → **Start your project** → sign up with
   any email.
2. **New project** → name it `anugiri`, set a database password (save it),
   pick a region near you (e.g. Mumbai) → **Create new project**. Wait ~2 min.
3. Open **SQL Editor** → **New query**.
4. Open `supabase-setup.sql` from this folder and **edit the two passcodes**:
   - `CHANGE-STAFF-1234` → the passcode your whole team will use
   - `CHANGE-ADMIN-9999` → your private admin passcode (needed to delete)
5. Paste the whole file into the SQL editor → **Run** → expect
   "Success. No rows returned".
6. **Project Settings (gear) → API** → copy the **Project URL** and the
   **anon public** key.

## Step 2 — Deploy free hosting (Vercel)

From this folder on a computer with Node.js:

```
npm install
npx vercel
```

Accept the defaults (press Enter through the questions; it opens a browser
to log in the first time). Then:

```
npx vercel env add VITE_SUPABASE_URL production
   (paste the Project URL)
npx vercel env add VITE_SUPABASE_ANON_KEY production
   (paste the anon public key)
npx vercel --prod
```

The last command prints your live link, e.g. `https://dentalog.vercel.app`.

Alternative (no command line): push this folder to GitHub, then on
<https://vercel.com> → Add New → Project → import the repo → add the two
environment variables → Deploy.

## Step 3 — Install on the team's phones

Send everyone the link:

- **Android (Chrome):** open link → ⋮ menu → **Add to Home screen**
- **iPhone (Safari):** open link → Share → **Add to Home Screen**

It then opens full-screen from its own icon like a normal app.
Give the **staff passcode** to your team; keep the **admin passcode**
to yourself.

---

## Customising

- **Clinic name in the header:** edit `CLINIC_NAME` in `src/config.js`,
  then redeploy (`npx vercel --prod`).
- **Treatment categories / payment modes:** same file.
- **Changing passcodes later:** Supabase → SQL Editor →

```sql
update app_secrets set value = 'NEW-CODE' where key = 'staff_passcode';
update app_secrets set value = 'NEW-CODE' where key = 'admin_passcode';
```

## Running locally (testing)

`npm install` then `npm run dev`. Without a `.env` file it runs in
**demo mode** (staff passcode `1234`, admin `9999`, data stays in the
browser). Copy `.env.example` to `.env` with your Supabase values to test
against the real database.

## How the security works

- Row Level Security is ON with **no public access at all** — patient data
  is never readable without the passcode, unlike a public read API.
- Every read and write goes through server-side functions that verify the
  staff passcode; deletes verify the admin passcode.
- Passcodes live only in the database (`app_secrets`), never in the app code.
- Report photos are compressed on the phone (~200 KB) and stored in the
  database, so no separate file storage is needed.

## Free-tier capacity

- Supabase free: 500 MB — roughly 2,000+ X-ray photos plus hundreds of
  thousands of visit records. Archive old reports if you ever get close.
- Supabase pauses a free project after ~1 week of zero activity; daily
  clinic use never triggers this (unpausing is one click if it happens
  during a long holiday).
- Vercel free: far more bandwidth than 10 users can use.

## Daily flow

- **Existing patient:** search name/phone → open → **+ Visit** → category,
  teeth, fee charged, payment received → Save.
- **Partial payment:** lower the "Payment received" amount — the balance
  shows automatically on the patient and in the Dues tab.
- **Clearing dues later:** add a visit with category `Payment Only`,
  fee 0, payment = amount received.
- **X-ray:** open patient → **+ Report** → take photo → Save.
- **Lock the app** from the More tab when handing your phone to someone.
