import { ArrowRight, CheckCircle2, Search, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import ApplicantView from '../../components/ApplicantView'
import { Avatar } from '../../components/Brand'
import { Field } from '../../components/Fields'
import { Modal, Spinner, StageTracker, StatusPill } from '../../components/Status'
import Thread from '../../components/Thread'
import { friendlyError, shortDate, timeAgo, useApp } from '../../context/store'
import { moveCandidate, moveCandidates, type Move } from '../../lib/db'
import { useCompanyApplications, useCompanyJobs } from '../../lib/hooks'
import { nextStep, roundsOf, type Step } from '../../lib/pipeline'
import type { Application, AppStatus } from '../../types'

const TABS: { id: string; label: string; match: (s: AppStatus) => boolean }[] = [
  { id: 'all', label: 'All', match: (s) => s !== 'withdrawn' },
  { id: 'applied', label: 'New', match: (s) => s === 'applied' },
  { id: 'reviewing', label: 'Reviewing', match: (s) => s === 'reviewing' },
  { id: 'interview', label: 'Interviewing', match: (s) => s === 'interview' || s === 'offer' },
  { id: 'hired', label: 'Hired', match: (s) => s === 'hired' },
  { id: 'closed', label: 'Closed', match: (s) => s === 'not-selected' || s === 'withdrawn' },
]

const LOCKED: AppStatus[] = ['withdrawn', 'hired']

/** A stage as a single string, so it can drive a radio group: "reviewing", "interview:2", … */
const keyOf = (s: Step) => (s.status === 'interview' ? `interview:${s.round}` : s.status)
const parseKey = (k: string): Step =>
  k.startsWith('interview:') ? { status: 'interview', round: Number(k.slice('interview:'.length)) } : { status: k as AppStatus, round: 0 }

function stepLabel(step: Step, rounds: string[]) {
  if (step.status === 'interview') return rounds[step.round] ?? 'Interview'
  return step.status === 'offer' ? 'Offer' : 'Not selected'
}

function templateFor(step: Step, rounds: string[]) {
  switch (step.status) {
    case 'reviewing':
      return 'Thank you for applying — we’re reviewing your application and will be in touch within a week.'
    case 'interview':
      return `Good news — you’ve been shortlisted for the ${rounds[step.round] ?? 'next'} round. We’ll share the details shortly, and we’re happy to fit around appointments.`
    case 'offer':
      return 'We’re delighted to offer you the role. Take whatever time you need to decide, and ask us anything.'
    case 'not-selected':
      return 'Thank you so much for your interest. We’ve decided to move forward with other candidates for this role, but we were glad to meet you and hope you’ll apply again.'
    default:
      return ''
  }
}

function PipelineEditor({ app, rounds }: { app: Application; rounds: string[] }) {
  const current = keyOf(app)
  const [stage, setStage] = useState(current)
  const [message, setMessage] = useState(app.employerMessage)
  // True while the message is one of our templates, so picking another stage can swap it.
  const [auto, setAuto] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const first = app.applicant.name.split(' ')[0]

  if (LOCKED.includes(app.status))
    return (
      <div className="hint-box">
        {app.status === 'hired' ? `${first} accepted your offer. 🎉` : `${first} withdrew this application.`}
      </div>
    )

  const next = nextStep(app, rounds)
  const options = [
    { key: 'applied', label: 'New' },
    { key: 'reviewing', label: 'Résumé review' },
    ...rounds.map((r, i) => ({ key: `interview:${i}`, label: r })),
    { key: 'offer', label: 'Offer sent' },
    { key: 'not-selected', label: 'Not selected' },
  ]

  const choose = (k: string) => {
    setSaved(false)
    setStage(k)
    if (k !== current && (!message.trim() || auto)) {
      setMessage(templateFor(parseKey(k), rounds))
      setAuto(true)
    }
  }

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await moveCandidate({ app, ...parseKey(stage), rounds, message })
      setSaved(true)
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="status-editor">
      <div className="status-editor__head">
        <h4>Hiring stage</h4>
        {next && stage === current && (
          <button type="button" className="btn btn--soft btn--sm" onClick={() => choose(keyOf(next))}>
            {next.label} <ArrowRight size={14} />
          </button>
        )}
      </div>
      <StageTracker app={{ ...app, rounds }} employer />
      <div className="status-editor__options" role="radiogroup" aria-label="Move to stage">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={stage === o.key}
            className={`chip ${stage === o.key ? 'chip--on' : ''}`}
            onClick={() => choose(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <Field label={`Note to ${first} with this update (optional)`} hint="They’ll see this in their application tracker.">
        <textarea
          rows={3}
          value={message}
          maxLength={2000}
          onChange={(e) => {
            setSaved(false)
            setAuto(false)
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
        <button className="btn btn--primary btn--sm" disabled={busy || (stage === current && message === app.employerMessage)} onClick={save}>
          {busy ? 'Saving…' : 'Save & notify'}
        </button>
      </div>
    </div>
  )
}

type BulkKind = 'next' | 'reject'

function BulkModal({
  kind,
  apps,
  roundsFor,
  onClose,
  onDone,
}: {
  kind: BulkKind
  apps: Application[]
  roundsFor: (a: Application) => string[]
  onClose: () => void
  onDone: () => void
}) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const plan = apps.map((app) => {
    const rounds = roundsFor(app)
    const step: Step | null =
      kind === 'next'
        ? nextStep(app, rounds)
        : LOCKED.includes(app.status) || app.status === 'not-selected'
          ? null
          : { status: 'not-selected', round: app.round }
    return { app, rounds, step }
  })
  const moves: Move[] = plan
    .filter((p) => p.step)
    .map(({ app, rounds, step }) => ({ app, rounds, status: step!.status, round: step!.round, message: message.trim() || templateFor(step!, rounds) }))
  const skipped = plan.length - moves.length

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      await moveCandidates(moves)
      onDone()
    } catch (e) {
      setError(friendlyError(e))
      setBusy(false)
    }
  }

  return (
    <Modal title={kind === 'next' ? 'Move candidates forward' : 'Mark as not selected'} onClose={onClose}>
      <div className="stack">
        {moves.length > 0 ? (
          <ul className="bulk-list">
            {plan
              .filter((p) => p.step)
              .map(({ app, rounds, step }) => (
                <li key={app.id}>
                  <Avatar name={app.applicant.name} size={28} />
                  <strong>{app.applicant.name}</strong>
                  <ArrowRight size={14} />
                  <span>{stepLabel(step!, rounds)}</span>
                </li>
              ))}
          </ul>
        ) : (
          <p className="muted">None of the selected candidates can move from their current stage.</p>
        )}
        {skipped > 0 && moves.length > 0 && (
          <p className="small muted">
            {skipped} selected {skipped === 1 ? 'candidate is' : 'candidates are'} already at an offer or finished, and will be skipped.
          </p>
        )}
        <Field label="Note to candidates (optional)" hint="Leave blank to send our default note for each stage.">
          <textarea rows={3} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="row row--end">
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className={`btn ${kind === 'next' ? 'btn--primary' : 'btn--dark'}`} onClick={run} disabled={busy || !moves.length}>
            {busy ? 'Saving…' : `Update ${moves.length} & notify`}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function Candidates() {
  const { user } = useApp()
  const { data: apps, loading } = useCompanyApplications(user?.id)
  const { data: jobs } = useCompanyJobs(user?.id)
  const [params, setParams] = useSearchParams()
  const [term, setTerm] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [bulk, setBulk] = useState<BulkKind | null>(null)

  const tab = params.get('status') ?? 'all'
  const jobFilter = params.get('job') ?? ''
  const roundFilter = params.get('round') ?? ''
  const selectedId = params.get('app')
  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    if (k === 'job') next.delete('round')
    setParams(next, { replace: true })
  }

  // Moves always use the job's current rounds; the application keeps its own copy if the job is gone.
  const roundsByJob = useMemo(() => new Map(jobs.map((j) => [j.id, j.rounds])), [jobs])
  const roundsFor = (a: Application) => roundsByJob.get(a.jobId) ?? roundsOf(a)

  const list = useMemo(() => {
    const t = term.trim().toLowerCase()
    const match = TABS.find((x) => x.id === tab)?.match ?? TABS[0]!.match
    return apps.filter(
      (a) =>
        match(a.status) &&
        (!jobFilter || a.jobId === jobFilter) &&
        (!roundFilter || (a.status === 'interview' && a.round === Number(roundFilter))) &&
        (!t || `${a.applicant.name} ${a.applicant.headline} ${a.applicant.skills.join(' ')} ${a.jobTitle}`.toLowerCase().includes(t)),
    )
  }, [apps, tab, jobFilter, roundFilter, term])

  const selected = apps.find((a) => a.id === selectedId)
  const jobTitles = useMemo(() => {
    const m = new Map(jobs.map((j) => [j.id, j.title]))
    apps.forEach((a) => m.has(a.jobId) || m.set(a.jobId, a.jobTitle))
    return [...m]
  }, [jobs, apps])
  const jobRounds = jobFilter ? (roundsByJob.get(jobFilter) ?? []) : []

  const pickedApps = list.filter((a) => picked.has(a.id))
  const allPicked = list.length > 0 && pickedApps.length === list.length
  const togglePick = (id: string) =>
    setPicked((p) => {
      const next = new Set(p)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

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
            {jobRounds.length > 0 && (
              <select value={roundFilter} onChange={(e) => setParam('round', e.target.value || null)} aria-label="Filter by round">
                <option value="">All rounds</option>
                {jobRounds.map((r, i) => (
                  <option key={i} value={i}>
                    Round {i + 1}: {r}
                  </option>
                ))}
              </select>
            )}
            <div className="input-icon input-icon--left">
              <Search size={16} />
              <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search name or skill" aria-label="Search candidates" />
            </div>
          </div>
        </div>

        {pickedApps.length > 0 && (
          <div className="bulk-bar" role="region" aria-label="Bulk actions">
            <strong>{pickedApps.length} selected</strong>
            <button className="btn btn--primary btn--sm" onClick={() => setBulk('next')}>
              Move to next round <ArrowRight size={14} />
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => setBulk('reject')}>
              Not selected
            </button>
            <button className="btn btn--text btn--sm" onClick={() => setPicked(new Set())}>
              Clear
            </button>
          </div>
        )}

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
              {list.length > 0 && (
                <li className="candidate-list__all">
                  <label className="checkbox">
                    <input type="checkbox" checked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(list.map((a) => a.id)))} />
                    <span className="small">Select all</span>
                  </label>
                </li>
              )}
              {list.length === 0 && <li className="muted small candidate-list__empty">Nobody here right now.</li>}
              {list.map((a) => (
                <li key={a.id} className="candidate-row">
                  <input
                    type="checkbox"
                    className="candidate-row__pick"
                    checked={picked.has(a.id)}
                    onChange={() => togglePick(a.id)}
                    aria-label={`Select ${a.applicant.name}`}
                  />
                  <button className={`candidate ${a.id === selectedId ? 'candidate--on' : ''}`} onClick={() => setParam('app', a.id)}>
                    <Avatar name={a.applicant.name} size={40} />
                    <span className="candidate__main">
                      <strong>
                        {a.applicant.name}
                        {a.lastMessageBy === 'seeker' && <span className="dot dot--inline" aria-label="New message" />}
                      </strong>
                      <small>{a.applicant.headline || a.applicant.currentRole || '—'}</small>
                      <small className="muted">
                        {a.jobTitle} · {timeAgo(a.createdAt)}
                      </small>
                    </span>
                    <StatusPill status={a.status} employer app={a} />
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
                <PipelineEditor key={selected.id} app={selected} rounds={roundsFor(selected)} />
                <Thread key={selected.id} app={selected} as="employer" />
                <ApplicantView applicant={selected.applicant} disclosed={selected.disclosed} coverNote={selected.coverNote} answers={selected.answers} />
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

      {bulk && (
        <BulkModal
          kind={bulk}
          apps={pickedApps}
          roundsFor={roundsFor}
          onClose={() => setBulk(null)}
          onDone={() => {
            setBulk(null)
            setPicked(new Set())
          }}
        />
      )}
    </div>
  )
}
