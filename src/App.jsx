import { useState, useRef } from 'react'
import Landing from './Landing'
import Sections from './sections'

export default function App() {
  const [view, setView] = useState('landing')
  const [currentSection, setCurrentSection] = useState(null)
  const [zoom, setZoom] = useState({ visible: false, expanding: false, color: '#4a7cf9' })
  const timeoutsRef = useRef([])

  const clearAll = () => timeoutsRef.current.forEach(clearTimeout)
  const after = (ms, fn) => { const t = setTimeout(fn, ms); timeoutsRef.current.push(t); return t }

  const navigateTo = (sectionId, color) => {
    clearAll()
    // Immediately show circle at portal size
    setZoom({ visible: true, expanding: false, color: color || '#4a7cf9' })

    // Next tick: trigger scale up
    after(30, () => setZoom(z => ({ ...z, expanding: true })))

    // Mid-animation: swap content
    after(500, () => {
      setCurrentSection(sectionId)
      setView('section')
    })

    // After animation: hide overlay
    after(750, () => setZoom({ visible: false, expanding: false, color }))
  }

  const navigateBack = () => {
    clearAll()
    setZoom({ visible: true, expanding: true, color: '#07070f' })

    after(30, () => setZoom(z => ({ ...z, expanding: true })))

    after(450, () => {
      setView('landing')
      setCurrentSection(null)
    })

    after(700, () => setZoom({ visible: false, expanding: false, color: '#07070f' }))
  }

  const SectionComp = currentSection ? Sections[currentSection] : null

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {view === 'landing' && <Landing onNavigate={navigateTo} />}
      {view === 'section' && SectionComp && <SectionComp onBack={navigateBack} />}

      {/* Portal zoom circle */}
      {zoom.visible && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '210px',
            height: '210px',
            borderRadius: '50%',
            background: zoom.color,
            pointerEvents: 'none',
            zIndex: 9999,
            transform: `translate(-50%, -50%) scale(${zoom.expanding ? 22 : 1})`,
            transition: zoom.expanding
              ? 'transform 0.72s cubic-bezier(0.76, 0, 0.24, 1)'
              : 'none',
          }}
        />
      )}
    </div>
  )
}
