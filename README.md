# SecondHope

A job platform for people affected by cancer — patients, survivors and caregivers — and the
employers who want to hire them. React + TypeScript + Vite on the front end, Firebase (Auth +
Firestore) as the backend.

## What's in it

**Job seekers**
- Sign up with email/password or Google, then a 5-step onboarding (every step skippable).
- Job board with filters (support offered, work mode, hours, Cancer-Aware Pledge), a fit score, and saved jobs.
- Apply with an optional note. The apply screen spells out exactly what the employer will see.
- Application tracker with live status updates, employer messages, withdraw, and accept-offer.
- Profile editor, plus "Preview what employers see".
- Settings: comfort mode (larger text, calm motion, higher contrast), password reset, delete account.

**Employers**
- Company setup, plus signing the Cancer-Aware Pledge.
- Dashboard with stats, job list (edit / close / reopen / delete), and recent applicants.
- Post and edit jobs. An inclusive-language check flags phrases like "no gaps" or "fast-paced".
- Candidates pipeline: filter by job or stage, read the application, move the stage, and message the candidate.
- Public company page.

## Privacy model

- `users/{uid}` holds the seeker's whole profile, including health details. **Only the owner can read it.**
- Employers never browse profiles. When someone applies, a **snapshot** is written to
  `applications/{jobId}_{uid}`, which only that seeker and that employer can read.
- Journey stage and support needs go into the snapshot only when the seeker chose
  "Share with Cancer-Aware employers" **and** the employer has signed the pledge. With "Share after an offer",
  they're added only when the seeker accepts an offer. Accommodation notes are never shared.
- `firestore.rules` enforces all of this, including who can move an application to which status. A company
  also can't show a pledge badge it hasn't signed. `npm run test:rules` checks 27 of these cases.

## Running it

### Option A — your Firebase project

1. In the [Firebase console](https://console.firebase.google.com), create a project and add a **Web app**.
2. **Authentication → Sign-in method**: enable **Email/Password** and **Google**.
3. **Firestore Database**: create a database (production mode).
4. `cp .env.example .env.local` and paste in the web app config.
5. Install and deploy the security rules:
   ```sh
   npm install
   npx firebase-tools login
   npx firebase-tools use --add      # pick your project
   npm run deploy:rules
   ```
6. Optionally add the sample jobs: `npm run seed` (creates 10 demo employer accounts; the password is printed at the end).
7. `npm run dev`

**Switching to another Firebase project later** (e.g. Scholar's): repeat steps 2–5 against that
project. The code doesn't change, only `.env.local` and the `firebase use` target.

### Option B — fully local with the emulators (no project needed)

Needs Java 11+.

```sh
npm run emulators        # terminal 1 — Auth + Firestore emulators (UI at http://127.0.0.1:4000)
npm run seed:emulator    # terminal 2 — sample employers + jobs
npm run test:rules       # optional — security rules checks
npm run dev:emulator     # app at http://localhost:5173
```

Emulator data resets when the emulators stop.

## Scripts

| Script | What it does |
| --- | --- |
| `dev` / `dev:emulator` | Vite dev server against the real project / the emulators |
| `build` | Type-check and production build |
| `emulators` | Start Auth + Firestore emulators with the local rules |
| `seed` / `seed:emulator` | Add demo employers and the 12 sample jobs |
| `test:rules` | Security rules smoke test (emulators must be running) |
| `deploy:rules` | Deploy `firestore.rules` and indexes |
| `deploy` | Build and deploy to Firebase Hosting + rules |

## Code map

```
src/
  lib/firebase.ts      Firebase init (reads env vars, connects emulators)
  lib/db.ts            All Firestore reads/writes
  lib/hooks.ts         Live-data hooks (jobs, company, applications)
  lib/comfort.ts       Comfort settings (per device)
  context/             Auth/session provider + helpers
  pages/               Seeker pages, auth, settings, company page
  pages/employer/      Employer dashboard, company setup, job form, candidates
  components/          Header, form fields, modal, applicant view…
firestore.rules        Security rules — the real privacy boundary
scripts/               Seed data, seed script, rules smoke test
```

## Not built yet / next steps

- **Pledge verification**: the pledge is self-signed. An admin review step (and an `admin` role) would make the badge mean more.
- **Email notifications** for status changes. Needs Cloud Functions, which requires the Blaze plan.
- **Résumé upload** (Firebase Storage) and multi-member employer teams.
- **Search at scale**: the job board loads all open jobs and filters in the browser. That's fine for hundreds
  of jobs; past that, move to Algolia/Typesense or paginated Firestore queries.
- The landing page statistics ("2,400+ people", "500+ employers", "92%") and testimonials are prototype
  placeholders. Replace them with real figures before launch.
