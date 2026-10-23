import {
  ArrowRight,
  Bookmark,
  Briefcase,
  CheckCircle2,
  Eye,
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
import ApplicantView from '../components/ApplicantView'
import { Avatar } from '../components/Brand'
import {
  AboutSection,
  ExperienceSection,
  JourneySection,
  PreferencesSection,
  SupportSection,
  type SectionProps,
} from '../components/ProfileSections'
import { ShowErrors } from '../components/showErrors'
import { Modal } from '../components/Status'
import { profileCompletion, useApp } from '../context/store'
import { DISCLOSURE_OPTIONS, JOURNEY_STAGES } from '../data/options'
import { disclosedFor, snapshotOf } from '../lib/db'
import { cleanProfile, hasErrors, profileErrors } from '../lib/validate'
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
  const [showErrors, setShowErrors] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(user!.profile)
  const invalid = hasErrors(profileErrors(draft))

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
      <ShowErrors.Provider value={showErrors}>
        <section.Component
          profile={draft}
          set={(patch) => {
            setSaved(false)
            setDraft((d) => ({ ...d, ...patch }))
          }}
        />
      </ShowErrors.Provider>
      {showErrors && invalid && (
        <p className="form-error" role="alert">
          Please fix the highlighted field before saving.
        </p>
      )}
      <div className="card__foot">
        <button
          className="btn btn--ghost"
          disabled={!dirty}
          onClick={() => {
            setShowErrors(false)
            setDraft(user!.profile)
          }}
        >
          Discard
        </button>
        <button
          className="btn btn--primary"
          disabled={!dirty}
          onClick={() => {
            setShowErrors(invalid)
            if (invalid) return
            const clean = cleanProfile(draft)
            updateProfile(clean)
            setDraft(clean)
            setSaved(true)
          }}
        >
          Save changes
        </button>
      </div>
    </div>
  )
}

export default function Profile() {
  const { user } = useApp()
  const [params, setParams] = useSearchParams()
  const [preview, setPreview] = useState(false)
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
            <Link to="/applications">
              <Briefcase size={16} /> Applications <ArrowRight size={14} className="push" />
            </Link>
            <Link to="/jobs?saved=1">
              <Bookmark size={16} /> Saved jobs <span className="count">{user.saved.length}</span>
            </Link>
          </nav>

          <div className="profile__main">
            <SectionEditor key={tab} id={SECTIONS.some((s) => s.id === tab) ? tab : 'about'} />
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
                Employers never browse your profile. They only see what you send when you apply — and health details
                only if you choose “share” in Journey & privacy.
              </p>
              <button className="btn btn--light btn--sm" onClick={() => setPreview(true)}>
                <Eye size={14} /> Preview what employers see
              </button>
            </div>
          </aside>
        </div>
      </div>
      {preview && (
        <Modal title="What an employer sees when you apply" onClose={() => setPreview(false)}>
          <p className="muted small modal__lead">
            {p.disclosure === 'open'
              ? 'You share your journey with Cancer-Aware pledged employers. Other employers see the version without it.'
              : p.disclosure === 'after-offer'
                ? 'Your journey details stay hidden until you accept an offer.'
                : 'Your journey and support needs stay private. Only you can see them.'}
          </p>
          <ApplicantView applicant={snapshotOf(user)} disclosed={p.disclosure === 'open' ? disclosedFor(user) : null} />
        </Modal>
      )}
    </div>
  )
}
