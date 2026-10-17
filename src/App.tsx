import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { SetupNotice, Splash } from './components/Status'
import { homeFor, useApp } from './context/store'
import { firebaseConfigured } from './lib/firebase'
import Landing from './pages/Landing'
import type { Role } from './types'

// Each area loads on demand so the first visit stays light on slow connections.
const auth = () => import('./pages/Auth')
const SignUp = lazy(() => auth().then((m) => ({ default: m.SignUp })))
const Login = lazy(() => auth().then((m) => ({ default: m.Login })))
const ForgotPassword = lazy(() => auth().then((m) => ({ default: m.ForgotPassword })))
const ChooseRole = lazy(() => auth().then((m) => ({ default: m.ChooseRole })))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Jobs = lazy(() => import('./pages/Jobs'))
const Applications = lazy(() => import('./pages/Applications'))
const Profile = lazy(() => import('./pages/Profile'))
const CompanyPage = lazy(() => import('./pages/CompanyPage'))
const Settings = lazy(() => import('./pages/Settings'))
const Dashboard = lazy(() => import('./pages/employer/Dashboard'))
const CompanySetup = lazy(() => import('./pages/employer/CompanySetup'))
const JobForm = lazy(() => import('./pages/employer/JobForm'))
const Candidates = lazy(() => import('./pages/employer/Candidates'))

function RequireAuth({ children, role }: { children: ReactNode; role?: Role }) {
  const { authUser, user, loading, needsRole } = useApp()
  const location = useLocation()
  if (loading) return <Splash />
  if (!authUser) return <Navigate to="/login" replace state={{ next: location.pathname + location.search }} />
  if (needsRole || !user) return <Navigate to="/welcome" replace />
  if (role && user.role !== role) return <Navigate to={homeFor(user)} replace />
  return children
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading, needsRole } = useApp()
  const location = useLocation()
  if (loading) return <Splash />
  if (needsRole) return <Navigate to="/welcome" replace />
  if (user) {
    const next = (location.state as { next?: string } | null)?.next
    return <Navigate to={user.onboarded && next ? next : homeFor(user)} replace />
  }
  return children
}

function NeedsRole({ children }: { children: ReactNode }) {
  const { user, loading, needsRole } = useApp()
  if (loading) return <Splash />
  if (!needsRole) return <Navigate to={homeFor(user)} replace />
  return children
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  if (!firebaseConfigured) return <SetupNotice />
  return (
    <>
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<Splash />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/signup"
              element={
                <GuestOnly>
                  <SignUp />
                </GuestOnly>
              }
            />
            <Route
              path="/login"
              element={
                <GuestOnly>
                  <Login />
                </GuestOnly>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <GuestOnly>
                  <ForgotPassword />
                </GuestOnly>
              }
            />
            <Route
              path="/welcome"
              element={
                <NeedsRole>
                  <ChooseRole />
                </NeedsRole>
              }
            />

            {/* Job seekers */}
            <Route
              path="/onboarding"
              element={
                <RequireAuth role="seeker">
                  <Onboarding />
                </RequireAuth>
              }
            />
            <Route
              path="/jobs"
              element={
                <RequireAuth role="seeker">
                  <Jobs />
                </RequireAuth>
              }
            />
            <Route
              path="/applications"
              element={
                <RequireAuth role="seeker">
                  <Applications />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth role="seeker">
                  <Profile />
                </RequireAuth>
              }
            />

            {/* Employers */}
            <Route
              path="/employer"
              element={
                <RequireAuth role="employer">
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/employer/setup"
              element={
                <RequireAuth role="employer">
                  <CompanySetup />
                </RequireAuth>
              }
            />
            <Route
              path="/employer/company"
              element={
                <RequireAuth role="employer">
                  <CompanySetup editing />
                </RequireAuth>
              }
            />
            <Route
              path="/employer/jobs/new"
              element={
                <RequireAuth role="employer">
                  <JobForm />
                </RequireAuth>
              }
            />
            <Route
              path="/employer/jobs/:id/edit"
              element={
                <RequireAuth role="employer">
                  <JobForm />
                </RequireAuth>
              }
            />
            <Route
              path="/employer/candidates"
              element={
                <RequireAuth role="employer">
                  <Candidates />
                </RequireAuth>
              }
            />

            {/* Everyone signed in */}
            <Route
              path="/companies/:id"
              element={
                <RequireAuth>
                  <CompanyPage />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <Settings />
                </RequireAuth>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  )
}
