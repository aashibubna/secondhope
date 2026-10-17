// Seeds demo employers + the prototype's sample jobs.
//
//   npm run seed            → uses the project in .env.local
//   npm run seed:emulator   → uses the local emulators
//
// It signs up one demo employer account per company through the normal client SDK,
// so the same security rules apply and no service-account key is needed.
// Safe to re-run: existing demo accounts are reused and their jobs replaced.
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { JOBS } from './seed-data.mjs'

const emulator = process.argv.includes('--emulator')

function readEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
        .split(/\r?\n/)
        .map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/))
        .filter(Boolean)
        .map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]),
    )
  } catch {
    return {}
  }
}

// Same precedence as Vite: .env.local overrides .env.
const env = { ...readEnv('.env'), ...readEnv('.env.local') }
const col = (name) => (env.VITE_COLLECTION_PREFIX ?? '') + name
const app = initializeApp(
  emulator
    ? { apiKey: 'demo-key', projectId: 'demo-secondhope' }
    : {
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        appId: env.VITE_FIREBASE_APP_ID,
      },
)
if (!emulator && !env.VITE_FIREBASE_API_KEY) {
  console.error('No Firebase config found. Fill in .env (see .env.example), or run `npm run seed:emulator`.')
  process.exit(1)
}

const auth = getAuth(app)
const db = getFirestore(app)
if (emulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

const PASSWORD = env.SEED_PASSWORD || 'secondhope-demo-2026'
const DAY = 86_400_000

const ABOUT = {
  'Lumen Health': 'We build patient companion tools used by thousands of people in treatment. Async-first and calm by design.',
  Brightpath: 'Simple billing software for small businesses, with a structured return-to-work programme for every new hire.',
  'Northwind Labs': 'A product studio building accessible web software. No on-call, short core hours, long-term thinking.',
  'Kindred Media': 'Independent publisher of long-form writing on wellbeing and money.',
  'Haven Care': 'Community clinics across Delhi NCR, with 12 weeks of paid medical leave for every team member.',
  'Orbit & Co': 'A growing consumer brand with a hybrid team that chooses its own office days.',
  Ledgerly: 'Bookkeeping for small businesses, delivered by a fully remote team.',
  Learnwell: 'Live online classes for grades 6–12, taught by people who love their subject.',
  'Second Light Oncology': 'Cancer care centre in Kolkata. Lived experience of cancer is valued across our teams.',
  'Quanta Insights': 'Retail analytics consultancy. Focused work blocks and no late-night meetings.',
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

async function signInOrCreate(email) {
  try {
    return (await createUserWithEmailAndPassword(auth, email, PASSWORD)).user
  } catch (e) {
    if (e.code !== 'auth/email-already-in-use') throw e
    return (await signInWithEmailAndPassword(auth, email, PASSWORD)).user
  }
}

const companies = [...new Set(JOBS.map((j) => j.company))]
for (const name of companies) {
  const jobs = JOBS.filter((j) => j.company === name)
  const first = jobs[0]
  const email = `demo+${slug(name)}@secondhope.dev`
  const user = await signInOrCreate(email)
  const uid = user.uid
  const now = Date.now()

  await setDoc(doc(db, col('users'), uid), {
    name: `${name} Hiring`,
    email,
    role: 'employer',
    createdAt: now,
    onboarded: true,
    profile: {},
    saved: [],
    seenAt: now,
  })

  const pledge = jobs.some((j) => j.pledge)
  await setDoc(doc(db, col('companies'), uid), {
    ownerUid: uid,
    name,
    logo: first.logo,
    website: `${slug(name)}.example`,
    industry: first.func === 'Healthcare' ? 'Healthcare' : 'Technology',
    size: '51–200',
    location: first.location,
    about: ABOUT[name] ?? '',
    supports: [...new Set(jobs.flatMap((j) => j.supports))],
    pledge,
    pledgeSignedAt: pledge ? now - 120 * DAY : null,
    createdAt: now,
  })

  const batch = writeBatch(db)
  const old = await getDocs(query(collection(db, col('jobs')), where('companyId', '==', uid)))
  const keep = new Set(jobs.map((j) => `seed-${j.id}`))
  old.forEach((d) => keep.has(d.id) || batch.delete(d.ref))
  for (const j of jobs) {
    const { id, postedDays, ...rest } = j
    const created = now - postedDays * DAY
    batch.set(doc(db, col('jobs'), `seed-${id}`), {
      ...rest,
      pledge,
      companyId: uid,
      status: 'open',
      createdAt: created,
      updatedAt: created,
    })
  }
  await batch.commit()
  await signOut(auth)
  console.log(`✓ ${name} — ${jobs.length} job(s)  [${email}]`)
}

console.log(`\nDone. Demo employers can log in with password: ${PASSWORD}`)
process.exit(0)
