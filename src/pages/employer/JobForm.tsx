import { AlertTriangle, ArrowLeft, Eye, Lightbulb } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import { ChipGroup, ChoiceCards, Field } from '../../components/Fields'
import { Spinner } from '../../components/Status'
import { friendlyError, useApp } from '../../context/store'
import { FUNCTIONS, JOB_HOURS, JOB_TYPES, SUPPORTS, WORK_MODES } from '../../data/options'
import { createJob, getJob, updateJob } from '../../lib/db'
import { useCompany } from '../../lib/hooks'
import type { Company, Job, JobInput } from '../../types'

const blank: JobInput = {
  title: '',
  location: '',
  mode: 'Remote',
  type: 'Full-time',
  hours: 'Flexible',
  salary: '',
  func: '',
  supports: [],
  description: '',
  responsibilities: [],
  requirements: [],
  status: 'open',
}

// Phrases that quietly screen out people with health histories or career pauses.
const FLAGGED: [RegExp, string][] = [
  [/\b(no|without) (career )?gaps?\b|continuous (employment|experience)/i, 'Asking for no career gaps excludes people who paused work for treatment or caregiving.'],
  [/\b(perfect|good|excellent) (physical )?health\b|\bhealthy\b|medically fit|fit and healthy/i, 'Health requirements can be discriminatory unless genuinely essential to the role.'],
  [/\b(high|boundless|endless) energy\b|\benergetic\b/i, '“Energetic” can read as a coded requirement. Describe the actual work instead.'],
  [/\bfast[- ]paced\b|\bwork hard,? play hard\b|\bhustle\b|\b(long|late) hours\b/i, 'Pace-heavy language can discourage people managing fatigue. Say what the workload really is.'],
  [/\b(young|youthful|digital native)\b/i, 'Age-coded words narrow your pool unfairly.'],
  [/\b(must|able to) (lift|stand|walk)\b/i, 'Only list physical requirements that are truly essential, and say if adjustments are possible.'],
  [/\bmedical (history|records|certificate)\b/i, 'Pledged employers don’t ask about medical history during hiring.'],
]

const lines = (s: string) => s.split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)

export default function JobForm() {
  const { id } = useParams()
  const { user } = useApp()
  const { data: company, loading: companyLoading } = useCompany(user?.id)
  const [job, setJob] = useState<{ id: string; data: Job | null } | null>(null)

  useEffect(() => {
    if (!id) return
    getJob(id)
      .catch(() => null)
      .then((data) => setJob({ id, data }))
  }, [id])

  const jobLoading = !!id && job?.id !== id
  if (!user) return null
  if (!companyLoading && !company) return <Navigate to="/employer/setup" replace />
  if (id && !jobLoading && (!job?.data || job.data.companyId !== user.id)) return <Navigate to="/employer" replace />
  if (companyLoading || jobLoading || !company)
    return (
      <div className="app">
        <AppHeader />
        <div className="page page--narrow">
          <Spinner />
        </div>
      </div>
    )

  // New jobs start with the support the company offers everywhere.
  const initial = (id && job?.data) || { ...blank, supports: company.supports }
  return <JobEditor key={id ?? 'new'} id={id} company={company} initial={initial} />
}

function JobEditor({ id, company, initial }: { id?: string; company: Company; initial: JobInput }) {
  const { user } = useApp()
  const navigate = useNavigate()
  const { title, location, mode, type, hours, salary, func, supports, description, status } = initial
  const [form, setForm] = useState<JobInput>({
    title,
    location,
    mode,
    type,
    hours,
    salary,
    func,
    supports,
    description,
    status,
    responsibilities: [],
    requirements: [],
  })
  const [resp, setResp] = useState(initial.responsibilities.join('\n'))
  const [reqs, setReqs] = useState(initial.requirements.join('\n'))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const warnings = useMemo(() => {
    const text = [form.title, form.description, resp, reqs].join('\n')
    return FLAGGED.filter(([re]) => re.test(text)).map(([, msg]) => msg)
  }, [form.title, form.description, resp, reqs])

  if (!user) return null
  const set = (patch: Partial<JobInput>) => setForm((f) => ({ ...f, ...patch }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const input: JobInput = { ...form, title: form.title.trim(), responsibilities: lines(resp), requirements: lines(reqs) }
    try {
      if (id) await updateJob(id, input)
      else await createJob(company, input)
      navigate('/employer')
    } catch (err) {
      console.error(err)
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app">
      <AppHeader />
      <div className="page page--narrow">
        <Link to="/employer" className="back-link">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <header className="page__head">
          <div>
            <span className="eyebrow">{id ? 'Edit job' : 'New job'}</span>
            <h1>{id ? form.title || 'Edit job' : 'Post a job'}</h1>
            <p className="muted">Clear, honest posts get better applicants — especially about flexibility and support.</p>
          </div>
        </header>

        <form className="stack" onSubmit={submit}>
          <section className="card">
            <h2>The basics</h2>
            <div className="form-grid">
              <div className="form-grid__full">
                <Field label="Job title">
                  <input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Customer Success Associate" required maxLength={120} />
                </Field>
              </div>
              <Field label="Job function">
                <select value={form.func} onChange={(e) => set({ func: e.target.value })} required>
                  <option value="">Select</option>
                  {FUNCTIONS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </Field>
              <Field label="Location">
                <input value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Pune, IN or Remote, IN" required />
              </Field>
              <Field label="Salary" hint="Posts with a salary range get far more applicants.">
                <input value={form.salary} onChange={(e) => set({ salary: e.target.value })} placeholder="e.g. ₹6L – ₹9L" />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => set({ status: e.target.value as JobInput['status'] })}>
                  <option value="open">Open — visible to candidates</option>
                  <option value="closed">Closed — hidden</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="card">
            <h2>How the work works</h2>
            <div className="stack">
              <div>
                <h4 className="sub-label">Work mode</h4>
                <ChoiceCards options={WORK_MODES.map((m) => ({ value: m, label: m }))} value={form.mode} onChange={(v) => set({ mode: v as JobInput['mode'] })} columns={3} />
              </div>
              <div>
                <h4 className="sub-label">Job type</h4>
                <ChoiceCards options={JOB_TYPES.map((m) => ({ value: m, label: m }))} value={form.type} onChange={(v) => set({ type: v as JobInput['type'] })} columns={4} />
              </div>
              <div>
                <h4 className="sub-label">Hours</h4>
                <ChoiceCards
                  options={JOB_HOURS.map((h) => ({
                    value: h,
                    label: h,
                    hint: h === 'Flexible' ? 'Choose when you work' : h === 'Reduced' ? 'Fewer than 30 hrs/week' : 'Regular schedule',
                  }))}
                  value={form.hours}
                  onChange={(v) => set({ hours: v as JobInput['hours'] })}
                  columns={3}
                />
              </div>
              <div>
                <h4 className="sub-label">Support offered in this role</h4>
                <ChipGroup options={SUPPORTS} value={form.supports} onChange={(v) => set({ supports: v })} />
              </div>
            </div>
          </section>

          <section className="card">
            <h2>Description</h2>
            <div className="stack">
              <Field label="About the role">
                <textarea rows={5} value={form.description} onChange={(e) => set({ description: e.target.value })} required maxLength={5000} />
              </Field>
              <Field label="Responsibilities" hint="One per line.">
                <textarea rows={4} value={resp} onChange={(e) => setResp(e.target.value)} placeholder={'Answer customer questions over chat\nWrite help-center articles'} />
              </Field>
              <Field label="Requirements" hint="One per line. Keep it to what’s truly essential.">
                <textarea rows={4} value={reqs} onChange={(e) => setReqs(e.target.value)} placeholder={'Clear written communication\nCareer gaps welcome'} />
              </Field>
            </div>
          </section>

          <section className={`card card--soft inclusive ${warnings.length ? 'inclusive--warn' : ''}`} aria-live="polite">
            {warnings.length ? (
              <>
                <h3>
                  <AlertTriangle size={16} /> A few phrases to reconsider
                </h3>
                <ul>
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h3>
                  <Lightbulb size={16} /> Inclusive language check
                </h3>
                <p className="small muted">
                  Looking good. Tip: saying “career gaps welcome” and naming real flexibility (e.g. “core hours 11–3”)
                  noticeably increases applications from survivors.
                </p>
              </>
            )}
          </section>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="row row--end">
            {id && (
              <Link to={`/companies/${user.id}`} className="btn btn--ghost">
                <Eye size={14} /> Company page
              </Link>
            )}
            <button className="btn btn--primary" disabled={busy}>
              {busy ? 'Saving…' : id ? 'Save changes' : form.status === 'open' ? 'Publish job' : 'Save as closed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
