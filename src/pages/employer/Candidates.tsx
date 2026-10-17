import { CheckCircle2, Search, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import ApplicantView from '../../components/ApplicantView'
import { Avatar } from '../../components/Brand'
import { Field } from '../../components/Fields'
import { Spinner, StatusPill } from '../../components/Status'
import { friendlyError, shortDate, timeAgo, useApp } from '../../context/store'
import { APP_STATUS, EMPLOYER_STATUSES } from '../../data/options'
import { setStatusAsEmployer } from '../../lib/db'
import { useCompanyApplications, useCompanyJobs } from '../../lib/hooks'
import type { Application, AppStatus } from '../../types'

const TABS: { id: string; label: string; match: (s: AppStatus) => boolean }[] = [
  { id: 'all', label: 'All', match: (s) => s !== 'withdrawn' },
  { id: 'applied', label: 'New', match: (s) => s === 'applied' },
  { id: 'reviewing', label: 'Reviewing', match: (s) => s === 'reviewing' },
  { id: 'interview', label: 'Interview', match: (s) => s === 'interview' || s === 'offer' },
  { id: 'hired', label: 'Hired', match: (s) => s === 'hired' },
  { id: 'closed', label: 'Closed', match: (s) => s === 'not-selected' || s === 'withdrawn' },
]

const TEMPLATES: Partial<Record<AppStatus, string>> = {
  reviewing: 'Thank you for applying — we’re reviewing your application and will be in touch within a week.',
  interview: 'We’d love to talk! Please share a few times that work for you. We’re happy to fit around appointments.',
  offer: 'We’re delighted to offer you the role. Take whatever time you need to decide, and ask us anything.',
  'not-selected':
    'Thank you so much for your interest. We’ve decided to move forward with other candidates for this role, but we were glad to meet you and hope you’ll apply again.',
}

function StatusEditor({ app }: { app: Application }) {
  const [status, setStatus] = useState<AppStatus>(app.status)
  const [message, setMessage] = useState(app.employerMessage)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const locked = app.status === 'withdrawn' || app.status === 'hired'

  if (locked)
    return (
      <div className="hint-box">
        {app.status === 'hired'
          ? `${app.applicant.name.split(' ')[0]} accepted your offer. 🎉`
          : `${app.applicant.name.split(' ')[0]} withdrew this application.`}
      </div>
    )

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await setStatusAsEmployer(app, status, message)
      setSaved(true)
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="status-editor">
      <h4>Update candidate</h4>
      <div className="status-editor__options" role="radiogroup" aria-label="Status">
        {EMPLOYER_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={status === s}
            className={`chip ${status === s ? 'chip--on' : ''}`}
            onClick={() => {
              setSaved(false)
              setStatus(s)
              if (s !== app.status && TEMPLATES[s] && (!message || Object.values(TEMPLATES).includes(message))) setMessage(TEMPLATES[s]!)
            }}
          >
            {APP_STATUS[s].employerLabel}
          </button>
        ))}
      </div>
      <Field label="Message to the candidate (optional)" hint="They’ll see this in their application tracker.">
        <textarea
          rows={3}
          value={message}
          maxLength={2000}
          onChange={(e) => {
            setSaved(false)
            setMessage(e.target.value)
          }}
        />
      </Field>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="row row--end">
        {saved && (
          <span className="saved-flag">
            <CheckCircle2 size={14} /> Candidate updated
          </span>
        )}
        <button className="btn btn--primary btn--sm" disabled={busy || (status === app.status && message === app.employerMessage)} onClick={save}>
          {busy ? 'Saving…' : 'Save & notify'}
        </button>
      </div>
    </div>
  )
}

export default function Candidates() {
  const { user } = useApp()
  const { data: apps, loading } = useCompanyApplications(user?.id)
  const { data: jobs } = useCompanyJobs(user?.id)
  const [params, setParams] = useSearchParams()
  const [term, setTerm] = useState('')

  const tab = params.get('status') ?? 'all'
  const jobFilter = params.get('job') ?? ''
  const selectedId = params.get('app')
  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }

  const list = useMemo(() => {
    const t = term.trim().toLowerCase()
    const match = TABS.find((x) => x.id === tab)?.match ?? TABS[0]!.match
    return apps.filter(
      (a) =>
        match(a.status) &&
        (!jobFilter || a.jobId === jobFilter) &&
        (!t || `${a.applicant.name} ${a.applicant.headline} ${a.applicant.skills.join(' ')} ${a.jobTitle}`.toLowerCase().includes(t)),
    )
  }, [apps, tab, jobFilter, term])

  const selected = apps.find((a) => a.id === selectedId)
  const jobTitles = useMemo(() => {
    const m = new Map(jobs.map((j) => [j.id, j.title]))
    apps.forEach((a) => m.has(a.jobId) || m.set(a.jobId, a.jobTitle))
    return [...m]
  }, [jobs, apps])

  return (
    <div className="app">
      <AppHeader />
      <div className="page">
        <header className="page__head">
          <div>
            <span className="eyebrow">Candidates</span>
            <h1>Your applicants</h1>
            <p className="muted">
              Candidates share a snapshot of their profile when they apply. Be kind and prompt — a quick update means a lot.
            </p>
          </div>
        </header>

        <div className="toolbar">
          <div className="tabs" role="tablist">
            {TABS.map((t) => {
              const n = apps.filter((a) => t.match(a.status) && (!jobFilter || a.jobId === jobFilter)).length
              return (
                <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'is-on' : ''} onClick={() => setParam('status', t.id === 'all' ? null : t.id)}>
                  {t.label} <span className="count">{n}</span>
                </button>
              )
            })}
          </div>
          <div className="toolbar__filters">
            <select value={jobFilter} onChange={(e) => setParam('job', e.target.value || null)} aria-label="Filter by job">
              <option value="">All jobs</option>
              {jobTitles.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
            <div className="input-icon input-icon--left">
              <Search size={16} />
              <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search name or skill" aria-label="Search candidates" />
            </div>
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : apps.length === 0 ? (
          <div className="empty">
            <Users size={28} />
            <h3>No applicants yet</h3>
            <p className="muted">Once your jobs are live, applications will appear here in real time.</p>
            <Link to="/employer/jobs/new" className="btn btn--dark btn--sm">
              Post a job
            </Link>
          </div>
        ) : (
          <div className={`candidates ${selected ? 'candidates--open' : ''}`}>
            <ul className="candidate-list">
              {list.length === 0 && <li className="muted small candidate-list__empty">Nobody here right now.</li>}
              {list.map((a) => (
                <li key={a.id}>
                  <button className={`candidate ${a.id === selectedId ? 'candidate--on' : ''}`} onClick={() => setParam('app', a.id)}>
                    <Avatar name={a.applicant.name} size={40} />
                    <span className="candidate__main">
                      <strong>{a.applicant.name}</strong>
                      <small>{a.applicant.headline || a.applicant.currentRole || '—'}</small>
                      <small className="muted">
                        {a.jobTitle} · {timeAgo(a.createdAt)}
                      </small>
                    </span>
                    <StatusPill status={a.status} employer />
                  </button>
                </li>
              ))}
            </ul>

            {selected ? (
              <aside className="candidate-detail">
                <div className="candidate-detail__bar">
                  <span className="muted small">
                    Applied for <strong>{selected.jobTitle}</strong> · {shortDate(selected.createdAt)}
                  </span>
                  <button className="icon-btn" onClick={() => setParam('app', null)} aria-label="Close">
                    <X size={18} />
                  </button>
                </div>
                <StatusEditor key={selected.id} app={selected} />
                <ApplicantView applicant={selected.applicant} disclosed={selected.disclosed} coverNote={selected.coverNote} />
              </aside>
            ) : (
              <aside className="candidate-detail candidate-detail--empty">
                <Users size={24} />
                <p className="muted">Select a candidate to see their application.</p>
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
