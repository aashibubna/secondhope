// Comfort settings are a per-device preference (people often use a different
// device on low-energy days), so they live in localStorage, not Firestore.
export interface Comfort {
  largeText: boolean
  calmMotion: boolean
  highContrast: boolean
}

const KEY = 'secondhope.comfort'
const DEFAULT: Comfort = { largeText: false, calmMotion: false, highContrast: false }

export function loadComfort(): Comfort {
  try {
    return { ...DEFAULT, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Comfort>) }
  } catch {
    return DEFAULT
  }
}

export function applyComfort(c: Comfort) {
  const root = document.documentElement
  root.toggleAttribute('data-large-text', c.largeText)
  root.toggleAttribute('data-calm', c.calmMotion)
  root.toggleAttribute('data-contrast', c.highContrast)
}

export function saveComfort(c: Comfort) {
  applyComfort(c)
  try {
    localStorage.setItem(KEY, JSON.stringify(c))
  } catch {
    /* storage unavailable — the setting still applies for this visit */
  }
}
