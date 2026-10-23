import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  HeartPulse,
  Lock,
  MapPin,
  PartyPopper,
  Search,
  SlidersHorizontal,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { CompanyLogo } from '../components/Brand'
import { Field, Toggle } from '../components/Fields'
import { ShowErrors } from '../components/showErrors'
import { Modal, Spinner, StatusPill } from '../components/Status'
import { friendlyError, matchScore, profileCompletion, timeAgo, useApp } from '../context/store'
import { FUNCTIONS, JOB_HOURS, JOB_TYPES, OTHER, SUPPORTS, WORK_MODES } from '../data/options'
import { apply, willDisclose } from '../lib/db'
import { useMyApplications, useOpenJobs } from '../lib/hooks'
import type { Application, Job } from '../types'

interface Filters {
  modes: string[]
  types: string[]
  supports: string[]
  funcs: string[]
  hours: string[]
  pledgeOnly: boolean
}

const EMPTY: Filters = { modes: [], types: [], supports: [], funcs: [], hours: [], pledgeOnly: false }

function CheckList({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  return (
    <div className="checklist">
      {options.map((o) => (
        <label key={o} className="checkbox">
          <input
            type="checkbox"
            checked={value.includes(o)}
            onChange={() => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o])}
          />
          <span>{o}</span>
        </label>
      ))}
    </div>
  )
}

function ApplyModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const { user } = useApp()
  const [note, setNote] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!user) return null
  const p = user.profile
  const completion = profileCompletion(p)
  const sharing = willDisclose(user, job)
  const missing = job.questions.filter((q) => q.required && !answers[q.id]?.trim())

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setShowErrors(true)
    if (missing.length) return setError('Please answer the required questions.')
    setBusy(true)
    setError(null)
    try {
      await apply(user, job, note, job.questions.map((q) => ({ question: q.text, answer: answers[q.id] ?? '' })))
      setDone(true)
    } catch (err) {
      console.error(err)
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  if (done)
    return (
      <Modal title="Application sent" onClose={onClose}>
        <div className="apply-done">
          <span className="apply-done__icon">
            <PartyPopper size={26} />
          </span>
          <h3>Well done for putting yourself forward.</h3>
          <p className="muted">
            {job.company} now has your application for <strong>{job.title}</strong>. We’ll let you know here as soon as
            they update it. In the meantime, rest up — you’ve done the hard part.
          </p>
          <div className="row row--center">
            <Link to="/applications" className="btn btn--dark btn--sm">
              Track my applications
            </Link>
            <button className="btn btn--ghost btn--sm" onClick={onClose}>
              Keep browsing
            </button>
          </div>
        </div>
      </Modal>
    )

  return (
    <Modal title={`Apply to ${job.company}`} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="apply-job">
          <CompanyLogo {...job.logo} size={44} />
          <div>
            <strong>{job.title}</strong>
            <small>
              {job.company} · {job.location}
            </small>
          </div>
        </div>

        <div className="apply-share">
          <h4>What {job.company} will see</h4>
          <ul>
            <li>
              <CheckCircle2 size={14} /> Your name, email{p.phone ? ', phone' : ''} and location
            </li>
            <li>
              <CheckCircle2 size={14} /> Your headline, about, experience and skills
            </li>
            {p.careerPause && p.careerPauseNote && (
              <li>
                <CheckCircle2 size={14} /> Your career pause, in your words: “{p.careerPauseNote}”
              </li>
            )}
            <li className={sharing ? '' : 'apply-share__private'}>
              {sharing ? <HeartPulse size={14} /> : <Lock size={14} />}
              {sharing
                ? 'Your journey stage and support needs (you chose to share these with pledged employers)'
                : p.disclosure === 'after-offer'
                  ? 'Your health details stay private until you accept an offer'
                  : 'No health information — that stays private'}
            </li>
          </ul>
          <Link to="/profile?tab=journey" className="small">
            Change what you share
          </Link>
        </div>

        {completion < 50 && (
          <p className="hint-box">
            Your profile is {completion}% complete. You can absolutely apply now — adding a headline and skills just
            helps {job.company} get to know you. <Link to="/profile">Update profile</Link>
          </p>
        )}

        {job.questions.length > 0 && (
          <ShowErrors.Provider value={showErrors}>
            <div className="stack">
              <h4>A few questions from {job.company}</h4>
              {job.questions.map((q) => (
                <Field
                  key={q.id}
                  label={q.required ? q.text : `${q.text} (optional)`}
                  error={missing.includes(q) ? 'This question needs an answer.' : undefined}
                >
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={answers[q.id] ?? ''}
                    required={q.required}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  />
                </Field>
              ))}
            </div>
          </ShowErrors.Provider>
        )}

        <Field label="A short note (optional)" hint="Why this role interests you. A couple of sentences is plenty.">
          <textarea
            rows={4}
            maxLength={3000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Hi ${job.company} team, I’d love to…`}
          />
        </Field>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="row row--end">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Not now
          </button>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'Sending…' : 'Send application'} <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  )
}

function JobDetail({ job, application, onClose }: { job: Job; application?: Application; onClose?: () => void }) {
  const { user, toggleSave } = useApp()
  const [applying, setApplying] = useState(false)
  const saved = user?.saved.includes(job.id)
  const score = matchScore(job, user?.profile)

  return (
    <div className="detail">
      {onClose && (
        <button className="detail__close icon-btn icon-btn--light" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      )}
      <div className="detail__cover">
        <div className="detail__cover-pattern" />
        <div className="detail__logo">
          <CompanyLogo {...job.logo} size={64} />
        </div>
      </div>
      <div className="detail__body">
        <h2>{job.title}</h2>
        <p className="detail__company">
          <Link to={`/companies/${job.companyId}`}>{job.company}</Link>
          {job.pledge && <BadgeCheck size={16} className="verified" aria-label="Cancer-Aware Pledge" />}
        </p>

        {score !== null && (
          <div className="fit">
            <div className="fit__ring" style={{ ['--p' as string]: score }}>
              <span>{score}%</span>
            </div>
            <div>
              <strong>Good fit for you</strong>
              <small>Based on the preferences you’ve shared</small>
            </div>
          </div>
        )}

        <dl className="detail__meta">
          <div>
            <dt>
              <MapPin size={14} /> Location
            </dt>
            <dd>{job.location}</dd>
          </div>
          <div>
            <dt>
              <Briefcase size={14} /> Work mode
            </dt>
            <dd>{job.mode}</dd>
          </div>
          <div>
            <dt>
              <Clock size={14} /> Job type
            </dt>
            <dd>
              {job.type} · {job.hours} hours
            </dd>
          </div>
          <div>
            <dt>
              <Wallet size={14} /> Salary
            </dt>
            <dd>{job.salary || 'Not listed'}</dd>
          </div>
        </dl>

        {job.supports.length > 0 && (
          <div className="support-box">
            <h4>
              <HeartPulse size={16} /> Support this employer offers
            </h4>
            <div className="support-box__list">
              {job.supports.map((s) => (
                <span key={s}>
                  <CheckCircle2 size={14} /> {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="detail__actions">
          {application ? (
            <Link to={`/applications?app=${application.id}`} className="btn btn--soft btn--block">
              <CheckCircle2 size={16} /> Applied · <StatusPill status={application.status} />
            </Link>
          ) : (
            <button className="btn btn--primary btn--block" onClick={() => setApplying(true)}>
              Apply now <ArrowRight size={16} />
            </button>
          )}
          <button
            className={`icon-btn icon-btn--outline ${saved ? 'is-on' : ''}`}
            onClick={() => toggleSave(job.id)}
            aria-label={saved ? 'Unsave' : 'Save'}
          >
            {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        </div>
        <p className="muted small">Posted {timeAgo(job.createdAt)}</p>

        <h4>Description</h4>
        <p className="muted">{job.description}</p>
        <h4>Responsibilities</h4>
        <ul>
          {job.responsibilities.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <h4>Requirements</h4>
        <ul>
          {job.requirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <h4>Hiring process</h4>
        <ol className="process">
          {['Résumé shortlisting', ...job.rounds, 'Offer'].map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ol>
        <Link to={`/companies/${job.companyId}`} className="detail__more">
          More about {job.company} <ArrowRight size={14} />
        </Link>
      </div>
      {applying && <ApplyModal job={job} onClose={() => setApplying(false)} />}
    </div>
  )
}

export default function Jobs() {
  const { user, toggleSave } = useApp()
  const { data: jobs, loading } = useOpenJobs()
  const { data: myApps } = useMyApplications(user?.id)
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [location, setLocation] = useState('')
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const selectedId = params.get('job')
  const [drawer, setDrawer] = useState(!!selectedId)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const savedOnly = params.get('saved') === '1'
  const query = params.get('q') ?? ''

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters((f) => ({ ...f, [k]: v }))

  const results = useMemo(() => {
    const term = query.toLowerCase()
    const loc = location.toLowerCase()
    return jobs.filter((j) => {
      if (savedOnly && !user?.saved.includes(j.id)) return false
      if (term && !`${j.title} ${j.company} ${j.func} ${j.description}`.toLowerCase().includes(term)) return false
      if (loc && !j.location.toLowerCase().includes(loc)) return false
      if (filters.modes.length && !filters.modes.includes(j.mode)) return false
      if (filters.types.length && !filters.types.includes(j.type)) return false
      if (filters.funcs.length && !filters.funcs.includes(FUNCTIONS.includes(j.func) ? j.func : OTHER)) return false
      if (filters.hours.length && !filters.hours.includes(j.hours)) return false
      if (filters.supports.length && !filters.supports.every((s) => j.supports.includes(s))) return false
      if (filters.pledgeOnly && !j.pledge) return false
      return true
    }).sort((a, b) => (matchScore(b, user?.profile) ?? 0) - (matchScore(a, user?.profile) ?? 0))
  }, [jobs, query, location, filters, savedOnly, user])

  const appByJob = useMemo(() => new Map(myApps.map((a) => [a.jobId, a])), [myApps])
  const select = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('job', id)
    setParams(next, { replace: true })
    setDrawer(true)
  }

  const selected = results.find((j) => j.id === selectedId) ?? results[0]
  const completion = user ? profileCompletion(user.profile) : 100

  const submitSearch = (e: FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams(params)
    if (q) next.set('q', q)
    else next.delete('q')
    setParams(next)
  }

  const applyPreferences = () => {
    if (!user) return
    const p = user.profile
    setFilters({
      ...EMPTY,
      modes: p.workModes,
      types: p.jobTypes,
      funcs: p.functions,
      supports: p.supportNeeds.slice(0, 2),
    })
  }

  return (
    <div className="app">
      <AppHeader />
      <div className="board">
        {/* ───── Filters ───── */}
        <aside className={`filters ${filtersOpen ? 'filters--open' : ''}`}>
          <div className="filters__head">
            <h3>Filter</h3>
            <button className="link-btn link-btn--danger" onClick={() => setFilters(EMPTY)}>
              Reset
            </button>
            <button className="icon-btn filters__close" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
              <X size={18} />
            </button>
          </div>

          {user && (user.profile.workModes.length > 0 || user.profile.functions.length > 0) && (
            <button className="prefs-btn" onClick={applyPreferences}>
              <Sparkles size={14} /> Use my preferences
            </button>
          )}

          <div className="filters__group">
            <h4>Job location</h4>
            <div className="input-icon input-icon--left">
              <MapPin size={16} />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Any city" />
            </div>
          </div>
          <div className="filters__group filters__group--pledge">
            <Toggle
              checked={filters.pledgeOnly}
              onChange={(v) => set('pledgeOnly', v)}
              label="Cancer-Aware Pledge only"
            />
          </div>
          <div className="filters__group">
            <h4>Support offered</h4>
            <CheckList options={SUPPORTS} value={filters.supports} onChange={(v) => set('supports', v)} />
          </div>
          <div className="filters__group">
            <h4>Work mode</h4>
            <CheckList options={WORK_MODES} value={filters.modes} onChange={(v) => set('modes', v)} />
          </div>
          <div className="filters__group">
            <h4>Hours</h4>
            <CheckList options={[...JOB_HOURS]} value={filters.hours} onChange={(v) => set('hours', v)} />
          </div>
          <div className="filters__group">
            <h4>Job type</h4>
            <CheckList options={JOB_TYPES} value={filters.types} onChange={(v) => set('types', v)} />
          </div>
          <div className="filters__group">
            <h4>Job function</h4>
            <CheckList options={[...FUNCTIONS, OTHER]} value={filters.funcs} onChange={(v) => set('funcs', v)} />
          </div>
        </aside>

        {/* ───── Results ───── */}
        <main className="results">
          <section className="banner">
            <div className="banner__grid" aria-hidden="true" />
            <h1>{user ? `Hi ${user.name.split(' ')[0]}, find work that fits your life.` : 'Find work that fits your life.'}</h1>
            <p>Every role here comes from an employer that understands life during and after cancer.</p>
            <form className="banner__search" onSubmit={submitSearch}>
              <Search size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs, companies…" />
              <button type="submit" className="round-btn" aria-label="Search">
                <ArrowRight size={18} />
              </button>
            </form>
          </section>

          {completion < 60 && (
            <Link to="/profile" className="nudge">
              <span className="nudge__bar">
                <span style={{ width: `${completion}%` }} />
              </span>
              <span>
                Your profile is <strong>{completion}%</strong> complete. Add your preferences for better matches —
                whenever you’re ready.
              </span>
              <ArrowRight size={16} />
            </Link>
          )}

          <div className="results__head">
            <h2>
              {results.length} {savedOnly ? 'saved ' : ''}
              {results.length === 1 ? 'job' : 'jobs'}
              {query && <span className="muted"> for “{query}”</span>}
            </h2>
            <div className="row">
              {savedOnly && (
                <Link to="/jobs" className="pill">
                  Saved only <X size={12} />
                </Link>
              )}
              <button className="btn btn--ghost btn--sm filters-trigger" onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal size={14} /> Filters
              </button>
            </div>
          </div>

          {loading ? (
            <Spinner label="Finding roles for you…" />
          ) : results.length === 0 ? (
            <div className="empty">
              <Search size={28} />
              {jobs.length === 0 ? (
                <>
                  <h3>New roles are on their way</h3>
                  <p className="muted">Employers are setting up right now. Their jobs will appear here as soon as they post.</p>
                </>
              ) : savedOnly && !user?.saved.length ? (
                <>
                  <h3>Nothing saved yet</h3>
                  <p className="muted">Tap the bookmark on any job to keep it here for later.</p>
                  <Link to="/jobs" className="btn btn--dark btn--sm">
                    Browse jobs
                  </Link>
                </>
              ) : (
                <>
                  <h3>No jobs match yet</h3>
                  <p className="muted">Try removing a filter or two. New roles are added every day.</p>
                  <button className="btn btn--dark btn--sm" onClick={() => setFilters(EMPTY)}>
                    Clear filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="job-grid">
              {results.map((job) => {
                const saved = user?.saved.includes(job.id)
                const isSel = selected?.id === job.id
                const app = appByJob.get(job.id)
                return (
                  <article
                    key={job.id}
                    className={`job-card ${isSel ? 'job-card--active' : ''}`}
                    onClick={() => select(job.id)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return
                      e.preventDefault()
                      select(job.id)
                    }}
                    tabIndex={0}
                    aria-label={`${job.title} at ${job.company}`}
                  >
                    <div className="job-card__top">
                      <div className="job-card__head">
                        <CompanyLogo {...job.logo} />
                        <button
                          className={`save-btn ${saved ? 'save-btn--on' : ''}`}
                          aria-label={saved ? 'Unsave job' : 'Save job'}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSave(job.id)
                          }}
                        >
                          {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        </button>
                      </div>
                      <h3>
                        {job.company} {job.pledge && <BadgeCheck size={16} className="verified" />}
                      </h3>
                      <p className="job-card__title">{job.title}</p>
                      <div className="job-card__tags">
                        <span>{job.mode}</span>
                        <span>{job.type}</span>
                        {app && <StatusPill status={app.status} />}
                      </div>
                      {job.supports.length > 0 && (
                        <div className="job-card__support">
                          <HeartPulse size={13} /> {job.supports[0]}
                          {job.supports.length > 1 && ` +${job.supports.length - 1}`}
                        </div>
                      )}
                    </div>
                    <div className="job-card__foot">
                      <div>
                        <strong>{job.salary}</strong>
                        <small>{job.location}</small>
                      </div>
                      <span className="details-btn">Details</span>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>

        {/* ───── Detail ───── */}
        {selected && (
          <aside className={`detail-panel ${drawer ? 'detail-panel--open' : ''}`}>
            <JobDetail key={selected.id} job={selected} application={appByJob.get(selected.id)} onClose={() => setDrawer(false)} />
          </aside>
        )}
        {(drawer || filtersOpen) && (
          <div
            className="scrim"
            onClick={() => {
              setDrawer(false)
              setFiltersOpen(false)
            }}
          />
        )}
      </div>
    </div>
  )
}
