import { ArrowRight, Check, Heart, MessageSquareText, PartyPopper } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { CompanyLogo } from '../components/Brand'
import { Modal, Spinner, StatusPill } from '../components/Status'
import { friendlyError, shortDate, useApp } from '../context/store'
import { APP_STATUS, PIPELINE } from '../data/options'
import { acceptOffer, withdraw } from '../lib/db'
import { useMyApplications } from '../lib/hooks'
import type { Application } from '../types'

const ACTIVE = new Set(['applied', 'reviewing', 'interview', 'offer'])

function Progress({ app }: { app: Application }) {
  const ended = app.status === 'not-selected' || app.status === 'withdrawn'
  // For ended applications, show how far it got before it stopped.
  const reached = ended
    ? Math.max(0, ...app.history.map((h) => PIPELINE.indexOf(h.status as (typeof PIPELINE)[number])))
    : PIPELINE.indexOf(app.status as (typeof PIPELINE)[number])
  return (
    <ol className={`tracker ${ended ? 'tracker--ended' : ''}`} aria-label="Application progress">
      {PIPELINE.map((s, i) => (
        <li key={s} className={i < reached ? 'is-done' : i === reached ? 'is-current' : ''}>
          <span className="tracker__dot">{i < reached && <Check size={10} strokeWidth={3} />}</span>
          <span className="tracker__label">{APP_STATUS[s].label}</span>
        </li>
      ))}
    </ol>
  )
}

type Confirm = { kind: 'withdraw' | 'accept'; app: Application }

function AppCard({ app, focused, onAction }: { app: Application; focused: boolean; onAction: (c: Confirm) => void }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focused])
  const active = ACTIVE.has(app.status)

  return (
    <article ref={ref} className={`app-card ${focused ? 'app-card--focus' : ''} ${active ? '' : 'app-card--past'}`}>
      <div className="app-card__top">
        <CompanyLogo {...app.logo} size={48} />
        <div className="app-card__title">
          <h3>{app.jobTitle}</h3>
          <p className="muted small">
            <Link to={`/companies/${app.companyId}`}>{app.companyName}</Link> · Applied {shortDate(app.createdAt)}
          </p>
        </div>
        <StatusPill status={app.status} />
      </div>

      <Progress app={app} />
      <p className="app-card__hint small">{APP_STATUS[app.status].hint}</p>

      {app.employerMessage && (
        <div className="message">
          <MessageSquareText size={16} />
          <div>
            <strong>Message from {app.companyName}</strong>
            <p>{app.employerMessage}</p>
          </div>
        </div>
      )}

      <div className="app-card__actions">
        <Link to={`/jobs?job=${app.jobId}`} className="btn btn--text btn--sm">
          View job
        </Link>
        {app.status === 'offer' && (
          <button className="btn btn--primary btn--sm" onClick={() => onAction({ kind: 'accept', app })}>
            <PartyPopper size={14} /> Accept offer
          </button>
        )}
        {active && (
          <button className="btn btn--ghost btn--sm" onClick={() => onAction({ kind: 'withdraw', app })}>
            {app.status === 'offer' ? 'Decline' : 'Withdraw'}
          </button>
        )}
      </div>
    </article>
  )
}

export default function Applications() {
  const { user } = useApp()
  const { data: apps, loading } = useMyApplications(user?.id)
  const [params] = useSearchParams()
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!user) return null

  const focus = params.get('app')
  const active = apps.filter((a) => ACTIVE.has(a.status))
  const past = apps.filter((a) => !ACTIVE.has(a.status))
  const interviews = apps.filter((a) => a.status === 'interview' || a.status === 'offer').length

  const run = async () => {
    if (!confirm) return
    setBusy(true)
    setError(null)
    try {
      if (confirm.kind === 'withdraw') await withdraw(confirm.app)
      else await acceptOffer(confirm.app, user)
      setConfirm(null)
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app">
      <AppHeader />
      <div className="page">
        <header className="page__head">
          <div>
            <span className="eyebrow">Your applications</span>
            <h1>Where things stand</h1>
            <p className="muted">Every update from employers shows up here. There’s no need to check constantly — we’ll keep it ready for you.</p>
          </div>
          <div className="mini-stats">
            <div>
              <strong>{apps.length}</strong>
              <span>Sent</span>
            </div>
            <div>
              <strong>{active.length}</strong>
              <span>In progress</span>
            </div>
            <div>
              <strong>{interviews}</strong>
              <span>Interviews & offers</span>
            </div>
          </div>
        </header>

        {loading ? (
          <Spinner />
        ) : apps.length === 0 ? (
          <div className="empty">
            <Heart size={28} />
            <h3>You haven’t applied anywhere yet</h3>
            <p className="muted">No rush. When a role feels right, it’ll be tracked here.</p>
            <Link to="/jobs" className="btn btn--dark btn--sm">
              Browse jobs <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="app-list">
                <h2>In progress</h2>
                {active.map((a) => (
                  <AppCard key={a.id} app={a} focused={a.id === focus} onAction={setConfirm} />
                ))}
              </section>
            )}
            {past.length > 0 && (
              <section className="app-list">
                <h2>Past applications</h2>
                {past.map((a) => (
                  <AppCard key={a.id} app={a} focused={a.id === focus} onAction={setConfirm} />
                ))}
              </section>
            )}
          </>
        )}
      </div>

      {confirm && (
        <Modal
          title={confirm.kind === 'accept' ? 'Accept this offer?' : confirm.app.status === 'offer' ? 'Decline this offer?' : 'Withdraw application?'}
          onClose={() => setConfirm(null)}
        >
          <div className="stack">
            {confirm.kind === 'accept' ? (
              <>
                <p>
                  You’re accepting the <strong>{confirm.app.jobTitle}</strong> offer from {confirm.app.companyName}.
                  They’ll be notified straight away.
                </p>
                {confirm.app.disclosure === 'after-offer' && user.profile.disclosure !== 'private' && (
                  <p className="hint-box">
                    You chose to share your journey after an offer, so your journey stage and support needs will now be
                    shared with {confirm.app.companyName} — to help them set up the right support from day one.
                  </p>
                )}
              </>
            ) : (
              <p>
                {confirm.app.companyName} will see that you’ve {confirm.app.status === 'offer' ? 'declined' : 'withdrawn'}.
                This can’t be undone, and that’s okay — doing what’s right for you always is.
              </p>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="row row--end">
              <button className="btn btn--ghost" onClick={() => setConfirm(null)}>
                Go back
              </button>
              <button className={`btn ${confirm.kind === 'accept' ? 'btn--primary' : 'btn--dark'}`} onClick={run} disabled={busy}>
                {busy ? 'Saving…' : confirm.kind === 'accept' ? 'Yes, accept' : 'Yes, confirm'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
