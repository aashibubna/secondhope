import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarHeart,
  Clock,
  HeartHandshake,
  Lock,
  MapPin,
  Menu,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  UserRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Logo, Ribbon } from '../components/Brand'
import { homeFor, useApp } from '../context/store'

const STAGES = [
  {
    icon: CalendarHeart,
    title: 'In treatment',
    text: 'Remote, part-time and flexible roles that bend around appointments and rest days.',
  },
  {
    icon: Sprout,
    title: 'In remission',
    text: 'Return-to-work programmes with gradual ramps, so you can ease back at your pace.',
  },
  {
    icon: Sparkles,
    title: 'Survivor',
    text: 'Full careers with employers who value resilience and never question a résumé gap.',
  },
  {
    icon: HeartHandshake,
    title: 'Caregiver',
    text: 'Schedules that leave room for the people you are caring for.',
  },
]

const STEPS = [
  {
    icon: UserRound,
    title: 'Create your account',
    text: 'Just a name and email. Everything else can wait until you are ready.',
  },
  {
    icon: Lock,
    title: 'Share only what you want',
    text: 'Tell us your needs privately. You decide if and when an employer sees anything.',
  },
  {
    icon: BadgeCheck,
    title: 'Apply with confidence',
    text: 'Every role shows the support it offers — flexible hours, treatment leave and more.',
  },
]

const STORIES = [
  {
    quote:
      'After eighteen months of chemo I was terrified of explaining the gap. Here, nobody asked me to. I found a remote design role with Thursdays off for follow-ups.',
    name: 'Meera Iyer',
    role: 'Product Designer · Breast cancer survivor',
  },
  {
    quote:
      'I needed part-time work while caring for my father. SecondHope showed me which employers would actually honour that.',
    name: 'Rahul Menon',
    role: 'Bookkeeper · Caregiver',
  },
  {
    quote:
      'We joined the Cancer-Aware Pledge and hired three incredible people in a quarter. Their perspective made our team better.',
    name: 'Ananya Rao',
    role: 'Head of People, Lumen Health',
  },
]

const ORBIT = ['Flexible hours', 'Treatment leave', 'Remote-first', 'Part-time', 'Return-to-work']

export default function Landing() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [story, setStory] = useState(0)

  const goSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const target = `/jobs${query ? `?q=${encodeURIComponent(query)}` : ''}`
    navigate(!user ? '/signup' : user.role === 'seeker' ? target : homeFor(user), { state: { next: target } })
  }

  return (
    <div className="landing">
      {/* ───────────── Hero ───────────── */}
      <section className="hero">
        <div className="hero__bg" aria-hidden="true" />
        <nav className={`navbar ${menuOpen ? 'navbar--open' : ''}`}>
          <Logo />
          <div className="navbar__links">
            <a href="#how">How it works</a>
            <a href="#stages">Who it’s for</a>
            <a href="#employers">For employers</a>
            <a href="#stories">Stories</a>
          </div>
          <div className="navbar__actions">
            {user ? (
              <Link to={homeFor(user)} className="btn btn--dark btn--sm">
                {user.role === 'employer' ? 'Go to dashboard' : 'Go to jobs'} <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="navbar__login">
                  Log in
                </Link>
                <Link to="/signup" className="btn btn--dark btn--sm">
                  Get started
                </Link>
              </>
            )}
          </div>
          <button className="navbar__burger" aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        <div className="hero__inner">
          <div className="hero__copy">
            <span className="eyebrow">
              <Ribbon size={14} /> A job platform for people affected by cancer
            </span>
            <h1 className="hero__title">
              Your Second <br />
              Chapter <em>Starts</em> <br />
              Right Here
            </h1>
            <p className="hero__lead">
              Find work that fits your life — whether you are in treatment, in remission, a survivor, or a
              caregiver. Employers here understand, so you never have to explain yourself first.
            </p>
            <form className="hero__search" onSubmit={goSearch}>
              <Search size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roles, e.g. designer, writer, support"
                aria-label="Search jobs"
              />
              <button className="btn btn--primary" type="submit">
                Find jobs <ArrowRight size={16} />
              </button>
            </form>
            <div className="hero__trust">
              <div className="avatar-stack">
                {['Meera I', 'Rahul M', 'Sana K', 'Joel D'].map((n) => (
                  <Avatar key={n} name={n} size={32} />
                ))}
              </div>
              <span>
                <strong>2,400+</strong> people found work that fits
              </span>
            </div>
          </div>

          <div className="hero__visual" aria-hidden="true">
            <div className="hero-card hero-card--main">
              <div className="hero-card__ribbon">
                <Ribbon size={88} color="#fff" />
              </div>
              <p className="hero-card__quote">“They asked about my skills, not my scans.”</p>
              <span className="hero-card__by">— Meera, Product Designer</span>
            </div>
            <div className="hero-card hero-card--stat">
              <span className="hero-card__label">Cancer-Aware employers</span>
              <span className="hero-card__big">500+</span>
            </div>
            <div className="hero-card hero-card--job">
              <span className="hero-card__pill">
                <BadgeCheck size={14} /> Pledged
              </span>
              <strong>Frontend Engineer</strong>
              <span className="muted small">Remote · Flexible hours</span>
              <div className="hero-card__tags">
                <span>Treatment leave</span>
                <span>4-day week</span>
              </div>
            </div>
            <div className="hero-card hero-card--float">
              <ShieldCheck size={16} /> Private by default
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Matching ───────────── */}
      <section className="section match">
        <div className="container match__grid">
          <div>
            <h2 className="h2">
              Jobs Matched To Your Skills, Your Energy, And Your Journey
            </h2>
            <p className="muted">
              Our matching considers what you are great at and what you need right now — like fewer hours,
              remote work, or time off for treatment — and only shows employers who can offer it.
            </p>
          </div>
          <div className="orbit" aria-hidden="true">
            <div className="orbit__ring orbit__ring--1" />
            <div className="orbit__ring orbit__ring--2" />
            <div className="orbit__ring orbit__ring--3" />
            <div className="orbit__core">
              <Ribbon size={30} color="#fff" />
            </div>
            {ORBIT.map((label, i) => (
              <span key={label} className={`orbit__chip orbit__chip--${i + 1}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Connecting / stats ───────────── */}
      <section className="section" id="employers">
        <div className="container connect">
          <div>
            <h2 className="h2">Connecting Resilient People With Employers Who Get It</h2>
            <div className="row">
              <Link to="/signup" className="btn btn--dark btn--sm">
                Join for free
              </Link>
              <Link to="/signup?role=employer" className="btn btn--ghost btn--sm">
                I’m hiring <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div>
            <p className="connect__lead">
              Every employer on SecondHope signs the <strong>Cancer-Aware Pledge</strong>: fair interviews,
              no questions about medical history, and real support written into every job post.
            </p>
            <p className="muted">
              Our platform is built with patients, survivors, oncologists and HR leaders. We help you skip
              the hard conversations and go straight to the part where your talent matters.
            </p>
            <div className="stat-row">
              <div className="stat stat--dark">
                <strong>92%</strong>
                <span>Felt supported at work</span>
                <small>reported by members after 6 months</small>
              </div>
              <div className="stat">
                <strong>1,200+</strong>
                <span>Open flexible roles</span>
                <small>remote, part-time and hybrid</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Stages ───────────── */}
      <section className="section section--soft" id="stages">
        <div className="container">
          <h2 className="h2 center">
            Built For Every Stage Of The Journey
          </h2>
          <p className="muted center narrow">
            Cancer doesn’t follow a straight line, and neither do careers. Wherever you are, there is work
            here that respects it.
          </p>
          <div className="stage-grid">
            {STAGES.map(({ icon: Icon, title, text }, i) => (
              <article key={title} className={`stage ${i === 1 ? 'stage--accent' : ''}`}>
                <span className="stage__icon">
                  <Icon size={20} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link to="/signup" className="stage__link">
                  Explore roles <ArrowUpRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Features ───────────── */}
      <section className="section">
        <div className="container">
          <h2 className="h2 center">A Kinder, Smarter Way To Find Work</h2>
          <div className="feature-grid">
            <article className="feature feature--tall">
              <h3>
                Cancer-Aware <br />
                Employers
              </h3>
              <p className="muted">Every company is verified and signed to our pledge before posting.</p>
              <div className="feature__logos">
                {[
                  ['LH', '#6c47ff'],
                  ['NL', '#1fb58f'],
                  ['BP', '#ff7a59'],
                  ['HC', '#2a6df4'],
                  ['OC', '#f5a524'],
                  ['LW', '#8b5cf6'],
                ].map(([t, c]) => (
                  <span key={t} style={{ background: `${c}1a`, color: c }}>
                    {t}
                  </span>
                ))}
              </div>
            </article>
            <article className="feature">
              <h4>Treatment-friendly filters</h4>
              <p>Filter by flexible hours, treatment leave, reduced hours and accessible offices.</p>
              <ArrowUpRight className="feature__arrow" size={18} />
            </article>
            <article className="feature feature--primary">
              <h4>Private by default</h4>
              <p>Your health details stay yours. Share them only if, when and with whom you choose.</p>
              <ArrowUpRight className="feature__arrow" size={18} />
            </article>
            <article className="feature">
              <h4>Career pause, reframed</h4>
              <p>Describe gaps in your own words. We help employers see resilience, not absence.</p>
              <ArrowUpRight className="feature__arrow" size={18} />
            </article>
          </div>
        </div>
      </section>

      {/* ───────────── Steps ───────────── */}
      <section className="section section--soft" id="how">
        <div className="container">
          <h2 className="h2 center">Three Gentle Steps To Your Next Role</h2>
          <div className="steps">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <article key={title} className={`step ${i === 1 ? 'step--active' : ''}`}>
                <span className="step__num">0{i + 1}</span>
                <span className="step__icon">
                  <Icon size={18} />
                </span>
                <h4>{title}</h4>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Stories ───────────── */}
      <section className="section" id="stories">
        <div className="container">
          <h2 className="h2 center">Stories From Our Community</h2>
          <div className="stories">
            {STORIES.map((s, i) => (
              <article
                key={s.name}
                className={`story ${i === story ? 'story--active' : ''}`}
                onClick={() => setStory(i)}
              >
                <Quote size={28} className="story__mark" />
                <p>{s.quote}</p>
                <footer>
                  <Avatar name={s.name} size={36} />
                  <span>
                    <strong>{s.name}</strong>
                    <small>{s.role}</small>
                  </span>
                </footer>
              </article>
            ))}
          </div>
          <div className="dots">
            {STORIES.map((s, i) => (
              <button
                key={s.name}
                aria-label={`Story ${i + 1}`}
                className={i === story ? 'on' : ''}
                onClick={() => setStory(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="section cta">
        <div className="container center">
          <span className="cta__ribbon">
            <Ribbon size={22} color="#fff" />
          </span>
          <h2 className="h2">Ready To Begin Your Second Chapter?</h2>
          <p className="muted narrow">
            Create a free account in under a minute. Set up your profile now, or whenever you feel ready.
          </p>
          <Link to="/signup" className="btn btn--dark">
            Create free account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ───────────── Footer ───────────── */}
      <footer className="footer">
        <div className="container">
          <div className="footer__top">
            <div>
              <Logo dark />
              <p className="footer__about">
                SecondHope is your gateway to meaningful work during and after cancer — matched to your
                skills, your schedule and your pace.
              </p>
              <Link to="/signup" className="btn btn--light btn--sm">
                Get started <ArrowRight size={14} />
              </Link>
            </div>
            <div className="footer__cols">
              <div>
                <h5>Job seekers</h5>
                <Link to="/jobs">Browse jobs</Link>
                <a href="#how">How it works</a>
                <a href="#stages">Who it’s for</a>
                <Link to="/profile">Your profile</Link>
              </div>
              <div>
                <h5>Employers</h5>
                <a href="#employers">The Pledge</a>
                <Link to="/signup?role=employer">Post a job</Link>
                <a href="#stories">Success stories</a>
              </div>
              <div>
                <h5>Support</h5>
                <a href="#how">Know your rights</a>
                <a href="#how">Résumé gap guide</a>
                <a href="mailto:hello@secondhope.example">Contact us</a>
              </div>
            </div>
          </div>
          <div className="footer__mid">
            <span className="muted-light small">
              <MapPin size={12} /> Made with care for the cancer community
            </span>
            <span className="muted-light small">
              <Clock size={12} /> Support Mon–Sat, 9am–7pm
            </span>
          </div>
          <div className="footer__bottom">© {new Date().getFullYear()} SecondHope. All rights reserved.</div>
        </div>
        <div className="footer__word" aria-hidden="true">
          SecondHope
        </div>
      </footer>
    </div>
  )
}
