import { useState, useRef, useCallback, useEffect, Component } from 'react'
import Landing from './Landing'
import Sections from './sections'
import Konami from './effects/Konami'
import ParticleField from './effects/ParticleField'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#e0e8f0', fontFamily: 'monospace', background: '#1a2332', minHeight: '100vh' }}>
          <h2>Something went wrong.</h2>
          <button onClick={() => this.setState({ hasError: false })} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  // view: 'landing' | 'zooming-in' | 'section' | 'crt-closing' | 'zooming-out'
  const [view, setView] = useState('landing')

  // Publish view onto <html data-app-view="..."> so HUD CSS can hide on
  // non-landing pages without prop-drilling. Set early so CSS sees it on
  // the very first paint.
  useEffect(() => {
    document.documentElement.dataset.appView = view
  }, [view])
  const [currentSection, setCurrentSection] = useState(null)
  const [sectionColor, setSectionColor] = useState('#4a7cf9')
  const [zoomClass, setZoomClass] = useState('')
  const [crtOn, setCrtOn] = useState(false)
  const [crtGreen, setCrtGreen] = useState(false)
  const safetyTimerRef = useRef(null)
  const crtTimerRef = useRef(null)
  const crtGreenTimerRef = useRef(null)
  const backTimerRef = useRef(null)
  const backDelayRef = useRef(null)

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(safetyTimerRef.current)
      clearTimeout(crtTimerRef.current)
      clearTimeout(crtGreenTimerRef.current)
      clearTimeout(backTimerRef.current)
      clearTimeout(backDelayRef.current)
    }
  }, [])

  const navigateTo = useCallback((sectionId, color) => {
    if (view !== 'landing') return
    setCurrentSection(sectionId)
    setSectionColor(color || '#4a7cf9')

    // Push a history entry so the browser/system back gesture (especially
    // important on mobile) navigates back to landing instead of exiting
    // the site entirely. The popstate handler below catches the back.
    try {
      window.history.pushState({ section: sectionId }, '', `#${sectionId}`)
    } catch (e) { /* ignore — privacy modes can block */ }

    // Bezel zoom — section lives in zoom-bezel the whole time
    setView('zooming-in')
    setZoomClass('')
    setCrtGreen(true)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setZoomClass('expanded')
      })
    })

    clearTimeout(safetyTimerRef.current)
    safetyTimerRef.current = setTimeout(() => {
      setView('section')
      setZoomClass('expanded done')
      // Fade out green overlay after entering section
      clearTimeout(crtGreenTimerRef.current)
      crtGreenTimerRef.current = setTimeout(() => setCrtGreen(false), 100)
    }, 900)
  }, [view])

  const finishZoomOut = useCallback(() => {
    setView('landing')
    setCurrentSection(null)
    setZoomClass('')
    setCrtGreen(false)
    // Trigger CRT turn-on animation
    setCrtOn(true)
    clearTimeout(crtTimerRef.current)
    crtTimerRef.current = setTimeout(() => setCrtOn(false), 500)
  }, [])

  // Actual close animation. Both the in-app back button (via
  // navigateBack -> history.back()) and the browser/system back gesture
  // (via the popstate effect below) funnel into this so they stay in
  // sync visually.
  const animateBackToLanding = useCallback(() => {
    if (view !== 'section' && view !== 'zooming-in') return

    // CRT green shutdown, then zoom-out
    setView('crt-closing')
    setCrtGreen(true)

    clearTimeout(backTimerRef.current)
    backTimerRef.current = setTimeout(() => {
      setView('zooming-out')
      setZoomClass('start-expanded')

      clearTimeout(backDelayRef.current)
      backDelayRef.current = setTimeout(() => {
        setZoomClass('collapsing')
      }, 30)

      clearTimeout(safetyTimerRef.current)
      safetyTimerRef.current = setTimeout(finishZoomOut, 500)
    }, 200)
  }, [view, finishZoomOut])

  const navigateBack = useCallback(() => {
    if (view !== 'section') return
    // Drive the URL back so the browser back gesture and the in-app
    // back button stay in sync. The popstate listener animates.
    try {
      window.history.back()
    } catch (e) {
      // Fallback for sandboxed contexts
      animateBackToLanding()
    }
  }, [view, animateBackToLanding])

  // popstate — runs the close animation on browser/system back gesture
  // (or when the in-app back button popped history).
  useEffect(() => {
    const onPop = () => {
      // Only act if we're in a section-ish state. If we're already on
      // landing, popstate may have been someone else's — ignore.
      if (view === 'section' || view === 'zooming-in') {
        animateBackToLanding()
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [view, animateBackToLanding])

  const handleZoomTransitionEnd = useCallback((e) => {
    if (e.propertyName !== 'top') return
    clearTimeout(safetyTimerRef.current)

    if (view === 'zooming-in') {
      setView('section')
      setZoomClass('expanded done')
      clearTimeout(crtGreenTimerRef.current)
      crtGreenTimerRef.current = setTimeout(() => setCrtGreen(false), 100)
    } else if (view === 'zooming-out') {
      finishZoomOut()
    }
  }, [view, finishZoomOut])

  const SectionComp = currentSection ? Sections[currentSection] : null

  // Always keep Landing mounted so zoom-out transition doesn't flash
  const showLanding = view === 'landing' || view === 'zooming-in' || view === 'section' || view === 'crt-closing' || view === 'zooming-out'
  // Section is always in the zoom-container (zoom-in, section, crt-closing, zoom-out)
  const showSectionContainer = (view === 'zooming-in' || view === 'section' || view === 'crt-closing' || view === 'zooming-out') && SectionComp
  const landingFading = view === 'zooming-in'

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <ParticleField />
      <Konami />
      {showLanding && (
        <Landing
          onNavigate={navigateTo}
          fading={landingFading}
          crtOn={crtOn}
          paused={view === 'section' || view === 'crt-closing'}
        />
      )}

      {showSectionContainer && (
        <div className="zoom-outer">
          <div
            className={`zoom-bezel ${zoomClass}${crtGreen ? ' crt-green' : ''}`}
            onTransitionEnd={handleZoomTransitionEnd}
          >
            <button className="bezel-back" onClick={navigateBack} aria-label="Go back">
              <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                <path d="M11 3L5 9L11 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="zoom-screen">
              <ErrorBoundary>
                <SectionComp onBack={navigateBack} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
