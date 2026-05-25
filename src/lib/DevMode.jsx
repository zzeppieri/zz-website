import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import './devmode.css'

/* ───────────────────────────────────────────────────────────────────────
 * DevMode subsystem
 * ----------------------------------------------------------------------
 * Hidden activator: 5 rapid clicks/taps on `.corner-tag-name` (within 2s)
 * opens a password overlay. Password `zach2026` (SHA-256 hash baked in).
 * Once authed, <DevEditable id="..."> elements become contentEditable;
 * edits are persisted to localStorage under `dev_overrides`.
 * ───────────────────────────────────────────────────────────────────── */

// SHA-256 of "zach2026". Precomputed via Node's webcrypto.subtle.digest.
const PASSWORD_HASH =
  '48636fae7bf2aa5b3ba0ab336d9da36252fe8c1358a1d5816614d8245cdc51d1'

const LS_AUTHED = 'dev_authed'
const LS_OVERRIDES = 'dev_overrides'

const ACTIVATOR_SELECTOR = '.corner-tag-name'
const ACTIVATOR_CLICKS = 5
const ACTIVATOR_WINDOW_MS = 2000

/* ─── helpers ─── */

async function sha256Hex(input) {
  const buf = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  const bytes = new Uint8Array(digest)
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0')
  }
  return out
}

function safeReadOverrides() {
  try {
    const raw = localStorage.getItem(LS_OVERRIDES)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function safeWriteOverrides(obj) {
  try {
    localStorage.setItem(LS_OVERRIDES, JSON.stringify(obj))
  } catch {
    /* quota or disabled storage — silently ignore */
  }
}

/* ─── Context ─── */

const DevModeCtx = createContext(null)

export function useDevMode() {
  const ctx = useContext(DevModeCtx)
  if (!ctx) {
    // Allow components to call this even when no provider mounted (e.g.
    // during tests) — return a no-op shape rather than throwing.
    return {
      enabled: false,
      login: async () => false,
      logout: () => {},
      setOverride: () => {},
      overrides: {},
      exportChanges: () => {},
      clearChanges: () => {},
    }
  }
  return ctx
}

/* ─── Provider ─── */

export function DevModeProvider({ children }) {
  const [enabled, setEnabled] = useState(false)
  const [overrides, setOverrides] = useState({})
  const [prompting, setPrompting] = useState(false)
  const [toast, setToast] = useState(null)

  // Restore state on mount.
  useEffect(() => {
    try {
      if (localStorage.getItem(LS_AUTHED) === 'true') {
        setEnabled(true)
      }
    } catch {
      /* ignore */
    }
    setOverrides(safeReadOverrides())
  }, [])

  /* ─── Override management ─── */

  const setOverride = useCallback((id, html) => {
    setOverrides((prev) => {
      const next = { ...prev }
      if (html === null || html === undefined) {
        delete next[id]
      } else {
        next[id] = html
      }
      safeWriteOverrides(next)
      return next
    })
  }, [])

  const clearChanges = useCallback(() => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm(
        'Clear ALL local content overrides? This cannot be undone.'
      )
      if (!ok) return
    }
    safeWriteOverrides({})
    setOverrides({})
    setToast({ kind: 'ok', msg: 'All overrides cleared.' })
  }, [])

  const exportChanges = useCallback(() => {
    try {
      const data = JSON.stringify(overrides, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'dev_overrides.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      // Revoke on next tick so the click has a chance to start the download.
      setTimeout(() => URL.revokeObjectURL(url), 0)
      setToast({ kind: 'ok', msg: 'Exported dev_overrides.json' })
    } catch {
      setToast({ kind: 'err', msg: 'Export failed' })
    }
  }, [overrides])

  /* ─── Auth ─── */

  const login = useCallback(async (password) => {
    try {
      const hex = await sha256Hex(password ?? '')
      if (hex === PASSWORD_HASH) {
        try {
          localStorage.setItem(LS_AUTHED, 'true')
        } catch {
          /* ignore */
        }
        setEnabled(true)
        setPrompting(false)
        setToast({ kind: 'ok', msg: 'DEV MODE ENGAGED' })
        return true
      }
    } catch {
      /* ignore */
    }
    return false
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(LS_AUTHED)
    } catch {
      /* ignore */
    }
    setEnabled(false)
    setToast({ kind: 'ok', msg: 'Dev mode disengaged' })
  }, [])

  /* ─── Toast auto-dismiss ─── */

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  /* ─── Hidden activator: 5 rapid clicks on .corner-tag-name ─── */

  useEffect(() => {
    if (enabled) return undefined // already in dev mode — no need to listen

    let clicks = []

    const onTap = (e) => {
      const target = e.target
      if (!target || !(target instanceof Element)) return
      const hit = target.closest(ACTIVATOR_SELECTOR)
      if (!hit) return
      const now = Date.now()
      clicks = clicks.filter((t) => now - t < ACTIVATOR_WINDOW_MS)
      clicks.push(now)
      if (clicks.length >= ACTIVATOR_CLICKS) {
        clicks = []
        setPrompting(true)
      }
    }

    // `click` covers mouse + most synthetic taps; pointerup gives faster
    // touch response on iOS where click is delayed.
    document.addEventListener('click', onTap, true)
    document.addEventListener('pointerup', onTap, true)

    return () => {
      document.removeEventListener('click', onTap, true)
      document.removeEventListener('pointerup', onTap, true)
    }
  }, [enabled])

  const value = useMemo(
    () => ({
      enabled,
      login,
      logout,
      setOverride,
      overrides,
      exportChanges,
      clearChanges,
    }),
    [
      enabled,
      login,
      logout,
      setOverride,
      overrides,
      exportChanges,
      clearChanges,
    ]
  )

  return (
    <DevModeCtx.Provider value={value}>
      {children}
      {prompting && (
        <PasswordOverlay
          onSubmit={login}
          onCancel={() => setPrompting(false)}
        />
      )}
      {toast && <Toast kind={toast.kind} msg={toast.msg} />}
    </DevModeCtx.Provider>
  )
}

/* ─── Password overlay ─── */

function PasswordOverlay({ onSubmit, onCancel }) {
  const [value, setValue] = useState('')
  const [denied, setDenied] = useState(false)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    // Focus on mount, after the fade-in starts.
    const t = setTimeout(() => {
      inputRef.current?.focus()
    }, 60)
    return () => clearTimeout(t)
  }, [])

  // Escape key cancels.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    const ok = await onSubmit(value)
    if (!ok) {
      setDenied(true)
      setValue('')
      // Reset the shake so it can replay on the next bad attempt.
      setTimeout(() => setDenied(false), 600)
      inputRef.current?.focus()
    }
    setBusy(false)
  }

  return (
    <div className="dm-overlay" role="dialog" aria-modal="true" aria-label="Developer mode authentication">
      <div className="dm-overlay-bg" onClick={onCancel} />
      <form className="dm-auth" onSubmit={handleSubmit}>
        <div className="dm-auth-header">
          <span className="dm-auth-prompt">[ZEPPIERI INDUSTRIES TERMLINK — AUTH]</span>
          <span className="dm-auth-cursor">_</span>
        </div>
        <label className="dm-auth-label" htmlFor="dm-pw">&gt; ENTER ACCESS KEY:</label>
        <input
          id="dm-pw"
          ref={inputRef}
          type="password"
          className={`dm-auth-input${denied ? ' dm-shake dm-denied' : ''}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {denied && (
          <div className="dm-auth-deny" role="alert">
            ◆ ACCESS DENIED ◆
          </div>
        )}
        <div className="dm-auth-actions">
          <button type="submit" className="dm-btn dm-btn-primary" disabled={busy}>
            {busy ? '...AUTHENTICATING' : 'ENTER'}
          </button>
          <button type="button" className="dm-link" onClick={onCancel}>
            cancel
          </button>
        </div>
      </form>
    </div>
  )
}

/* ─── Toast ─── */

function Toast({ kind, msg }) {
  return (
    <div className={`dm-toast dm-toast-${kind}`} role="status">
      {msg}
    </div>
  )
}

/* ─── DevEditable ─── */

export function DevEditable({ id, as: Tag = 'span', children, className, ...rest }) {
  const { enabled, overrides, setOverride } = useDevMode()
  const ref = useRef(null)
  const override = overrides[id]
  const hasOverride = typeof override === 'string'

  // Push override HTML into the node imperatively when dev mode is on.
  // (We can't combine `dangerouslySetInnerHTML` with `children`, and we
  // want stock React rendering when no override exists.)
  useEffect(() => {
    if (!ref.current) return
    if (enabled && hasOverride) {
      if (ref.current.innerHTML !== override) {
        ref.current.innerHTML = override
      }
    }
  }, [enabled, hasOverride, override])

  if (!id) {
    // Misuse guard — still render children so the page is never broken.
    return <Tag className={className} {...rest}>{children}</Tag>
  }

  // Read-only path (most visitors): show override if present, else children.
  if (!enabled) {
    if (hasOverride) {
      return (
        <Tag
          className={className}
          dangerouslySetInnerHTML={{ __html: override }}
          {...rest}
        />
      )
    }
    return <Tag className={className} {...rest}>{children}</Tag>
  }

  // Editable path.
  const onBlur = (e) => {
    const html = e.currentTarget.innerHTML
    setOverride(id, html)
  }

  // Block Enter from inserting <div>/<br> chaos in inline elements like span.
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && Tag !== 'div' && Tag !== 'p') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  const editableProps = {
    ref,
    className: `${className || ''} dm-editable`.trim(),
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: true,
    'data-dm-id': id,
    onBlur,
    onKeyDown,
    ...rest,
  }

  if (hasOverride) {
    // Imperative effect above will sync the override into the node.
    return <Tag {...editableProps} />
  }
  return <Tag {...editableProps}>{children}</Tag>
}

/* ─── HUD ─── */

export function DevModeHUD() {
  const { enabled, exportChanges, clearChanges, logout, overrides } = useDevMode()
  const [collapsed, setCollapsed] = useState(false)
  if (!enabled) return null

  const count = Object.keys(overrides).length

  return (
    <div className={`dm-hud${collapsed ? ' dm-hud-collapsed' : ''}`}>
      <div className="dm-hud-header">
        <span className="dm-hud-dot" aria-hidden="true" />
        <span className="dm-hud-title">DEV MODE — EDITING</span>
        <button
          type="button"
          className="dm-hud-collapse"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand dev panel' : 'Collapse dev panel'}
        >
          {collapsed ? '+' : '–'}
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="dm-hud-meta">
            {count === 0
              ? 'No overrides yet — click any [editable] text.'
              : `${count} override${count === 1 ? '' : 's'} active`}
          </div>
          <div className="dm-hud-actions">
            <button type="button" className="dm-btn" onClick={exportChanges}>
              Export Changes
            </button>
            <button type="button" className="dm-btn dm-btn-warn" onClick={clearChanges}>
              Clear All
            </button>
            <button type="button" className="dm-btn dm-btn-ghost" onClick={logout}>
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default DevModeProvider
