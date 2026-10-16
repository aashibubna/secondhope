import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { emptyProfile, type Profile, type User } from '../types'
import { AppContext, type AppState } from './store'

// Front-end only demo storage. Replace with real API calls when a backend exists.
const USERS_KEY = 'secondhope.users'
const SESSION_KEY = 'secondhope.session'

function loadUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as User[]
  } catch {
    return []
  }
}

function saveUsers(users: User[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    /* storage unavailable */
  }
}

function loadSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(loadUsers)
  const [sessionId, setSessionId] = useState<string | null>(loadSession)

  useEffect(() => saveUsers(users), [users])
  useEffect(() => {
    try {
      if (sessionId) localStorage.setItem(SESSION_KEY, sessionId)
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      /* storage unavailable */
    }
  }, [sessionId])

  const user = users.find((u) => u.id === sessionId) ?? null

  const updateUser = useCallback(
    (fn: (u: User) => User) => {
      setUsers((all) => all.map((u) => (u.id === sessionId ? fn(u) : u)))
    },
    [sessionId],
  )

  const signUp = useCallback(
    (name: string, email: string, password: string) => {
      const normalized = email.trim().toLowerCase()
      if (users.some((u) => u.email === normalized)) {
        return 'An account with this email already exists. Try logging in.'
      }
      const newUser: User = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: normalized,
        password,
        createdAt: new Date().toISOString(),
        onboarded: false,
        profile: { ...emptyProfile },
        saved: [],
        applied: [],
      }
      setUsers((all) => [...all, newUser])
      setSessionId(newUser.id)
      return null
    },
    [users],
  )

  const logIn = useCallback(
    (email: string, password: string) => {
      const found = users.find((u) => u.email === email.trim().toLowerCase())
      if (!found || found.password !== password) return 'That email and password do not match.'
      setSessionId(found.id)
      return null
    },
    [users],
  )

  const value = useMemo<AppState>(
    () => ({
      user,
      signUp,
      logIn,
      logOut: () => setSessionId(null),
      updateProfile: (patch: Partial<Profile>) =>
        updateUser((u) => ({ ...u, profile: { ...u.profile, ...patch } })),
      finishOnboarding: () => updateUser((u) => ({ ...u, onboarded: true })),
      toggleSave: (jobId: string) =>
        updateUser((u) => ({
          ...u,
          saved: u.saved.includes(jobId) ? u.saved.filter((id) => id !== jobId) : [...u.saved, jobId],
        })),
      apply: (jobId: string) =>
        updateUser((u) =>
          u.applied.some((a) => a.jobId === jobId)
            ? u
            : { ...u, applied: [...u.applied, { jobId, date: new Date().toISOString() }] },
        ),
    }),
    [user, signUp, logIn, updateUser],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
