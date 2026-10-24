# WiniD Hub app

Dance and fitness classes in your apartment community · *Where moments become art*

Student portal (sign up, join classes, attendance, fees, dance styles) and admin portal (dashboard, enquiries, WhatsApp messages, students, class schedule with cancellations and make-up classes, attendance, fees, locations).

## What's in this project

```
winidhub-app/
├── index.html                 Page shell (title, fonts, app icon)
├── package.json               Tools the app needs (Vite, Supabase, QR codes)
├── vite.config.js             Build settings
├── .env.example               The two Supabase values the app needs
├── public/
│   ├── logo.png               WiniD Hub logo
│   ├── icon-192.png, icon-512.png, apple-touch-icon.png   Home-screen icons
│   └── manifest.webmanifest   Lets students "Add to Home Screen"
├── src/
│   ├── main.js                Starts the app
│   ├── app.js                 All screens and features
│   ├── backend.js             Logins and saving data to Supabase
│   └── styles.css             Colours, fonts and layout
└── supabase/
    ├── schema.sql             Database tables, security rules, sign-up functions
    └── seed.sql               Your classes, dance styles, places, fees, bank and WhatsApp wording
```

## Setup (one time, about 30 minutes)

### 1. Put the code on GitHub
1. Open your **winidhub-app** repository on github.com.
2. Click **Add file → Upload files**.
3. Drag in **everything inside** the `winidhub-app` folder (the files and the `public`, `src`, `supabase` folders).
4. Click **Commit changes**.

### 2. Create the database in Supabase
1. Supabase → your **winidhub** project → **SQL Editor** → **New query**.
2. Open `supabase/schema.sql`, copy everything, paste, click **Run**. You should see "Success".
3. New query again: copy everything from `supabase/seed.sql`, paste, **Run**.
4. **Authentication → Sign In / Providers → Email**: switch **Confirm email** **off** and save.
   (Students sign in with their mobile number and password; no SMS or email code is needed.)

### 3. Make yourself the admin
1. Supabase → **Authentication → Users → Add user → Create new user**.
   Enter your email and a strong password, tick **Auto Confirm User**, create.
2. SQL Editor → New query, paste this with your email, **Run**:
   ```sql
   update public.profiles set role = 'admin'
   where user_id = (select id from auth.users where email = 'your-email@example.com');
   ```
3. In the app, use **Admin login** (bottom right of the sign-in page) with that email and password.

### 4. Put the app online with Cloudflare Pages (free)
1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Choose GitHub, allow access to **winidhub-app**, select it.
3. Build settings:
   - Framework preset: **Vite** (or None)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Environment variables** (add both):
   - `VITE_SUPABASE_URL` = your Project URL, e.g. `https://abcd1234.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = Supabase → Project Settings → **API Keys** → the **anon / publishable** key
     (never use the `service_role` / secret key here)
5. **Save and Deploy.** Your app goes live at `https://winidhub-app.pages.dev` (or similar).
   Every change saved to GitHub redeploys it automatically.

### 5. Later: your own address
After buying `winidhub.in`: Cloudflare Pages project → **Custom domains → Set up a custom domain → winidhub.in**.

## Adding students the studio already knows
In the admin portal, students who sign up appear automatically. For students you add yourself in Supabase
(Table Editor → `students`), give them their phone number in `phone_digits` (10 digits); they then use
**Set up your password** on the sign-in page with that number.

## Without Supabase (demo mode)
If the two `VITE_SUPABASE_…` values are not set, the app runs in demo mode with sample students and
one-tap demo logins, saving only in that browser. Useful for showing the app.

## Run on your own computer (optional, for developers)
```
npm install
cp .env.example .env.local   # then fill in the two values
npm run dev
```

## Not yet connected
- **WhatsApp:** messages are written automatically and sent with one tap ("Send on WhatsApp").
  Fully automatic sending needs the WhatsApp Business (Cloud) API for 99404 62190.
- **Razorpay:** payments go by UPI QR / bank transfer to the studio's ICICI account and are confirmed by the admin.
