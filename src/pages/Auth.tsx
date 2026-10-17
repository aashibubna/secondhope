import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, HeartHandshake, Lock, MailCheck, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Logo, Ribbon } from '../components/Brand'
import { Field } from '../components/Fields'
import { useApp } from '../context/store'
import type { Role } from '../types'

function AuthLayout({ children, employer = false }: { children: ReactNode; employer?: boolean }) {
  return (
    <div className="auth">
      <div className="auth__form">
        <Logo />
        <div className="auth__body">{children}</div>
        <p className="auth__foot">
          <Lock size={12} /> Your information is encrypted and never sold.
        </p>
      </div>
      <aside className="auth__art">
        <div className="auth__art-ribbon">
          <Ribbon size={140} color="rgba(255,255,255,.95)" />
        </div>
        {employer ? (
          <>
            <blockquote>
              “We joined the Cancer-Aware Pledge and hired three incredible people in a quarter.”
              <cite>— Ananya Rao, Head of People · Lumen Health</cite>
            </blockquote>
            <ul className="auth__perks">
              <li>
                <ShieldCheck size={16} /> Reach resilient, experienced talent
              </li>
              <li>
                <ShieldCheck size={16} /> Post jobs free and manage applicants in one place
              </li>
              <li>
                <ShieldCheck size={16} /> Show candidates the support you offer
              </li>
            </ul>
          </>
        ) : (
          <>
            <blockquote>
              “Cancer changed a lot of things. It didn’t change what I’m capable of.”
              <cite>— Joel D’Souza, Data Analyst · Survivor</cite>
            </blockquote>
            <ul className="auth__perks">
              <li>
                <ShieldCheck size={16} /> Health details are private by default
              </li>
              <li>
                <ShieldCheck size={16} /> Only Cancer-Aware pledged employers
              </li>
              <li>
                <ShieldCheck size={16} /> Profile setup is optional — do it anytime
              </li>
            </ul>
          </>
        )}
      </aside>
    </div>
  )
}

function PasswordInput({
  value,
  onChange,
  autoComplete,
}: {
  value: string
  onChange: (v: string) => void
  autoComplete: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="input-icon">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="At least 8 characters"
        autoComplete={autoComplete}
        required
        minLength={8}
      />
      <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

function GoogleButton({ onError }: { onError: (e: string) => void }) {
  const { googleSignIn } = useApp()
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      className="btn btn--ghost btn--block google-btn"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        const err = await googleSignIn()
        setBusy(false)
        if (err) onError(err)
      }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      Continue with Google
    </button>
  )
}

function RolePicker({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  const roles = [
    { value: 'seeker' as const, icon: HeartHandshake, label: 'I’m looking for work', hint: 'Patients, survivors & caregivers' },
    { value: 'employer' as const, icon: Building2, label: 'I’m hiring', hint: 'Employers & recruiters' },
  ]
  return (
    <div className="role-picker" role="radiogroup" aria-label="Account type">
      {roles.map(({ value: v, icon: Icon, label, hint }) => (
        <button
          type="button"
          key={v}
          role="radio"
          aria-checked={value === v}
          className={`role-option ${value === v ? 'role-option--on' : ''}`}
          onClick={() => onChange(v)}
        >
          <Icon size={20} />
          <span>
            <strong>{label}</strong>
            <small>{hint}</small>
          </span>
        </button>
      ))}
    </div>
  )
}

export function SignUp() {
  const { signUp } = useApp()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const role: Role = params.get('role') === 'employer' ? 'employer' : 'seeker'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!agree) return setError('Please accept the terms to continue.')
    setBusy(true)
    setError(null)
    const err = await signUp(name, email, password, role)
    setBusy(false)
    if (err) return setError(err)
    navigate(role === 'employer' ? '/employer/setup' : '/onboarding')
  }

  return (
    <AuthLayout employer={role === 'employer'}>
      <h1 className="auth__title">Create your account</h1>
      <p className="muted">
        {role === 'employer'
          ? 'Free to post jobs. Set up your company in a few minutes.'
          : 'Free forever for job seekers. It takes less than a minute.'}
      </p>
      <RolePicker value={role} onChange={(r) => setParams(r === 'employer' ? { role: r } : {}, { replace: true })} />
      <form className="stack" onSubmit={submit}>
        <Field label={role === 'employer' ? 'Your full name' : 'Full name'}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" required />
        </Field>
        <Field label={role === 'employer' ? 'Work email' : 'Email'}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={role === 'employer' ? 'you@company.com' : 'you@example.com'}
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
        </Field>
        <label className="checkbox">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
          </span>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
          {busy ? 'Creating your account…' : 'Create account'} <ArrowRight size={16} />
        </button>
      </form>
      <div className="divider">
        <span>or</span>
      </div>
      <GoogleButton onError={setError} />
      <p className="auth__switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  )
}

export function Login() {
  const { logIn } = useApp()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = await logIn(email, password)
    setBusy(false)
    // On success, GuestOnly redirects to the right home (or `state.next`).
    if (err) setError(err)
  }

  return (
    <AuthLayout>
      <h1 className="auth__title">Welcome back</h1>
      <p className="muted">Good to see you again. Let’s pick up where you left off.</p>
      <form className="stack" onSubmit={submit}>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
        </Field>
        <Link to="/forgot-password" state={location.state} className="auth__forgot">
          Forgot your password?
        </Link>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'} <ArrowRight size={16} />
        </button>
      </form>
      <div className="divider">
        <span>or</span>
      </div>
      <GoogleButton onError={setError} />
      <p className="auth__switch">
        New to SecondHope? <Link to="/signup">Create an account</Link>
      </p>
    </AuthLayout>
  )
}

export function ForgotPassword() {
  const { resetPassword } = useApp()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const err = await resetPassword(email)
    setBusy(false)
    // Don't reveal whether an account exists for this email.
    if (err && !err.includes('couldn’t find')) return setError(err)
    setSent(true)
  }

  return (
    <AuthLayout>
      {sent ? (
        <div className="stack">
          <span className="auth__icon">
            <MailCheck size={22} />
          </span>
          <h1 className="auth__title">Check your inbox</h1>
          <p className="muted">
            If an account exists for <strong>{email}</strong>, you’ll get a link to set a new password. It can take a
            couple of minutes — and do peek in your spam folder.
          </p>
          <Link to="/login" className="btn btn--primary btn--block">
            Back to log in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="auth__title">Reset your password</h1>
          <p className="muted">It happens to everyone. Enter your email and we’ll send you a reset link.</p>
          <form className="stack" onSubmit={submit}>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </Field>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'} <ArrowRight size={16} />
            </button>
          </form>
          <p className="auth__switch">
            <Link to="/login">
              <ArrowLeft size={14} /> Back to log in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}

/** Shown once after Google sign-in, before a users/{uid} document exists. */
export function ChooseRole() {
  const { chooseRole, authUser, logOut } = useApp()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('seeker')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <AuthLayout employer={role === 'employer'}>
      <h1 className="auth__title">
        Welcome{authUser?.displayName ? `, ${authUser.displayName.split(' ')[0]}` : ''}
      </h1>
      <p className="muted">One quick question so we can set things up for you.</p>
      <RolePicker value={role} onChange={setRole} />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="btn btn--primary btn--block"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          const err = await chooseRole(role)
          setBusy(false)
          if (err) return setError(err)
          navigate(role === 'employer' ? '/employer/setup' : '/onboarding')
        }}
      >
        Continue <ArrowRight size={16} />
      </button>
      <p className="auth__switch">
        Not you?{' '}
        <button className="link-btn" onClick={() => logOut()}>
          Use a different account
        </button>
      </p>
    </AuthLayout>
  )
}
