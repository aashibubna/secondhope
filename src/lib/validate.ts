import { OTHER } from '../data/options'
import type { Profile } from '../types'

export type Errors<K extends string = string> = Partial<Record<K, string>>

export const hasErrors = (e: Errors) => Object.keys(e).length > 0

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i

export const isEmail = (s: string) => EMAIL.test(s.trim())

/** 10-digit local number (optionally with a leading 0), or 8–15 digits with a +country code. */
export function isPhone(s: string) {
  const t = s.trim()
  if (!/^\+?[\d\s\-().]+$/.test(t)) return false
  const digits = t.replace(/\D/g, '')
  if (t.startsWith('+')) return digits.length >= 8 && digits.length <= 15
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('0'))
}

/** Adds https:// when someone types a bare domain like "linkedin.com/in/me". */
export function normalizeUrl(s: string) {
  const t = s.trim()
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

export function isUrl(s: string) {
  const t = s.trim()
  if (!t || /\s/.test(t)) return false
  try {
    const u = new URL(normalizeUrl(t))
    return (u.protocol === 'http:' || u.protocol === 'https:') && /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(u.hostname)
  } catch {
    return false
  }
}

export function isName(s: string) {
  const t = s.trim()
  return t.length >= 2 && t.length <= 80 && /\p{L}/u.test(t)
}

export const MESSAGES = {
  email: 'Please enter a valid email, like name@example.com.',
  phone: 'Enter a 10-digit mobile number, or include the country code (e.g. +44 20 7946 0958).',
  url: 'Please enter a valid link, like linkedin.com/in/yourname.',
  name: 'Please enter your name (at least 2 letters).',
}

/** Problems in what a seeker typed. Every profile field is optional, so only filled-in values are checked. */
export function profileErrors(p: Profile): Errors<keyof Profile> {
  const e: Errors<keyof Profile> = {}
  if (p.phone.trim() && !isPhone(p.phone)) e.phone = MESSAGES.phone
  if (p.linkedin.trim() && !isUrl(p.linkedin)) e.linkedin = MESSAGES.url
  if (p.functions.includes(OTHER) && !p.functionsOther.trim()) e.functionsOther = 'Tell us which area, or unselect “Other”.'
  return e
}

/** Tidies a profile before it is saved. */
export function cleanProfile(p: Profile): Profile {
  return {
    ...p,
    phone: p.phone.trim(),
    linkedin: normalizeUrl(p.linkedin),
    functionsOther: p.functions.includes(OTHER) ? p.functionsOther.trim() : '',
  }
}
