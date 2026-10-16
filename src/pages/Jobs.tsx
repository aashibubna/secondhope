import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  HeartPulse,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { CompanyLogo } from '../components/Brand'
import { Toggle } from '../components/Fields'
import { profileCompletion, matchScore, useApp } from '../context/store'
import { JOBS } from '../data/jobs'
import { FUNCTIONS, JOB_TYPES, SUPPORTS, WORK_MODES } from '../data/options'
import type { Job } from '../types'

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

function JobDetail({ job, onClose }: { job: Job; onClose?: () => void }) {
  const { user, toggleSave, apply } = useApp()
  const saved = user?.saved.includes(job.id)
  const applied = user?.applied.some((a) => a.jobId === job.id)
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
          {job.company} {job.pledge && <BadgeCheck size={16} className="verified" />}
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
            <dd>{job.salary}</dd>
          </div>
        </dl>

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

        <div className="detail__actions">
          <button className="btn btn--primary btn--block" disabled={applied} onClick={() => apply(job.id)}>
            {applied ? (
              <>
                <CheckCircle2 size={16} /> Applied
              </>
            ) : (
              <>
                Apply now <ArrowRight size={16} />
              </>
            )}
          </button>
          <button
            className={`icon-btn icon-btn--outline ${saved ? 'is-on' : ''}`}
            onClick={() => toggleSave(job.id)}
            aria-label={saved ? 'Unsave' : 'Save'}
          >
            {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        </div>
        <p className="muted small">Posted {job.postedDays === 1 ? '1 day' : `${job.postedDays} days`} ago</p>

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
      </div>
    </div>
  )
}

export default function Jobs() {
  const { user, toggleSave } = useApp()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [location, setLocation] = useState('')
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [selectedId, setSelectedId] = useState<string>(JOBS[0]!.id)
  const [drawer, setDrawer] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const savedOnly = params.get('saved') === '1'
  const query = params.get('q') ?? ''

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters((f) => ({ ...f, [k]: v }))

  const results = useMemo(() => {
    const term = query.toLowerCase()
    const loc = location.toLowerCase()
    return JOBS.filter((j) => {
      if (savedOnly && !user?.saved.includes(j.id)) return false
      if (term && !`${j.title} ${j.company} ${j.func}`.toLowerCase().includes(term)) return false
      if (loc && !j.location.toLowerCase().includes(loc)) return false
      if (filters.modes.length && !filters.modes.includes(j.mode)) return false
      if (filters.types.length && !filters.types.includes(j.type)) return false
      if (filters.funcs.length && !filters.funcs.includes(j.func)) return false
      if (filters.hours.length && !filters.hours.includes(j.hours)) return false
      if (filters.supports.length && !filters.supports.every((s) => j.supports.includes(s))) return false
      if (filters.pledgeOnly && !j.pledge) return false
      return true
    }).sort((a, b) => (matchScore(b, user?.profile) ?? 0) - (matchScore(a, user?.profile) ?? 0))
  }, [query, location, filters, savedOnly, user])

  const selected = results.find((j) => j.id === selectedId) ?? results[0]
  const completion = user ? profileCompletion(user.profile) : 100

  const submitSearch = (e: React.FormEvent) => {
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
            <CheckList options={['Flexible', 'Reduced', 'Standard']} value={filters.hours} onChange={(v) => set('hours', v)} />
          </div>
          <div className="filters__group">
            <h4>Job type</h4>
            <CheckList options={JOB_TYPES} value={filters.types} onChange={(v) => set('types', v)} />
          </div>
          <div className="filters__group">
            <h4>Job function</h4>
            <CheckList options={FUNCTIONS} value={filters.funcs} onChange={(v) => set('funcs', v)} />
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

          {results.length === 0 ? (
            <div className="empty">
              <Search size={28} />
              <h3>No jobs match yet</h3>
              <p className="muted">Try removing a filter or two. New roles are added every day.</p>
              <button className="btn btn--dark btn--sm" onClick={() => setFilters(EMPTY)}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="job-grid">
              {results.map((job) => {
                const saved = user?.saved.includes(job.id)
                const isSel = selected?.id === job.id
                return (
                  <article
                    key={job.id}
                    className={`job-card ${isSel ? 'job-card--active' : ''}`}
                    onClick={() => {
                      setSelectedId(job.id)
                      setDrawer(true)
                    }}
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
                      </div>
                      <div className="job-card__support">
                        <HeartPulse size={13} /> {job.supports[0]}
                        {job.supports.length > 1 && ` +${job.supports.length - 1}`}
                      </div>
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
            <JobDetail job={selected} onClose={() => setDrawer(false)} />
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
