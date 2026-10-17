import { ArrowRight, BadgeCheck, Building2, CheckCircle2, Globe, HeartPulse, MapPin, Pencil, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { CompanyLogo } from '../components/Brand'
import { Spinner } from '../components/Status'
import { timeAgo, useApp } from '../context/store'
import { PLEDGE_COMMITMENTS } from '../data/options'
import { useCompany, useCompanyJobs } from '../lib/hooks'

export default function CompanyPage() {
  const { id } = useParams()
  const { user } = useApp()
  const { data: company, loading } = useCompany(id)
  const { data: jobs } = useCompanyJobs(id, true)
  const own = user?.id === id

  return (
    <div className="app">
      <AppHeader />
      <div className="page">
        {loading ? (
          <Spinner />
        ) : !company ? (
          <div className="empty">
            <Building2 size={28} />
            <h3>We couldn’t find this company</h3>
            <p className="muted">It may have left SecondHope.</p>
            <Link to="/jobs" className="btn btn--dark btn--sm">
              Browse jobs
            </Link>
          </div>
        ) : (
          <>
            <section className="company-hero">
              <div className="company-hero__cover" aria-hidden="true" />
              <div className="company-hero__body">
                <CompanyLogo {...company.logo} size={88} />
                <div className="company-hero__id">
                  <h1>
                    {company.name}
                    {company.pledge && <BadgeCheck size={22} className="verified" aria-label="Cancer-Aware Pledge" />}
                  </h1>
                  <div className="profile__meta">
                    {company.industry && (
                      <span>
                        <Building2 size={14} /> {company.industry}
                      </span>
                    )}
                    {company.location && (
                      <span>
                        <MapPin size={14} /> {company.location}
                      </span>
                    )}
                    {company.size && (
                      <span>
                        <Users size={14} /> {company.size} people
                      </span>
                    )}
                    {company.website && (
                      <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer">
                        <Globe size={14} /> {company.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
                {own && (
                  <Link to="/employer/company" className="btn btn--ghost btn--sm">
                    <Pencil size={14} /> Edit company
                  </Link>
                )}
              </div>
            </section>

            <div className="company-grid">
              <div className="stack">
                {company.about && (
                  <div className="card">
                    <h2>About</h2>
                    <p className="prose">{company.about}</p>
                  </div>
                )}
                <div className="card">
                  <h2>Open roles ({jobs.length})</h2>
                  {jobs.length === 0 ? (
                    <p className="muted">No open roles right now. Check back soon.</p>
                  ) : (
                    <ul className="mini-jobs">
                      {jobs.map((j) => (
                        <li key={j.id}>
                          <CompanyLogo {...j.logo} size={40} />
                          <div>
                            <strong>{j.title}</strong>
                            <small>
                              {j.location} · {j.mode} · {j.type} · {timeAgo(j.createdAt)}
                            </small>
                          </div>
                          {user?.role === 'seeker' ? (
                            <Link to={`/jobs?job=${j.id}`} className="btn btn--ghost btn--sm">
                              View <ArrowRight size={14} />
                            </Link>
                          ) : (
                            <span className="pill">{j.salary}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <aside className="stack">
                {company.supports.length > 0 && (
                  <div className="support-box">
                    <h4>
                      <HeartPulse size={16} /> Support offered
                    </h4>
                    <div className="support-box__list">
                      {company.supports.map((s) => (
                        <span key={s}>
                          <CheckCircle2 size={14} /> {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {company.pledge && (
                  <div className="card card--dark">
                    <BadgeCheck size={18} />
                    <h3>Cancer-Aware Pledge</h3>
                    <p>
                      {company.name} signed the pledge{company.pledgeSignedAt ? ` in ${new Date(company.pledgeSignedAt).getFullYear()}` : ''} and
                      commits to:
                    </p>
                    <ul className="pledge-list">
                      {PLEDGE_COMMITMENTS.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
