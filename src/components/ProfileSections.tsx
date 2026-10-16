import { Lock } from 'lucide-react'
import {
  DISCLOSURE_OPTIONS,
  FUNCTIONS,
  HOURS,
  JOB_TYPES,
  JOURNEY_STAGES,
  SKILL_SUGGESTIONS,
  SUPPORTS,
  WORK_MODES,
} from '../data/options'
import type { Disclosure, JourneyStage, Profile } from '../types'
import { ChipGroup, ChoiceCards, Field, TagInput, Toggle } from './Fields'

export interface SectionProps {
  profile: Profile
  set: (patch: Partial<Profile>) => void
}

export function AboutSection({ profile, set }: SectionProps) {
  return (
    <div className="form-grid">
      <Field label="Headline" hint="A short line about you, e.g. “Designer returning after a career pause”">
        <input
          value={profile.headline}
          onChange={(e) => set({ headline: e.target.value })}
          placeholder="What do you do, or want to do?"
        />
      </Field>
      <Field label="Location">
        <input
          value={profile.location}
          onChange={(e) => set({ location: e.target.value })}
          placeholder="City, Country"
        />
      </Field>
      <Field label="Phone (optional)">
        <input value={profile.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+91" />
      </Field>
      <Field label="LinkedIn or portfolio (optional)">
        <input
          value={profile.linkedin}
          onChange={(e) => set({ linkedin: e.target.value })}
          placeholder="https://"
        />
      </Field>
      <div className="form-grid__full">
        <Field label="About you" hint="Your strengths, what energises you, what you are looking for next.">
          <textarea
            rows={4}
            value={profile.bio}
            onChange={(e) => set({ bio: e.target.value })}
            placeholder="I’m a people-first marketer who…"
          />
        </Field>
      </div>
    </div>
  )
}

export function JourneySection({ profile, set }: SectionProps) {
  return (
    <div className="stack">
      <div className="privacy-note">
        <Lock size={16} />
        <p>
          Everything here is optional and <strong>private by default</strong>. We only use it to surface
          roles that fit your life right now.
        </p>
      </div>
      <div>
        <h4 className="sub-label">Where are you in your journey?</h4>
        <ChoiceCards<JourneyStage>
          options={JOURNEY_STAGES}
          value={profile.journeyStage}
          onChange={(v) => set({ journeyStage: v })}
        />
      </div>
      <div>
        <h4 className="sub-label">Who can see this?</h4>
        <ChoiceCards<Disclosure>
          options={DISCLOSURE_OPTIONS}
          value={profile.disclosure}
          onChange={(v) => set({ disclosure: v })}
          columns={1}
        />
      </div>
    </div>
  )
}

export function PreferencesSection({ profile, set }: SectionProps) {
  return (
    <div className="stack">
      <div>
        <h4 className="sub-label">Where would you like to work?</h4>
        <ChipGroup options={WORK_MODES} value={profile.workModes} onChange={(v) => set({ workModes: v })} />
      </div>
      <div>
        <h4 className="sub-label">How much time feels right?</h4>
        <ChoiceCards options={HOURS} value={profile.hours} onChange={(v) => set({ hours: v })} columns={4} />
      </div>
      <div>
        <h4 className="sub-label">Job type</h4>
        <ChipGroup options={JOB_TYPES} value={profile.jobTypes} onChange={(v) => set({ jobTypes: v })} />
      </div>
      <div>
        <h4 className="sub-label">Areas you are interested in</h4>
        <ChipGroup options={FUNCTIONS} value={profile.functions} onChange={(v) => set({ functions: v })} />
      </div>
    </div>
  )
}

export function SupportSection({ profile, set }: SectionProps) {
  return (
    <div className="stack">
      <div>
        <h4 className="sub-label">What support would help you thrive?</h4>
        <p className="muted small">We will prioritise employers who already offer these.</p>
        <ChipGroup options={SUPPORTS} value={profile.supportNeeds} onChange={(v) => set({ supportNeeds: v })} />
      </div>
      <Field
        label="Anything else? (optional, private)"
        hint="e.g. “I have treatment every other Tuesday morning” — used only for matching."
      >
        <textarea
          rows={3}
          value={profile.accommodationNotes}
          onChange={(e) => set({ accommodationNotes: e.target.value })}
          placeholder="Share only what you’re comfortable with"
        />
      </Field>
    </div>
  )
}

export function ExperienceSection({ profile, set }: SectionProps) {
  return (
    <div className="stack">
      <div className="form-grid">
        <Field label="Most recent role">
          <input
            value={profile.currentRole}
            onChange={(e) => set({ currentRole: e.target.value })}
            placeholder="e.g. Senior Accountant at ABC Ltd"
          />
        </Field>
        <Field label="Years of experience">
          <select value={profile.yearsExperience} onChange={(e) => set({ yearsExperience: e.target.value })}>
            <option value="">Select</option>
            <option>Less than 1 year</option>
            <option>1–3 years</option>
            <option>3–5 years</option>
            <option>5–10 years</option>
            <option>10+ years</option>
          </select>
        </Field>
      </div>
      <div>
        <h4 className="sub-label">Skills</h4>
        <TagInput
          value={profile.skills}
          onChange={(v) => set({ skills: v })}
          suggestions={SKILL_SUGGESTIONS}
          placeholder="Type a skill and press Enter"
        />
      </div>
      <div className="career-pause">
        <Toggle
          checked={profile.careerPause}
          onChange={(v) => set({ careerPause: v })}
          label="I have a career pause on my résumé"
        />
        {profile.careerPause && (
          <Field
            label="How would you like it described?"
            hint="Employers see this exact wording — no medical details unless you add them."
          >
            <input
              value={profile.careerPauseNote}
              onChange={(e) => set({ careerPauseNote: e.target.value })}
              placeholder="e.g. “2023–2024: Career pause for health and family”"
            />
          </Field>
        )}
      </div>
    </div>
  )
}
