import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

// All config comes from env vars, so switching to another Firebase project
// is just a matter of editing `.env.local` (see `.env.example`).
const env = import.meta.env
export const useEmulators = env.VITE_USE_EMULATORS === 'true'

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? (useEmulators ? 'demo-key' : undefined),
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? (useEmulators ? 'demo-secondhope' : undefined),
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = !!(config.apiKey && config.projectId)

// Optional prefix for every collection name, e.g. `sh_` → `sh_users`, `sh_jobs`.
// Lets SecondHope share a Firebase project with another app without the two touching each other's data.
const prefix = env.VITE_COLLECTION_PREFIX ?? ''
export const col = (name: 'users' | 'companies' | 'jobs' | 'applications') => prefix + name

const app = initializeApp(firebaseConfigured ? config : { apiKey: 'missing', projectId: 'missing' })

export const auth = getAuth(app)
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
