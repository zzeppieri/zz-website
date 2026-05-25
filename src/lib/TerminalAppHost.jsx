import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import './terminal-app-host.css'

/* ============================================================
   TerminalAppHost
   ----------------------------------------------------------------
   Bridge between Terminal mode (src/modes/Terminal.jsx) and the
   inline mini-apps in src/games/. Terminal commands like
   `run snake`, `run printer`, `run lego` fire a
       window.dispatchEvent(new CustomEvent('terminal:run', { detail: { app } }))
   We catch it and mount the requested game inside a full-screen
   modal overlay. ESC or backdrop click closes the modal AND
   re-dispatches `terminal:close-app` so Terminal can clean up
   its inline placeholder slot.
   ----------------------------------------------------------------
   Usage:
       import TerminalAppHost from './lib/TerminalAppHost.jsx'
       // ...then inside your root tree:
       <TerminalAppHost />
   ============================================================ */

/* ── Lazy game imports (only loaded when actually invoked) ── */
const Snake = lazy(() => import('../games/CircuitSnake.jsx'))
const Printer = lazy(() => import('../games/PrinterSim.jsx'))
const Lego = lazy(() => import('../games/LeanLego.jsx'))

const APP_REGISTRY = {
  snake:   { Component: Snake,   label: 'circuit-snake' },
  printer: { Component: Printer, label: 'printer-sim'   },
  lego:    { Component: Lego,    label: 'lean-lego'     },
}

const VALID_APPS = new Set(Object.keys(APP_REGISTRY))

export default function TerminalAppHost() {
  const [activeApp, setActiveApp] = useState(null)
  const frameRef = useRef(null)

  /* Track which apps have been requested at least once. Once loaded,
   * a game stays mounted-in-memory via React's lazy chunk cache, so
   * re-opening is instant. */
  const loadedRef = useRef(new Set())
  if (activeApp) loadedRef.current.add(activeApp)

  /* ── Close helper: resets state + tells Terminal to tear down its slot ── */
  const closeApp = useCallback(() => {
    setActiveApp((cur) => {
      if (cur) {
        try {
          window.dispatchEvent(new CustomEvent('terminal:close-app'))
        } catch {
          /* no-op */
        }
      }
      return null
    })
  }, [])

  /* ── Listen for terminal:run + terminal:close-app ── */
  useEffect(() => {
    const onRun = (e) => {
      const app = e?.detail?.app
      if (typeof app === 'string' && VALID_APPS.has(app)) {
        setActiveApp(app)
      }
    }
    /* When Terminal itself dispatches close-app (ESC inside terminal,
     * close button on the placeholder slot, etc.) we want to mirror
     * that. Do NOT re-dispatch here or we'd loop. */
    const onClose = () => setActiveApp(null)

    window.addEventListener('terminal:run', onRun)
    window.addEventListener('terminal:close-app', onClose)
    return () => {
      window.removeEventListener('terminal:run', onRun)
      window.removeEventListener('terminal:close-app', onClose)
    }
  }, [])

  /* ── ESC key closes modal ── */
  useEffect(() => {
    if (!activeApp) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeApp()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [activeApp, closeApp])

  /* ── Lock body scroll while open ── */
  useEffect(() => {
    if (!activeApp) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [activeApp])

  /* ── Focus the modal frame on open for screen-reader / kb users ── */
  useEffect(() => {
    if (activeApp && frameRef.current) {
      try { frameRef.current.focus() } catch { /* no-op */ }
    }
  }, [activeApp])

  /* ── Backdrop click closes (but clicks inside the frame don't) ── */
  const onBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) closeApp()
  }, [closeApp])

  /* Resolve the registry entry (memoized so we don't re-pick on rerender) */
  const entry = useMemo(
    () => (activeApp ? APP_REGISTRY[activeApp] : null),
    [activeApp],
  )

  if (!activeApp || !entry) return null

  const { Component, label } = entry

  return (
    <div
      className="tah-backdrop"
      role="presentation"
      onMouseDown={onBackdropClick}
    >
      <div
        className="tah-frame"
        role="dialog"
        aria-modal="true"
        aria-label={`Terminal app: ${label}`}
        tabIndex={-1}
        ref={frameRef}
      >
        <header className="tah-header">
          <span className="tah-title">
            <span className="tah-prompt">$</span>{' '}
            <span className="tah-path">/usr/local/bin/</span>
            <span className="tah-app-name">{label}</span>
          </span>
          <button
            type="button"
            className="tah-close"
            onClick={closeApp}
            aria-label="Exit app"
          >
            EXIT (esc / close)
          </button>
        </header>
        <div className="tah-body">
          <Suspense
            fallback={
              <div className="tah-fallback" role="status" aria-live="polite">
                <span className="tah-fallback-text">
                  &#9618; initializing {label}...
                </span>
              </div>
            }
          >
            <Component />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
