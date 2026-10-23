import { Lock, MessagesSquare, Send } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { friendlyError, timeAgo, useApp } from '../context/store'
import { sendMessage } from '../lib/db'
import { useMessages } from '../lib/hooks'
import { canMessage } from '../lib/pipeline'
import type { Application } from '../types'

/**
 * The conversation between an employer and one candidate. It opens once the candidate is past
 * résumé shortlisting and becomes read-only when the application ends.
 */
export default function Thread({ app, as }: { app: Application; as: 'seeker' | 'employer' }) {
  const { user } = useApp()
  const { data: messages, loading } = useMessages(app.id)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const open = canMessage(app.status)
  const other = as === 'employer' ? app.applicant.name.split(' ')[0] : app.companyName

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  if (!user) return null
  if (!open && !messages.length && !loading) {
    return as === 'employer' ? (
      <div className="thread thread--locked">
        <Lock size={14} />
        <p className="small muted">Messaging opens once you shortlist {other} past résumé review.</p>
      </div>
    ) : null
  }

  const send = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      await sendMessage(app, as, user.id, text)
      setText('')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="thread" aria-label={`Messages with ${other}`}>
      <h4>
        <MessagesSquare size={16} /> Messages with {other}
      </h4>
      {messages.length === 0 ? (
        <p className="small muted thread__empty">
          {as === 'employer' ? `Say hello — ${other} will see it in their application tracker.` : `No messages yet. ${other} can reach you here.`}
        </p>
      ) : (
        <ol className="thread__list" ref={listRef}>
          {messages.map((m) => (
            <li key={m.id} className={m.from === as ? 'is-mine' : ''}>
              <p>{m.text}</p>
              <small>
                {m.from === as ? 'You' : other} · {timeAgo(m.at)}
              </small>
            </li>
          ))}
        </ol>
      )}
      {open ? (
        <form className="thread__compose" onSubmit={send}>
          <textarea
            rows={2}
            value={text}
            maxLength={2000}
            placeholder={`Write to ${other}…`}
            aria-label={`Message ${other}`}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send()
            }}
          />
          <button className="btn btn--primary btn--sm" disabled={busy || !text.trim()}>
            <Send size={14} /> {busy ? 'Sending…' : 'Send'}
          </button>
        </form>
      ) : (
        <p className="small muted">This conversation is closed.</p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
