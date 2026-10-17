// End-to-end check of the data flow and security rules against the local emulators.
//   npm run emulators   (in another terminal)
//   npm run test:rules
import { deleteApp, initializeApp } from 'firebase/app'
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import {
  arrayUnion,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setLogLevel,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

setLogLevel('silent')
let n = 0
function client() {
  const app = initializeApp({ apiKey: 'demo-key', projectId: 'demo-secondhope' }, `c${n++}`)
  const auth = getAuth(app)
  const db = getFirestore(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  return { app, auth, db }
}

let failed = 0
async function check(name, fn, shouldPass = true) {
  try {
    await fn()
    if (shouldPass) console.log(`  ✓ ${name}`)
    else (failed++, console.log(`  ✗ ${name} — was allowed but should be denied`))
  } catch (e) {
    if (!shouldPass && /permission|PERMISSION/.test(String(e.code ?? e.message))) console.log(`  ✓ ${name} (denied)`)
    else (failed++, console.log(`  ✗ ${name} — ${e.code ?? e.message}`))
  }
}
const deny = (name, fn) => check(name, fn, false)

const stamp = Date.now()
const now = Date.now()
const profile = { disclosure: 'open', journeyStage: 'remission', supportNeeds: ['Flexible hours'], accommodationNotes: 'secret' }

async function signUp(c, role, name) {
  const { user } = await createUserWithEmailAndPassword(c.auth, `${name}-${stamp}@test.dev`, 'password123')
  await setDoc(doc(c.db, 'users', user.uid), {
    name, email: user.email, role, createdAt: now, onboarded: true, profile: role === 'seeker' ? profile : {}, saved: [], seenAt: now,
  })
  return user.uid
}

const emp = client(), emp2 = client(), seeker = client(), other = client()
const empId = await signUp(emp, 'employer', 'emp')
const emp2Id = await signUp(emp2, 'employer', 'emp2')
const seekerId = await signUp(seeker, 'seeker', 'seeker')
const otherId = await signUp(other, 'seeker', 'other')

console.log('\nUsers (private profiles)')
await check('seeker reads own profile', () => getDoc(doc(seeker.db, 'users', seekerId)))
await deny('employer reads seeker profile', () => getDoc(doc(emp.db, 'users', seekerId)))
await deny('seeker reads another seeker', () => getDoc(doc(other.db, 'users', seekerId)))
await deny('seeker changes own role to employer', () => updateDoc(doc(seeker.db, 'users', seekerId), { role: 'employer' }))

console.log('\nCompanies')
const company = { ownerUid: empId, name: 'Acme', logo: { initials: 'AC', color: '#6c47ff' }, website: '', industry: 'Other', size: '', location: '', about: '', supports: [], pledge: true, pledgeSignedAt: now, createdAt: now }
await check('employer creates own company', () => setDoc(doc(emp.db, 'companies', empId), company))
await deny('seeker creates a company', () => setDoc(doc(seeker.db, 'companies', seekerId), { ...company, ownerUid: seekerId }))
await deny('employer edits someone else’s company', () => updateDoc(doc(emp2.db, 'companies', empId), { name: 'Hacked' }))
await setDoc(doc(emp2.db, 'companies', emp2Id), { ...company, ownerUid: emp2Id, name: 'Beta', pledge: false })

console.log('\nJobs')
const job = { companyId: empId, company: 'Acme', logo: company.logo, pledge: true, title: 'Writer', location: 'Remote', mode: 'Remote', type: 'Full-time', hours: 'Flexible', salary: '', func: 'Writing & Content', supports: [], description: 'Write.', responsibilities: [], requirements: [], status: 'open', createdAt: now, updatedAt: now }
const jobId = `job-${stamp}`
await check('employer posts a job', () => setDoc(doc(emp.db, 'jobs', jobId), job))
await deny('unpledged employer fakes the pledge badge', () => setDoc(doc(emp2.db, 'jobs', `fake-${stamp}`), { ...job, companyId: emp2Id, company: 'Beta' }))
await deny('employer posts under another company', () => setDoc(doc(emp2.db, 'jobs', `x-${stamp}`), job))
await check('seeker lists open jobs', () => getDocs(query(collection(seeker.db, 'jobs'), where('status', '==', 'open'))))
await setDoc(doc(emp.db, 'jobs', `closed-${stamp}`), { ...job, status: 'closed' })
await deny('seeker reads a closed job', () => getDoc(doc(seeker.db, 'jobs', `closed-${stamp}`)))

console.log('\nApplications')
const appId = `${jobId}_${seekerId}`
const app = { jobId, seekerUid: seekerId, companyId: empId, jobTitle: 'Writer', companyName: 'Acme', logo: company.logo, status: 'applied', coverNote: 'Hi', applicant: { name: 'seeker' }, disclosure: 'open', disclosed: { journeyStage: 'remission', supportNeeds: [] }, employerMessage: '', updatedBy: 'seeker', history: [{ status: 'applied', at: now }], createdAt: now, updatedAt: now }
await deny('employer applies to a job', () => setDoc(doc(emp.db, 'applications', `${jobId}_${empId}`), { ...app, seekerUid: empId }))
await deny('seeker applies with wrong companyId', () => setDoc(doc(seeker.db, 'applications', appId), { ...app, companyId: emp2Id }))
await deny('seeker applies as already "offer"', () => setDoc(doc(seeker.db, 'applications', appId), { ...app, status: 'offer' }))
await deny('seeker applies to a closed job', () => setDoc(doc(seeker.db, 'applications', `closed-${stamp}_${seekerId}`), { ...app, jobId: `closed-${stamp}` }))
await check('seeker applies', () => setDoc(doc(seeker.db, 'applications', appId), app))
await check('employer sees the applicant', () => getDocs(query(collection(emp.db, 'applications'), where('companyId', '==', empId))))
await deny('other employer reads it', () => getDoc(doc(emp2.db, 'applications', appId)))
await deny('other seeker reads it', () => getDoc(doc(other.db, 'applications', appId)))
await deny('seeker promotes themselves to "offer"', () => updateDoc(doc(seeker.db, 'applications', appId), { status: 'offer', updatedBy: 'seeker', updatedAt: now }))
await deny('employer marks as "hired" (only the seeker can accept)', () => updateDoc(doc(emp.db, 'applications', appId), { status: 'hired', updatedBy: 'employer', updatedAt: now }))
await deny('employer edits the applicant snapshot', () => updateDoc(doc(emp.db, 'applications', appId), { coverNote: 'changed', updatedBy: 'employer', updatedAt: now }))
await check('employer moves to interview with a message', () => updateDoc(doc(emp.db, 'applications', appId), { status: 'interview', employerMessage: 'Let’s talk!', updatedBy: 'employer', updatedAt: now, history: arrayUnion({ status: 'interview', at: now }) }))
await check('employer sends an offer', () => updateDoc(doc(emp.db, 'applications', appId), { status: 'offer', updatedBy: 'employer', updatedAt: now }))
await check('seeker accepts the offer', () => updateDoc(doc(seeker.db, 'applications', appId), { status: 'hired', updatedBy: 'seeker', updatedAt: now }))
await deny('employer changes a hired application', () => updateDoc(doc(emp.db, 'applications', appId), { status: 'not-selected', updatedBy: 'employer', updatedAt: now }))

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed')
await Promise.all([emp, emp2, seeker, other].map((c) => deleteApp(c.app)))
process.exit(failed ? 1 : 0)
