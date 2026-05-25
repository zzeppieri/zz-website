import { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from 'react'
import './career-timeline.css'

/* ─── Data: Zach's career stops (chronological) ───────────────────────────── */
const STOPS = [
  {
    id: 'hire-2022',
    when: 'JUN 2022',
    year: 2022,
    type: 'milestone',
    icon: '◆',
    title: 'Hired @ Chromalloy',
    blurb: 'Associate Continuous Improvement Analyst — aerospace MRO operations.',
    details: [
      'Onboarded into Lean / TPS methodology under CI leadership',
      'Blade Cell CapEx package approved (Nov 2022)',
      'Started Six Sigma Green Belt coursework',
    ],
  },
  {
    id: 'promo-2023',
    when: '2023',
    year: 2023,
    type: 'promo',
    icon: '▲',
    title: 'Promoted: CI Analyst',
    blurb: 'First promotion. Led Blade Cell deployment from CapEx to floor.',
    details: [
      'Blade Cell deployment — $2.4M scope, team of 20',
      'Earned Six Sigma Green Belt',
      'Lean Leadership Week (CAZ + CHOL sites)',
    ],
  },
  {
    id: 'training-2023',
    when: '2023',
    year: 2023,
    type: 'training',
    icon: '✶',
    title: 'Six Sigma Green Belt',
    blurb: 'Certified. Lean Leadership Week at CAZ + CHOL sites.',
    details: [
      'DMAIC project on critical-to-quality flow constraints',
      'Cross-site Lean immersion across two Chromalloy facilities',
    ],
  },
  {
    id: 'savings-2024',
    when: '2024',
    year: 2024,
    type: 'project',
    icon: '$',
    title: '6,000 hrs Savings',
    blurb: '17 Kaizen events. 5S program scored 15 → 85 points.',
    details: [
      '6,000 hours of productivity savings delivered',
      '17 Kaizen events facilitated',
      '5S program lifted from 15 → 85 audit points',
      'Blade Cell Gate 1 TAT: 14d → 4.75d (66% reduction)',
    ],
  },
  {
    id: 'patent-2024',
    when: 'JUL 2024',
    year: 2024,
    type: 'milestone',
    icon: '⊕',
    title: 'Patent Filed',
    blurb: 'Baffle Extraction Tool — Jul–Sep 2024 prosecution.',
    details: [
      'Co-inventor on Baffle Extraction Tool patent application',
      'Filed Jul 2024, full prosecution by Sep 2024',
      'Tool solves recurring teardown bottleneck in turbine repair',
    ],
  },
  {
    id: 'promo-2025',
    when: '2025',
    year: 2025,
    type: 'promo',
    icon: '▲',
    title: 'Promoted: Sr CI Analyst',
    blurb: '130% of savings target. First direct report.',
    details: [
      '23,500 hours of productivity savings (130% of target)',
      '12 Kaizen events — 5 external (BLC, CNV, CSD, CAZ)',
      'Built Lunch-and-Learn program: 77+ trained',
      'First direct report (intern → full-time hire)',
    ],
  },
  {
    id: 'tulip-2026',
    when: 'FEB 2026',
    year: 2026,
    type: 'project',
    icon: '⌨',
    title: 'PM — Tulip MES',
    blurb: 'Windsor CT deployment. PwC partner. Pilot May, go-live Sept.',
    details: [
      'Project Manager for Tulip MES rollout at Windsor CT site',
      'PwC as implementation partner',
      'Pilot launch May 2026 • Full go-live September 2026',
      'AI-augmented PM toolchain: Claude PM framework, prompt-engineered visualizer, Smartsheet MCP',
    ],
  },
  {
    id: 'future-2026',
    when: 'Q4 2026',
    year: 2026.9,
    type: 'future',
    icon: '◇',
    title: 'CI Practitioner Leadership',
    blurb: 'Expecting to manage 1–2 CI Practitioners.',
    details: [
      'Building team structure for CI Practitioner roles',
      'Mentor pipeline through Lunch-and-Learn graduates',
    ],
  },
]

/* ─── Layout constants ─────────────────────────────────────────────────────── */
const STOP_SPACING_DESKTOP = 280 // px between stops on desktop
const SIDE_PAD              = 80  // matches CSS .tl-track horizontal padding
const MOBILE_BREAKPOINT     = 700 // container width threshold for mobile layout

/* Hook: track CONTAINER width (not viewport) via ResizeObserver.
   Falls back to window.innerWidth if RO is unavailable.                       */
function useContainerWidth(ref) {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  )

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    // initial measure
    setWidth(el.getBoundingClientRect().width || window.innerWidth)

    if (typeof ResizeObserver === 'undefined') {
      const onResize = () => setWidth(el.getBoundingClientRect().width)
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect?.width
        if (w && w > 0) setWidth(w)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])

  return width
}

/* Hook: detect touch-primary devices (no hover, coarse pointer).
   Used to skip drag-pan handlers that fight native touch scrolling.           */
function useIsTouch() {
  const [touch, setTouch] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)')
    const update = () => setTouch(mq.matches)
    update()
    if (mq.addEventListener) mq.addEventListener('change', update)
    else mq.addListener(update)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', update)
      else mq.removeListener(update)
    }
  }, [])
  return touch
}

export default function CareerTimeline() {
  const rootRef     = useRef(null)
  const viewportRef = useRef(null)
  const stopRefs    = useRef({})

  const containerWidth = useContainerWidth(rootRef)
  const isMobile       = containerWidth < MOBILE_BREAKPOINT
  const isTouch        = useIsTouch()

  const [activeId, setActiveId] = useState(null)
  const [progress, setProgress] = useState(0)

  /* compute positions + axis ticks */
  const { trackWidth, positioned, axisTicks } = useMemo(() => {
    const positioned = STOPS.map((s, i) => ({
      ...s,
      x: SIDE_PAD + i * STOP_SPACING_DESKTOP,
      side: i % 2 === 0 ? 'up' : 'down',
    }))
    const trackWidth = SIDE_PAD * 2 + (STOPS.length - 1) * STOP_SPACING_DESKTOP
    // axis ticks at year boundaries — pick first stop of each year
    const seenYears = new Set()
    const axisTicks = []
    positioned.forEach((p) => {
      const yKey = Math.floor(p.year)
      if (!seenYears.has(yKey)) {
        seenYears.add(yKey)
        axisTicks.push({ label: yKey >= 2027 ? 'BEYOND' : String(yKey), x: p.x })
      }
    })
    // append a final Q4'26 tick if a future stop exists
    const future = positioned.find((p) => p.type === 'future')
    if (future) axisTicks.push({ label: future.when, x: future.x })
    return { trackWidth, positioned, axisTicks }
  }, [])

  const activeIdx  = positioned.findIndex((s) => s.id === activeId)
  const activeStop = activeIdx >= 0 ? positioned[activeIdx] : null

  /* ── Scrolling helpers ─────────────────────────────────────────────────── */
  const scrollToStop = useCallback(
    (id, opts = {}) => {
      const node = stopRefs.current[id]
      const vp = viewportRef.current
      if (!node || !vp) return
      const behavior = opts.instant ? 'auto' : 'smooth'
      if (isMobile) {
        const target = node.offsetTop + node.offsetHeight / 2 - vp.clientHeight / 2
        vp.scrollTo({ top: Math.max(0, target), behavior })
      } else {
        const target = node.offsetLeft + node.offsetWidth / 2 - vp.clientWidth / 2
        vp.scrollTo({ left: Math.max(0, target), behavior })
      }
    },
    [isMobile]
  )

  const moveBy = useCallback(
    (delta) => {
      const currentIdx =
        activeIdx >= 0
          ? activeIdx
          : nearestStopIdx(viewportRef.current, stopRefs.current, positioned, isMobile)
      const nextIdx = Math.max(0, Math.min(positioned.length - 1, currentIdx + delta))
      const nextId = positioned[nextIdx].id
      setActiveId((prev) => (prev === nextId ? prev : nextId))
      scrollToStop(nextId)
    },
    [activeIdx, positioned, scrollToStop, isMobile]
  )

  /* ── Progress + nearest-stop tracking on scroll ────────────────────────── */
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    let ticking = false
    const update = () => {
      ticking = false
      if (isMobile) {
        const total = vp.scrollHeight - vp.clientHeight
        setProgress(total > 0 ? vp.scrollTop / total : 0)
      } else {
        const total = vp.scrollWidth - vp.clientWidth
        setProgress(total > 0 ? vp.scrollLeft / total : 0)
      }
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    vp.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => vp.removeEventListener('scroll', onScroll)
  }, [isMobile])

  /* ── Mouse-wheel horizontal scroll (desktop, non-touch only) ───────────── */
  useEffect(() => {
    if (isMobile || isTouch) return
    const vp = viewportRef.current
    if (!vp) return
    const onWheel = (e) => {
      // translate vertical wheel into horizontal scroll, but only if there's
      // actual horizontal overflow — otherwise let the page scroll naturally
      const canScrollX = vp.scrollWidth > vp.clientWidth + 1
      if (!canScrollX) return
      if (e.deltaY === 0 && e.deltaX !== 0) return
      e.preventDefault()
      vp.scrollLeft += e.deltaY + e.deltaX
    }
    vp.addEventListener('wheel', onWheel, { passive: false })
    return () => vp.removeEventListener('wheel', onWheel)
  }, [isMobile, isTouch])

  /* ── Drag-to-pan (desktop pointer, non-touch only) ─────────────────────── */
  useEffect(() => {
    if (isMobile || isTouch) return
    const vp = viewportRef.current
    if (!vp) return
    let isDown = false
    let startX = 0
    let startScroll = 0
    let moved = false
    const onDown = (e) => {
      if (e.button !== 0) return
      isDown = true
      moved = false
      startX = e.pageX
      startScroll = vp.scrollLeft
      vp.classList.add('is-grabbing')
    }
    const onMove = (e) => {
      if (!isDown) return
      const dx = e.pageX - startX
      if (Math.abs(dx) > 4) moved = true
      vp.scrollLeft = startScroll - dx
    }
    const onUp = () => {
      if (!isDown) return
      isDown = false
      vp.classList.remove('is-grabbing')
      if (moved) {
        const swallow = (ev) => {
          ev.stopPropagation()
          ev.preventDefault()
        }
        vp.addEventListener('click', swallow, { capture: true, once: true })
      }
    }
    vp.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      vp.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isMobile, isTouch])

  /* ── Keyboard nav ─────────────────────────────────────────────────────── */
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        moveBy(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        moveBy(-1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        setActiveId(positioned[0].id)
        scrollToStop(positioned[0].id)
      } else if (e.key === 'End') {
        e.preventDefault()
        const last = positioned[positioned.length - 1]
        setActiveId(last.id)
        scrollToStop(last.id)
      } else if (e.key === 'Escape') {
        setActiveId(null)
      }
    },
    [moveBy, positioned, scrollToStop]
  )

  /* ── Stop click → toggle expanded ──────────────────────────────────────── */
  const handleStopClick = useCallback(
    (id) => {
      setActiveId((prev) => (prev === id ? null : id))
      scrollToStop(id)
    },
    [scrollToStop]
  )

  /* ── Layout switch: reset scroll on orientation/breakpoint change ──────── */
  useEffect(() => {
    const vp = viewportRef.current
    if (vp) vp.scrollTo({ left: 0, top: 0, behavior: 'auto' })
  }, [isMobile])

  /* ── Close detail panel on outside click (modal behavior) ──────────────── */
  useEffect(() => {
    if (!activeId) return
    const onDocClick = (e) => {
      const root = rootRef.current
      if (!root) return
      // close if click is outside the detail panel AND outside any stop button
      const panel  = root.querySelector('.tl-detail-panel')
      const onStop = e.target.closest && e.target.closest('.tl-stop')
      const onPnl  = panel && panel.contains(e.target)
      if (!onStop && !onPnl) setActiveId(null)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [activeId])

  return (
    <div
      ref={rootRef}
      className={'tl-root' + (isMobile ? ' is-mobile' : ' is-desktop')}
      role="region"
      aria-label="Career timeline — Zachary Zeppieri"
      onKeyDown={onKeyDown}
    >
      <div className="tl-header">
        <span className="tl-header-title">› career.timeline</span>
        <span className="tl-header-meta">
          {isMobile ? 'swipe / tap' : 'scroll • drag • ←/→ • enter'}
        </span>
      </div>

      <div ref={viewportRef} className="tl-viewport" tabIndex={0}>
        <div
          className="tl-track"
          style={!isMobile ? { width: trackWidth } : undefined}
        >
          <div className="tl-rail" aria-hidden="true" />

          {!isMobile &&
            axisTicks.map((t) => (
              <span
                key={t.label + t.x}
                className="tl-axis-tick"
                style={{ left: t.x }}
              >
                {t.label}
              </span>
            ))}

          {positioned.map((s, i) => (
            <button
              key={s.id}
              ref={(el) => {
                if (el) stopRefs.current[s.id] = el
              }}
              type="button"
              className={
                'tl-stop' + (activeId === s.id ? ' is-active' : '')
              }
              data-type={s.type}
              data-side={s.side}
              style={!isMobile ? { left: s.x } : undefined}
              onClick={() => handleStopClick(s.id)}
              aria-expanded={activeId === s.id}
              aria-label={`${s.when}: ${s.title}`}
            >
              <span className="tl-connector" aria-hidden="true" />
              <span className="tl-node" aria-hidden="true" />
              <span className="tl-card">
                <span className="tl-card-when">
                  <span className="tl-card-icon" aria-hidden="true">{s.icon}</span>
                  <span className="tl-card-when-text">{s.when}</span>
                </span>
                <span className="tl-card-title">{s.title}</span>
                <span className="tl-card-blurb">{s.blurb}</span>
              </span>
              {/* sr-only ordinal */}
              <span className="tl-sr-only">
                Stop {i + 1} of {positioned.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal-style detail panel — overlays inside the widget, never clips */}
      {activeStop && (
        <div
          className="tl-detail-panel"
          data-type={activeStop.type}
          role="dialog"
          aria-label={`Details: ${activeStop.title}`}
        >
          <div className="tl-detail-head">
            <span className="tl-detail-when">
              <span className="tl-detail-icon" aria-hidden="true">{activeStop.icon}</span>
              {activeStop.when}
            </span>
            <span className={'tl-pill tl-pill-' + activeStop.type}>
              {pillLabel(activeStop.type)}
            </span>
            <button
              type="button"
              className="tl-detail-close"
              onClick={() => setActiveId(null)}
              aria-label="Close details"
            >
              ✕
            </button>
          </div>
          <h3 className="tl-detail-title">{activeStop.title}</h3>
          <p className="tl-detail-blurb">{activeStop.blurb}</p>
          <ul className="tl-detail-list">
            {activeStop.details.map((d, di) => (
              <li key={di}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="tl-controls">
        <button
          type="button"
          className="tl-btn"
          onClick={() => moveBy(-1)}
          aria-label="Previous stop"
        >
          ← Prev
        </button>
        <div className="tl-progress" aria-hidden="true">
          <div
            className="tl-progress-fill"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
        <span className="tl-counter" aria-live="polite">
          <strong>{activeIdx >= 0 ? activeIdx + 1 : '–'}</strong> / {positioned.length}
        </span>
        <button
          type="button"
          className="tl-btn"
          onClick={() => moveBy(1)}
          aria-label="Next stop"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

/* ─── helpers ───────────────────────────────────────────────────────────── */

function pillLabel(type) {
  switch (type) {
    case 'promo':     return 'PROMOTION'
    case 'project':   return 'PROJECT'
    case 'training':  return 'TRAINING'
    case 'milestone': return 'MILESTONE'
    case 'future':    return 'UPCOMING'
    default:          return type.toUpperCase()
  }
}

function nearestStopIdx(vp, refs, stops, isMobile) {
  if (!vp) return 0
  const center = isMobile
    ? vp.scrollTop + vp.clientHeight / 2
    : vp.scrollLeft + vp.clientWidth / 2
  let bestIdx = 0
  let bestDist = Infinity
  stops.forEach((s, i) => {
    const el = refs[s.id]
    if (!el) return
    const pos = isMobile
      ? el.offsetTop + el.offsetHeight / 2
      : el.offsetLeft + el.offsetWidth / 2
    const d = Math.abs(pos - center)
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  })
  return bestIdx
}
