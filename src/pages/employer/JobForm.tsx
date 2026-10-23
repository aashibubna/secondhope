import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, Eye, Lightbulb, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import { ChipGroup, ChoiceCards, Field } from '../../components/Fields'
import { ShowErrors } from '../../components/showErrors'
import { Spinner } from '../../components/Status'
import { friendlyError, useApp } from '../../context/store'
import {
  DEFAULT_ROUNDS,
  FUNCTIONS,
  JOB_HOURS,
  JOB_TYPES,
  MAX_QUESTIONS,
  MAX_ROUNDS,
  OTHER,
  SALARY_PERIODS,
  SALARY_UNITS,
  SUPPORTS,
  WORK_MODES,
} from '../../data/options'
import { createJob, getJob, updateJob } from '../../lib/db'
import { useCompany } from '../../lib/hooks'
import { digitsOnly, formatPay, parsePay } from '../../lib/salary'
import { hasErrors, type Errors } from '../../lib/validate'
import type { Company, Job, JobInput, Question, SalaryPeriod, SalaryUnit } from '../../types'

const blank: JobInput = {
  title: '',
  location: '',
  mode: 'Remote',
  type: 'Full-time',
  hours: 'Flexible',
  salary: '',
  pay: null,
  func: '',
  supports: [],
  description: '',
  responsibilities: [],
  requirements: [],
  questions: [],
  rounds: DEFAULT_ROUNDS,
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

const newId = () => Math.random().toString(36).slice(2, 10)

interface PayDraft {
  min: string
  max: string
  unit: SalaryUnit
  period: SalaryPeriod
}

function payDraftOf(job: JobInput): PayDraft {
  const pay = job.pay ?? (job.salary ? parsePay(job.salary) : null)
  return pay
    ? { min: String(pay.min), max: pay.max != null ? String(pay.max) : '', unit: pay.unit, period: pay.period }
    : { min: '', max: '', unit: 'L', period: 'year' }
}

type ErrorKey = 'funcOther' | 'payMin' | 'payMax' | `q-${string}` | `r-${number}`

function jobErrors(func: string, funcOther: string, pay: PayDraft, questions: Question[], rounds: string[]) {
  const e: Errors<ErrorKey> = {}
  if (func === OTHER && !funcOther.trim()) e.funcOther = 'Please type the job function.'
  const min = Number(pay.min)
  const max = Number(pay.max)
  if (pay.max && !pay.min) e.payMin = 'Add the lowest amount too, or clear the range.'
  else if (pay.min && !(min > 0)) e.payMin = 'Enter an amount above zero.'
  if (pay.max && !(max > 0)) e.payMax = 'Enter an amount above zero.'
  else if (pay.max && pay.min && max < min) e.payMax = 'The maximum should be at least the minimum.'
  questions.forEach((q) => {
    if (!q.text.trim()) e[`q-${q.id}`] = 'Type the question, or remove it.'
  })
  rounds.forEach((r, i) => {
    if (!r.trim()) e[`r-${i}`] = 'Name this round, or remove it.'
  })
  return e
}

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
  const { title, location, mode, type, hours, salary, pay, func, supports, description, questions, rounds, status } = initial
  const custom = !!func && !FUNCTIONS.includes(func)
  const [form, setForm] = useState<JobInput>({
    title,
    location,
    mode,
    type,
    hours,
    salary,
    pay,
    func: custom ? OTHER : func,
    supports,
    description,
    status,
    responsibilities: [],
    requirements: [],
    questions,
    rounds,
  })
  const [funcOther, setFuncOther] = useState(custom ? func : '')
  const [payDraft, setPayDraft] = useState<PayDraft>(() => payDraftOf(initial))
  const [resp, setResp] = useState(initial.responsibilities.join('\n'))
  const [reqs, setReqs] = useState(initial.requirements.join('\n'))
  const [busy, setBusy] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const warnings = useMemo(() => {
    const text = [form.title, form.description, resp, reqs, ...form.questions.map((q) => q.text)].join('\n')
    return FLAGGED.filter(([re]) => re.test(text)).map(([, msg]) => msg)
  }, [form.title, form.description, resp, reqs, form.questions])

  if (!user) return null
  const set = (patch: Partial<JobInput>) => setForm((f) => ({ ...f, ...patch }))
  const setPay = (patch: Partial<PayDraft>) => setPayDraft((p) => ({ ...p, ...patch }))
  const errors = jobErrors(form.func, funcOther, payDraft, form.questions, form.rounds)
  const preview = payDraft.min && !errors.payMin && !errors.payMax
    ? formatPay({ min: Number(payDraft.min), max: payDraft.max ? Number(payDraft.max) : null, unit: payDraft.unit, period: payDraft.period })
    : null

  const setQuestion = (qid: string, patch: Partial<Question>) =>
    set({ questions: form.questions.map((q) => (q.id === qid ? { ...q, ...patch } : q)) })
  const setRound = (i: number, name: string) => set({ rounds: form.rounds.map((r, j) => (j === i ? name : r)) })
  const moveRound = (i: number, by: number) => {
    const next = [...form.rounds]
    ;[next[i], next[i + by]] = [next[i + by]!, next[i]!]
    set({ rounds: next })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setShowErrors(true)
    if (hasErrors(errors)) return setError('Please fix the highlighted fields.')
    setBusy(true)
    setError(null)
    const payValue = payDraft.min
      ? { min: Number(payDraft.min), max: payDraft.max && payDraft.max !== payDraft.min ? Number(payDraft.max) : null, unit: payDraft.unit, period: payDraft.period }
      : null
    const input: JobInput = {
      ...form,
      title: form.title.trim(),
      location: form.location.trim(),
      func: form.func === OTHER ? funcOther.trim() : form.func,
      pay: payValue,
      salary: payValue ? formatPay(payValue) : '',
      responsibilities: lines(resp),
      requirements: lines(reqs),
      questions: form.questions.map((q) => ({ ...q, text: q.text.trim() })),
      rounds: form.rounds.map((r) => r.trim()),
    }
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

        <ShowErrors.Provider value={showErrors}>
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
                    {[...FUNCTIONS, OTHER].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </Field>
                {form.func === OTHER && (
                  <Field label="Other job function" error={errors.funcOther}>
                    <input value={funcOther} onChange={(e) => setFuncOther(e.target.value)} placeholder="e.g. Legal, Research" maxLength={60} required />
                  </Field>
                )}
                <Field label="Location">
                  <input value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Pune, IN or Remote, IN" required maxLength={100} />
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={(e) => set({ status: e.target.value as JobInput['status'] })}>
                    <option value="open">Open — visible to candidates</option>
                    <option value="closed">Closed — hidden</option>
                  </select>
                </Field>
                <div className="form-grid__full">
                  <span className="field__label">Salary (optional)</span>
                  <div className="salary">
                    <Field label="Minimum" error={errors.payMin}>
                      <input inputMode="decimal" value={payDraft.min} onChange={(e) => setPay({ min: digitsOnly(e.target.value) })} placeholder="e.g. 6" maxLength={12} />
                    </Field>
                    <Field label="Maximum" error={errors.payMax}>
                      <input inputMode="decimal" value={payDraft.max} onChange={(e) => setPay({ max: digitsOnly(e.target.value) })} placeholder="e.g. 9" maxLength={12} />
                    </Field>
                    <Field label="In">
                      <select value={payDraft.unit} onChange={(e) => setPay({ unit: e.target.value as SalaryUnit })}>
                        {SALARY_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Paid">
                      <select value={payDraft.period} onChange={(e) => setPay({ period: e.target.value as SalaryPeriod })}>
                        {SALARY_PERIODS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <p className="field__hint">
                    {preview ? (
                      <>
                        Candidates will see <strong>{preview}</strong>
                      </>
                    ) : (
                      'Numbers only. Posts with a salary range get far more applicants.'
                    )}
                  </p>
                </div>
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
                  <textarea rows={4} value={resp} onChange={(e) => setResp(e.target.value)} maxLength={3000} placeholder={'Answer customer questions over chat\nWrite help-center articles'} />
                </Field>
                <Field label="Requirements" hint="One per line. Keep it to what’s truly essential.">
                  <textarea rows={4} value={reqs} onChange={(e) => setReqs(e.target.value)} maxLength={3000} placeholder={'Clear written communication\nCareer gaps welcome'} />
                </Field>
              </div>
            </section>

            <section className="card">
              <h2>Screening questions</h2>
              <p className="muted small">
                Optional. Candidates answer these when they apply. Please don’t ask about health, treatment or medical history.
              </p>
              <div className="stack editable-list">
                {form.questions.map((q, i) => (
                  <div key={q.id} className="editable-row">
                    <Field label={`Question ${i + 1}`} error={errors[`q-${q.id}`]}>
                      <input value={q.text} onChange={(e) => setQuestion(q.id, { text: e.target.value })} placeholder="e.g. Which tools have you used for customer support?" maxLength={300} />
                    </Field>
                    <label className="checkbox editable-row__check">
                      <input type="checkbox" checked={q.required} onChange={(e) => setQuestion(q.id, { required: e.target.checked })} />
                      <span>Required</span>
                    </label>
                    <button type="button" className="icon-btn" aria-label={`Remove question ${i + 1}`} onClick={() => set({ questions: form.questions.filter((x) => x.id !== q.id) })}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {form.questions.length < MAX_QUESTIONS && (
                  <button type="button" className="btn btn--ghost btn--sm add-btn" onClick={() => set({ questions: [...form.questions, { id: newId(), text: '', required: false }] })}>
                    <Plus size={14} /> Add a question
                  </button>
                )}
              </div>
            </section>

            <section className="card">
              <h2>Hiring rounds</h2>
              <p className="muted small">
                After résumé shortlisting, candidates move through these rounds in order, then to an offer. Add as many as your process needs.
              </p>
              <ol className="rounds">
                <li className="rounds__fixed">
                  <span className="rounds__num">✓</span> Résumé shortlisting
                </li>
                {form.rounds.map((r, i) => (
                  <li key={i}>
                    <span className="rounds__num">{i + 1}</span>
                    <Field label={`Round ${i + 1} name`} error={errors[`r-${i}`]}>
                      <input value={r} onChange={(e) => setRound(i, e.target.value)} placeholder="e.g. Technical interview" maxLength={60} />
                    </Field>
                    <div className="rounds__actions">
                      <button type="button" className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => moveRound(i, -1)}>
                        <ArrowUp size={16} />
                      </button>
                      <button type="button" className="icon-btn" aria-label="Move down" disabled={i === form.rounds.length - 1} onClick={() => moveRound(i, 1)}>
                        <ArrowDown size={16} />
                      </button>
                      <button type="button" className="icon-btn" aria-label={`Remove round ${i + 1}`} onClick={() => set({ rounds: form.rounds.filter((_, j) => j !== i) })}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
                <li className="rounds__fixed">
                  <span className="rounds__num">★</span> Offer
                </li>
              </ol>
              {form.rounds.length < MAX_ROUNDS && (
                <button type="button" className="btn btn--ghost btn--sm add-btn" onClick={() => set({ rounds: [...form.rounds, ''] })}>
                  <Plus size={14} /> Add a round
                </button>
              )}
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
        </ShowErrors.Provider>
      </div>
    </div>
  )
}
