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
