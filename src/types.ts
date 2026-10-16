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

export interface Application {
  jobId: string
  date: string
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
  onboarded: boolean
  profile: Profile
  saved: string[]
  applied: Application[]
}

export interface Job {
  id: string
  title: string
  company: string
  logo: { initials: string; color: string }
  location: string
  mode: 'Remote' | 'Hybrid' | 'On-site'
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance'
  hours: 'Standard' | 'Flexible' | 'Reduced'
  salary: string
  func: string
  postedDays: number
  pledge: boolean
  supports: string[]
  description: string
  responsibilities: string[]
  requirements: string[]
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
