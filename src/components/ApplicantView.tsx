import { Briefcase, HeartPulse, Link2, Lock, Mail, MapPin, Phone } from 'lucide-react'
import { JOURNEY_STAGES } from '../data/options'
import type { ApplicantSnapshot, Disclosed } from '../types'
import { Avatar } from './Brand'

/**
 * The candidate as an employer sees them. Used by employers on the Candidates page
 * and by seekers in "Preview what employers see", so the two can never drift apart.
 */
export default function ApplicantView({
  applicant: a,
  disclosed,
  coverNote,
}: {
  applicant: ApplicantSnapshot
  disclosed: Disclosed | null
  coverNote?: string
}) {
  const stage = disclosed && JOURNEY_STAGES.find((s) => s.value === disclosed.journeyStage)
  return (
    <div className="applicant">
      <div className="applicant__head">
        <Avatar name={a.name} size={56} />
        <div>
          <h3>{a.name}</h3>
          <p className="muted">{a.headline || a.currentRole || 'No headline yet'}</p>
        </div>
      </div>

      <ul className="applicant__contact">
        {a.location && (
          <li>
            <MapPin size={14} /> {a.location}
          </li>
        )}
        <li>
          <Mail size={14} /> <a href={`mailto:${a.email}`}>{a.email}</a>
        </li>
        {a.phone && (
          <li>
            <Phone size={14} /> {a.phone}
          </li>
        )}
        {a.linkedin && (
          <li>
            <Link2 size={14} />{' '}
            <a href={a.linkedin.startsWith('http') ? a.linkedin : `https://${a.linkedin}`} target="_blank" rel="noreferrer">
              {a.linkedin.replace(/^https?:\/\//, '')}
            </a>
          </li>
        )}
      </ul>

      {coverNote && (
        <section>
          <h4>Note from {a.name.split(' ')[0]}</h4>
          <p className="applicant__note">{coverNote}</p>
        </section>
      )}

      {a.bio && (
        <section>
          <h4>About</h4>
          <p>{a.bio}</p>
        </section>
      )}

      {(a.currentRole || a.yearsExperience) && (
        <section>
          <h4>Experience</h4>
          <p>
            <Briefcase size={14} className="inline-icon" /> {a.currentRole || 'Role not added'}
            {a.yearsExperience && <span className="muted"> · {a.yearsExperience}</span>}
          </p>
          {a.careerPauseNote && <p className="applicant__pause">{a.careerPauseNote}</p>}
        </section>
      )}

      {a.skills.length > 0 && (
        <section>
          <h4>Skills</h4>
          <div className="tags">
            {a.skills.map((s) => (
              <span key={s} className="tag">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {disclosed ? (
        <section className="applicant__disclosed">
          <h4>
            <HeartPulse size={14} /> Shared by the candidate
          </h4>
          {stage && <p>Journey: {stage.label}</p>}
          {disclosed.supportNeeds.length > 0 && (
            <>
              <p className="small muted">Support that helps them do their best work:</p>
              <div className="tags">
                {disclosed.supportNeeds.map((s) => (
                  <span key={s} className="tag tag--soft">
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
          <p className="small muted">Shared in confidence under the Cancer-Aware Pledge. Please keep it that way.</p>
        </section>
      ) : (
        <section className="applicant__private">
          <Lock size={14} />
          <p className="small">
            No health information is shared with this application. Under the Cancer-Aware Pledge, please don’t ask about
            medical history — focus on skills and fit.
          </p>
        </section>
      )}
    </div>
  )
}
