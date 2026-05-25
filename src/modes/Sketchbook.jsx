/* ============================================================
   Sketchbook.jsx — hand-drawn lab notebook portfolio takeover
   Zach Zeppieri / Lab Notebook

   Usage:
     import Sketchbook from './modes/Sketchbook'
     <Sketchbook onExit={() => setMode('default')} />

   Self-contained: no external deps beyond React + sketchbook.css.
   Google Font (Caveat / Architects Daughter / Patrick Hand) is
   loaded once at mount via <link>; falls back to system
   handwriting stack if blocked.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './sketchbook.css'

/* ── Reduced-motion detection ── */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ── Google handwriting fonts — injected once, harmless if blocked ── */
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Architects+Daughter&family=Patrick+Hand&display=swap'

function useHandwritingFont() {
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (document.querySelector(`link[data-sketchbook-font]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONTS_HREF
    link.setAttribute('data-sketchbook-font', 'true')
    document.head.appendChild(link)
    return () => {
      // Don't remove on unmount — the font is cheap and may be reused.
    }
  }, [])
}

/* ============================================================
   Tiny SVG doodles — each ~24-48px, stroke-only, hand-feel
   ============================================================ */

function DoodleGear({ size = 32, className = '', style = {} }) {
  return (
    <svg
      className={`sk-doodle ${className}`}
      style={style}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="24" cy="24" r="9" />
        <circle cx="24" cy="24" r="3.2" />
        <path d="M24 6 L25 12 L23 12 Z" />
        <path d="M24 42 L25 36 L23 36 Z" />
        <path d="M6 24 L12 23 L12 25 Z" />
        <path d="M42 24 L36 23 L36 25 Z" />
        <path d="M11 11 L16 14 L14 16 Z" />
        <path d="M37 37 L32 34 L34 32 Z" />
        <path d="M37 11 L34 16 L32 14 Z" />
        <path d="M11 37 L14 32 L16 34 Z" />
      </g>
    </svg>
  )
}

function DoodleCoffee({ size = 30, className = '', style = {} }) {
  return (
    <svg
      className={`sk-doodle ${className}`}
      style={style}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 18 L36 18 L34 38 Q33 42 29 42 L17 42 Q13 42 12 38 Z" />
        <path d="M36 22 Q44 22 44 30 Q44 36 36 36" />
        <path d="M18 8 Q15 12 18 16" />
        <path d="M24 6 Q21 11 24 15" />
        <path d="M30 8 Q27 12 30 16" />
      </g>
    </svg>
  )
}

function DoodleAtom({ size = 36, className = '', style = {} }) {
  return (
    <svg
      className={`sk-doodle ${className}`}
      style={style}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <ellipse cx="24" cy="24" rx="18" ry="7" />
        <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(60 24 24)" />
        <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(120 24 24)" />
        <circle cx="24" cy="24" r="2.2" fill="currentColor" />
      </g>
    </svg>
  )
}

function DoodleBurst({ size = 36, className = '', style = {} }) {
  // "Lean burst" — kaizen starburst
  return (
    <svg
      className={`sk-doodle ${className}`}
      style={style}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 6 L26 18 L36 10 L30 21 L42 22 L31 26 L40 35 L28 30 L26 42 L22 30 L10 35 L19 26 L8 22 L20 21 L14 10 L22 18 Z" />
      </g>
    </svg>
  )
}

function DoodlePaperPlane({ size = 44, className = '', style = {} }) {
  return (
    <svg
      className={`sk-doodle ${className}`}
      style={style}
      viewBox="0 0 64 48"
      width={size}
      height={size * 0.75}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 24 L60 6 L48 42 L32 28 Z" />
        <path d="M32 28 L60 6" />
        <path d="M32 28 L36 40" />
      </g>
    </svg>
  )
}

function DoodleNeuralNet({ width = 140, height = 80, className = '', style = {} }) {
  // 3-layer net: 3 → 4 → 2
  const l1 = [18, 40, 62]
  const l2 = [12, 32, 52, 72]
  const l3 = [25, 55]
  return (
    <svg
      className={`sk-doodle ${className}`}
      style={style}
      viewBox="0 0 140 80"
      width={width}
      height={height}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.7">
        {l1.map((y1) =>
          l2.map((y2, i) => (
            <line key={`a${y1}-${i}`} x1="22" y1={y1} x2="70" y2={y2} />
          ))
        )}
        {l2.map((y2) =>
          l3.map((y3, i) => (
            <line key={`b${y2}-${i}`} x1="70" y1={y2} x2="118" y2={y3} />
          ))
        )}
      </g>
      <g fill="#f3eed7" stroke="currentColor" strokeWidth="1.3">
        {l1.map((y) => (
          <circle key={`n1-${y}`} cx="22" cy={y} r="4" />
        ))}
        {l2.map((y) => (
          <circle key={`n2-${y}`} cx="70" cy={y} r="4" />
        ))}
        {l3.map((y) => (
          <circle key={`n3-${y}`} cx="118" cy={y} r="4" />
        ))}
      </g>
    </svg>
  )
}

function DoodleGauge({ value = 70, label = '', size = 110, className = '' }) {
  // Half-circle gauge with wobbly needle
  const angle = -180 + (value / 100) * 180
  const rad = (angle * Math.PI) / 180
  const cx = 55
  const cy = 55
  const nx = cx + 38 * Math.cos(rad)
  const ny = cy + 38 * Math.sin(rad)
  return (
    <svg
      className={`sk-doodle sk-gauge ${className}`}
      viewBox="0 0 110 80"
      width={size}
      height={size * 0.72}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 55 Q12 12 55 12 Q98 12 98 55" />
        <path d="M16 55 Q16 16 55 16" strokeWidth="0.8" opacity="0.4" />
        <line x1="20" y1="55" x2="24" y2="50" />
        <line x1="55" y1="14" x2="55" y2="20" />
        <line x1="90" y1="55" x2="86" y2="50" />
        <line x1={cx} y1={cy} x2={nx} y2={ny} strokeWidth="2" />
        <circle cx={cx} cy={cy} r="3" fill="currentColor" />
      </g>
      <text
        x="55"
        y="74"
        textAnchor="middle"
        fontFamily="'Caveat', 'Bradley Hand', cursive"
        fontSize="14"
        fill="#1a1a1a"
      >
        {label}
      </text>
    </svg>
  )
}

function PDCAWheel({ size = 180 }) {
  return (
    <svg
      className="sk-doodle sk-pdca"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <g fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round">
        <circle cx="100" cy="100" r="74" />
        <circle cx="100" cy="100" r="76" strokeWidth="0.8" opacity="0.4" />
        <line x1="100" y1="22" x2="100" y2="178" />
        <line x1="22" y1="100" x2="178" y2="100" />
        {/* curved arrow around the outside */}
        <path
          d="M100 14 Q170 14 186 84"
          strokeWidth="1.4"
          markerEnd="url(#sk-arrowhead)"
        />
        <defs>
          <marker
            id="sk-arrowhead"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 Z" fill="#1a1a1a" />
          </marker>
        </defs>
      </g>
      <g
        fontFamily="'Caveat', 'Bradley Hand', cursive"
        fontSize="34"
        fill="#1a1a1a"
        textAnchor="middle"
      >
        <text x="60" y="68">P</text>
        <text x="140" y="68">D</text>
        <text x="140" y="148">C</text>
        <text x="60" y="148">A</text>
      </g>
    </svg>
  )
}

function HardHatPortrait() {
  // Stylized "selfie" — hard-hat profile with calipers
  return (
    <svg
      className="sk-portrait"
      viewBox="0 0 180 220"
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sk-hat" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e8b14c" />
          <stop offset="1" stopColor="#b87d22" />
        </linearGradient>
      </defs>
      {/* background wash */}
      <rect x="0" y="0" width="180" height="220" fill="#dfd9c0" />
      {/* face profile */}
      <g stroke="#1a1a1a" strokeWidth="2" fill="#e9d3a8" strokeLinejoin="round">
        <path d="M55 90 Q55 130 70 155 L70 180 L115 180 L115 150 Q138 130 138 90 Q138 60 96 60 Q55 60 55 90 Z" />
      </g>
      {/* ear */}
      <path d="M58 110 Q52 115 58 124" fill="none" stroke="#1a1a1a" strokeWidth="1.6" />
      {/* eye */}
      <circle cx="95" cy="98" r="2.2" fill="#1a1a1a" />
      {/* brow */}
      <path d="M88 90 L102 87" stroke="#1a1a1a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* mouth */}
      <path d="M105 130 Q112 132 118 128" stroke="#1a1a1a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* hard hat */}
      <g stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round">
        <path d="M40 78 Q40 38 96 38 Q150 38 150 78 L150 84 L40 84 Z" fill="url(#sk-hat)" />
        <path d="M40 78 L150 78" fill="none" />
        <path d="M96 38 L96 80" fill="none" />
      </g>
      {/* calipers */}
      <g stroke="#1a1a1a" strokeWidth="1.6" fill="#d8d8d8" strokeLinejoin="round">
        <rect x="20" y="190" width="120" height="10" rx="1" />
        <rect x="30" y="186" width="18" height="22" />
        <rect x="92" y="186" width="18" height="22" />
        <line x1="40" y1="190" x2="40" y2="200" stroke="#1a1a1a" />
        <line x1="50" y1="190" x2="50" y2="198" stroke="#1a1a1a" />
        <line x1="60" y1="190" x2="60" y2="200" stroke="#1a1a1a" />
        <line x1="70" y1="190" x2="70" y2="198" stroke="#1a1a1a" />
        <line x1="80" y1="190" x2="80" y2="200" stroke="#1a1a1a" />
      </g>
    </svg>
  )
}

/* ============================================================
   Sketched arrow — bezier with small jitter
   ============================================================ */
function SketchArrow({
  from = [0, 0],
  to = [100, 0],
  curve = 30,
  color = '#1a1a1a',
  width = 2,
  dashed = false,
  reduced = false,
  className = '',
  style = {},
}) {
  const [x1, y1] = from
  const [x2, y2] = to
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  // perpendicular offset for curve
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.max(1, Math.sqrt(dx * dx + dy * dy))
  const nx = -dy / len
  const ny = dx / len
  const cpx = mx + nx * curve
  const cpy = my + ny * curve
  // wobble: small jitter at the control point
  const j = reduced ? 0 : 3
  const wob1x = cpx + (Math.random() - 0.5) * j
  const wob1y = cpy + (Math.random() - 0.5) * j
  // arrowhead
  const headAngle = Math.atan2(y2 - wob1y, x2 - wob1x)
  const ah = 9
  const hx1 = x2 - ah * Math.cos(headAngle - 0.5)
  const hy1 = y2 - ah * Math.sin(headAngle - 0.5)
  const hx2 = x2 - ah * Math.cos(headAngle + 0.5)
  const hy2 = y2 - ah * Math.sin(headAngle + 0.5)

  // viewbox sized to bounding box with padding
  const minX = Math.min(x1, x2, wob1x) - 12
  const minY = Math.min(y1, y2, wob1y) - 12
  const maxX = Math.max(x1, x2, wob1x) + 12
  const maxY = Math.max(y1, y2, wob1y) + 12
  const w = maxX - minX
  const h = maxY - minY

  return (
    <svg
      className={`sk-arrow ${className}`}
      style={style}
      viewBox={`${minX} ${minY} ${w} ${h}`}
      width={w}
      height={h}
      aria-hidden="true"
    >
      <path
        d={`M ${x1} ${y1} Q ${wob1x} ${wob1y} ${x2} ${y2}`}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      <path
        d={`M ${x2} ${y2} L ${hx1} ${hy1} M ${x2} ${y2} L ${hx2} ${hy2}`}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/* ============================================================
   Tape, Polaroid, Sticky Note, Paperclip primitives
   ============================================================ */

function TapeStrip({ rotate = -8, top = -10, left = '40%', width = 90, color = '#f3e8a8', className = '' }) {
  return (
    <div
      className={`sk-tape ${className}`}
      style={{
        '--tape-rot': `${rotate}deg`,
        top,
        left,
        width,
        background: color,
      }}
      aria-hidden="true"
    />
  )
}

function Polaroid({ children, caption, rotate = -3, className = '', style = {}, onClick }) {
  return (
    <button
      type="button"
      className={`sk-polaroid ${className}`}
      style={{ '--rot': `${rotate}deg`, ...style }}
      onClick={onClick}
    >
      <TapeStrip rotate={6} top={-14} left={'50%'} width={70} />
      <div className="sk-polaroid-photo">{children}</div>
      <div className="sk-polaroid-caption">{caption}</div>
    </button>
  )
}

function StickyNote({
  children,
  rotate = 3,
  color = '#fff59a',
  className = '',
  style = {},
  onClick,
}) {
  return (
    <button
      type="button"
      className={`sk-sticky ${className}`}
      style={{ '--rot': `${rotate}deg`, '--bg': color, ...style }}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function Paperclip({ className = '', style = {} }) {
  return (
    <svg
      className={`sk-paperclip ${className}`}
      style={style}
      viewBox="0 0 40 80"
      width="34"
      height="68"
      aria-hidden="true"
    >
      <path
        d="M12 6 L12 60 Q12 72 22 72 Q32 72 32 60 L32 16 Q32 8 24 8 Q16 8 16 16 L16 56 Q16 62 20 62 Q24 62 24 56 L24 20"
        fill="none"
        stroke="#777"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ============================================================
   Doodle Canvas — silly easter egg drawing layer per page
   ============================================================ */
function DoodleCanvas({ active, reduced }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const lastRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const resize = () => {
      const rect = c.getBoundingClientRect()
      c.width = rect.width * (window.devicePixelRatio || 1)
      c.height = rect.height * (window.devicePixelRatio || 1)
      const ctx = c.getContext('2d')
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const pos = useCallback((e) => {
    const c = canvasRef.current
    const rect = c.getBoundingClientRect()
    const t = e.touches ? e.touches[0] : e
    return { x: t.clientX - rect.left, y: t.clientY - rect.top }
  }, [])

  const onDown = useCallback(
    (e) => {
      if (!active) return
      drawingRef.current = true
      lastRef.current = pos(e)
      e.preventDefault?.()
    },
    [active, pos]
  )
  const onMove = useCallback(
    (e) => {
      if (!active || !drawingRef.current) return
      const c = canvasRef.current
      const ctx = c.getContext('2d')
      const p = pos(e)
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(lastRef.current.x, lastRef.current.y)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
      lastRef.current = p
      e.preventDefault?.()
    },
    [active, pos]
  )
  const onUp = useCallback(() => {
    drawingRef.current = false
  }, [])

  // fade lines slowly when not reduced
  useEffect(() => {
    if (!active || reduced) return
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    let raf
    let last = performance.now()
    const tick = (t) => {
      if (t - last > 90) {
        ctx.fillStyle = 'rgba(243, 238, 215, 0.04)'
        ctx.fillRect(0, 0, c.width, c.height)
        last = t
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, reduced])

  return (
    <canvas
      ref={canvasRef}
      className={`sk-doodle-canvas ${active ? 'is-active' : ''}`}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={onDown}
      onTouchMove={onMove}
      onTouchEnd={onUp}
      aria-hidden="true"
    />
  )
}

/* ============================================================
   Pages
   ============================================================ */

function Page({ children, pageNum, total, ariaLabel, id }) {
  return (
    <section
      id={id}
      className="sk-page"
      aria-label={ariaLabel}
      data-page={pageNum}
    >
      <div className="sk-page-bg" aria-hidden="true" />
      <div className="sk-page-margin" aria-hidden="true" />
      <div className="sk-page-number">Page {pageNum} of {total}</div>
      <div className="sk-page-inner">{children}</div>
    </section>
  )
}

function Page1({ onLiftSticky }) {
  return (
    <>
      <h1 className="sk-title sk-handwriting-big">
        Zach Zeppieri
        <span className="sk-title-sub">/ Lab Notebook</span>
        <svg
          className="sk-title-underline"
          viewBox="0 0 380 14"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M2 9 Q 60 2 130 8 T 260 7 T 378 6"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </h1>

      <div className="sk-row sk-row-portrait">
        <Polaroid caption="HARD HAT // 2026" rotate={-4}>
          <HardHatPortrait />
        </Polaroid>

        <div className="sk-prose sk-handwriting">
          <p>
            Sr CI Engineer at <u>Chromalloy</u>. Aerospace MRO.<br />
            Patent-pending tool. <strong>30,000 hrs saved</strong> in '24–'25.
          </p>
          <p>
            Building toward MES + AI ops at scale.
          </p>
          <p className="sk-aside">
            (Six Sigma Green Belt. ME @ SUNY New Paltz.)
          </p>
        </div>
      </div>

      <div className="sk-sticky-area sk-sticky-area-1">
        <SketchArrow
          from={[20, 20]}
          to={[200, 80]}
          curve={-30}
          className="sk-arrow-1"
        />
        <StickyNote rotate={-5} onClick={onLiftSticky} className="sk-sticky-1">
          <strong>Right now:</strong>
          <br />
          Tulip MES @ Windsor (CT).
          <br />
          Pilot in May 2026.
        </StickyNote>
      </div>

      <DoodleGear size={28} className="sk-margin-doodle sk-md-1" />
      <DoodleBurst size={30} className="sk-margin-doodle sk-md-2" />
    </>
  )
}

function Page2() {
  return (
    <>
      <h2 className="sk-heading sk-handwriting-big">How I think</h2>
      <div className="sk-underline-wrap">
        <svg viewBox="0 0 240 10" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M2 6 Q 60 1 130 5 T 238 4"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="sk-flow sk-handwriting">
        <span className="sk-flow-step">Find waste</span>
        <span className="sk-flow-arrow">→</span>
        <span className="sk-flow-step">Measure it</span>
        <span className="sk-flow-arrow">→</span>
        <span className="sk-flow-step">Standardize</span>
        <span className="sk-flow-arrow">→</span>
        <span className="sk-flow-step">Automate</span>
      </div>

      <div className="sk-row sk-row-pdca">
        <PDCAWheel size={210} />
        <div className="sk-prose sk-handwriting">
          <p className="sk-quote">
            <span className="sk-quote-mark">&ldquo;</span>
            Complacency is the death of progress.
            <span className="sk-quote-mark">&rdquo;</span>
          </p>
          <p className="sk-quote-attr">— manager, '25 review</p>
          <p>
            PDCA is the loop. Every project. Every shift.
          </p>
        </div>
      </div>

      <div className="sk-margin-doodles">
        <DoodleGear size={26} className="sk-md-a" />
        <DoodleCoffee size={28} className="sk-md-b" />
        <span className="sk-md-text sk-handwriting sk-md-c">kaizen</span>
        <span className="sk-md-text sk-handwriting sk-md-d" style={{ fontFamily: "'Patrick Hand', cursive" }}>
          KAIZEN
        </span>
        <DoodleBurst size={28} className="sk-md-e" />
      </div>
    </>
  )
}

function Page3() {
  const years = [
    {
      year: "'22",
      title: 'Blade Cell CapEx ($2.4M)',
      detail: 'Built justification + ROI model.',
    },
    {
      year: "'23",
      title: 'Promoted: CI Analyst. Six Sigma GB.',
      detail: 'First 10K hrs reduction year.',
    },
    {
      year: "'24",
      title: 'Baffle Tool — patent filed',
      detail: 'Co-inventor. Stage-gate approved.',
    },
    {
      year: "'25",
      title: 'Promoted: Senior. 23,500 hrs saved.',
      detail: '29 Kaizen events. 77+ trained.',
    },
    {
      year: "'26",
      title: 'Tulip MES PM — Windsor',
      detail: 'AI-augmented stack. Pilot live.',
    },
  ]
  return (
    <>
      <h2 className="sk-heading sk-handwriting-big">What I&rsquo;ve shipped</h2>
      <div className="sk-underline-wrap">
        <svg viewBox="0 0 280 10" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M2 6 Q 70 1 140 5 T 278 4"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="sk-timeline">
        <svg
          className="sk-timeline-line"
          viewBox="0 0 1000 20"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M10 10 Q 200 6 400 12 T 800 9 L 990 11"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        {years.map((y, i) => (
          <div
            key={y.year}
            className="sk-timeline-node"
            style={{ '--i': i, '--pct': `${(i / (years.length - 1)) * 100}%` }}
          >
            <div className="sk-timeline-dot" />
            <div className={`sk-timeline-card sk-tc-${i % 2 === 0 ? 'top' : 'bot'}`}>
              <div className="sk-tc-year sk-handwriting-big">{y.year}</div>
              <div className="sk-tc-title sk-handwriting">{y.title}</div>
              <div className="sk-tc-detail sk-handwriting sk-tc-detail-sm">{y.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="sk-gauges">
        <div className="sk-gauge-wrap">
          <DoodleGauge value={94} label="30,000 hrs" />
          <div className="sk-handwriting sk-gauge-cap">labor saved '24–'25</div>
        </div>
        <div className="sk-gauge-wrap">
          <DoodleGauge value={78} label="29 events" />
          <div className="sk-handwriting sk-gauge-cap">Kaizen runs led</div>
        </div>
        <div className="sk-gauge-wrap">
          <DoodleGauge value={88} label="77+ trained" />
          <div className="sk-handwriting sk-gauge-cap">operators & engineers</div>
        </div>
      </div>
    </>
  )
}

function Page4({ onLiftSticky }) {
  return (
    <>
      <h2 className="sk-heading sk-handwriting-big">How I work</h2>
      <div className="sk-underline-wrap">
        <svg viewBox="0 0 220 10" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M2 6 Q 60 1 130 5 T 218 4"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <p className="sk-prose sk-handwriting sk-subtitle">
        Models orchestrate. <strong>I scope, decompose, ship.</strong>
      </p>

      <div className="sk-stack-diagram">
        <div className="sk-stack-box sk-sb-claude">Claude</div>
        <div className="sk-stack-box sk-sb-copilot">Copilot</div>
        <div className="sk-stack-box sk-sb-smartsheet">Smartsheet</div>
        <div className="sk-stack-box sk-sb-tulip">Tulip</div>
        <div className="sk-stack-me sk-handwriting-big">ME</div>

        {/* connecting arrows */}
        <SketchArrow from={[60, 24]} to={[200, 78]} curve={20} className="sk-sa sk-sa-1" />
        <SketchArrow from={[200, 24]} to={[60, 78]} curve={-20} className="sk-sa sk-sa-2" />
        <SketchArrow from={[60, 120]} to={[200, 170]} curve={20} className="sk-sa sk-sa-3" />
        <SketchArrow from={[200, 120]} to={[60, 170]} curve={-20} className="sk-sa sk-sa-4" />
      </div>

      <div className="sk-row sk-row-stack-aside">
        <div className="sk-net-wrap">
          <DoodleNeuralNet width={170} height={100} />
          <div className="sk-handwriting sk-net-cap">orchestration ≠ magic</div>
        </div>

        <StickyNote rotate={2} color="#cfe8b3" onClick={onLiftSticky} className="sk-wip">
          <strong>WIP — next:</strong>
          <br />
          – Copilot ingestion of OEM tracker
          <br />
          – Smartsheet MCP for live PM
          <br />
          – Tulip Player on shop floor
        </StickyNote>
      </div>

      <DoodleAtom size={40} className="sk-margin-doodle sk-md-3" />
    </>
  )
}

function Page5() {
  return (
    <>
      <h2 className="sk-heading sk-handwriting-big">Reach out</h2>
      <div className="sk-underline-wrap">
        <svg viewBox="0 0 180 10" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M2 6 Q 50 1 100 5 T 178 4"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="sk-contact-card">
        <Paperclip className="sk-card-clip" />
        <div className="sk-contact-handwriting sk-handwriting-big">Zach Zeppieri</div>
        <div className="sk-contact-row sk-handwriting">
          <span className="sk-contact-label">email</span>
          <span className="sk-contact-val">zzeppieri@chromalloy.com</span>
        </div>
        <div className="sk-contact-row sk-handwriting">
          <span className="sk-contact-label">LinkedIn</span>
          <span className="sk-contact-val">/in/zachary-zeppieri</span>
        </div>
        <div className="sk-contact-row sk-handwriting">
          <span className="sk-contact-label">site</span>
          <span className="sk-contact-val">zeppieri.dev</span>
        </div>

        <div className="sk-plane-wrap">
          <DoodlePaperPlane size={62} />
          <SketchArrow from={[8, 6]} to={[120, 24]} curve={-18} className="sk-plane-arrow" />
        </div>
      </div>

      <p className="sk-prose sk-handwriting sk-closing-script">
        Open to MES + lean systems roles. Drop a note.
      </p>

      <div className="sk-signoff sk-handwriting-big">
        Built this entire site by hand.
        <br />
        Talk soon. — Z.
      </div>

      <DoodleBurst size={32} className="sk-margin-doodle sk-md-4" />
    </>
  )
}

/* ============================================================
   Main component
   ============================================================ */

export default function Sketchbook({ onExit = () => {} }) {
  useHandwritingFont()
  const containerRef = useRef(null)
  const [activePage, setActivePage] = useState(1)
  const [doodleMode, setDoodleMode] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [lifted, setLifted] = useState(null)

  const PAGES = useMemo(
    () => [
      { id: 'sk-p1', label: 'Page 1 — Who I am', Render: Page1 },
      { id: 'sk-p2', label: 'Page 2 — How I think', Render: Page2 },
      { id: 'sk-p3', label: 'Page 3 — What I shipped', Render: Page3 },
      { id: 'sk-p4', label: 'Page 4 — How I work', Render: Page4 },
      { id: 'sk-p5', label: 'Page 5 — Reach out', Render: Page5 },
    ],
    []
  )

  useEffect(() => {
    setReduced(prefersReducedMotion())
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(prefersReducedMotion())
    mq?.addEventListener?.('change', onChange)
    return () => mq?.removeEventListener?.('change', onChange)
  }, [])

  // Track active page from scroll for the dot indicator
  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.55) {
            const n = Number(entry.target.dataset.page)
            if (n) setActivePage(n)
          }
        })
      },
      { root, threshold: [0.55, 0.75] }
    )
    root.querySelectorAll('.sk-page').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // ESC to exit
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onExit?.()
      if (e.key.toLowerCase() === 'd' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setDoodleMode((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  const scrollToPage = useCallback((n) => {
    const root = containerRef.current
    if (!root) return
    const target = root.querySelector(`[data-page="${n}"]`)
    if (target) {
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    }
  }, [reduced])

  const onLiftSticky = useCallback(() => {
    setLifted(true)
    window.setTimeout(() => setLifted(false), 600)
  }, [])

  return (
    <div className={`sk-root ${reduced ? 'is-reduced' : ''} ${lifted ? 'is-lifted' : ''}`}>
      <button
        type="button"
        className="sk-exit"
        onClick={onExit}
        aria-label="Exit notebook"
      >
        <TapeStrip rotate={-3} top={-8} left={'50%'} width={70} color="#f1d27a" />
        <span className="sk-exit-text">EXIT NOTEBOOK</span>
      </button>

      <button
        type="button"
        className={`sk-doodle-toggle ${doodleMode ? 'is-on' : ''}`}
        onClick={() => setDoodleMode((v) => !v)}
        aria-pressed={doodleMode}
        title="Doodle mode (drag to draw)"
      >
        {doodleMode ? 'doodle: on' : 'doodle: off'}
      </button>

      <nav className="sk-dots" aria-label="Notebook pages">
        {PAGES.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className={`sk-dot ${activePage === i + 1 ? 'is-active' : ''}`}
            onClick={() => scrollToPage(i + 1)}
            aria-label={`Go to ${p.label}`}
            aria-current={activePage === i + 1 ? 'page' : undefined}
          >
            <span className="sk-dot-inner" />
          </button>
        ))}
      </nav>

      <div className="sk-scroll" ref={containerRef}>
        {PAGES.map(({ id, label, Render }, idx) => (
          <Page
            key={id}
            id={id}
            ariaLabel={label}
            pageNum={idx + 1}
            total={PAGES.length}
          >
            <Render onLiftSticky={onLiftSticky} />
            <DoodleCanvas active={doodleMode} reduced={reduced} />
          </Page>
        ))}
      </div>
    </div>
  )
}
