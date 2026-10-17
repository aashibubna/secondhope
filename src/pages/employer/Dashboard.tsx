import { ArrowRight, BadgeCheck, Briefcase, Eye, EyeOff, Pencil, PlusCircle, Sparkles, Trash2, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import { Avatar } from '../../components/Brand'
import { Modal, Spinner, StatusPill } from '../../components/Status'
import { friendlyError, timeAgo, useApp } from '../../context/store'
import { deleteJob, updateJob } from '../../lib/db'
import { useCompany, useCompanyApplications, useCompanyJobs } from '../../lib/hooks'
import type { Job } from '../../types'

export default function Dashboard() {
  const { user } = useApp()
  const [params, setParams] = useSearchParams()
  const { data: company, loading } = useCompany(user?.id)
  const { data: jobs, loading: jobsLoading } = useCompanyJobs(user?.id)
  const { data: apps } = useCompanyApplications(user?.id)
  const [removing, setRemoving] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(() => {
    const m = new Map<string, { total: number; fresh: number }>()
    for (const a of apps) {
      if (a.status === 'withdrawn') continue
      const c = m.get(a.jobId) ?? { total: 0, fresh: 0 }
      c.total++
      if (a.status === 'applied') c.fresh++
      m.set(a.jobId, c)
    }
    return m
  }, [apps])

  if (!user) return null
  if (loading) return <Splashy />
  if (!company) return <Navigate to="/employer/setup" replace />

  const open = jobs.filter((j) => j.status === 'open').length
  const fresh = apps.filter((a) => a.status === 'applied').length
  const interviewing = apps.filter((a) => a.status === 'interview' || a.status === 'offer').length
  const hired = apps.filter((a) => a.status === 'hired').length
  const recent = apps.filter((a) => a.status !== 'withdrawn').slice(0, 5)

  const toggleOpen = (j: Job) => updateJob(j.id, { status: j.status === 'open' ? 'closed' : 'open' }).catch((e) => setError(friendlyError(e)))

  return (
    <div className="app">
      <AppHeader />
      <div className="page">
        {params.get('welcome') && (
          <div className="welcome-banner">
            <Sparkles size={18} />
            <p>
              <strong>{company.name} is all set.</strong> Post your first role — it goes live for candidates straight away.
            </p>
            <Link to="/employer/jobs/new" className="btn btn--light btn--sm">
              Post a job
            </Link>
            <button className="icon-btn icon-btn--light" aria-label="Dismiss" onClick={() => setParams({}, { replace: true })}>
              <X size={16} />
            </button>
          </div>
        )}

        <header className="page__head">
          <div>
            <span className="eyebrow">Employer dashboard</span>
            <h1>Hello, {user.name.split(' ')[0]}</h1>
            <p className="muted">Here’s how {company.name} is doing on SecondHope.</p>
          </div>
          <Link to="/employer/jobs/new" className="btn btn--primary">
            <PlusCircle size={16} /> Post a job
          </Link>
        </header>

        {!company.pledge && (
          <Link to="/employer/company" className="nudge">
            <BadgeCheck size={18} />
            <span>
              Sign the <strong>Cancer-Aware Pledge</strong> to earn a badge on every job and reach candidates who filter for it.
            </span>
            <ArrowRight size={16} />
          </Link>
        )}

        <div className="stat-cards">
          <div className="stat-card">
            <Briefcase size={18} />
            <strong>{open}</strong>
            <span>Open jobs</span>
          </div>
          <Link to="/employer/candidates?status=applied" className="stat-card stat-card--accent">
            <Users size={18} />
            <strong>{fresh}</strong>
            <span>New applicants</span>
          </Link>
          <Link to="/employer/candidates?status=interview" className="stat-card">
            <Sparkles size={18} />
            <strong>{interviewing}</strong>
            <span>Interviews & offers</span>
          </Link>
          <div className="stat-card">
            <BadgeCheck size={18} />
            <strong>{hired}</strong>
            <span>Hired</span>
          </div>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="dash-grid">
          <section className="card">
            <div className="card__head">
              <h2>Your jobs</h2>
            </div>
            {jobsLoading ? (
              <Spinner />
            ) : jobs.length === 0 ? (
              <div className="empty empty--small">
                <p className="muted">No jobs yet. Your first post takes about five minutes.</p>
                <Link to="/employer/jobs/new" className="btn btn--dark btn--sm">
                  Post a job <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <ul className="job-rows">
                {jobs.map((j) => {
                  const c = counts.get(j.id)
                  return (
                    <li key={j.id} className={j.status === 'closed' ? 'is-closed' : ''}>
                      <div className="job-rows__main">
                        <strong>{j.title}</strong>
                        <small>
                          {j.location} · {j.mode} · {j.type} · posted {timeAgo(j.createdAt)}
                        </small>
                      </div>
                      <span className={`status ${j.status === 'open' ? 'status--good' : 'status--muted'}`}>
                        {j.status === 'open' ? 'Open' : 'Closed'}
                      </span>
                      <Link to={`/employer/candidates?job=${j.id}`} className="job-rows__count">
                        <Users size={14} /> {c?.total ?? 0}
                        {c?.fresh ? <span className="badge">{c.fresh} new</span> : null}
                      </Link>
                      <div className="job-rows__actions">
                        <Link to={`/employer/jobs/${j.id}/edit`} className="icon-btn" aria-label={`Edit ${j.title}`} title="Edit">
                          <Pencil size={16} />
                        </Link>
                        <button
                          className="icon-btn"
                          onClick={() => toggleOpen(j)}
                          aria-label={j.status === 'open' ? `Close ${j.title}` : `Reopen ${j.title}`}
                          title={j.status === 'open' ? 'Close job' : 'Reopen job'}
                        >
                          {j.status === 'open' ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button className="icon-btn" onClick={() => setRemoving(j)} aria-label={`Delete ${j.title}`} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="card__head">
              <h2>Recent applicants</h2>
              <Link to="/employer/candidates" className="link-btn">
                See all
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="muted small">Applicants will appear here as soon as someone applies.</p>
            ) : (
              <ul className="people">
                {recent.map((a) => (
                  <li key={a.id}>
                    <Link to={`/employer/candidates?app=${a.id}`}>
                      <Avatar name={a.applicant.name} size={36} />
                      <span>
                        <strong>{a.applicant.name}</strong>
                        <small>
                          {a.jobTitle} · {timeAgo(a.createdAt)}
                        </small>
                      </span>
                      <StatusPill status={a.status} employer />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {removing && (
        <Modal title="Delete this job?" onClose={() => setRemoving(null)}>
          <div className="stack">
            <p>
              <strong>{removing.title}</strong> will be removed permanently. Candidates who applied keep their own record.
              If you might reopen it, close it instead.
            </p>
            <div className="row row--end">
              <button className="btn btn--ghost" onClick={() => setRemoving(null)}>
                Cancel
              </button>
              {removing.status === 'open' && (
                <button
                  className="btn btn--dark"
                  onClick={() => {
                    toggleOpen(removing)
                    setRemoving(null)
                  }}
                >
                  Close instead
                </button>
              )}
              <button
                className="btn btn--danger"
                onClick={() => {
                  deleteJob(removing.id).catch((e) => setError(friendlyError(e)))
                  setRemoving(null)
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Splashy() {
  return (
    <div className="app">
      <AppHeader />
      <div className="page">
        <Spinner />
      </div>
    </div>
  )
}
