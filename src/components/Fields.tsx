import { Check, Plus, X } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import { ShowErrors } from './showErrors'

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  /** Shown once the person has left the field (or tried to submit). */
  error?: string
  children: ReactNode
}) {
  const [touched, setTouched] = useState(false)
  const showAll = useContext(ShowErrors)
  const shown = error && (touched || showAll) ? error : null
  return (
    <label className={`field ${shown ? 'field--invalid' : ''}`} onBlur={() => setTouched(true)}>
      <span className="field__label">{label}</span>
      {children}
      {shown ? (
        <span className="field__error" role="alert">
          {shown}
        </span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </label>
  )
}

export function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <div className="chips">
      {options.map((opt) => {
        const on = value.includes(opt)
        return (
          <button
            type="button"
            key={opt}
            className={`chip ${on ? 'chip--on' : ''}`}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== opt) : [...value, opt])}
          >
            {on && <Check size={14} />}
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export function ChoiceCards<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: readonly { value: T; label: string; hint?: string }[]
  value: string
  onChange: (v: T) => void
  columns?: number
}) {
  return (
    <div className="choice-cards" style={{ ['--cols' as string]: columns }}>
      {options.map((opt) => {
        const on = value === opt.value
        return (
          <button
            type="button"
            key={opt.value}
            className={`choice ${on ? 'choice--on' : ''}`}
            aria-pressed={on}
            onClick={() => onChange(opt.value)}
          >
            <span className="choice__radio">{on && <Check size={12} strokeWidth={3} />}</span>
            <span>
              <span className="choice__label">{opt.label}</span>
              {opt.hint && <span className="choice__hint">{opt.hint}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function TagInput({
  value,
  onChange,
  suggestions,
  placeholder,
}: {
  value: string[]
  onChange: (next: string[]) => void
  suggestions: string[]
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')
  const add = (tag: string) => {
    const t = tag.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setDraft('')
  }
  return (
    <div className="tag-input">
      <div className="tag-input__box">
        {value.map((t) => (
          <span className="tag" key={t}>
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((v) => v !== t))}>
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          placeholder={value.length ? '' : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add(draft)
            } else if (e.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1))
            }
          }}
        />
      </div>
      <div className="tag-input__suggest">
        {suggestions
          .filter((s) => !value.includes(s))
          .slice(0, 8)
          .map((s) => (
            <button type="button" key={s} onClick={() => add(s)}>
              <Plus size={12} /> {s}
            </button>
          ))}
      </div>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hideLabel = false,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hideLabel?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`toggle ${checked ? 'toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__track">
        <span className="toggle__thumb" />
      </span>
      {hideLabel ? <span className="sr-only">{label}</span> : label}
    </button>
  )
}
