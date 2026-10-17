import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateAuthProfile,
  type User as AuthUser,
} from 'firebase/auth'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import * as data from '../lib/db'
import { auth } from '../lib/firebase'
import type { Profile, Role, User } from '../types'
import { AppContext, friendlyError, type AppState } from './store'

async function attempt(fn: () => Promise<unknown>) {
  try {
    await fn()
    return null
  } catch (e) {
    console.error(e)
    return friendlyError(e)
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [userLoaded, setUserLoaded] = useState(false)
  // Between creating the Auth account and writing users/{uid}; hides the brief "no profile yet" state.
  const [creating, setCreating] = useState(false)

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setAuthUser(u)
        setUserLoaded(false)
        if (!u) setUser(null)
        setAuthReady(true)
      }),
    [],
  )

  useEffect(() => {
    if (!authUser) return
    return data.watchUser(
      authUser.uid,
      (u) => {
        setUser(u)
        setUserLoaded(true)
      },
      (e) => {
        console.error(e)
        setUserLoaded(true)
      },
    )
  }, [authUser])

  // `creating` only matters once the Auth account exists; before that, the sign-up form must
  // stay mounted so it can show errors such as "email already in use".
  const loading = !authReady || (!!authUser && (creating || !userLoaded))

  const value = useMemo<AppState>(() => {
    const uid = authUser?.uid
    return {
      authUser,
      user,
      loading,
      needsRole: !!authUser && userLoaded && !user,

      signUp: async (name, email, password, role) => {
        setCreating(true)
        const err = await attempt(async () => {
          const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
          await updateAuthProfile(cred.user, { displayName: name.trim() })
          await data.createUserDoc(cred.user.uid, name.trim(), cred.user.email ?? email.trim(), role)
          // Non-blocking: we never gate anything behind verification.
          sendEmailVerification(cred.user).catch(() => {})
        })
        setCreating(false)
        return err
      },

      logIn: (email, password) => attempt(() => signInWithEmailAndPassword(auth, email.trim(), password)),

      googleSignIn: () => attempt(() => signInWithPopup(auth, new GoogleAuthProvider())),

      chooseRole: (role: Role) =>
        attempt(async () => {
          if (!authUser) throw new Error('Not signed in')
          await data.createUserDoc(
            authUser.uid,
            authUser.displayName ?? authUser.email?.split('@')[0] ?? 'Friend',
            authUser.email ?? '',
            role,
          )
        }),

      resetPassword: (email) => attempt(() => sendPasswordResetEmail(auth, email.trim())),

      logOut: () => signOut(auth),

      updateProfile: async (patch: Partial<Profile>) => {
        if (uid) await data.updateProfile(uid, patch)
      },

      finishOnboarding: async () => {
        if (uid) await data.updateUser(uid, { onboarded: true })
      },

      toggleSave: (jobId: string) => {
        if (uid && user) data.setSaved(uid, jobId, !user.saved.includes(jobId)).catch(console.error)
      },

      markSeen: () => {
        if (uid) data.updateUser(uid, { seenAt: Date.now() }).catch(console.error)
      },

      deleteAccount: (password) =>
        attempt(async () => {
          if (!authUser || !user) throw new Error('Not signed in')
          if (password && authUser.email) {
            await reauthenticateWithCredential(authUser, EmailAuthProvider.credential(authUser.email, password))
          } else {
            await reauthenticateWithPopup(authUser, new GoogleAuthProvider())
          }
          await data.deleteUserData(user)
          await deleteUser(authUser)
        }),
    }
  }, [authUser, user, loading, userLoaded])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
