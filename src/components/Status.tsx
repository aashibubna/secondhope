import { useEffect, useRef, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { APP_STATUS } from '../data/options'
import { currentLabel, reachedIndex, roundsOf, stageLabels } from '../lib/pipeline'
import type { Application, AppStatus } from '../types'
import { Ribbon } from './Brand'

export function Splash() {
  return (
    <div className="splash" role="status" aria-live="polite">
      <span className="splash__mark">
        <Ribbon size={28} color="#fff" />
      </span>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="spinner" role="status">
      <span className="spinner__dot" />
      <span className="muted small">{label}</span>
    </div>
  )
}

export function StatusPill({ status, employer = false, app }: { status: AppStatus; employer?: boolean; app?: Application }) {
  const s = APP_STATUS[status]
  // While interviewing, name the actual round ("Phone screen") instead of the generic stage.
  const round = app && status === 'interview' ? currentLabel(app, employer) : null
  return <span className={`status status--${s.tone}`}>{round ?? (employer ? s.employerLabel : s.label)}</span>
}

/** Every stage of this application's hiring process, with how far it has got. */
export function StageTracker({ app, employer = false }: { app: Application; employer?: boolean }) {
  const ended = app.status === 'not-selected' || app.status === 'withdrawn'
  const labels = stageLabels(roundsOf(app), employer)
  const reached = reachedIndex(app)
  return (
    <ol className={`tracker ${ended ? 'tracker--ended' : ''}`} style={{ ['--steps' as string]: labels.length }} aria-label="Application progress">
      {labels.map((label, i) => (
        <li key={i} className={i < reached ? 'is-done' : i === reached ? 'is-current' : ''} aria-current={i === reached ? 'step' : undefined}>
          <span className="tracker__dot">{i < reached && <Check size={10} strokeWidth={3} />}</span>
          <span className="tracker__label">{label}</span>
        </li>
      ))}
    </ol>
  )
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el && !el.open) el.showModal()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'modal--wide' : ''}`}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
    >
      <div className="modal__inner">
        <header className="modal__head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}

export function SetupNotice() {
  return (
    <div className="setup">
      <div className="setup__card">
        <span className="splash__mark">
          <Ribbon size={24} color="#fff" />
        </span>
        <h1>Connect Firebase to get started</h1>
        <p className="muted">SecondHope needs a Firebase project for sign-in and data. It takes about five minutes.</p>
        <ol>
          <li>
            Copy <code>.env.example</code> to <code>.env.local</code>.
          </li>
          <li>
            Paste your web app config from Firebase console → Project settings → Your apps.
          </li>
          <li>
            Enable <strong>Email/Password</strong> and <strong>Google</strong> sign-in, and create a Firestore database.
          </li>
          <li>
            Deploy the rules with <code>npm run deploy:rules</code>, then restart <code>npm run dev</code>.
          </li>
        </ol>
        <p className="muted small">
          Or try it locally with no project: set <code>VITE_USE_EMULATORS=true</code> and run <code>npm run emulators</code>.
        </p>
      </div>
    </div>
  )
}
