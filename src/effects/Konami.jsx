import { useEffect, useRef, useState, useCallback } from 'react'
import './konami.css'

// Konami code: ↑ ↑ ↓ ↓ ← → ← → B A
const SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
]

// Lock-out before pointer-events relaxes (ms). Keeps stray clicks from
// dismissing the overlay before the "ACCESS GRANTED" banner is even readable.
const POINTER_LOCK_MS = 1200
const AUTO_FADE_MS = 12000
const FADE_OUT_MS = 700
const BANNER_VISIBLE_MS = 2000

// Character pool: katakana (U+30A0–U+30FF) + digits + a sprinkle of latin
const KATAKANA = Array.from({ length: 96 }, (_, i) =>
  String.fromCharCode(0x30a0 + i)
)
const DIGITS = '0123456789'.split('')
const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const CHAR_POOL = [...KATAKANA, ...KATAKANA, ...DIGITS, ...LATIN]

const randomChar = () => CHAR_POOL[(Math.random() * CHAR_POOL.length) | 0]

export default function Konami() {
  const [active, setActive] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)
  const [pointerLocked, setPointerLocked] = useState(true)
  const [showBanner, setShowBanner] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const sequenceIdxRef = useRef(0)
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const columnsRef = useRef([])
  const lastFrameRef = useRef(0)
  const fadeTimerRef = useRef(null)
  const autoFadeTimerRef = useRef(null)
  const pointerLockTimerRef = useRef(null)
  const bannerTimerRef = useRef(null)
  const activeRef = useRef(false)

  // Keep a ref in sync so the keydown handler (mounted once) can check
  // current active state without re-binding.
  useEffect(() => {
    activeRef.current = active
  }, [active])

  // Detect prefers-reduced-motion once and subscribe to changes.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mql.matches)
    const onChange = (e) => setReducedMotion(e.matches)
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    }
    // Safari < 14 fallback
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  const beginFadeOut = useCallback(() => {
    if (!activeRef.current) return
    setFadingOut(true)
    clearTimeout(fadeTimerRef.current)
    fadeTimerRef.current = setTimeout(() => {
      setActive(false)
      setFadingOut(false)
      setShowBanner(false)
      setPointerLocked(true)
    }, FADE_OUT_MS)
  }, [])

  const trigger = useCallback(() => {
    if (activeRef.current) return
    setActive(true)
    setFadingOut(false)
    setShowBanner(true)
    setPointerLocked(true)

    // Dispatch achievement event so external systems can hook in
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('achievement:konami', {
            detail: { at: Date.now(), code: 'konami' },
          })
        )
      } catch {
        // Some legacy embedding contexts may block CustomEvent; ignore.
      }
    }

    clearTimeout(bannerTimerRef.current)
    bannerTimerRef.current = setTimeout(
      () => setShowBanner(false),
      BANNER_VISIBLE_MS
    )

    clearTimeout(pointerLockTimerRef.current)
    pointerLockTimerRef.current = setTimeout(
      () => setPointerLocked(false),
      POINTER_LOCK_MS
    )

    clearTimeout(autoFadeTimerRef.current)
    autoFadeTimerRef.current = setTimeout(beginFadeOut, AUTO_FADE_MS)
  }, [beginFadeOut])

  // Global keydown listener — sequence detection + Escape to dismiss.
  useEffect(() => {
    const onKeyDown = (e) => {
      // Escape dismisses an active overlay
      if (activeRef.current && e.key === 'Escape') {
        beginFadeOut()
        return
      }

      // Don't capture sequence keys while typing into a form field
      const target = e.target
      const tag =
        target && target.tagName ? target.tagName.toUpperCase() : ''
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (target && target.isContentEditable)
      ) {
        return
      }

      const expected = SEQUENCE[sequenceIdxRef.current]
      // Case-insensitive match for the B/A keys
      const key = e.key
      const match =
        expected.length === 1
          ? key.toLowerCase() === expected.toLowerCase()
          : key === expected

      if (match) {
        sequenceIdxRef.current += 1
        if (sequenceIdxRef.current >= SEQUENCE.length) {
          sequenceIdxRef.current = 0
          trigger()
        }
      } else {
        // Allow re-starting if the wrong key is itself the start of the sequence
        sequenceIdxRef.current =
          key === SEQUENCE[0] || key.toLowerCase() === SEQUENCE[0].toLowerCase()
            ? 1
            : 0
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [trigger, beginFadeOut])

  // Canvas Matrix rain — only runs when active AND motion is allowed.
  useEffect(() => {
    if (!active || reducedMotion) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const fontSize = 16
    let width = 0
    let height = 0
    let dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))

    const resize = () => {
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const cols = Math.ceil(width / fontSize)
      const next = []
      for (let i = 0; i < cols; i++) {
        const existing = columnsRef.current[i]
        next.push(
          existing || {
            y: Math.random() * -height,
            speed: 1.4 + Math.random() * 2.6, // px-rows per ~16ms
            trailDrop: 0.04 + Math.random() * 0.06,
            head: randomChar(),
          }
        )
      }
      columnsRef.current = next
      // Prime background
      ctx.fillStyle = '#0a1118'
      ctx.fillRect(0, 0, width, height)
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = (ts) => {
      const last = lastFrameRef.current || ts
      const dt = Math.min(48, ts - last) // cap dt so tab-switches don't catapult
      lastFrameRef.current = ts

      // Fade prior frame — average alpha controls trail length
      ctx.fillStyle = 'rgba(10, 17, 24, 0.08)'
      ctx.fillRect(0, 0, width, height)

      ctx.font = `${fontSize}px "VT323", "IBM Plex Mono", monospace`
      ctx.textBaseline = 'top'

      const cols = columnsRef.current
      const frameUnits = dt / 16
      for (let i = 0; i < cols.length; i++) {
        const col = cols[i]
        const x = i * fontSize
        // Tail glyph (the previous head, drawn dimmer at the prior y)
        ctx.fillStyle = '#3fa564'
        ctx.fillText(col.head, x, col.y)

        // Advance, occasionally swap glyph
        col.y += col.speed * fontSize * 0.18 * frameUnits
        if (Math.random() < 0.08) col.head = randomChar()

        // Head — brighter, white-tinted
        ctx.fillStyle = '#d8ffe6'
        ctx.fillText(col.head, x, col.y)

        // Reset column if past bottom (probabilistic for varied rhythm)
        if (col.y > height && Math.random() < col.trailDrop) {
          col.y = -fontSize * (2 + Math.random() * 10)
          col.speed = 1.4 + Math.random() * 2.6
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
      lastFrameRef.current = 0
      window.removeEventListener('resize', resize)
    }
  }, [active, reducedMotion])

  // Final cleanup on unmount: clear all timers (rAF handled by the effect above)
  useEffect(() => {
    return () => {
      clearTimeout(fadeTimerRef.current)
      clearTimeout(autoFadeTimerRef.current)
      clearTimeout(pointerLockTimerRef.current)
      clearTimeout(bannerTimerRef.current)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  if (!active) return null

  const overlayClass = [
    'km-overlay',
    fadingOut ? 'km-overlay--fading' : '',
    pointerLocked ? 'km-overlay--locked' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = () => {
    if (pointerLocked) return // ignore clicks during initial lock-out
    beginFadeOut()
  }

  return (
    <div
      className={overlayClass}
      role="presentation"
      aria-hidden="true"
      onClick={handleClick}
    >
      {!reducedMotion && <canvas ref={canvasRef} className="km-canvas" />}
      {reducedMotion && <div className="km-reduced-bg" />}
      {showBanner && (
        <div className="km-banner" role="status" aria-live="polite">
          ACCESS GRANTED
        </div>
      )}
    </div>
  )
}
