import type { User as AuthUser } from 'firebase/auth'
import { createContext, useContext } from 'react'
import type { Job, Profile, Role, User } from '../types'

export interface AppState {
  /** Firebase Auth account. */
  authUser: AuthUser | null
  /** The `users/{uid}` document. Null while loading or before a role is chosen. */
  user: User | null
  /** True until we know whether someone is signed in. */
  loading: boolean
  /** Signed in (e.g. via Google) but has not picked seeker / employer yet. */
  needsRole: boolean
  /** Actions resolve to an error message for the user, or null on success. */
  signUp: (name: string, email: string, password: string, role: Role) => Promise<string | null>
  logIn: (email: string, password: string) => Promise<string | null>
  googleSignIn: () => Promise<string | null>
  chooseRole: (role: Role) => Promise<string | null>
  resetPassword: (email: string) => Promise<string | null>
  logOut: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<void>
  finishOnboarding: () => Promise<void>
  toggleSave: (jobId: string) => void
  markSeen: () => void
  deleteAccount: (password: string | null) => Promise<string | null>
}

export const AppContext = createContext<AppState | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

export function homeFor(user: User | null) {
  if (!user) return '/'
  if (user.role === 'employer') return user.onboarded ? '/employer' : '/employer/setup'
  return user.onboarded ? '/jobs' : '/onboarding'
}

/** Turns Firebase error codes into calm, plain-language messages. */
export function friendlyError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
    'auth/invalid-email': 'That email address doesn’t look quite right.',
    'auth/weak-password': 'Please choose a password with at least 8 characters.',
    'auth/invalid-credential': 'That email and password don’t match. Take your time and try again.',
    'auth/wrong-password': 'That password doesn’t match. Take your time and try again.',
    'auth/user-not-found': 'We couldn’t find an account with that email.',
    'auth/too-many-requests': 'Too many attempts for now. Please take a short break and try again in a few minutes.',
    'auth/popup-closed-by-user': 'The sign-in window was closed before finishing.',
    'auth/network-request-failed': 'We couldn’t reach the server. Please check your connection.',
    'auth/requires-recent-login': 'For your safety, please confirm your password to continue.',
    'permission-denied': 'You don’t have permission to do that.',
    unavailable: 'You seem to be offline. Your changes will sync when you reconnect.',
  }
  return map[code] ?? 'Something went wrong on our side. Please try again in a moment.'
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

export function timeAgo(ms: number) {
  const days = Math.floor((Date.now() - ms) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

export const shortDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
