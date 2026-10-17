export type Role = 'seeker' | 'employer'

export type JourneyStage =
  | ''
  | 'in-treatment'
  | 'remission'
  | 'survivor'
  | 'caregiver'
  | 'prefer-not'

export type Disclosure = 'private' | 'after-offer' | 'open'

export interface Profile {
  headline: string
  location: string
  phone: string
  bio: string
  journeyStage: JourneyStage
  disclosure: Disclosure
  workModes: string[]
  hours: string
  jobTypes: string[]
  functions: string[]
  supportNeeds: string[]
  accommodationNotes: string
  skills: string[]
  currentRole: string
  yearsExperience: string
  careerPause: boolean
  careerPauseNote: string
  linkedin: string
}

/** `users/{uid}` — readable and writable only by its owner. */
export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: number
  onboarded: boolean
  /** Seekers only. Employers keep an empty profile. */
  profile: Profile
  saved: string[]
  /** Last time the notification bell was opened (ms). */
  seenAt: number
}

export interface Logo {
  initials: string
  color: string
}

/** `companies/{ownerUid}` — public. */
export interface Company {
  id: string
  ownerUid: string
  name: string
  logo: Logo
  website: string
  industry: string
  size: string
  location: string
  about: string
  supports: string[]
  pledge: boolean
  pledgeSignedAt: number | null
  createdAt: number
}

export type JobStatus = 'open' | 'closed'

export interface Job {
  id: string
  companyId: string
  /** Denormalised from the company so the job board needs a single query. */
  company: string
  logo: Logo
  pledge: boolean
  title: string
  location: string
  mode: 'Remote' | 'Hybrid' | 'On-site'
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance'
  hours: 'Standard' | 'Flexible' | 'Reduced'
  salary: string
  func: string
  supports: string[]
  description: string
  responsibilities: string[]
  requirements: string[]
  status: JobStatus
  createdAt: number
  updatedAt: number
}

export type JobInput = Omit<Job, 'id' | 'companyId' | 'company' | 'logo' | 'pledge' | 'createdAt' | 'updatedAt'>

export type AppStatus =
  | 'applied'
  | 'reviewing'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'not-selected'
  | 'withdrawn'

/** What the employer receives when someone applies — a snapshot, never a live view of the profile. */
export interface ApplicantSnapshot {
  name: string
  email: string
  phone: string
  headline: string
  location: string
  bio: string
  currentRole: string
  yearsExperience: string
  skills: string[]
  careerPauseNote: string
  linkedin: string
}

/**
 * Health context — only present when the applicant chose to share it.
 * Accommodation notes are never included: the profile promises they are used only for matching.
 */
export interface Disclosed {
  journeyStage: JourneyStage
  supportNeeds: string[]
}

/** `applications/{jobId}_{seekerUid}` */
export interface Application {
  id: string
  jobId: string
  seekerUid: string
  companyId: string
  jobTitle: string
  companyName: string
  logo: Logo
  status: AppStatus
  coverNote: string
  applicant: ApplicantSnapshot
  disclosure: Disclosure
  disclosed: Disclosed | null
  employerMessage: string
  updatedBy: 'seeker' | 'employer'
  history: { status: AppStatus; at: number }[]
  createdAt: number
  updatedAt: number
}

export const emptyProfile: Profile = {
  headline: '',
  location: '',
  phone: '',
  bio: '',
  journeyStage: '',
  disclosure: 'private',
  workModes: [],
  hours: '',
  jobTypes: [],
  functions: [],
  supportNeeds: [],
  accommodationNotes: '',
  skills: [],
  currentRole: '',
  yearsExperience: '',
  careerPause: false,
  careerPauseNote: '',
  linkedin: '',
}
