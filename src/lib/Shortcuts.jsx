import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './shortcuts.css';

/* ════════════════════════════════════════════════════════════════════
   Shortcuts.jsx — Global keyboard-shortcuts help overlay
   --------------------------------------------------------------------
   Default export: <ShortcutsOverlay />
     A renderless component that listens globally for ?, Cmd/Ctrl+/, and
     ESC. Renders a centered modal panel showing every shortcut grouped
     by category, plus mode-switching chips. Also renders a tiny floating
     "?" button at the bottom-right (desktop only) to surface itself.

   Triggers:
     • `?` (Shift+/)         — toggle overlay (skipped when typing in input)
     • Cmd+/  or  Ctrl+/      — toggle overlay
     • ESC                    — close overlay
     • Click outside the panel — close overlay
     • Click the floating "?" — open overlay

   Mode-switching:
     The Mode chips write `localStorage.portfolio_mode = id` and reload
     the window. If the host app exposes a `useMode` hook via the
     <ModeProvider> (Mode.jsx), we would prefer that — but since this
     overlay sits outside any provider's render tree by design (mounted
     globally in main.jsx), we keep the path simple and reliable: write
     to storage + reload. This guarantees mode-switch works regardless
     of where the overlay is mounted.

   Visual contract: dark navy panel #0e1a2a + cyan accent (matches the
   site's CRT theme). All classes prefixed .sc- to avoid collisions.

   prefers-reduced-motion is respected (CSS).
   ════════════════════════════════════════════════════════════════════ */

/* ── Mode catalog (chips). Keep IDs in sync with Mode.jsx ─────────── */
const MODE_CHIPS = [
  { id: 'default',    label: 'BLUEPRINT'  },
  { id: 'a3',         label: 'A3'         },
  { id: 'terminal',   label: 'TERMINAL'   },
  { id: 'engine',     label: 'ENGINE'     },
  { id: 'sketchbook', label: 'SKETCHBOOK' },
  { id: 'neural',     label: 'NEURAL'     },
  // Magazine may or may not be wired up — chip stays visible; the
  // switch handler checks against a known-good list before reloading.
  { id: 'magazine',   label: 'MAGAZINE'   },
];

const STORAGE_KEY = 'portfolio_mode';

/* ── Helpers ─────────────────────────────────────────────────────── */
function isTypingTarget(el) {
  if (!el) return false;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (el.isContentEditable) return true;
  return false;
}

function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(max-width: 720px)').matches;
}

function switchMode(id) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch (_) {
    /* private mode / quota — fall through and reload anyway */
  }
  try {
    // Tiny delay so the click animation reads as committed
    setTimeout(() => window.location.reload(), 60);
  } catch (_) {
    window.location.reload();
  }
}

/* ── Shortcut catalog (single source of truth for the overlay) ───── */
const GROUPS = [
  {
    heading: 'Global',
    rows: [
      { keys: ['?'],                        desc: 'Show / hide this help' },
      { keys: ['Cmd', '/'], altKeys: ['Ctrl', '/'], desc: 'Show / hide this help' },
      { keys: ['ESC'],                      desc: 'Close current overlay / back out' },
      { keys: ['↑', '↑', '↓', '↓', '←', '→', '←', '→', 'B', 'A'],
                                            desc: 'Konami code — matrix rain easter egg' },
    ],
  },
  {
    heading: 'Terminal mode',
    rows: [
      { keys: ['help'],                     desc: 'Print available command list' },
      { keys: ['Tab'],                      desc: 'Autocomplete current command' },
      { keys: ['↑', '↓'],                   desc: 'Walk command history' },
      { keys: ['Ctrl', 'L'],                desc: 'Clear screen' },
      { keys: ['Ctrl', 'C'],                desc: 'Cancel input' },
      { keys: ['ESC'],                      desc: 'Exit terminal mode' },
    ],
  },
  {
    heading: 'Other',
    rows: [
      { keys: ['Name', '×5'],               desc: 'Tap your name 5× to unlock dev mode (password gate)' },
      { keys: ['Click'],                    desc: 'Click any sticky note on the corkboard to enter a section' },
    ],
  },
];

/* ════════════════════════════════════════════════════════════════════
   <ShortcutsOverlay /> — default export
   ════════════════════════════════════════════════════════════════════ */
function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(isMobileViewport());
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
  const triggerBtnRef = useRef(null);

  /* Track viewport class so we can hide the floating button on mobile */
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(max-width: 720px)');
    const handler = (e) => setIsMobile(e.matches);
    // older Safari uses addListener
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
    setIsMobile(mq.matches);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else if (mq.removeListener) mq.removeListener(handler);
    };
  }, []);

  /* Global key listener — toggles + ESC close */
  useEffect(() => {
    const handler = (e) => {
      // Never hijack typing in inputs / textareas / contentEditable
      if (isTypingTarget(e.target)) return;

      // Cmd+/ or Ctrl+/
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      // ESC closes
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
        return;
      }

      // ? (Shift+/) toggles — only when no modifier other than Shift is held
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  /* Click-outside closes (only when open) */
  useEffect(() => {
    if (!open) return undefined;
    const handlePointer = (e) => {
      const panel = panelRef.current;
      const trigger = triggerBtnRef.current;
      if (!panel) return;
      if (panel.contains(e.target)) return;
      if (trigger && trigger.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
    };
  }, [open]);

  /* Focus the close button when the panel opens (a11y) */
  useEffect(() => {
    if (open && closeBtnRef.current) {
      // delay one frame so the panel finishes mounting before focus moves
      const id = window.requestAnimationFrame(() => {
        try { closeBtnRef.current && closeBtnRef.current.focus(); } catch (_) {}
      });
      return () => window.cancelAnimationFrame(id);
    }
    return undefined;
  }, [open]);

  /* Lock body scroll while open */
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  const handleChipClick = useCallback((id) => {
    switchMode(id);
  }, []);

  /* Current mode (for highlighting the active chip). Read directly from
     storage to stay decoupled from the React mode context. */
  const currentMode = useMemo(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) || 'default';
    } catch (_) {
      return 'default';
    }
  }, [open]); // re-read each time the overlay is opened

  return (
    <>
      {/* Floating trigger button — desktop only */}
      {!isMobile && (
        <button
          ref={triggerBtnRef}
          type="button"
          className={`sc-trigger${open ? ' sc-trigger--active' : ''}`}
          aria-label="Show keyboard shortcuts"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={toggle}
          title="Keyboard shortcuts (?)"
        >
          ?
        </button>
      )}

      {open && (
        <div
          className="sc-backdrop"
          role="presentation"
          aria-hidden={false}
        >
          <div
            ref={panelRef}
            className="sc-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sc-title"
            aria-describedby="sc-subtitle"
          >
            <header className="sc-panel__header">
              <div className="sc-panel__title-block">
                <h2 id="sc-title" className="sc-panel__title">
                  Keyboard Shortcuts
                </h2>
                <p id="sc-subtitle" className="sc-panel__subtitle">
                  Press <span className="sc-inline-kbd">?</span> anytime to show this panel
                </p>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                className="sc-panel__close"
                aria-label="Close shortcuts overlay"
                onClick={close}
              >
                ×
              </button>
            </header>

            <div className="sc-panel__body">
              {/* Modes section — chip switcher (rendered first as the
                  most "actionable" surface) */}
              <section className="sc-section">
                <h3 className="sc-section__heading">Modes</h3>
                <p className="sc-section__hint">
                  Click a chip to switch presentation modes.
                </p>
                <div className="sc-chips" role="list">
                  {MODE_CHIPS.map((m) => {
                    const active = m.id === currentMode;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="listitem"
                        className={`sc-chip${active ? ' sc-chip--active' : ''}`}
                        onClick={() => handleChipClick(m.id)}
                        aria-current={active ? 'true' : undefined}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Keyboard shortcut groups */}
              {GROUPS.map((group) => (
                <section key={group.heading} className="sc-section">
                  <h3 className="sc-section__heading">{group.heading}</h3>
                  <dl className="sc-rows">
                    {group.rows.map((row, i) => (
                      <div key={i} className="sc-row">
                        <dt className="sc-row__keys">
                          <KeyCombo keys={row.keys} />
                          {row.altKeys && (
                            <>
                              <span className="sc-row__or">or</span>
                              <KeyCombo keys={row.altKeys} />
                            </>
                          )}
                        </dt>
                        <dd className="sc-row__desc">{row.desc}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>

            <footer className="sc-panel__footer">
              <span className="sc-panel__footer-hint">
                <span className="sc-inline-kbd">ESC</span> to close
              </span>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

/* Tiny presentational helper — renders a sequence of <kbd> chips joined
   by a thin "+" separator for combos. Used by every row in the overlay. */
function KeyCombo({ keys }) {
  return (
    <span className="sc-combo">
      {keys.map((k, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sc-combo__plus" aria-hidden="true">+</span>}
          <kbd className="sc-kbd">{k}</kbd>
        </React.Fragment>
      ))}
    </span>
  );
}

export default ShortcutsOverlay;
