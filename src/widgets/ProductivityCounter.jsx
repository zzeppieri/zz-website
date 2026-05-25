import { useEffect, useRef, useState, useCallback } from 'react'
import './productivity-counter.css'

/* ─── ProductivityCounter ───────────────────────────────────────────────
 * Self-contained CRT-style live counter widget.
 *
 * Readouts:
 *   1. TOTAL HOURS SAVED  — cumulative; eases up to BASELINE on mount,
 *                          then drifts up at RATE_MS per hour.
 *   2. THIS SESSION       — hours saved while the page has been open;
 *                          starts at 0, same drift rate.
 *   3. UPTIME             — wall-clock time since mount (HH:MM:SS).
 *
 * Pauses increments when the tab is hidden (visibilityState === 'hidden').
 * No external deps. No required props. Cleans up all timers on unmount.
 * ──────────────────────────────────────────────────────────────────── */

const BASELINE = 30000          // cumulative hours saved through today
const COUNTUP_MS = 2000         // duration of the initial ease-out to BASELINE
const RATE_MS = 6500            // ms between +1 hour ticks (~13.3K/day ≈ live drift)
const TOTAL_DIGITS = 6          // pad cumulative readout to 6 digits ("030,000")
const SESSION_DIGITS = 4        // pad session readout to 4 digits ("0,000")

/* easeOutCubic — fast start, soft settle */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

/* Format integer with thousands separators, padded to `width` digits. */
function formatCount(n, width) {
  const safe = Math.max(0, Math.floor(n))
  const padded = String(safe).padStart(width, '0')
  // Insert commas every 3 from the right
  return padded.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/* Format milliseconds as HH:MM:SS (no day rollover; caps practical use). */
function formatUptime(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (v) => String(v).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/* Renders a string as a row of split-flap-style digit/separator cells. */
function DigitRow({ value, ariaLabel }) {
  const chars = value.split('')
  return (
    <div className="pc-digits" aria-label={ariaLabel} role="text">
      {chars.map((ch, i) => {
        const isDigit = /\d/.test(ch)
        return (
          <span
            key={i}
            className={`pc-cell${isDigit ? '' : ' pc-sep'}`}
            aria-hidden="true"
          >
            <span className="pc-cell-inner">{ch}</span>
          </span>
        )
      })}
    </div>
  )
}

export default function ProductivityCounter() {
  /* ── State ────────────────────────────────────────────────────────── */
  // Animated cumulative total (eases to BASELINE on mount, then drifts).
  const [total, setTotal] = useState(0)
  // Hours saved during this session (starts at 0, drifts at same rate).
  const [session, setSession] = useState(0)
  // Wall-clock ms since mount (drives uptime readout + drift calculations).
  const [elapsedMs, setElapsedMs] = useState(0)
  // LIVE indicator blink (toggles every ~900ms when visible).
  const [blink, setBlink] = useState(true)
  // Pause flag mirrored to a ref so timers can read latest value.
  const [paused, setPaused] = useState(false)

  /* ── Refs (avoid stale closures in rAF / intervals) ───────────────── */
  const mountTimeRef = useRef(performance.now())
  // Accumulated "active" ms (excludes time the tab was hidden).
  const activeMsRef = useRef(0)
  const lastTickRef = useRef(performance.now())
  const pausedRef = useRef(false)
  const introDoneRef = useRef(false)
  const rafRef = useRef(null)
  const driftIntervalRef = useRef(null)
  const blinkIntervalRef = useRef(null)

  /* Keep pausedRef in sync with paused state. */
  useEffect(() => { pausedRef.current = paused }, [paused])

  /* ── Visibility: pause on hidden tab ──────────────────────────────── */
  useEffect(() => {
    const onVis = () => {
      const hidden = document.visibilityState === 'hidden'
      setPaused(hidden)
      // On resume, reset the tick anchor so we don't credit hidden time.
      if (!hidden) lastTickRef.current = performance.now()
    }
    document.addEventListener('visibilitychange', onVis)
    // Initialize once in case we mounted in a hidden tab.
    onVis()
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  /* ── Intro count-up to BASELINE (rAF, ease-out) ───────────────────── */
  useEffect(() => {
    const start = performance.now()
    const tick = (now) => {
      if (pausedRef.current) {
        // Hold the loop alive but don't advance progress while hidden.
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      const t = Math.min(1, (now - start) / COUNTUP_MS)
      const eased = easeOutCubic(t)
      setTotal(eased * BASELINE)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        introDoneRef.current = true
        setTotal(BASELINE)
        // Anchor drift timing from the moment intro finishes.
        lastTickRef.current = performance.now()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  /* ── Drift + uptime loop ──────────────────────────────────────────────
   * Runs at 1Hz. Each tick:
   *   - Adds the *active* delta (skipped if paused) to elapsedMs.
   *   - Adds floor(active/RATE_MS) hours to total + session.
   * Using a single interval (vs setInterval per readout) keeps them in
   * lockstep and is cheap on the event loop.
   * ─────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    // Carry remainder ms so we don't lose fractional ticks between calls.
    let driftRemainder = 0

    driftIntervalRef.current = setInterval(() => {
      if (pausedRef.current) {
        // Don't accrue while hidden; just re-anchor on resume.
        lastTickRef.current = performance.now()
        return
      }
      const now = performance.now()
      const delta = now - lastTickRef.current
      lastTickRef.current = now
      activeMsRef.current += delta
      setElapsedMs(activeMsRef.current)

      // Only drift the total after the intro count-up settles.
      if (!introDoneRef.current) return

      driftRemainder += delta
      if (driftRemainder >= RATE_MS) {
        const hoursToAdd = Math.floor(driftRemainder / RATE_MS)
        driftRemainder -= hoursToAdd * RATE_MS
        setTotal((t) => t + hoursToAdd)
        setSession((s) => s + hoursToAdd)
      }
    }, 1000)

    return () => clearInterval(driftIntervalRef.current)
  }, [])

  /* ── LIVE blink (paused when hidden) ──────────────────────────────── */
  useEffect(() => {
    blinkIntervalRef.current = setInterval(() => {
      if (pausedRef.current) return
      setBlink((b) => !b)
    }, 900)
    return () => clearInterval(blinkIntervalRef.current)
  }, [])

  /* ── Final cleanup safety net ─────────────────────────────────────── */
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      clearInterval(driftIntervalRef.current)
      clearInterval(blinkIntervalRef.current)
    }
  }, [])

  /* ── Status text for the live header ──────────────────────────────── */
  const statusText = paused ? 'PAUSED' : 'LIVE'

  return (
    <div className={`pc-panel${paused ? ' pc-paused' : ''}`} role="region" aria-label="Productivity counter">
      {/* CRT overlay layers */}
      <div className="pc-scanlines" aria-hidden="true" />
      <div className="pc-vignette" aria-hidden="true" />

      {/* Header bar: LIVE indicator + signal label */}
      <div className="pc-header">
        <div className="pc-live">
          <span className={`pc-live-dot${blink && !paused ? ' on' : ''}`} aria-hidden="true" />
          <span className="pc-live-text">{statusText}</span>
        </div>
        <div className="pc-signal" aria-hidden="true">
          <span /> <span /> <span /> <span />
        </div>
        <div className="pc-channel">CH-01 · LEAN OPS</div>
      </div>

      {/* Three readouts */}
      <div className="pc-readouts">
        <div className="pc-readout pc-readout--primary">
          <DigitRow
            value={formatCount(total, TOTAL_DIGITS)}
            ariaLabel={`Total hours saved: ${formatCount(total, TOTAL_DIGITS)}`}
          />
          <div className="pc-label">Total Hours Saved · Cumulative</div>
        </div>

        <div className="pc-readout">
          <DigitRow
            value={formatCount(session, SESSION_DIGITS)}
            ariaLabel={`This session: ${formatCount(session, SESSION_DIGITS)} hours`}
          />
          <div className="pc-label">Saved · This Visit</div>
        </div>

        <div className="pc-readout">
          <DigitRow
            value={formatUptime(elapsedMs)}
            ariaLabel={`Session uptime ${formatUptime(elapsedMs)}`}
          />
          <div className="pc-label">Session Uptime</div>
        </div>
      </div>

      {/* Footer ticker */}
      <div className="pc-footer" aria-hidden="true">
        <span className="pc-footer-tag">REC</span>
        <span className="pc-footer-bar" />
        <span className="pc-footer-meta">RATE · +1 hr / {Math.round(RATE_MS / 1000)}s</span>
      </div>
    </div>
  )
}
