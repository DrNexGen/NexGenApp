# NexGen Hospital app — deployment guide

Orthopaedics & Physiotherapy patient manager (PWA). Two doctors
(Dr. Varun — Orthopaedics, Dr. Umashankar — Physiotherapy), appointment
booking, per-visit fees/reports, dues, and admin money reports with
per-doctor breakdown and Excel/backup export.

The app is already built and tested. Three one-time steps get it live, all
under YOUR NexGen accounts. Do them in this order.

---

## Step 1 — Set up the database (Supabase)

1. Open your project: <https://supabase.com/dashboard/project/qxpsmynqacrlwifnamdp>
2. Left sidebar → **SQL Editor** → **New query**.
3. Open `supabase-setup.sql` from this folder. **Edit the four passcodes** near
   the top (each login sees different data):
   - `CHANGE-STAFF-1234` → assistants: book/manage patients, upload reports.
     No money reports, no deletes.
   - `CHANGE-ADMIN-9999` → owner/admin: sees **all** doctors' data, money
     reports, exports, and deletes.
   - `CHANGE-VARUN-1111` → Dr. Varun: sees **only his own** orthopaedic
     patients, appointments, reports, and earnings.
   - `CHANGE-UMA-2222` → Dr. Umashankar: sees **only his own** physiotherapy
     data and earnings.
4. Paste the whole file into the SQL editor → **Run**. Expect
   "Success. No rows returned".

That creates all tables (patients, visits, reports) and the secure functions.
Give each person only their own passcode.

To add or change a doctor login later:
```sql
update app_secrets set value = 'NEW-CODE' where key = 'doc_passcode:Dr. Varun';
```

## Step 2 — Put the code on GitHub

The local repo is already committed with the remote set. In a terminal:

```
cd C:\Sreeni\NexGenApp
git push -u origin main
```

When prompted for a password, use a **GitHub Personal Access Token** (not your
account password): GitHub → Settings → Developer settings → Personal access
tokens → generate one with "repo" scope, and paste it as the password.
(Or push using GitHub Desktop.)

## Step 3 — Deploy on Vercel (team next-gen18)

Easiest path — import the GitHub repo:

1. Log in to Vercel with the account that owns **next-gen18**.
2. **Add New → Project** → import `nextgenhospitalcare-png/NexGenApp`.
3. Framework auto-detects as Vite. Before deploying, add two **Environment
   Variables**:
   - `VITE_SUPABASE_URL` = `https://qxpsmynqacrlwifnamdp.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = *(your anon public key)*
4. Click **Deploy**. You get a live link like `https://nexgenapp.vercel.app`.

From then on, every `git push` auto-deploys the update.

### Alternative — Vercel CLI (if you prefer)

```
cd C:\Sreeni\NexGenApp
npx vercel login          (log in as the next-gen18 account owner)
npx vercel --scope next-gen18
npx vercel env add VITE_SUPABASE_URL production
npx vercel env add VITE_SUPABASE_ANON_KEY production
npx vercel --prod --scope next-gen18
```

---

## Install on phones

Send the team the live link:
- **Android (Chrome):** menu → Add to Home screen / Install app
- **iPhone (Safari):** Share → Add to Home Screen

Give assistants the staff passcode; keep the admin passcode to yourself.

## Local preview (optional)

`npm install` then `npm run dev`. Without a `.env` file it runs in demo mode
(staff `1234`, admin `9999`, data in the browser only). The `.env` in this
folder connects it to the real Supabase for local testing.

## SECURITY — important

- The **service_role key** and **DB password** you shared bypass all security.
  They must NEVER go into the app, `.env`, or GitHub. The app uses only the
  **anon public key**. Consider rotating both in the Supabase dashboard since
  they were shared in chat (Settings → API; Settings → Database → reset
  password).
- Patient data is medical: the database has Row Level Security with no public
  access — all reads/writes go through passcode-checked functions.
