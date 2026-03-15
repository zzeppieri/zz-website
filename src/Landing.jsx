import { useRef, useEffect, useState, useCallback } from 'react'

/* ── Bubble definitions ── */
const BUBBLES = [
  { id: 'about',      label: 'About Me',        angle: -110, color: '#D44638', noteColor: '#F7E98E', icon: '👤', desc: 'Who I am & what drives me',
    callout: ['5+ Years Exp', '20+ Projects', 'PMP Certified'] },
  { id: 'contact',    label: 'Contact\nMe',     angle: -70,  color: '#0277BD', noteColor: '#B3E5FC', icon: '📬', desc: 'Get in touch',
    callout: ['LinkedIn', 'Email'],
    isContact: true,
    contactOptions: [
      { icon: '🔗', label: 'LinkedIn', url: 'https://linkedin.com/in/zacharyzeppieri' },
      { icon: '✉️', label: 'Email', url: 'mailto:zachary@zacharyzeppieri.com' },
    ] },
  { id: 'experience', label: 'Work\nExperience', angle:  -20, color: '#2E7D32', noteColor: '#BAFFC9', icon: '💼', desc: 'My professional journey',
    callout: ['3 Roles', 'Cross-functional', 'CI & PM'] },
  { id: 'hobbies',    label: 'Hobbies',          angle:  20,  color: '#AD1457', noteColor: '#FFB3BA', icon: '🎯', desc: 'Life outside of work',
    callout: ['Building Things', 'Gaming', 'Running'] },
  { id: 'projects',   label: 'Other\nProjects',  angle:  70,  color: '#1565C0', noteColor: '#BAE1FF', icon: '🚀', desc: 'Things I\'ve built & improved',
    callout: ['Process Improvement', 'Capital Projects', 'Quality'] },
  { id: 'cad',        label: 'CAD\nProjects',    angle:  110, color: '#E65100', noteColor: '#FFE0B2', icon: '📐', desc: '3D designs & engineering work',
    callout: ['SolidWorks', 'AutoCAD', 'GD&T'] },
  { id: 'tools',      label: 'Tools',            angle:  160, color: '#00838F', noteColor: '#B2EBF2', icon: '🔧', desc: 'Software & methodologies I use',
    callout: ['CAD / Design', 'Data Analytics', 'ERP / MES'] },
  { id: 'skills',     label: 'Skills',           angle:  200, color: '#6A1B9A', noteColor: '#E1BEE7', icon: '⚡', desc: 'What I bring to the table',
    callout: ['Lean & CI', 'Six Sigma', 'Leadership'] },
]

const ORBIT_R = 350
const NOTE_ROTATIONS = [2, -1.5, 3, -2, 1, -3, 2.5, -1]

/* ── useIsMobile hook ── */
function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])
  return mobile
}

/* ── Background dust particle field ── */
function BgCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx    = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const pts = Array.from({ length: 60 }, () => ({
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12 - 0.03,
      r:  0.3 + Math.random() * 1.2,
      a:  0.02 + Math.random() * 0.08,
      col: ['78,201,212', '120,180,200', '200,220,240', '60,140,160'][Math.floor(Math.random() * 4)],
    }))

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width)  p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.col},${p.a})`
        ctx.fill()
      })
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
}

/* ── CRT Terminal ── */
const IDLE_LINES = [
  { text: 'ZEPPIERI INDUSTRIES (TM) TERMLINK', cls: 'dim' },
  { text: '==================================', cls: 'dim' },
  { text: '', cls: '' },
  { text: '> Portfolio Terminal v1.0', cls: '' },
  { text: '> Status: ONLINE', cls: '' },
  { text: '', cls: '' },
  { text: '  Zachary Zeppieri', cls: 'bright' },
  { text: '  Lean Mfg Engineer / Project Mgr', cls: '' },
  { text: '', cls: '' },
  { text: '> Hover a note to explore...', cls: 'dim' },
]

function getHoverLines(bubble) {
  return [
    { text: 'ZEPPIERI INDUSTRIES (TM) TERMLINK', cls: 'dim' },
    { text: '==================================', cls: 'dim' },
    { text: '', cls: '' },
    { text: `> run:// load-section`, cls: '' },
    { text: `> SECTION: ${bubble.label.replace('\n', ' ')}`, cls: 'bright' },
    { text: `> LOG: ${bubble.desc}`, cls: '' },
    { text: '', cls: '' },
    { text: '> Click to enter section...', cls: 'dim' },
  ]
}

function CrtTerminal({ hovered, shuttingDown, isMobile, crtOn }) {
  const [displayLines, setDisplayLines] = useState(IDLE_LINES)
  const [phase, setPhase] = useState('idle')
  const intervalRef = useRef(null)
  const charIndexRef = useRef(0)
  const targetRef = useRef([])

  useEffect(() => {
    if (shuttingDown) {
      clearInterval(intervalRef.current)
      return
    }

    if (hovered && !hovered.external && !hovered.isContact) {
      clearInterval(intervalRef.current)
      const target = getHoverLines(hovered)
      targetRef.current = target
      const totalChars = target.reduce((sum, l) => sum + l.text.length + 1, 0)
      charIndexRef.current = 0
      setPhase('typing')
      setDisplayLines([])

      intervalRef.current = setInterval(() => {
        charIndexRef.current += 2 // type 2 chars per tick for speed
        let remaining = charIndexRef.current
        const built = []

        for (const line of targetRef.current) {
          if (remaining <= 0) break
          const chars = Math.min(remaining, line.text.length)
          built.push({ text: line.text.slice(0, chars), cls: line.cls })
          remaining -= chars
          if (remaining > 0) remaining -= 1
        }

        setDisplayLines(built)

        if (charIndexRef.current >= totalChars) {
          clearInterval(intervalRef.current)
          setPhase('typed')
        }
      }, 8)
    } else if (!hovered) {
      clearInterval(intervalRef.current)
      setDisplayLines(IDLE_LINES)
      setPhase('idle')
    }

    return () => clearInterval(intervalRef.current)
  }, [hovered, shuttingDown])

  return (
    <div className={isMobile ? 'mobile-terminal-wrap' : 'terminal-wrap'}>
      <div className="terminal-frame">
        <div className={`terminal-screen${shuttingDown ? ' crt-off' : ''}${crtOn ? ' crt-on' : ''}`}>
          <div className="terminal-scanlines" />
          <div className="terminal-vignette" />
          <div className="terminal-content">
            {displayLines.map((line, i) => (
              <div key={i} className={`terminal-line${line.cls ? ' ' + line.cls : ''}`}>
                {line.text}
              </div>
            ))}
            {phase !== 'typed' && !shuttingDown && (
              <span className="terminal-cursor" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Engineering Callout Overlay ── */
function CalloutOverlay({ bubble, viewW, viewH }) {
  const rad = a => (a * Math.PI) / 180
  const bx = viewW / 2 + Math.cos(rad(bubble.angle)) * ORBIT_R
  const by = viewH / 2 + Math.sin(rad(bubble.angle)) * ORBIT_R

  // Position callout offset from the bubble
  const angleDeg = bubble.angle
  const offsetX = angleDeg > -90 && angleDeg < 90 ? 90 : -90
  const calloutX = bx + offsetX
  const calloutY = by - 50

  // Leader line midpoint
  const midX = bx + offsetX * 0.3

  return (
    <div className="callout-overlay" style={{ left: 0, top: 0, width: '100%', height: '100%', position: 'absolute' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {/* Leader line */}
        <line x1={bx} y1={by - 60} x2={midX} y2={calloutY} className="callout-line" />
        <line x1={midX} y1={calloutY} x2={calloutX} y2={calloutY} className="callout-line" />
        {/* Dot at bubble end */}
        <circle cx={bx} cy={by - 60} r="2.5" className="callout-dot" />
        {/* Dot at callout end */}
        <circle cx={calloutX} cy={calloutY} r="2.5" className="callout-dot" />
      </svg>
      <div
        className="callout-box"
        style={{
          position: 'absolute',
          left: offsetX > 0 ? calloutX + 8 : undefined,
          right: offsetX < 0 ? viewW - calloutX + 8 : undefined,
          top: calloutY - 14,
        }}
      >
        <div className="callout-title">{bubble.label.replace('\n', ' ')}</div>
        <div className="callout-metrics">
          {bubble.callout.map((m, i) => (
            <span key={i} className="callout-metric">{m}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Contact Submenu ── */
function ContactSubmenu({ bubble, viewW, viewH }) {
  const rad = a => (a * Math.PI) / 180
  const bx = viewW / 2 + Math.cos(rad(bubble.angle)) * ORBIT_R
  const by = viewH / 2 + Math.sin(rad(bubble.angle)) * ORBIT_R

  const offsetX = bubble.angle > -90 && bubble.angle < 90 ? 80 : -80
  const menuX = bx + offsetX
  const menuY = by - 20

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 25 }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <line x1={bx} y1={by} x2={menuX} y2={menuY + 10} className="contact-submenu-line" />
      </svg>
      <div
        className="contact-submenu"
        style={{
          position: 'absolute',
          left: offsetX > 0 ? menuX + 8 : undefined,
          right: offsetX < 0 ? viewW - menuX + 8 : undefined,
          top: menuY,
        }}
      >
        {bubble.contactOptions.map((opt) => (
          <div
            key={opt.label}
            className="contact-option"
            onClick={(e) => { e.stopPropagation(); window.open(opt.url, '_blank') }}
          >
            <span className="contact-option-icon">{opt.icon}</span>
            <span>{opt.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Circuit Board SVG ── */
function CircuitSVG({ bubbles, hovered, viewW, viewH }) {
  const cx = viewW / 2
  const cy = viewH / 2
  const rad = a => (a * Math.PI) / 180

  const termHalfW = 176
  const termHalfH = 135

  // Group bubbles by which terminal edge they connect to, sorted to avoid crossings
  const sides = { top: [], bottom: [], left: [], right: [] }
  bubbles.forEach((b) => {
    const a = b.angle
    if (a >= -135 && a < -45) sides.top.push(b)
    else if (a >= -45 && a < 45) sides.right.push(b)
    else if (a >= 45 && a < 135) sides.bottom.push(b)
    else sides.left.push(b)
  })
  // Sort so start offsets match bubble spatial order (prevents line crossings)
  sides.top.sort((a, b) => Math.cos(rad(a.angle)) - Math.cos(rad(b.angle)))
  sides.bottom.sort((a, b) => Math.cos(rad(a.angle)) - Math.cos(rad(b.angle)))
  sides.left.sort((a, b) => Math.sin(rad(a.angle)) - Math.sin(rad(b.angle)))
  sides.right.sort((a, b) => Math.sin(rad(a.angle)) - Math.sin(rad(b.angle)))

  const getPath = (bubble) => {
    const bx = cx + Math.cos(rad(bubble.angle)) * ORBIT_R
    const by = cy + Math.sin(rad(bubble.angle)) * ORBIT_R

    const a = bubble.angle
    let startX, startY, side, sideList

    if (a >= -135 && a < -45) { side = 'top'; sideList = sides.top }
    else if (a >= -45 && a < 45) { side = 'right'; sideList = sides.right }
    else if (a >= 45 && a < 135) { side = 'bottom'; sideList = sides.bottom }
    else { side = 'left'; sideList = sides.left }

    const idx = sideList.indexOf(bubble)
    const count = sideList.length
    const spread = (count > 1) ? 40 : 0
    const offset = (idx - (count - 1) / 2) * spread

    if (side === 'top' || side === 'bottom') {
      startX = cx + offset
      startY = cy + (side === 'top' ? -termHalfH : termHalfH)
    } else {
      startX = cx + (side === 'right' ? termHalfW : -termHalfW)
      startY = cy + offset
    }

    // Manhattan route: go out from terminal edge, then turn toward bubble
    let path, nodes
    if (side === 'top' || side === 'bottom') {
      const midY = startY + (by - startY) * 0.4
      path = `M ${startX} ${startY} V ${midY} H ${bx} V ${by}`
      nodes = [
        { x: startX, y: startY },
        { x: startX, y: midY },
        { x: bx, y: midY },
        { x: bx, y: by },
      ]
    } else {
      const midX = startX + (bx - startX) * 0.4
      path = `M ${startX} ${startY} H ${midX} V ${by} H ${bx}`
      nodes = [
        { x: startX, y: startY },
        { x: midX, y: startY },
        { x: midX, y: by },
        { x: bx, y: by },
      ]
    }

    return { path, nodes }
  }

  return (
    <svg
      className="circuit-svg"
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {bubbles.map((b, i) => {
        const { path, nodes } = getPath(b)
        const active = hovered?.id === b.id
        const cls = active ? ' active' : ''

        return (
          <g key={b.id}>
            <path d={path} className={`circuit-trace-glow${cls}`} />
            <path d={path} className={`circuit-trace${cls}`} />
            <path
              d={path}
              className={`circuit-elec${cls}`}
              style={{ animationDelay: `${i * -0.5}s` }}
            />
            <path
              d={path}
              className={`circuit-elec${cls}`}
              style={{ animationDelay: `${i * -0.5 - 2}s` }}
            />
            {nodes.map((n, ni) => (
              <circle
                key={ni}
                cx={n.x}
                cy={n.y}
                r={ni === 0 ? 4 : 3}
                className={ni === 0 ? 'circuit-node-center' : `circuit-node${cls}`}
              />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

/* ── Mobile Landing Layout ── */
function MobileLanding({ onNavigate, crtOn }) {
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <div className="mobile-landing">
      <BgCanvas />
      <div className="blueprint-bg" />

      <CrtTerminal hovered={null} shuttingDown={false} isMobile={true} crtOn={crtOn} />

      <div className="mobile-name">Zachary Zeppieri</div>
      <div className="mobile-role">Lean Mfg Engineer · Project Manager</div>

      <div className="mobile-cards">
        {BUBBLES.map((b, i) => (
          <div key={b.id}>
            <div
              className="mobile-card"
              style={{
                '--mc': b.color,
                '--note-bg': b.noteColor,
                '--i': i,
                '--rot': `${NOTE_ROTATIONS[i]}deg`,
              }}
              onClick={() => {
                if (b.isContact) {
                  setContactOpen(prev => !prev)
                  return
                }
                onNavigate(b.id, b.color)
              }}
            >
              <div className="mobile-card-pin" />
              <div className="mobile-card-icon">{b.icon}</div>
              <div className="mobile-card-text">
                <div className="mobile-card-label">{b.label.replace('\n', ' ')}</div>
                <div className="mobile-card-desc">{b.desc}</div>
              </div>
              <div className="mobile-card-arrow">{b.isContact ? (contactOpen ? '▾' : '▸') : '→'}</div>
            </div>
            {b.isContact && contactOpen && (
              <div className="mobile-contact-sub">
                {b.contactOptions.map(opt => (
                  <div
                    key={opt.label}
                    className="mobile-contact-option"
                    onClick={() => window.open(opt.url, '_blank')}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main Landing component ── */
export default function Landing({ onNavigate, fading, crtOn }) {
  const [hovered, setHovered] = useState(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [shuttingDown, setShuttingDown] = useState(false)
  const [viewSize, setViewSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const isMobile = useIsMobile()
  const shutdownTimer = useRef(null)
  const contactRef = useRef(null)

  useEffect(() => {
    const onResize = () => setViewSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Click-away handler for contact submenu
  useEffect(() => {
    if (!contactOpen) return
    const handler = (e) => {
      // Close if click is outside contact bubble and submenu
      if (contactRef.current && contactRef.current.contains(e.target)) return
      const submenu = document.querySelector('.contact-submenu')
      if (submenu && submenu.contains(e.target)) return
      setContactOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [contactOpen])

  const rad = a => (a * Math.PI) / 180

  const handleClick = useCallback((bubble) => {
    if (bubble.isContact) {
      setContactOpen(prev => !prev)
      return
    }
    // Close contact menu if open
    setContactOpen(false)
    // Trigger CRT shutdown, then navigate
    setShuttingDown(true)
    clearTimeout(shutdownTimer.current)
    shutdownTimer.current = setTimeout(() => {
      setShuttingDown(false)
      onNavigate(bubble.id, bubble.color)
    }, 450)
  }, [onNavigate])

  if (isMobile) {
    return <MobileLanding onNavigate={onNavigate} crtOn={crtOn} />
  }

  return (
    <div
      className={fading ? 'landing-fade-out' : ''}
      style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', transition: 'opacity 0.4s ease' }}
    >
      <BgCanvas />
      <div className="blueprint-bg" />

      {/* Circuit board traces */}
      <CircuitSVG
        bubbles={BUBBLES}
        hovered={hovered}
        viewW={viewSize.w}
        viewH={viewSize.h}
      />

      {/* CRT Terminal */}
      <CrtTerminal hovered={hovered} shuttingDown={shuttingDown} isMobile={false} crtOn={crtOn} />

      {/* Engineering callout on hover */}
      {hovered && !hovered.isContact && hovered.callout && (
        <CalloutOverlay
          bubble={hovered}
          viewW={viewSize.w}
          viewH={viewSize.h}
        />
      )}

      {/* Contact submenu */}
      {contactOpen && (
        <ContactSubmenu
          bubble={BUBBLES.find(b => b.isContact)}
          viewW={viewSize.w}
          viewH={viewSize.h}
        />
      )}

      {/* Sticky note bubbles */}
      {BUBBLES.map((b, i) => {
        const x = Math.cos(rad(b.angle)) * ORBIT_R
        const y = Math.sin(rad(b.angle)) * ORBIT_R
        const active = hovered?.id === b.id
        const rot = NOTE_ROTATIONS[i]

        return (
          <div
            key={b.id}
            ref={b.isContact ? contactRef : undefined}
            className={`sticky-bubble ${active ? 'active' : ''}`}
            style={{
              position: 'absolute',
              left: `calc(50% + ${x}px)`,
              top:  `calc(50% + ${y}px)`,
              zIndex: 10,
              '--note-bg': b.noteColor,
              '--note-color': b.color,
              '--rot': `${rot}deg`,
              '--float-dur': `${3.5 + i * 0.22}s`,
              '--float-delay': `${i * 0.15}s`,
              animation: `floatBubble var(--float-dur) ease-in-out var(--float-delay) infinite ${active ? 'paused' : 'running'}`,
            }}
            onMouseEnter={() => setHovered(b)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleClick(b)}
          >
            <div className="sticky-pin" />
            <div className="sticky-note">
              <span className="sticky-icon">{b.icon}</span>
              <span className="sticky-label">{b.label.replace('\n', ' ')}</span>
            </div>
          </div>
        )
      })}

      {/* Corner branding */}
      <div className="corner-tag">
        <div className="corner-tag-name">Zachary Zeppieri</div>
        <div className="corner-tag-role">Lean Mfg Engineer · Project Manager</div>
      </div>
      <div className="hint-tag">Hover a note to explore</div>
    </div>
  )
}
