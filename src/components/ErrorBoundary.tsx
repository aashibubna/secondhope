import { Component, type ReactNode } from 'react'
import { Ribbon } from './Brand'

/** Last-resort screen, worded gently — nobody should be met with a blank page. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error(error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="setup">
        <div className="setup__card">
          <span className="splash__mark">
            <Ribbon size={24} color="#fff" />
          </span>
          <h1>Something went wrong on our side</h1>
          <p className="muted">
            It’s not you — and nothing you saved has been lost. Please try again, and if it keeps happening, let us know.
          </p>
          <div className="row">
            <button className="btn btn--primary" onClick={() => window.location.reload()}>
              Try again
            </button>
            <a className="btn btn--ghost" href="/">
              Go home
            </a>
          </div>
        </div>
      </div>
    )
  }
}
