import { useState, useRef, useCallback } from 'react'
import Landing from './Landing'
import Sections from './sections'

export default function App() {
  // view: 'landing' | 'zooming-in' | 'section' | 'crt-closing' | 'zooming-out'
  const [view, setView] = useState('landing')
  const [currentSection, setCurrentSection] = useState(null)
  const [sectionColor, setSectionColor] = useState('#4a7cf9')
  const [zoomClass, setZoomClass] = useState('')
  const [crtOn, setCrtOn] = useState(false)
  const [crtGreen, setCrtGreen] = useState(false)
  const safetyTimerRef = useRef(null)
  const crtTimerRef = useRef(null)
  const crtGreenTimerRef = useRef(null)

  const isMobile = () => window.innerWidth < 768

  const navigateTo = useCallback((sectionId, color) => {
    if (view !== 'landing') return
    setCurrentSection(sectionId)
    setSectionColor(color || '#4a7cf9')

    if (isMobile()) {
      setView('section')
      setZoomClass('expanded done')
      return
    }

    // Desktop: bezel zoom — section lives in zoom-bezel the whole time
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

  const navigateBack = useCallback(() => {
    if (view !== 'section') return

    if (isMobile()) {
      setView('landing')
      setCurrentSection(null)
      setZoomClass('')
      setCrtOn(true)
      clearTimeout(crtTimerRef.current)
      crtTimerRef.current = setTimeout(() => setCrtOn(false), 500)
      return
    }

    // Desktop: CRT green shutdown, then zoom-out
    setView('crt-closing')
    setCrtGreen(true)

    setTimeout(() => {
      setView('zooming-out')
      setZoomClass('start-expanded')

      setTimeout(() => {
        setZoomClass('collapsing')
      }, 30)

      clearTimeout(safetyTimerRef.current)
      safetyTimerRef.current = setTimeout(finishZoomOut, 500)
    }, 200)
  }, [view, finishZoomOut])

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
      {showLanding && (
        <Landing
          onNavigate={navigateTo}
          fading={landingFading}
          crtOn={crtOn}
        />
      )}

      {showSectionContainer && (
        <div className="zoom-outer">
          <div
            className={`zoom-bezel ${zoomClass}${crtGreen ? ' crt-green' : ''}`}
            onTransitionEnd={handleZoomTransitionEnd}
          >
            <button className="bezel-back" onClick={navigateBack}>
              <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                <path d="M11 3L5 9L11 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="zoom-screen">
              <SectionComp onBack={navigateBack} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
