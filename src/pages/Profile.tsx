import {
  ArrowRight,
  Bookmark,
  Briefcase,
  CheckCircle2,
  HeartHandshake,
  HeartPulse,
  Lock,
  MapPin,
  Settings2,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { Avatar, CompanyLogo } from '../components/Brand'
import {
  AboutSection,
  ExperienceSection,
  JourneySection,
  PreferencesSection,
  SupportSection,
  type SectionProps,
} from '../components/ProfileSections'
import { profileCompletion, useApp } from '../context/store'
import { JOBS } from '../data/jobs'
import { DISCLOSURE_OPTIONS, JOURNEY_STAGES } from '../data/options'
import type { Profile as ProfileT } from '../types'

const SECTIONS: {
  id: string
  label: string
  icon: typeof UserRound
  desc: string
  Component: (p: SectionProps) => React.JSX.Element
}[] = [
  { id: 'about', label: 'About you', icon: UserRound, desc: 'Basic details employers see first.', Component: AboutSection },
  {
    id: 'journey',
    label: 'Journey & privacy',
    icon: Lock,
    desc: 'Optional. Control exactly who sees what.',
    Component: JourneySection,
  },
  {
    id: 'preferences',
    label: 'Work preferences',
    icon: Settings2,
    desc: 'The kind of work that fits right now.',
    Component: PreferencesSection,
  },
  {
    id: 'support',
    label: 'Support needs',
    icon: HeartHandshake,
    desc: 'Accommodations that help you do your best work.',
    Component: SupportSection,
  },
  {
    id: 'experience',
    label: 'Experience & skills',
    icon: Briefcase,
    desc: 'Your background, in your own words.',
    Component: ExperienceSection,
  },
]

function SectionEditor({ id }: { id: string }) {
  const { user, updateProfile } = useApp()
  const section = SECTIONS.find((s) => s.id === id)!
  const [draft, setDraft] = useState<ProfileT>(user!.profile)
  const [saved, setSaved] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(user!.profile)

  return (
    <div className="card">
      <div className="card__head">
        <div>
          <h2>{section.label}</h2>
          <p className="muted small">{section.desc}</p>
        </div>
        {saved && !dirty && (
          <span className="saved-flag">
            <CheckCircle2 size={14} /> Saved
          </span>
        )}
      </div>
      <section.Component
        profile={draft}
        set={(patch) => {
          setSaved(false)
          setDraft((d) => ({ ...d, ...patch }))
        }}
      />
      <div className="card__foot">
        <button className="btn btn--ghost" disabled={!dirty} onClick={() => setDraft(user!.profile)}>
          Discard
        </button>
        <button
          className="btn btn--primary"
          disabled={!dirty}
          onClick={() => {
            updateProfile(draft)
            setSaved(true)
          }}
        >
          Save changes
        </button>
      </div>
    </div>
  )
}

function JobList({ ids, empty }: { ids: { id: string; meta: string }[]; empty: string }) {
  if (!ids.length)
    return (
      <div className="empty empty--small">
        <p className="muted">{empty}</p>
        <Link to="/jobs" className="btn btn--dark btn--sm">
          Browse jobs <ArrowRight size={14} />
        </Link>
      </div>
    )
  return (
    <ul className="mini-jobs">
      {ids.map(({ id, meta }) => {
        const job = JOBS.find((j) => j.id === id)
        if (!job) return null
        return (
          <li key={id}>
            <CompanyLogo {...job.logo} size={40} />
            <div>
              <strong>{job.title}</strong>
              <small>
                {job.company} · {job.location}
              </small>
            </div>
            <span className="pill">{meta}</span>
          </li>
        )
      })}
    </ul>
  )
}

export default function Profile() {
  const { user } = useApp()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'about'
  if (!user) return null

  const p = user.profile
  const completion = profileCompletion(p)
  const stage = JOURNEY_STAGES.find((s) => s.value === p.journeyStage)
  const disclosure = DISCLOSURE_OPTIONS.find((d) => d.value === p.disclosure)
  const missing = SECTIONS.filter((s) => {
    if (s.id === 'about') return !p.headline || !p.bio
    if (s.id === 'journey') return !p.journeyStage
    if (s.id === 'preferences') return !p.workModes.length || !p.hours
    if (s.id === 'support') return !p.supportNeeds.length
    return !p.skills.length
  })

  return (
    <div className="app">
      <AppHeader />
      <div className="profile">
        <section className="profile__hero">
          <div className="profile__hero-bg" aria-hidden="true" />
          <Avatar name={user.name} size={88} />
          <div className="profile__id">
            <h1>{user.name}</h1>
            <p>{p.headline || 'Add a headline so employers know what you do'}</p>
            <div className="profile__meta">
              {p.location && (
                <span>
                  <MapPin size={14} /> {p.location}
                </span>
              )}
              {stage && (
                <span>
                  <HeartPulse size={14} /> {stage.label}
                </span>
              )}
              <span>
                <Lock size={14} /> {disclosure?.label}
              </span>
            </div>
          </div>
          <div className="completion">
            <div className="fit__ring fit__ring--lg" style={{ ['--p' as string]: completion }}>
              <span>{completion}%</span>
            </div>
            <div>
              <strong>Profile strength</strong>
              <small>{completion === 100 ? 'Looking great!' : 'Complete it at your own pace'}</small>
            </div>
          </div>
        </section>

        <div className="profile__grid">
          <nav className="profile__nav">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} className={tab === id ? 'is-on' : ''} onClick={() => setParams({ tab: id })}>
                <Icon size={16} /> {label}
                {missing.some((m) => m.id === id) && <span className="todo-dot" title="Not filled yet" />}
              </button>
            ))}
            <hr />
            <button className={tab === 'applications' ? 'is-on' : ''} onClick={() => setParams({ tab: 'applications' })}>
              <Briefcase size={16} /> Applications <span className="count">{user.applied.length}</span>
            </button>
            <button className={tab === 'saved' ? 'is-on' : ''} onClick={() => setParams({ tab: 'saved' })}>
              <Bookmark size={16} /> Saved jobs <span className="count">{user.saved.length}</span>
            </button>
          </nav>

          <div className="profile__main">
            {SECTIONS.some((s) => s.id === tab) && <SectionEditor key={tab} id={tab} />}
            {tab === 'applications' && (
              <div className="card">
                <h2>Applications</h2>
                <JobList
                  ids={user.applied.map((a) => ({
                    id: a.jobId,
                    meta: `Applied ${new Date(a.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`,
                  }))}
                  empty="You haven’t applied anywhere yet. No rush."
                />
              </div>
            )}
            {tab === 'saved' && (
              <div className="card">
                <h2>Saved jobs</h2>
                <JobList ids={user.saved.map((id) => ({ id, meta: 'Saved' }))} empty="Jobs you bookmark will show up here." />
              </div>
            )}
          </div>

          <aside className="profile__side">
            {missing.length > 0 && (
              <div className="card card--soft">
                <h3>Finish when you’re ready</h3>
                <p className="muted small">A fuller profile means better matches. There’s no deadline.</p>
                <ul className="todo">
                  {missing.map((m) => (
                    <li key={m.id}>
                      <button onClick={() => setParams({ tab: m.id })}>
                        <m.icon size={14} /> {m.label} <ArrowRight size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="card card--dark">
              <Lock size={18} />
              <h3>Your privacy, protected</h3>
              <p>
                Health information is never shown on your public profile. Employers only see it if you choose
                “share” in Journey & privacy.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
