import { createContext, useContext } from 'react'
import type { Job, Profile, User } from '../types'

export interface AppState {
  user: User | null
  signUp: (name: string, email: string, password: string) => string | null
  logIn: (email: string, password: string) => string | null
  logOut: () => void
  updateProfile: (patch: Partial<Profile>) => void
  finishOnboarding: () => void
  toggleSave: (jobId: string) => void
  apply: (jobId: string) => void
}

export const AppContext = createContext<AppState | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

const PROFILE_CHECKS: ((p: Profile) => boolean)[] = [
  (p) => !!p.headline,
  (p) => !!p.location,
  (p) => !!p.bio,
  (p) => !!p.journeyStage,
  (p) => p.workModes.length > 0,
  (p) => !!p.hours,
  (p) => p.functions.length > 0,
  (p) => p.supportNeeds.length > 0,
  (p) => p.skills.length > 0,
  (p) => !!p.currentRole,
]

export function profileCompletion(p: Profile) {
  const done = PROFILE_CHECKS.filter((check) => check(p)).length
  return Math.round((done / PROFILE_CHECKS.length) * 100)
}

/** A gentle 0–100 "fit" score based on what the user chose to share. */
export function matchScore(job: Job, p: Profile | undefined) {
  if (!p) return null
  let score = 55
  if (p.workModes.includes(job.mode)) score += 12
  if (p.functions.includes(job.func)) score += 14
  if (p.jobTypes.includes(job.type)) score += 6
  const overlap = p.supportNeeds.filter((s) => job.supports.includes(s)).length
  score += Math.min(overlap * 5, 15)
  if (job.pledge) score += 3
  return Math.min(score, 98)
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}
