export const JOURNEY_STAGES = [
  { value: 'in-treatment', label: 'In treatment', hint: 'Working around appointments and energy levels' },
  { value: 'remission', label: 'In remission', hint: 'Easing back in, at my own pace' },
  { value: 'survivor', label: 'Survivor', hint: 'Ready for my next chapter' },
  { value: 'caregiver', label: 'Caregiver', hint: 'Supporting someone I love' },
  { value: 'prefer-not', label: 'Prefer not to say', hint: 'That is completely okay' },
] as const

export const DISCLOSURE_OPTIONS = [
  {
    value: 'private',
    label: 'Keep it private',
    hint: 'Only used to match you with jobs. Employers never see it.',
  },
  {
    value: 'after-offer',
    label: 'Share after an offer',
    hint: 'We reveal it to an employer only once you accept an offer.',
  },
  {
    value: 'open',
    label: 'Share with Cancer-Aware employers',
    hint: 'Visible to pledged employers when you apply.',
  },
] as const

export const WORK_MODES = ['Remote', 'Hybrid', 'On-site']

export const HOURS = [
  { value: 'full', label: 'Full-time' },
  { value: 'part', label: 'Part-time' },
  { value: 'flexible', label: 'Flexible schedule' },
  { value: 'project', label: 'Project based' },
]

export const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance']

export const FUNCTIONS = [
  'Design',
  'Engineering',
  'Customer Support',
  'Marketing',
  'Writing & Content',
  'Operations',
  'Finance',
  'Healthcare',
  'Education',
  'Sales',
]

export const SUPPORTS = [
  'Flexible hours',
  'Treatment leave',
  'Remote-first',
  'Reduced hours',
  'Return-to-work program',
  'Wellness support',
  'Accessible office',
  'Low physical demand',
]

export const SKILL_SUGGESTIONS = [
  'Communication',
  'Figma',
  'Project management',
  'Customer service',
  'Excel',
  'Writing',
  'Python',
  'Data analysis',
  'Teaching',
  'Bookkeeping',
  'Social media',
  'React',
]

export const JOB_HOURS = ['Flexible', 'Reduced', 'Standard'] as const

export const YEARS_EXPERIENCE = ['Less than 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years']

export const APP_STATUS = {
  applied: { label: 'Applied', employerLabel: 'New', tone: 'neutral', hint: 'Your application has been sent.' },
  reviewing: { label: 'In review', employerLabel: 'Reviewing', tone: 'info', hint: 'The team is reading your application.' },
  interview: { label: 'Interview', employerLabel: 'Interview', tone: 'accent', hint: 'They would like to talk with you.' },
  offer: { label: 'Offer', employerLabel: 'Offer sent', tone: 'good', hint: 'You have an offer! Take your time to decide.' },
  hired: { label: 'Accepted', employerLabel: 'Hired', tone: 'good', hint: 'Congratulations on your new role.' },
  'not-selected': {
    label: 'Not this time',
    employerLabel: 'Not selected',
    tone: 'muted',
    hint: 'This one didn’t work out — it says nothing about your worth.',
  },
  withdrawn: { label: 'Withdrawn', employerLabel: 'Withdrawn', tone: 'muted', hint: 'You withdrew this application.' },
} as const

/** The stages a candidate moves through, in order. */
export const PIPELINE = ['applied', 'reviewing', 'interview', 'offer', 'hired'] as const

/** Statuses an employer can set. */
export const EMPLOYER_STATUSES = ['applied', 'reviewing', 'interview', 'offer', 'not-selected'] as const

export const INDUSTRIES = [
  'Healthcare',
  'Technology',
  'Education',
  'Finance',
  'Retail & E-commerce',
  'Media & Content',
  'Manufacturing',
  'Non-profit',
  'Professional services',
  'Other',
]

export const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–1,000', '1,000+']

export const LOGO_COLORS = ['#6c47ff', '#ff7a59', '#1fb58f', '#e94f8a', '#2a6df4', '#f5a524', '#0f9d9a', '#c2410c', '#111827']

export const PLEDGE_COMMITMENTS = [
  'We never ask candidates about their medical history or treatment during hiring.',
  'We treat career pauses as normal and do not penalise résumé gaps.',
  'Every job post lists the support we genuinely offer — nothing we can’t honour.',
  'We provide reasonable accommodations, including time off for appointments.',
  'Any health information a candidate chooses to share stays confidential.',
]
