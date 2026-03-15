import { useRef, useEffect, useState, useCallback } from 'react'

/* ── Bubble definitions ── */
const BUBBLES = [
  { id: 'about',      label: 'About Me',        angle: -90,  color: '#ff6b2b', icon: '👤', desc: 'Who I am & what drives me' },
  { id: 'experience', label: 'Work\nExperience', angle: -54,  color: '#4f9cf9', icon: '💼', desc: 'My professional journey' },
  { id: 'skills',     label: 'Skills',           angle: -18,  color: '#a855f7', icon: '⚡', desc: 'What I bring to the table' },
  { id: 'projects',   label: 'Projects',         angle:  18,  color: '#22c55e', icon: '🚀', desc: 'Things I\'ve built & improved' },
  { id: 'cad',        label: 'CAD\nProjects',    angle:  54,  color: '#f59e0b', icon: '📐', desc: '3D designs & engineering work' },
  { id: 'tools',      label: 'Tools',            angle:  90,  color: '#06b6d4', icon: '🔧', desc: 'Software & methodologies I use' },
  { id: 'hobbies',    label: 'Hobbies',          angle:  126, color: '#ec4899', icon: '🎯', desc: 'Life outside of work' },
  { id: 'linkedin',   label: 'LinkedIn',         angle:  162, color: '#0ea5e9', icon: '🔗', desc: 'Let\'s connect professionally', external: 'https://linkedin.com/in/zacharyzeppieri' },
  { id: 'email',      label: 'Email',            angle:  198, color: '#f97316', icon: '✉️', desc: 'Get in touch directly', external: 'mailto:zachary@zacharyzeppieri.com' },
  { id: 'github',     label: 'GitHub',           angle:  234, color: '#8b5cf6', icon: '💻', desc: 'My code & open source work', external: 'https://github.com/zzeppieri' },
]

const ORBIT_R = 270   // px from center to bubble center
const PORTAL_D = 220  // portal diameter

/* ── Portal canvas particle system ── */
function PortalCanvas({ hoverColor }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({ hoverColor: null, particles: [] })
  const rafRef    = useRef(null)

  useEffect(() => { stateRef.current.hoverColor = hoverColor }, [hoverColor])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const W = canvas.width  = PORTAL_D
    const H = canvas.height = PORTAL_D
    const cx = W / 2, cy = H / 2, R = W / 2 - 2

    /* Spawn orbiting particles */
    const particles = Array.from({ length: 80 }, (_, i) => ({
      angle:  (Math.PI * 2 * i) / 80 + Math.random() * 0.8,
      radius: 12 + Math.random() * (R - 18),
      speed:  (0.0025 + Math.random() * 0.007) * (Math.random() > 0.5 ? 1 : -1),
      size:   0.4 + Math.random() * 1.8,
      alpha:  0.15 + Math.random() * 0.65,
      bright: Math.random() > 0.75,
    }))
    stateRef.current.particles = particles

    const hexToRgb = hex => {
      const n = parseInt(hex.slice(1), 16)
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      /* Clip to circle */
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.clip()

      /* Background nebula */
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
      bg.addColorStop(0,   '#1a1a3e')
      bg.addColorStop(0.5, '#0e0e22')
      bg.addColorStop(1,   '#07070f')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      /* Particles */
      const { hoverColor } = stateRef.current
      const [hr, hg, hb] = hoverColor ? hexToRgb(hoverColor) : [74, 124, 249]

      particles.forEach(p => {
        p.angle += p.speed
        const x = cx + Math.cos(p.angle) * p.radius
        const y = cy + Math.sin(p.angle) * p.radius

        ctx.beginPath()
        ctx.arc(x, y, p.size, 0, Math.PI * 2)

        if (p.bright) {
          ctx.fillStyle = `rgba(${hr},${hg},${hb},${p.alpha})`
        } else {
          ctx.fillStyle = `rgba(180, 180, 255, ${p.alpha * 0.5})`
        }
        ctx.fill()
      })

      /* Color tint overlay toward hovered color */
      if (hoverColor) {
        const tint = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
        tint.addColorStop(0, `rgba(${hr},${hg},${hb},0.18)`)
        tint.addColorStop(1, 'transparent')
        ctx.fillStyle = tint
        ctx.beginPath()
        ctx.arc(cx, cy, R, 0, Math.PI * 2)
        ctx.fill()
      }

      /* Inner glow ring */
      const ring = ctx.createRadialGradient(cx, cy, R - 18, cx, cy, R)
      ring.addColorStop(0, 'transparent')
      ring.addColorStop(1, `rgba(${hr},${hg},${hb},0.3)`)
      ctx.fillStyle = ring
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return <canvas ref={canvasRef} className="portal-canvas" style={{ borderRadius: '50%' }} />
}

/* ── Background particle field ── */
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

    const pts = Array.from({ length: 90 }, () => ({
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r:  0.3 + Math.random() * 1.2,
      a:  0.04 + Math.random() * 0.18,
      col: Math.random() > 0.8 ? '255,107,43' : '90,110,255',
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

/* ── Orbit connecting line (SVG overlay) ── */
function OrbitSVG({ hovered }) {
  const size = (ORBIT_R + 80) * 2
  const cx   = size / 2
  const rad  = a => (a * Math.PI) / 180

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 5 }}
    >
      {/* Dashed orbit ring */}
      <circle cx={cx} cy={cx} r={ORBIT_R} fill="none" stroke="rgba(255,107,43,0.08)" strokeWidth="1" strokeDasharray="5 10" />
      {/* Active spoke */}
      {hovered && hovered.id !== 'resume' && (
        <line
          x1={cx}
          y1={cx}
          x2={cx + Math.cos(rad(hovered.angle)) * (ORBIT_R - 40)}
          y2={cx + Math.sin(rad(hovered.angle)) * (ORBIT_R - 40)}
          stroke={hovered.color}
          strokeWidth="1"
          opacity="0.4"
          strokeDasharray="3 5"
        />
      )}
    </svg>
  )
}

/* ── Main Landing component ── */
export default function Landing({ onNavigate }) {
  const [hovered, setHovered] = useState(null)

  const rad = a => (a * Math.PI) / 180

  const handleClick = useCallback((bubble) => {
    if (bubble.external) {
      window.open(bubble.external, '_blank')
      return
    }
    onNavigate(bubble.id, bubble.color)
  }, [onNavigate])

  const isHov = id => hovered?.id === id

  /* Label placement: push label outward from center */
  const getLabelStyle = (angle) => {
    const normalised = ((angle % 360) + 360) % 360
    const isRight    = normalised < 90 || normalised > 270
    const isTop      = normalised > 180 && normalised < 360
    const isBot      = !isTop
    return {
      position: 'absolute',
      top:  isBot ? 'calc(100% + 0.4rem)' : 'auto',
      bottom: isTop && !isBot ? 'calc(100% + 0.4rem)' : 'auto',
      left:  '50%',
      transform: 'translateX(-50%)',
      textAlign: 'center',
    }
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#07070f' }}>
      <BgCanvas />
      <div className="landing-grid" />

      {/* Portal */}
      <div
        className="portal-wrap"
        style={{ '--pc': hovered?.color || '#4a7cf9', zIndex: 10 }}
        onClick={() => window.open('/resume.pdf', '_blank')}
        onMouseEnter={() => setHovered({ id: 'resume', label: 'Resume', color: '#ff6b2b', desc: 'View my full résumé' })}
        onMouseLeave={() => setHovered(null)}
      >
        <div className="portal-ring-b" style={{ '--pc': hovered?.color || '#4a7cf9' }} />
        <div className="portal-ring-a" style={{ '--pc': hovered?.color || '#4a7cf9' }} />
        <div className="portal-body">
          <PortalCanvas hoverColor={hovered?.color || null} />
          <div className="portal-text">
            {hovered && hovered.id !== 'resume' ? (
              <>
                <div className="portal-hover-name">{hovered.label.replace('\n', ' ')}</div>
                <div className="portal-hover-desc">{hovered.desc}</div>
              </>
            ) : hovered?.id === 'resume' ? (
              <>
                <div className="portal-hover-name" style={{ fontSize: '1rem' }}>View Résumé</div>
                <div className="portal-hover-desc">Opens your PDF</div>
              </>
            ) : (
              <>
                <div className="portal-name">ZZ</div>
                <div className="portal-tag">Portfolio</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Orbit decorative SVG */}
      <OrbitSVG hovered={hovered} />

      {/* Bubbles */}
      {BUBBLES.map((b, i) => {
        const x = Math.cos(rad(b.angle)) * ORBIT_R
        const y = Math.sin(rad(b.angle)) * ORBIT_R
        const active = isHov(b.id)

        return (
          <div
            key={b.id}
            className={`bubble ${active ? 'active' : ''}`}
            style={{
              position: 'absolute',
              left: `calc(50% + ${x}px)`,
              top:  `calc(50% + ${y}px)`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              '--bc': b.color,
              animation: `floatBubble ${3.5 + i * 0.22}s ease-in-out ${i * 0.15}s infinite`,
              animationPlayState: active ? 'paused' : 'running',
            }}
            onMouseEnter={() => setHovered(b)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleClick(b)}
          >
            <div className="bubble-circle">
              <span style={{ fontSize: '1.25rem', userSelect: 'none' }}>{b.icon}</span>
            </div>
            <div
              className="bubble-label"
              style={{
                position: 'absolute',
                ...getLabelOffset(b.angle),
                whiteSpace: 'pre',
              }}
            >
              {b.label}
            </div>
          </div>
        )
      })}

      {/* Corner branding */}
      <div className="corner-tag">
        <div className="corner-tag-name">Zachary Zeppieri</div>
        <div className="corner-tag-role">Lean Mfg Engineer · Project Manager</div>
      </div>
      <div className="hint-tag">Hover a node to explore</div>
    </div>
  )
}

/* ── Helper: label offset based on angle ── */
function getLabelOffset(angle) {
  const a = ((angle % 360) + 360) % 360
  const pad = '6px'

  // Top quadrant (going up)
  if (a >= 250 && a <= 290) return { bottom: `calc(100% + ${pad})`, left: '50%', transform: 'translateX(-50%)' }
  // Bottom quadrant
  if (a >= 70  && a <= 110) return { top: `calc(100% + ${pad})`, left: '50%', transform: 'translateX(-50%)' }
  // Right half
  if (a < 70 || a > 290) {
    if (a >= 330 || a <= 30)  return { top: `calc(100% + ${pad})`, left: '50%', transform: 'translateX(-50%)' }
    if (a >= 290 && a < 330)  return { top: '50%', left: `calc(100% + 8px)`, transform: 'translateY(-50%)' }
    if (a > 30  && a < 70)   return { top: '50%', left: `calc(100% + 8px)`, transform: 'translateY(-50%)' }
  }
  // Left half
  if (a >= 110 && a <= 250) {
    if (a >= 150 && a <= 210) return { top: `calc(100% + ${pad})`, left: '50%', transform: 'translateX(-50%)' }
    return { top: '50%', right: `calc(100% + 8px)`, transform: 'translateY(-50%)', textAlign: 'right' }
  }

  return { top: `calc(100% + ${pad})`, left: '50%', transform: 'translateX(-50%)' }
}
