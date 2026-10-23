import { ArrowRight, BadgeCheck, CheckCircle2, ExternalLink } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppHeader from '../../components/AppHeader'
import { CompanyLogo } from '../../components/Brand'
import { ChipGroup, Field } from '../../components/Fields'
import { ShowErrors } from '../../components/showErrors'
import { Spinner } from '../../components/Status'
import { friendlyError, initials, useApp } from '../../context/store'
import { COMPANY_SIZES, INDUSTRIES, LOGO_COLORS, PLEDGE_COMMITMENTS, SUPPORTS } from '../../data/options'
import { saveCompany } from '../../lib/db'
import { useCompany } from '../../lib/hooks'
import { isUrl, MESSAGES, normalizeUrl } from '../../lib/validate'
import type { Company } from '../../types'

type Form = Omit<Company, 'id' | 'ownerUid' | 'createdAt'>

const blank: Form = {
  name: '',
  logo: { initials: '', color: LOGO_COLORS[0]! },
  website: '',
  industry: '',
  size: '',
  location: '',
  about: '',
  supports: [],
  pledge: false,
  pledgeSignedAt: null,
}

function toForm(c: Company): Form {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ownerUid, createdAt, ...rest } = c
  return { ...blank, ...rest }
}

function CompanyForm({ initial, editing }: { initial: Form; editing: boolean }) {
  const { user, finishOnboarding } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState<Form>(initial)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!user) return null
  const websiteError = form.website.trim() && !isUrl(form.website) ? MESSAGES.url : undefined
  const nameError = form.name.trim().length < 2 ? 'Please enter your company’s name.' : undefined

  const set = (patch: Partial<Form>) => {
    setSaved(false)
    setForm((f) => ({ ...f, ...patch }))
  }
  const logo = { initials: initials(form.name) || '··', color: form.logo.color }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setShowErrors(true)
    if (websiteError || nameError) return setError('Please fix the highlighted fields.')
    setBusy(true)
    setError(null)
    try {
      await saveCompany(
        user.id,
        { ...form, name: form.name.trim(), website: normalizeUrl(form.website), location: form.location.trim(), logo },
        !editing,
      )
      if (!editing) {
        await finishOnboarding()
        navigate('/employer?welcome=1')
      } else setSaved(true)
    } catch (err) {
      console.error(err)
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ShowErrors.Provider value={showErrors}>
      <form className="stack" onSubmit={submit}>
        <section className="card">
          <div className="card__head">
            <div>
              <h2>Company details</h2>
              <p className="muted small">This is what candidates see on your company page and job posts.</p>
            </div>
            <CompanyLogo {...logo} size={56} />
          </div>
          <div className="form-grid">
            <Field label="Company name" error={nameError}>
              <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Lumen Health" required maxLength={80} />
            </Field>
            <Field label="Website (optional)" error={websiteError}>
              <input
                type="url"
                inputMode="url"
                value={form.website}
                onChange={(e) => set({ website: e.target.value })}
                placeholder="yourcompany.com"
                maxLength={300}
              />
            </Field>
            <Field label="Industry">
              <select value={form.industry} onChange={(e) => set({ industry: e.target.value })} required>
                <option value="">Select</option>
                {INDUSTRIES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </Field>
            <Field label="Company size">
              <select value={form.size} onChange={(e) => set({ size: e.target.value })}>
                <option value="">Select</option>
                {COMPANY_SIZES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Headquarters">
              <input value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="City, Country" maxLength={100} />
            </Field>
            <Field label="Logo colour" hint="We create a simple logo from your initials.">
              <div className="swatches">
                {LOGO_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    className={`swatch ${form.logo.color === c ? 'swatch--on' : ''}`}
                    style={{ background: c }}
                    aria-label={`Colour ${c}`}
                    aria-pressed={form.logo.color === c}
                    onClick={() => set({ logo: { ...form.logo, color: c } })}
                  />
                ))}
              </div>
            </Field>
            <div className="form-grid__full">
              <Field label="About the company" hint="Your mission, your culture, and what working with you is like.">
                <textarea rows={5} value={form.about} onChange={(e) => set({ about: e.target.value })} maxLength={3000} />
              </Field>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Support you offer</h2>
          <p className="muted small">
            Candidates filter by these. Only choose what you genuinely offer — you can add more per job.
          </p>
          <ChipGroup options={SUPPORTS} value={form.supports} onChange={(v) => set({ supports: v })} />
        </section>

        <section className={`card pledge ${form.pledge ? 'pledge--on' : ''}`}>
          <div className="card__head">
            <div>
              <h2>
                <BadgeCheck size={20} /> The Cancer-Aware Pledge
              </h2>
              <p className="muted small">
                Pledged employers get a badge on every job and rank higher for candidates who ask for it.
              </p>
            </div>
          </div>
          <ul className="pledge-list pledge-list--checks">
            {PLEDGE_COMMITMENTS.map((c) => (
              <li key={c}>
                <CheckCircle2 size={16} /> {c}
              </li>
            ))}
          </ul>
          <label className="checkbox checkbox--strong">
            <input
              type="checkbox"
              checked={form.pledge}
              onChange={(e) => set({ pledge: e.target.checked, pledgeSignedAt: e.target.checked ? (form.pledgeSignedAt ?? Date.now()) : null })}
            />
            <span>On behalf of {form.name || 'our company'}, we sign the Cancer-Aware Pledge.</span>
          </label>
        </section>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="row row--end">
          {saved && (
            <span className="saved-flag">
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
          {editing && (
            <Link to={`/companies/${user.id}`} className="btn btn--ghost">
              View public page <ExternalLink size={14} />
            </Link>
          )}
          <button className="btn btn--primary" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create company'} {!editing && <ArrowRight size={16} />}
          </button>
        </div>
      </form>
    </ShowErrors.Provider>
  )
}

export default function CompanySetup({ editing = false }: { editing?: boolean }) {
  const { user } = useApp()
  const { data: company, loading } = useCompany(user?.id)
  const isEdit = editing || !!company

  return (
    <div className="app">
      <AppHeader />
      <div className="page page--narrow">
        <header className="page__head">
          <div>
            <span className="eyebrow">{isEdit ? 'Company profile' : 'Welcome to SecondHope'}</span>
            <h1>{isEdit ? 'Your company' : 'Set up your company'}</h1>
            {!isEdit && (
              <p className="muted">
                A few details and you’re ready to post. Thank you for opening your doors to people rebuilding after
                cancer.
              </p>
            )}
          </div>
        </header>
        {loading ? (
          <Spinner />
        ) : (
          <CompanyForm key={company?.id ?? 'new'} editing={isEdit} initial={company ? toForm(company) : blank} />
        )}
      </div>
    </div>
  )
}
