import { sendEmailVerification, updateProfile as updateAuthProfile } from 'firebase/auth'
import { CheckCircle2, Eye, KeyRound, Lock, MailWarning, Trash2, Type, Waves } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { Field, Toggle } from '../components/Fields'
import { Modal } from '../components/Status'
import { friendlyError, useApp } from '../context/store'
import { loadComfort, saveComfort, type Comfort } from '../lib/comfort'
import { updateUser } from '../lib/db'

export default function Settings() {
  const { user, authUser, resetPassword, deleteAccount } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [comfort, setComfort] = useState<Comfort>(loadComfort)
  const [flash, setFlash] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!user || !authUser) return null

  const usesPassword = authUser.providerData.some((p) => p.providerId === 'password')
  const notify = (msg: string) => {
    setFlash(msg)
    setTimeout(() => setFlash(null), 3500)
  }
  const setC = (patch: Partial<Comfort>) => {
    const next = { ...comfort, ...patch }
    setComfort(next)
    saveComfort(next)
  }

  const saveName = (e: FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    updateUser(user.id, { name: n }).catch(console.error)
    updateAuthProfile(authUser, { displayName: n }).catch(console.error)
    notify('Your name has been updated.')
  }

  const remove = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = await deleteAccount(usesPassword ? password : null)
    setBusy(false)
    if (err) return setError(err)
    navigate('/')
  }

  return (
    <div className="app">
      <AppHeader />
      <div className="page page--narrow">
        <header className="page__head">
          <div>
            <span className="eyebrow">Settings</span>
            <h1>Make SecondHope work for you</h1>
          </div>
        </header>

        {flash && (
          <p className="toast" role="status">
            <CheckCircle2 size={16} /> {flash}
          </p>
        )}

        <section className="card">
          <div className="card__head">
            <div>
              <h2>Comfort</h2>
              <p className="muted small">
                For tired eyes, foggy days or shaky hands. These settings apply on this device.
              </p>
            </div>
          </div>
          <div className="settings-list">
            <div className="settings-row">
              <Type size={18} />
              <div>
                <strong>Larger text</strong>
                <p className="muted small">Makes text and buttons bigger and easier to tap.</p>
              </div>
              <Toggle checked={comfort.largeText} onChange={(v) => setC({ largeText: v })} label="Larger text" hideLabel />
            </div>
            <div className="settings-row">
              <Waves size={18} />
              <div>
                <strong>Calm motion</strong>
                <p className="muted small">Turns off animations and moving elements.</p>
              </div>
              <Toggle checked={comfort.calmMotion} onChange={(v) => setC({ calmMotion: v })} label="Calm motion" hideLabel />
            </div>
            <div className="settings-row">
              <Eye size={18} />
              <div>
                <strong>Higher contrast</strong>
                <p className="muted small">Darker text and stronger outlines.</p>
              </div>
              <Toggle checked={comfort.highContrast} onChange={(v) => setC({ highContrast: v })} label="Higher contrast" hideLabel />
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Account</h2>
          <form className="form-grid" onSubmit={saveName}>
            <Field label="Name">
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Email">
              <input value={user.email} disabled />
            </Field>
            <div className="form-grid__full row row--end">
              <button className="btn btn--primary btn--sm" disabled={name.trim() === user.name || !name.trim()}>
                Save name
              </button>
            </div>
          </form>
          {!authUser.emailVerified && usesPassword && (
            <div className="hint-box row">
              <MailWarning size={16} />
              <span>Your email isn’t verified yet. It’s optional, but it helps you recover your account.</span>
              <button
                className="link-btn"
                onClick={() =>
                  sendEmailVerification(authUser)
                    .then(() => notify('Verification email sent. Check your inbox.'))
                    .catch((e) => notify(friendlyError(e)))
                }
              >
                Send link
              </button>
            </div>
          )}
          {usesPassword && (
            <div className="settings-row">
              <KeyRound size={18} />
              <div>
                <strong>Password</strong>
                <p className="muted small">We’ll email you a secure link to choose a new one.</p>
              </div>
              <button
                className="btn btn--ghost btn--sm"
                onClick={async () => {
                  const err = await resetPassword(user.email)
                  notify(err ?? `Reset link sent to ${user.email}.`)
                }}
              >
                Send reset link
              </button>
            </div>
          )}
        </section>

        {user.role === 'seeker' && (
          <section className="card">
            <div className="settings-row">
              <Lock size={18} />
              <div>
                <strong>Privacy</strong>
                <p className="muted small">Choose whether and when employers see anything about your health journey.</p>
              </div>
              <Link to="/profile?tab=journey" className="btn btn--ghost btn--sm">
                Manage
              </Link>
            </div>
          </section>
        )}

        <section className="card card--danger">
          <div className="settings-row">
            <Trash2 size={18} />
            <div>
              <strong>Delete account</strong>
              <p className="muted small">
                {user.role === 'seeker'
                  ? 'Permanently removes your profile, saved jobs and applications.'
                  : 'Permanently removes your company and all its job posts.'}
              </p>
            </div>
            <button className="btn btn--danger btn--sm" onClick={() => setDeleting(true)}>
              Delete
            </button>
          </div>
        </section>
      </div>

      {deleting && (
        <Modal title="Delete your account?" onClose={() => setDeleting(false)}>
          <form className="stack" onSubmit={remove}>
            <p>
              This permanently deletes your account and everything in it. It can’t be undone. If you just need a
              break, you can simply log out — everything will be here when you come back.
            </p>
            {usesPassword && (
              <Field label="Confirm your password">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              </Field>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="row row--end">
              <button type="button" className="btn btn--ghost" onClick={() => setDeleting(false)}>
                Keep my account
              </button>
              <button type="submit" className="btn btn--danger" disabled={busy}>
                {busy ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
