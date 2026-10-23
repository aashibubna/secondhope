import { ArrowLeft, ArrowRight, Check, Heart } from 'lucide-react'
import { useState } from 'react'
import type { Profile } from '../types'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Brand'
import { ShowErrors } from '../components/showErrors'
import {
  AboutSection,
  ExperienceSection,
  JourneySection,
  PreferencesSection,
  SupportSection,
  type SectionProps,
} from '../components/ProfileSections'
import { useApp } from '../context/store'
import { cleanProfile, hasErrors, profileErrors } from '../lib/validate'

const STEPS: { label: string; title: string; subtitle: string; Component: (p: SectionProps) => React.JSX.Element }[] = [
  {
    label: 'About you',
    title: 'Tell us a little about you',
    subtitle: 'This helps employers get to know the person behind the résumé.',
    Component: AboutSection,
  },
  {
    label: 'Your journey',
    title: 'Your journey, your rules',
    subtitle: 'Sharing helps us match you better — but it is entirely up to you.',
    Component: JourneySection,
  },
  {
    label: 'Work preferences',
    title: 'What kind of work fits right now?',
    subtitle: 'You can change this any time as your energy and needs change.',
    Component: PreferencesSection,
  },
  {
    label: 'Support needs',
    title: 'Support that helps you thrive',
    subtitle: 'We highlight employers who already offer what you need.',
    Component: SupportSection,
  },
  {
    label: 'Experience',
    title: 'Your experience and skills',
    subtitle: 'Last step. Add as much or as little as you like.',
    Component: ExperienceSection,
  },
]

export default function Onboarding() {
  const { user, updateProfile, finishOnboarding } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  // Edits stay local and are saved at each step, so typing never waits on the network.
  const [draft, setDraft] = useState<Profile | null>(user?.profile ?? null)
  const [busy, setBusy] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  if (!user || !draft) return null
  const { title, subtitle, Component } = STEPS[step]!
  const last = step === STEPS.length - 1
  const invalid = hasErrors(profileErrors(draft))

  const save = () => updateProfile(cleanProfile(draft)).catch(console.error)
  /** Nothing is saved while a field on this step needs fixing. */
  const blocked = () => {
    setShowErrors(invalid)
    return invalid
  }
  const goTo = (i: number) => {
    if (blocked()) return
    save()
    setStep(i)
  }
  const finish = () => {
    if (blocked()) return
    setBusy(true)
    // Firestore applies writes locally first, so there's no need to wait for the server
    // (which would hang on a flaky connection).
    save()
    finishOnboarding().catch(console.error)
    navigate('/jobs')
  }
  const next = () => (last ? finish() : goTo(step + 1))

  return (
    <div className="onboard">
      <aside className="onboard__side">
        <Logo dark />
        <div className="onboard__welcome">
          <Heart size={20} />
          <h2>Welcome, {user.name.split(' ')[0]}.</h2>
          <p>
            Let’s set up your profile. Every step is optional — skip anything you like and come back to it
            from your profile whenever you’re ready.
          </p>
        </div>
        <ol className="onboard__steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className={i === step ? 'is-current' : i < step ? 'is-done' : ''}>
              <button onClick={() => goTo(i)} aria-current={i === step ? 'step' : undefined}>
                <span className="onboard__dot">{i < step ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>
        <p className="onboard__side-foot">Your progress is saved as you go. You can change any of this later from your profile.</p>
      </aside>

      <main className="onboard__main">
        <div className="onboard__top">
          <div className="progress">
            <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <button className="link-btn" onClick={finish} disabled={busy}>
            Skip setup, I’ll do it later
          </button>
        </div>

        <div className="onboard__content">
          <span className="eyebrow">
            Step {step + 1} of {STEPS.length}
          </span>
          <h1 className="onboard__title">{title}</h1>
          <p className="muted">{subtitle}</p>
          <div className="onboard__form">
            <ShowErrors.Provider value={showErrors}>
              <Component key={step} profile={draft} set={(patch) => setDraft((d) => ({ ...d!, ...patch }))} />
            </ShowErrors.Provider>
            {showErrors && invalid && (
              <p className="form-error" role="alert">
                Please fix the highlighted field before moving on.
              </p>
            )}
          </div>
        </div>

        <div className="onboard__actions">
          <button className="btn btn--ghost" disabled={step === 0} onClick={() => goTo(step - 1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="row">
            {!last && (
              <button className="btn btn--text" onClick={() => goTo(step + 1)}>
                Skip this step
              </button>
            )}
            <button className="btn btn--primary" onClick={next} disabled={busy}>
              {last ? 'Finish & see jobs' : 'Continue'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
