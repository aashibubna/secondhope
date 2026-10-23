import { SHORTLISTED } from '../data/options'
import type { Application, AppStatus } from '../types'

/**
 * A candidate moves through: Applied → Résumé review → each of the job's rounds → Offer → Hired.
 * Rounds live on the job, so every company can run as many as it needs.
 */
export interface Step {
  status: AppStatus
  round: number
}

/** Applications from before rounds existed had a single "Interview" stage. */
export const roundsOf = (app: Pick<Application, 'rounds'>) => (app.rounds?.length ? app.rounds : ['Interview'])

export function stageLabels(rounds: string[], employer = false) {
  return [employer ? 'New' : 'Applied', 'Résumé review', ...rounds, employer ? 'Offer sent' : 'Offer', employer ? 'Hired' : 'Accepted']
}

export function stageIndex(step: { status: AppStatus; round?: number }, rounds: string[]) {
  switch (step.status) {
    case 'applied':
      return 0
    case 'reviewing':
      return 1
    case 'interview':
      return 2 + Math.min(step.round ?? 0, Math.max(rounds.length - 1, 0))
    case 'offer':
      return 2 + rounds.length
    case 'hired':
      return 3 + rounds.length
    default:
      return -1
  }
}

/** How far an application got — for ended ones, the furthest stage it reached before stopping. */
export function reachedIndex(app: Application) {
  const rounds = roundsOf(app)
  const now = stageIndex(app, rounds)
  if (now >= 0) return now
  return Math.max(0, ...app.history.map((h) => stageIndex(h, rounds)))
}

export function currentLabel(app: Application, employer = false) {
  const i = stageIndex(app, roundsOf(app))
  return i >= 0 ? stageLabels(roundsOf(app), employer)[i]! : null
}

/** The one move that takes a candidate forward, given the job's current rounds. */
export function nextStep(app: Application, rounds: string[]): (Step & { label: string }) | null {
  if (app.status === 'applied' || app.status === 'reviewing')
    return rounds.length
      ? { status: 'interview', round: 0, label: `Shortlist for ${rounds[0]}` }
      : { status: 'offer', round: 0, label: 'Shortlist & send offer' }
  if (app.status === 'interview') {
    const r = app.round ?? 0
    return r + 1 < rounds.length
      ? { status: 'interview', round: r + 1, label: `Move to ${rounds[r + 1]}` }
      : { status: 'offer', round: r, label: 'Send offer' }
  }
  return null
}

/** Messaging opens once the candidate is past résumé shortlisting. */
export const canMessage = (status: AppStatus) => (SHORTLISTED as readonly AppStatus[]).includes(status)
