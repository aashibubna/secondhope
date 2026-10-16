import { Link } from 'react-router-dom'
import { initials } from '../context/store'

/** Lavender awareness ribbon — the colour for all cancers. */
export function Ribbon({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M16 3c-3.6 0-6 2.7-6 6 0 3 1.8 5.8 3.6 8.6L7 27.4l3.6 1.6 5.4-8 5.4 8 3.6-1.6-6.6-9.8C20.2 14.8 22 12 22 9c0-3.3-2.4-6-6-6Zm0 4c1.3 0 2 .9 2 2 0 1.5-.9 3.3-2 5.1-1.1-1.8-2-3.6-2-5.1 0-1.1.7-2 2-2Z"
        fill={color}
      />
    </svg>
  )
}

export function Logo({ dark = false, to = '/' }: { dark?: boolean; to?: string }) {
  return (
    <Link to={to} className={`logo ${dark ? 'logo--dark' : ''}`} aria-label="SecondHope home">
      <span className="logo__mark">
        <Ribbon size={18} color="#fff" />
      </span>
      <span className="logo__text">
        Second<em>Hope</em>
      </span>
    </Link>
  )
}

export function CompanyLogo({ initials, color, size = 44 }: { initials: string; color: string; size?: number }) {
  return (
    <span
      className="company-logo"
      style={{ width: size, height: size, background: `${color}1a`, color, fontSize: size * 0.34 }}
    >
      {initials}
    </span>
  )
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const letters = initials(name)
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {letters || '?'}
    </span>
  )
}
