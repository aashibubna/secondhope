import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './context/store'
import { Login, SignUp } from './pages/Auth'
import Jobs from './pages/Jobs'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useApp()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ next: location.pathname + location.search }} />
  return children
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useApp()
  if (user) return <Navigate to={user.onboarded ? '/jobs' : '/onboarding'} replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<GuestOnly><SignUp /></GuestOnly>} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
      <Route path="/jobs" element={<RequireAuth><Jobs /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
