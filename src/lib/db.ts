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
  type ApplicantSnapshot,
  type Application,
  type AppStatus,
  type Company,
  type Disclosed,
  type Job,
  type JobInput,
  type Profile,
  type Role,
  type User,
} from '../types'
import { db } from './firebase'

/* ───────────── helpers ───────────── */

const withId = <T>(id: string, data: DocumentData) => ({ ...data, id }) as T

function watchList<T>(q: Query, cb: (rows: T[]) => void, onError?: (e: Error) => void) {
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => withId<T>(d.id, d.data()))),
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
  return setDoc(doc(db, 'users', uid), user)
}

export function watchUser(uid: string, cb: (u: User | null) => void, onError: (e: Error) => void) {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => cb(snap.exists() ? withId<User>(snap.id, { profile: emptyProfile, saved: [], ...snap.data() }) : null),
    onError,
  )
}

export function updateUser(uid: string, patch: Partial<Omit<User, 'id' | 'role' | 'profile'>>) {
  return updateDoc(doc(db, 'users', uid), patch)
}

export function updateProfile(uid: string, patch: Partial<Profile>) {
  // merge:true deep-merges the `profile` map; arrays inside are replaced as a whole.
  return setDoc(doc(db, 'users', uid), { profile: patch }, { merge: true })
}

export function setSaved(uid: string, jobId: string, save: boolean) {
  return updateDoc(doc(db, 'users', uid), { saved: save ? arrayUnion(jobId) : arrayRemove(jobId) })
}

/* ───────────── companies ───────────── */

export function watchCompany(id: string, cb: (c: Company | null) => void) {
  return onSnapshot(
    doc(db, 'companies', id),
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
    doc(db, 'companies', uid),
    { ...data, ownerUid: uid, ...(isNew ? { createdAt: Date.now() } : {}) },
    { merge: true },
  )
  if (!isNew) {
    const jobs = await getDocs(query(collection(db, 'jobs'), where('companyId', '==', uid)))
    jobs.forEach((j) => batch.update(j.ref, { company: data.name, logo: data.logo, pledge: data.pledge }))
  }
  await batch.commit()
}

/* ───────────── jobs ───────────── */

export const watchOpenJobs = (cb: (jobs: Job[]) => void, onError?: (e: Error) => void) =>
  watchList<Job>(query(collection(db, 'jobs'), where('status', '==', 'open')), cb, onError)

export const watchCompanyJobs = (companyId: string, cb: (jobs: Job[]) => void, openOnly = false) =>
  watchList<Job>(
    openOnly
      ? query(collection(db, 'jobs'), where('companyId', '==', companyId), where('status', '==', 'open'))
      : query(collection(db, 'jobs'), where('companyId', '==', companyId)),
    cb,
  )

export async function getJob(id: string) {
  const snap = await getDoc(doc(db, 'jobs', id))
  return snap.exists() ? withId<Job>(snap.id, snap.data()) : null
}

export async function createJob(company: Company, input: JobInput) {
  const now = Date.now()
  const ref = await addDoc(collection(db, 'jobs'), {
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
  updateDoc(doc(db, 'jobs', id), { ...patch, updatedAt: Date.now() })

export const deleteJob = (id: string) => deleteDoc(doc(db, 'jobs', id))

/* ───────────── applications ───────────── */

export const applicationId = (jobId: string, uid: string) => `${jobId}_${uid}`

export const watchMyApplications = (uid: string, cb: (apps: Application[]) => void) =>
  watchList<Application>(query(collection(db, 'applications'), where('seekerUid', '==', uid)), cb)

export const watchCompanyApplications = (companyId: string, cb: (apps: Application[]) => void) =>
  watchList<Application>(query(collection(db, 'applications'), where('companyId', '==', companyId)), cb)

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

export function apply(user: User, job: Job, coverNote: string) {
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
    applicant: snapshotOf(user),
    disclosure: user.profile.disclosure,
    disclosed: willDisclose(user, job) ? disclosedFor(user) : null,
    employerMessage: '',
    updatedBy: 'seeker',
    history: [{ status: 'applied', at: now }],
    createdAt: now,
    updatedAt: now,
  }
  return setDoc(doc(db, 'applications', applicationId(job.id, user.id)), app)
}

export function setStatusAsEmployer(app: Application, status: AppStatus, message: string) {
  const now = Date.now()
  return updateDoc(doc(db, 'applications', app.id), {
    status,
    employerMessage: message.trim(),
    updatedBy: 'employer',
    updatedAt: now,
    history: arrayUnion({ status, at: now }),
  })
}

export function withdraw(app: Application) {
  const now = Date.now()
  return updateDoc(doc(db, 'applications', app.id), {
    status: 'withdrawn',
    updatedBy: 'seeker',
    updatedAt: now,
    history: arrayUnion({ status: 'withdrawn', at: now }),
  })
}

export function acceptOffer(app: Application, user: User) {
  const now = Date.now()
  return updateDoc(doc(db, 'applications', app.id), {
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
    const apps = await getDocs(query(collection(db, 'applications'), where('seekerUid', '==', user.id)))
    apps.forEach((a) => batch.delete(a.ref))
  } else {
    const jobs = await getDocs(query(collection(db, 'jobs'), where('companyId', '==', user.id)))
    jobs.forEach((j) => batch.delete(j.ref))
    batch.delete(doc(db, 'companies', user.id))
  }
  batch.delete(doc(db, 'users', user.id))
  await batch.commit()
}
