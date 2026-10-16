import { Bell, LogOut, Settings, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/store'
import { Avatar, Logo } from './Brand'

const NAV = [
  ['/jobs', 'Find Jobs'],
  ['/jobs?saved=1', 'Saved'],
  ['/profile?tab=applications', 'Applications'],
  ['/profile', 'Profile'],
] as const

export default function AppHeader() {
  const { user, logOut } = useApp()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <header className="app-header">
      <Logo dark to="/jobs" />
      <nav className="app-header__nav">
        {NAV.map(([to, label]) => (
          <Link key={to} to={to} className={
              pathname + search === to ||
              (to === '/profile' && pathname === '/profile' && !search.includes('applications'))
                ? 'active'
                : ''
            }>
            {label}
          </Link>
        ))}
      </nav>
      <div className="app-header__icons">
        <button aria-label="Notifications" className="icon-btn">
          <Bell size={18} />
          <span className="dot" />
        </button>
        <Link to="/profile?tab=journey" aria-label="Privacy settings" className="icon-btn">
          <Settings size={18} />
        </Link>
        {user && (
          <div className="menu" ref={ref}>
            <button className="menu__trigger" onClick={() => setOpen((o) => !o)} aria-label="Account menu">
              <Avatar name={user.name} size={34} />
            </button>
            {open && (
              <div className="menu__list">
                <div className="menu__head">
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                </div>
                <Link to="/profile" onClick={() => setOpen(false)}>
                  <UserRound size={14} /> My profile
                </Link>
                <button
                  onClick={() => {
                    logOut()
                    navigate('/')
                  }}
                >
                  <LogOut size={14} /> Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
