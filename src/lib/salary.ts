import type { Pay, SalaryPeriod, SalaryUnit } from '../types'

const PERIOD_TEXT: Record<SalaryPeriod, string> = { year: '/ year', month: '/ month', hour: '/ hr' }

const amount = (n: number, unit: SalaryUnit) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}${unit}`

/** e.g. { min: 6, max: 9, unit: 'L', period: 'year' } → "₹6L – ₹9L / year" */
export function formatPay(p: Pay) {
  const range = p.max != null && p.max !== p.min ? `${amount(p.min, p.unit)} – ${amount(p.max, p.unit)}` : amount(p.min, p.unit)
  return `${range} ${PERIOD_TEXT[p.period]}`
}

/** Keeps only digits and a single decimal point, so the salary boxes never hold words. */
export function digitsOnly(s: string) {
  const clean = s.replace(/[^\d.]/g, '')
  const dot = clean.indexOf('.')
  return dot === -1 ? clean : clean.slice(0, dot + 1) + clean.slice(dot + 1).replace(/\./g, '')
}

const unitOf = (u: string | undefined): SalaryUnit => {
  const t = u?.toLowerCase()
  if (!t) return ''
  if (t === 'k' || t === 'thousand') return 'K'
  if (t.startsWith('l')) return 'L'
  return 'Cr'
}

/** Best-effort read of a free-text salary from older posts, e.g. "₹4.5L – ₹6L" or "₹1,500 / hr". */
export function parsePay(s: string): Pay | null {
  const found = [...s.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|lakhs?|lacs?|l|crores?|cr)?\b/gi)]
  if (!found.length || found.length > 2) return null
  const nums = found.map((m) => Number(m[1]!.replace(/,/g, '')))
  if (nums.some((n) => !Number.isFinite(n) || n <= 0)) return null
  const units = found.map((m) => unitOf(m[2]))
  const unit = units[units.length - 1]!
  if (units.some((u) => u && u !== unit)) return null
  const period: SalaryPeriod = /\b(hr|hour)/i.test(s) ? 'hour' : /\bmonth|\bmo\b|\bpm\b/i.test(s) ? 'month' : 'year'
  return { min: nums[0]!, max: nums[1] ?? null, unit, period }
}
