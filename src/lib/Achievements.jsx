import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import './achievements.css'

/* ─── CATALOG ─────────────────────────────────────────────────────── */
const ACHIEVEMENTS = [
  { id: 'first_visit',      name: 'First Contact',      desc: 'Welcome to the terminal.',        icon: '👋',  secret: false },
  { id: 'explored_all',     name: 'Curator',            desc: 'Visited every section.',          icon: '🗺️', secret: false },
  { id: 'snake_played',     name: 'Sysadmin',           desc: 'Played the Circuit Snake.',       icon: '🐍',  secret: false },
  { id: 'snake_score_100',  name: 'Electron Harvester', desc: 'Scored 100+ in Snake.',           icon: '⚡',  secret: false },
  { id: 'printer_complete', name: 'Layer by Layer',     desc: 'Completed a 3D print.',           icon: '🖨️', secret: false },
  { id: 'card_flipped',     name: 'Read the Back',      desc: 'Flipped the Pokemon-style card.', icon: '🎴',  secret: false },
  { id: 'konami',           name: 'There is no spoon.', desc: '↑↑↓↓←→←→BA',                      icon: '🟩',  secret: true  },
  { id: 'dev_mode',         name: 'sudo journalctl -f', desc: 'Found the dev login.',            icon: '🔐',  secret: true  },
  { id: 'kaizen_master',    name: 'Kaizen Master',      desc: 'Hovered every bubble.',           icon: '🧠',  secret: false },
  { id: 'patience',         name: 'Patience',           desc: 'Idled for 60 seconds.',           icon: '⏳',  secret: true  },
]

const STORAGE_KEY = 'achievements_unlocked'
const UNLOCK_EVENT = 'achievement:unlocked'
const SECTION_EVENT = 'achievement:section-visited'
const TOTAL_SECTIONS = 7

/* ─── CONTEXT ─────────────────────────────────────────────────────── */
const AchievementsContext = createContext(null)

export function useAchievements() {
  const ctx = useContext(AchievementsContext)
  if (!ctx) {
    // Safe fallback so consumers don't crash if used outside provider.
    return {
      unlocked: [],
      unlock: () => {},
      isUnlocked: () => false,
      allAchievements: ACHIEVEMENTS,
    }
  }
  return ctx
}

/* ─── SOUND (Web Audio, no files) ─────────────────────────────────── */
function playUnlockChime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const now = ctx.currentTime
    const notes = [660, 880, 1320] // A5 / A6 / E7-ish arpeggio
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, now + i * 0.07)
      gain.gain.setValueAtTime(0.0001, now + i * 0.07)
      gain.gain.exponentialRampToValueAtTime(0.06, now + i * 0.07 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.18)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + i * 0.07)
      osc.stop(now + i * 0.07 + 0.2)
    })
    setTimeout(() => ctx.close().catch(() => {}), 800)
  } catch (_) {
    /* no-op */
  }
}

/* ─── PROVIDER ────────────────────────────────────────────────────── */
export function AchievementsProvider({ children }) {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  // Use a ref to read latest value inside async callbacks without re-binding.
  const unlockedRef = useRef(unlocked)
  useEffect(() => {
    unlockedRef.current = unlocked
  }, [unlocked])

  const isUnlocked = useCallback((id) => unlockedRef.current.includes(id), [])

  const unlock = useCallback((id) => {
    if (!ACHIEVEMENTS.find((a) => a.id === id)) return
    if (unlockedRef.current.includes(id)) return
    const next = [...unlockedRef.current, id]
    unlockedRef.current = next
    setUnlocked(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* quota / private mode — ignore */
    }
    const def = ACHIEVEMENTS.find((a) => a.id === id)
    window.dispatchEvent(
      new CustomEvent(UNLOCK_EVENT, { detail: def })
    )
    playUnlockChime()
  }, [])

  /* Auto-trackers ─────────────────────────────────────────────────── */
  useEffect(() => {
    // first_visit — fire after mount
    const t = setTimeout(() => unlock('first_visit'), 300)
    return () => clearTimeout(t)
  }, [unlock])

  useEffect(() => {
    // patience — 60s idle on page
    if (unlockedRef.current.includes('patience')) return
    const t = setTimeout(() => unlock('patience'), 60000)
    return () => clearTimeout(t)
  }, [unlock])

  useEffect(() => {
    // explored_all — listen for section visits
    const visited = new Set()
    const handler = (e) => {
      const id = e?.detail?.id
      if (!id) return
      visited.add(id)
      if (visited.size >= TOTAL_SECTIONS) {
        unlock('explored_all')
      }
    }
    window.addEventListener(SECTION_EVENT, handler)
    return () => window.removeEventListener(SECTION_EVENT, handler)
  }, [unlock])

  const value = useMemo(
    () => ({
      unlocked,
      unlock,
      isUnlocked,
      allAchievements: ACHIEVEMENTS,
    }),
    [unlocked, unlock, isUnlocked]
  )

  return (
    <AchievementsContext.Provider value={value}>
      {children}
      <AchievementToast />
    </AchievementsContext.Provider>
  )
}

/* ─── HUD (top-right badge + expanding panel) ─────────────────────── */
export function AchievementsHUD() {
  const { unlocked, allAchievements } = useAchievements()
  const [open, setOpen] = useState(false)

  const total = allAchievements.length
  const count = unlocked.length

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className={`ach-hud ${open ? 'ach-hud--open' : ''}`}>
      <button
        type="button"
        className="ach-hud-badge"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Achievements: ${count} of ${total} unlocked`}
      >
        <span className="ach-hud-badge-icon">★</span>
        <span className="ach-hud-badge-count">
          {count}<span className="ach-hud-badge-slash">/</span>{total}
        </span>
      </button>

      {open && (
        <div className="ach-hud-panel" role="dialog" aria-label="Achievements list">
          <div className="ach-hud-panel-head">
            <span className="ach-hud-panel-title">// achievements.log</span>
            <button
              type="button"
              className="ach-hud-panel-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <ul className="ach-hud-list">
            {allAchievements.map((a) => {
              const got = unlocked.includes(a.id)
              const hidden = a.secret && !got
              return (
                <li
                  key={a.id}
                  className={`ach-hud-item ${got ? 'ach-hud-item--got' : ''} ${hidden ? 'ach-hud-item--hidden' : ''}`}
                >
                  <span className="ach-hud-item-icon">
                    {hidden ? '❓' : a.icon}
                  </span>
                  <span className="ach-hud-item-body">
                    <span className="ach-hud-item-name">
                      {hidden ? '???' : a.name}
                    </span>
                    <span className="ach-hud-item-desc">
                      {hidden ? 'Locked — keep exploring.' : a.desc}
                    </span>
                  </span>
                  <span className="ach-hud-item-mark">
                    {got ? '✓' : '·'}
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="ach-hud-panel-foot">
            {count} / {total} unlocked
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── TOAST (stacked, sliding-in, auto-dismiss) ───────────────────── */
export function AchievementToast() {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  useEffect(() => {
    const handler = (e) => {
      const ach = e?.detail
      if (!ach || !ach.id) return
      const key = `${ach.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((prev) => [...prev, { key, ach, leaving: false }])

      // Start fade-out at 3.6s, remove at 4s
      const fadeT = setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.key === key ? { ...t, leaving: true } : t))
        )
      }, 3600)
      const killT = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.key !== key))
        timersRef.current.delete(key)
      }, 4000)
      timersRef.current.set(key, [fadeT, killT])
    }

    window.addEventListener(UNLOCK_EVENT, handler)
    return () => {
      window.removeEventListener(UNLOCK_EVENT, handler)
      timersRef.current.forEach((arr) => arr.forEach(clearTimeout))
      timersRef.current.clear()
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="ach-toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map(({ key, ach, leaving }) => (
        <div
          key={key}
          className={`ach-toast ${leaving ? 'ach-toast--leaving' : ''}`}
          role="status"
        >
          <span className="ach-toast-icon">{ach.icon}</span>
          <span className="ach-toast-body">
            <span className="ach-toast-label">ACHIEVEMENT UNLOCKED</span>
            <span className="ach-toast-name">{ach.name}</span>
            <span className="ach-toast-desc">{ach.desc}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export default AchievementsProvider
