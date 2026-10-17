import {
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Search,
  Settings,
  UserRound,
  Users,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { APP_STATUS } from '../data/options'
import { homeFor, timeAgo, useApp } from '../context/store'
import { useCompanyApplications, useMyApplications } from '../lib/hooks'
import type { User } from '../types'
import { Avatar, CompanyLogo, Logo } from './Brand'

const SEEKER_NAV = [
  ['/jobs', 'Find Jobs', Search],
  ['/jobs?saved=1', 'Saved', Bookmark],
  ['/applications', 'Applications', Briefcase],
  ['/profile', 'Profile', UserRound],
] as const

const EMPLOYER_NAV = [
  ['/employer', 'Dashboard', LayoutDashboard],
  ['/employer/candidates', 'Candidates', Users],
  ['/employer/jobs/new', 'Post a job', PlusCircle],
  ['/employer/company', 'Company', Building2],
] as const

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onOutside()
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [onOutside])
  return ref
}

interface Note {
  id: string
  logo: { initials: string; color: string }
  text: ReactNode
  at: number
  to: string
}

function useNotes(user: User): Note[] {
  const seeker = user.role === 'seeker'
  const mine = useMyApplications(seeker ? user.id : undefined).data
  const incoming = useCompanyApplications(seeker ? undefined : user.id).data
  if (seeker) {
    return mine
      .filter((a) => a.updatedBy === 'employer')
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 8)
      .map((a) => ({
        id: a.id,
        logo: a.logo,
        at: a.updatedAt,
        to: `/applications?app=${a.id}`,
        text: (
          <>
            <strong>{a.companyName}</strong> moved your application for {a.jobTitle} to{' '}
            <strong>{APP_STATUS[a.status].label}</strong>
          </>
        ),
      }))
  }
  return incoming.slice(0, 8).map((a) => ({
    id: a.id,
    logo: { initials: a.applicant.name.slice(0, 2).toUpperCase(), color: '#6c47ff' },
    at: a.createdAt,
    to: `/employer/candidates?app=${a.id}`,
    text: (
      <>
        <strong>{a.applicant.name}</strong> applied for {a.jobTitle}
      </>
    ),
  }))
}

function Notifications({ user }: { user: User }) {
  const { markSeen } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(() => setOpen(false))
  const notes = useNotes(user)
  const unread = notes.filter((n) => n.at > user.seenAt).length

  return (
    <div className="menu" ref={ref}>
      <button
        aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
        className="icon-btn"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o)
          if (!open && unread) markSeen()
        }}
      >
        <Bell size={18} />
        {unread > 0 && <span className="dot" />}
      </button>
      {open && (
        <div className="menu__list menu__list--wide">
          <div className="menu__head">
            <strong>Notifications</strong>
          </div>
          {notes.length === 0 ? (
            <p className="menu__empty muted small">
              {user.role === 'seeker'
                ? 'Updates from employers will appear here.'
                : 'New applications will appear here.'}
            </p>
          ) : (
            notes.map((n) => (
              <Link key={n.id} to={n.to} className={`note ${n.at > user.seenAt ? 'note--new' : ''}`} onClick={() => setOpen(false)}>
                <CompanyLogo {...n.logo} size={32} />
                <span>
                  <span className="note__text">{n.text}</span>
                  <small>{timeAgo(n.at)}</small>
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function AppHeader() {
  const { user, logOut } = useApp()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(() => setOpen(false))
  if (!user) return null

  const nav = user.role === 'employer' ? EMPLOYER_NAV : SEEKER_NAV
  const here = pathname + search
  const isActive = (to: string) => {
    if (to.includes('?')) return here.startsWith(to)
    if (to === '/jobs') return pathname === '/jobs' && !search.includes('saved=1')
    if (to === '/employer') return pathname === '/employer'
    return pathname.startsWith(to)
  }

  return (
    <header className="app-header">
      <Logo dark to={homeFor(user)} />
      <nav className="app-header__nav" aria-label="Main">
        {nav.map(([to, label, Icon]) => (
          <Link key={to} to={to} className={isActive(to) ? 'active' : ''} aria-current={isActive(to) ? 'page' : undefined}>
            <Icon size={18} className="app-header__nav-icon" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="app-header__icons">
        <Notifications user={user} />
        <Link to="/settings" aria-label="Settings" className="icon-btn">
          <Settings size={18} />
        </Link>
        <div className="menu" ref={ref}>
          <button className="menu__trigger" onClick={() => setOpen((o) => !o)} aria-label="Account menu" aria-expanded={open}>
            <Avatar name={user.name} size={34} />
          </button>
          {open && (
            <div className="menu__list">
              <div className="menu__head">
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
              {user.role === 'seeker' ? (
                <Link to="/profile" onClick={() => setOpen(false)}>
                  <UserRound size={14} /> My profile
                </Link>
              ) : (
                <Link to="/employer/company" onClick={() => setOpen(false)}>
                  <Building2 size={14} /> Company profile
                </Link>
              )}
              <Link to="/settings" onClick={() => setOpen(false)}>
                <Settings size={14} /> Settings & comfort
              </Link>
              <button
                onClick={async () => {
                  await logOut()
                  navigate('/')
                }}
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
