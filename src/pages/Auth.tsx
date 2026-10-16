import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Logo, Ribbon } from '../components/Brand'
import { Field } from '../components/Fields'
import { useApp } from '../context/store'

function AuthLayout({ children }: { children: ReactNode }) {
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
      </aside>
    </div>
  )
}

function PasswordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div className="input-icon">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="At least 8 characters"
        required
        minLength={8}
      />
      <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

export function SignUp() {
  const { signUp } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!agree) return setError('Please accept the terms to continue.')
    const err = signUp(name, email, password)
    if (err) return setError(err)
    navigate('/onboarding')
  }

  return (
    <AuthLayout>
      <h1 className="auth__title">Create your account</h1>
      <p className="muted">Free forever for job seekers. It takes less than a minute.</p>
      <form className="stack" onSubmit={submit}>
        <Field label="Full name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={setPassword} />
        </Field>
        <label className="checkbox">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
          </span>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn--primary btn--block" type="submit">
          Create account <ArrowRight size={16} />
        </button>
      </form>
      <p className="auth__switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  )
}

export function Login() {
  const { logIn } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err = logIn(email, password)
    if (err) return setError(err)
    const next = (location.state as { next?: string } | null)?.next
    navigate(next ?? '/jobs')
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
            required
          />
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={setPassword} />
        </Field>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn--primary btn--block" type="submit">
          Log in <ArrowRight size={16} />
        </button>
      </form>
      <p className="auth__switch">
        New to SecondHope? <Link to="/signup">Create an account</Link>
      </p>
    </AuthLayout>
  )
}
