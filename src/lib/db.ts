import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Query,
} from 'firebase/firestore'
import {
  emptyProfile,
  type Answer,
  type ApplicantSnapshot,
  type Application,
  type AppStatus,
  type Company,
  type Disclosed,
  type Job,
  type JobInput,
  type Message,
  type Profile,
  type Role,
  type User,
} from '../types'
import { col, db } from './firebase'

/* ───────────── helpers ───────────── */

const withId = <T>(id: string, data: DocumentData, defaults?: Partial<T>) => ({ ...defaults, ...data, id }) as T

// Fields added after launch; older documents read as if they had these values.
const JOB_DEFAULTS: Partial<Job> = { pay: null, questions: [], rounds: ['Interview'] }
const APP_DEFAULTS: Partial<Application> = { answers: [], round: 0, rounds: ['Interview'], lastMessageAt: 0, lastMessageBy: '' }

function watchList<T>(q: Query, cb: (rows: T[]) => void, onError?: (e: Error) => void, defaults?: Partial<T>) {
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => withId<T>(d.id, d.data(), defaults))),
    (e) => {
      console.error(e)
      onError?.(e)
    },
  )
}

/* ───────────── users ───────────── */

export function createUserDoc(uid: string, name: string, email: string, role: Role) {
  const user: Omit<User, 'id'> = {
    name,
    email,
    role,
    createdAt: Date.now(),
    onboarded: false,
    profile: { ...emptyProfile },
    saved: [],
    seenAt: Date.now(),
  }
  return setDoc(doc(db, col('users'), uid), user)
}

export function watchUser(uid: string, cb: (u: User | null) => void, onError: (e: Error) => void) {
  return onSnapshot(
    doc(db, col('users'), uid),
    (snap) => {
      const data = snap.data()
      // A doc without a SecondHope role (e.g. from another app on the same project) counts as "no profile yet".
      const ours = data?.role === 'seeker' || data?.role === 'employer'
      cb(ours ? withId<User>(snap.id, { saved: [], ...data, profile: { ...emptyProfile, ...data.profile } }) : null)
    },
    onError,
  )
}

export function updateUser(uid: string, patch: Partial<Omit<User, 'id' | 'role' | 'profile'>>) {
  return updateDoc(doc(db, col('users'), uid), patch)
}

export function updateProfile(uid: string, patch: Partial<Profile>) {
  // merge:true deep-merges the `profile` map; arrays inside are replaced as a whole.
  return setDoc(doc(db, col('users'), uid), { profile: patch }, { merge: true })
}

export function setSaved(uid: string, jobId: string, save: boolean) {
  return updateDoc(doc(db, col('users'), uid), { saved: save ? arrayUnion(jobId) : arrayRemove(jobId) })
}

/* ───────────── companies ───────────── */

export function watchCompany(id: string, cb: (c: Company | null) => void) {
  return onSnapshot(
    doc(db, col('companies'), id),
    (snap) => cb(snap.exists() ? withId<Company>(snap.id, snap.data()) : null),
    (e) => {
      console.error(e)
      cb(null)
    },
  )
}

/** Saves the company and keeps the copies on its jobs in sync. */
export async function saveCompany(uid: string, data: Omit<Company, 'id' | 'ownerUid' | 'createdAt'>, isNew: boolean) {
  const batch = writeBatch(db)
  batch.set(
    doc(db, col('companies'), uid),
    { ...data, ownerUid: uid, ...(isNew ? { createdAt: Date.now() } : {}) },
    { merge: true },
  )
  if (!isNew) {
    const jobs = await getDocs(query(collection(db, col('jobs')), where('companyId', '==', uid)))
    jobs.forEach((j) => batch.update(j.ref, { company: data.name, logo: data.logo, pledge: data.pledge }))
  }
  await batch.commit()
}

/* ───────────── jobs ───────────── */

export const watchOpenJobs = (cb: (jobs: Job[]) => void, onError?: (e: Error) => void) =>
  watchList<Job>(query(collection(db, col('jobs')), where('status', '==', 'open')), cb, onError, JOB_DEFAULTS)

export const watchCompanyJobs = (companyId: string, cb: (jobs: Job[]) => void, openOnly = false) =>
  watchList<Job>(
    openOnly
      ? query(collection(db, col('jobs')), where('companyId', '==', companyId), where('status', '==', 'open'))
      : query(collection(db, col('jobs')), where('companyId', '==', companyId)),
    cb,
    undefined,
    JOB_DEFAULTS,
  )

export async function getJob(id: string) {
  const snap = await getDoc(doc(db, col('jobs'), id))
  return snap.exists() ? withId<Job>(snap.id, snap.data(), JOB_DEFAULTS) : null
}

export async function createJob(company: Company, input: JobInput) {
  const now = Date.now()
  const ref = await addDoc(collection(db, col('jobs')), {
    ...input,
    companyId: company.id,
    company: company.name,
    logo: company.logo,
    pledge: company.pledge,
    createdAt: now,
    updatedAt: now,
  })
  return ref.id
}

export const updateJob = (id: string, patch: Partial<JobInput>) =>
  updateDoc(doc(db, col('jobs'), id), { ...patch, updatedAt: Date.now() })

export const deleteJob = (id: string) => deleteDoc(doc(db, col('jobs'), id))

/* ───────────── applications ───────────── */

export const applicationId = (jobId: string, uid: string) => `${jobId}_${uid}`

export const watchMyApplications = (uid: string, cb: (apps: Application[]) => void) =>
  watchList<Application>(query(collection(db, col('applications')), where('seekerUid', '==', uid)), cb, undefined, APP_DEFAULTS)

export const watchCompanyApplications = (companyId: string, cb: (apps: Application[]) => void) =>
  watchList<Application>(query(collection(db, col('applications')), where('companyId', '==', companyId)), cb, undefined, APP_DEFAULTS)

export function disclosedFor(user: User): Disclosed {
  return { journeyStage: user.profile.journeyStage, supportNeeds: user.profile.supportNeeds }
}

/** Health details travel with an application only if the seeker's own setting allows it. */
export function willDisclose(user: User, job: Pick<Job, 'pledge'>) {
  return user.profile.disclosure === 'open' && job.pledge
}

/** Exactly what an employer receives about a person when they apply. */
export function snapshotOf(user: User): ApplicantSnapshot {
  const p = user.profile
  return {
    name: user.name,
    email: user.email,
    phone: p.phone,
    headline: p.headline,
    location: p.location,
    bio: p.bio,
    currentRole: p.currentRole,
    yearsExperience: p.yearsExperience,
    skills: p.skills,
    careerPauseNote: p.careerPause ? p.careerPauseNote : '',
    linkedin: p.linkedin,
  }
}

export function apply(user: User, job: Job, coverNote: string, answers: Answer[]) {
  const now = Date.now()
  const app: Omit<Application, 'id'> = {
    jobId: job.id,
    seekerUid: user.id,
    companyId: job.companyId,
    jobTitle: job.title,
    companyName: job.company,
    logo: job.logo,
    status: 'applied',
    coverNote: coverNote.trim(),
    answers: answers.map((a) => ({ question: a.question, answer: a.answer.trim() })).filter((a) => a.answer),
    applicant: snapshotOf(user),
    disclosure: user.profile.disclosure,
    disclosed: willDisclose(user, job) ? disclosedFor(user) : null,
    employerMessage: '',
    updatedBy: 'seeker',
    round: 0,
    rounds: job.rounds,
    history: [{ status: 'applied', at: now }],
    lastMessageAt: 0,
    lastMessageBy: '',
    createdAt: now,
    updatedAt: now,
  }
  return setDoc(doc(db, col('applications'), applicationId(job.id, user.id)), app)
}

export interface Move {
  app: Application
  status: AppStatus
  /** Index into `rounds` while the status is 'interview'. */
  round: number
  /** The job's current rounds. */
  rounds: string[]
  message: string
}

function movePatch({ status, round, rounds, message }: Move, now: number) {
  return {
    status,
    round,
    rounds,
    employerMessage: message.trim(),
    updatedBy: 'employer',
    updatedAt: now,
    history: arrayUnion(status === 'interview' ? { status, at: now, round } : { status, at: now }),
  }
}

export const moveCandidate = (move: Move) => updateDoc(doc(db, col('applications'), move.app.id), movePatch(move, Date.now()))

/** Moves several candidates at once — all succeed or none do. */
export async function moveCandidates(moves: Move[]) {
  const now = Date.now()
  const batch = writeBatch(db)
  moves.forEach((m) => batch.update(doc(db, col('applications'), m.app.id), movePatch(m, now)))
  await batch.commit()
}

/* ───────────── messages ───────────── */

const messagesOf = (appId: string) => collection(db, col('applications'), appId, 'messages')

export const watchMessages = (appId: string, cb: (msgs: Message[]) => void) =>
  watchList<Message>(query(messagesOf(appId), orderBy('at')), cb)

export async function sendMessage(app: Application, from: Message['from'], uid: string, text: string) {
  const now = Date.now()
  const batch = writeBatch(db)
  const msg: Omit<Message, 'id'> = { from, uid, text: text.trim(), at: now }
  batch.set(doc(messagesOf(app.id)), msg)
  // Lets the other side's notification bell know without reading every thread.
  batch.update(doc(db, col('applications'), app.id), { lastMessageAt: now, lastMessageBy: from })
  await batch.commit()
}

export function withdraw(app: Application) {
  const now = Date.now()
  return updateDoc(doc(db, col('applications'), app.id), {
    status: 'withdrawn',
    updatedBy: 'seeker',
    updatedAt: now,
    history: arrayUnion({ status: 'withdrawn', at: now }),
  })
}

export function acceptOffer(app: Application, user: User) {
  const now = Date.now()
  return updateDoc(doc(db, col('applications'), app.id), {
    status: 'hired',
    updatedBy: 'seeker',
    updatedAt: now,
    history: arrayUnion({ status: 'hired', at: now }),
    // "Share after an offer" — this is the moment the seeker agreed to.
    ...(app.disclosure === 'after-offer' && user.profile.disclosure !== 'private' ? { disclosed: disclosedFor(user) } : {}),
  })
}

/* ───────────── account deletion ───────────── */

/** Removes everything the user owns. Run before deleting the Auth account. */
export async function deleteUserData(user: User) {
  const batch = writeBatch(db)
  if (user.role === 'seeker') {
    const apps = await getDocs(query(collection(db, col('applications')), where('seekerUid', '==', user.id)))
    const threads = await Promise.all(apps.docs.map((a) => getDocs(messagesOf(a.id))))
    threads.forEach((t) => t.forEach((m) => batch.delete(m.ref)))
    apps.forEach((a) => batch.delete(a.ref))
  } else {
    const jobs = await getDocs(query(collection(db, col('jobs')), where('companyId', '==', user.id)))
    jobs.forEach((j) => batch.delete(j.ref))
    batch.delete(doc(db, col('companies'), user.id))
  }
  batch.delete(doc(db, col('users'), user.id))
  await batch.commit()
}
