import React, {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './mode.css';

/* ════════════════════════════════════════════════════════════════════
   Mode.jsx — Presentation-mode switcher (provider + HUD + dispatcher)
   --------------------------------------------------------------------
   Exports:
     • ModeProvider     — React Context provider; wraps the app.
     • useMode()        — hook → { mode, setMode, modes }
     • <ModeSwitcher /> — floating top-right HUD widget (rounded pill)
     • <ModeHost />     — renderless dispatcher that lazy-loads alt-modes

   Modes available:
     • default   → renders nothing; the standard Blueprint landing shows
     • a3        → src/modes/A3Report.jsx       (default export)
     • terminal  → src/modes/Terminal.jsx       (default export)
     • engine    → src/modes/EngineDiagram.jsx  (default export)

   Each alt-mode receives onExit={() => setMode('default')}.
   Persistence: localStorage.portfolio_mode (default 'default').
   ════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'portfolio_mode';
const DEFAULT_MODE = 'default';

/* ── Mode catalog (single source of truth) ───────────────────────── */
const MODES = [
  { id: 'default',    label: 'Blueprint',  short: 'BLUEPRINT',  icon: '📋', desc: 'Corkboard + CRT terminal landing.' },
  { id: 'a3',         label: 'A3 Report',  short: 'A3',         icon: '📄', desc: 'Lean problem-solving doc layout.' },
  { id: 'terminal',   label: 'Terminal',   short: 'CLI',        icon: '▶_', desc: 'Fully interactive CLI portfolio.' },
  { id: 'engine',     label: 'Engine',     short: 'ENGINE',     icon: '🛩️', desc: 'Aerospace turbine cross-section navigation.' },
  { id: 'sketchbook', label: 'Sketchbook', short: 'NOTEBOOK',   icon: '📓', desc: 'Hand-drawn lab notebook pages.' },
  { id: 'neural',     label: 'Neural',     short: 'NEURAL',     icon: '🧠', desc: '3D-feeling knowledge graph / neural net.' },
  { id: 'magazine',   label: 'Magazine',   short: 'MAGAZINE',   icon: '📰', desc: 'Time-style cover with story callouts.' },
];

const MODE_IDS = MODES.map((m) => m.id);

/* ── Lazy alt-mode imports (absolute path via Vite alias-less relative).
   These are siblings of the Mode.jsx file's parent: src/modes/*.jsx.
   React.lazy guarantees these files are NOT loaded until selected.   */
const A3Report      = lazy(() => import('../modes/A3Report.jsx'));
const Terminal      = lazy(() => import('../modes/Terminal.jsx'));
const EngineDiagram = lazy(() => import('../modes/EngineDiagram.jsx'));
const Sketchbook    = lazy(() => import('../modes/Sketchbook.jsx'));
const Neural        = lazy(() => import('../modes/Neural.jsx'));
const Magazine      = lazy(() => import('../modes/Magazine.jsx'));

/* ── Context ─────────────────────────────────────────────────────── */
const ModeCtx = createContext(null);

/* ── Storage helpers ─────────────────────────────────────────────── */
function readStoredMode() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && MODE_IDS.includes(v)) return v;
  } catch (_) {
    /* SSR / privacy mode — fall through */
  }
  return DEFAULT_MODE;
}

function writeStoredMode(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch (_) {
    /* ignore quota / private-mode errors */
  }
}

/* ════════════════════════════════════════════════════════════════════
   ModeProvider
   ════════════════════════════════════════════════════════════════════ */
export function ModeProvider({ children }) {
  const [mode, setModeState] = useState(DEFAULT_MODE);

  // Rehydrate on mount
  useEffect(() => {
    const stored = readStoredMode();
    if (stored !== DEFAULT_MODE) setModeState(stored);
  }, []);

  // Persist on change + publish to <html data-mode="..."> so HUD CSS can
  // gate visibility per mode without prop-drilling.
  useEffect(() => {
    writeStoredMode(mode);
    try { document.documentElement.dataset.mode = mode } catch (e) {}
  }, [mode]);

  const setMode = useCallback((nextId) => {
    if (!MODE_IDS.includes(nextId)) return;
    setModeState(nextId);
  }, []);

  const cycleMode = useCallback((direction = 1) => {
    setModeState((curr) => {
      const idx = MODE_IDS.indexOf(curr);
      const next = MODE_IDS[(idx + direction + MODE_IDS.length) % MODE_IDS.length];
      return next;
    });
  }, []);

  // Keyboard mode-cycle: `m` cycles forward, `Shift+m` cycles backward.
  // Skipped if focus is in an input / contentEditable so we don't fight
  // the terminal mode's input field or any other typing surface.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'm' && e.key !== 'M') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      const isTyping =
        t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (isTyping) return;
      e.preventDefault();
      cycleMode(e.shiftKey ? -1 : 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cycleMode]);

  const value = useMemo(
    () => ({ mode, setMode, cycleMode, modes: MODES }),
    [mode, setMode, cycleMode]
  );

  return <ModeCtx.Provider value={value}>{children}</ModeCtx.Provider>;
}

/* ════════════════════════════════════════════════════════════════════
   useMode() hook
   ════════════════════════════════════════════════════════════════════ */
export function useMode() {
  const ctx = useContext(ModeCtx);
  if (!ctx) {
    // Safe fallback for consumers used outside the provider
    return {
      mode: DEFAULT_MODE,
      setMode: () => {},
      modes: MODES,
    };
  }
  return ctx;
}

/* ════════════════════════════════════════════════════════════════════
   <ModeSwitcher /> — floating HUD puck (rounded pill, top-right)
   ════════════════════════════════════════════════════════════════════ */
export function ModeSwitcher() {
  const { mode, setMode, modes } = useMode();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const firstOptionRef = useRef(null);

  // Close on outside-click + Escape
  useEffect(() => {
    if (!open) return undefined;

    const handlePointer = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer, { passive: true });
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // Focus the first option when the panel opens (keyboard a11y)
  useEffect(() => {
    if (open && firstOptionRef.current) {
      firstOptionRef.current.focus();
    }
  }, [open]);

  const choose = useCallback(
    (id) => {
      setMode(id);
      setOpen(false);
    },
    [setMode]
  );

  const current = modes.find((m) => m.id === mode) || modes[0];

  return (
    <div
      ref={rootRef}
      className={`mo-switcher${open ? ' mo-switcher--open' : ''}`}
    >
      <button
        type="button"
        className="mo-switcher__puck"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Mode: ${current.label}. Click to change presentation mode.`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mo-switcher__icon" aria-hidden="true">
          {current.icon}
        </span>
        <span className="mo-switcher__label">
          <span className="mo-switcher__label-prefix">MODE</span>
          <span className="mo-switcher__label-value">{current.short}</span>
        </span>
        <span className="mo-switcher__caret" aria-hidden="true">v</span>
      </button>

      <div
        className="mo-switcher__panel"
        role="listbox"
        aria-label="Choose presentation mode"
      >
        {modes.map((m, idx) => {
          const selected = m.id === mode;
          return (
            <button
              key={m.id}
              ref={idx === 0 ? firstOptionRef : undefined}
              type="button"
              role="option"
              aria-checked={selected}
              aria-selected={selected}
              className="mo-switcher__option"
              onClick={() => choose(m.id)}
            >
              <span className="mo-switcher__option-icon" aria-hidden="true">
                {m.icon}
              </span>
              <span className="mo-switcher__option-body">
                <span className="mo-switcher__option-name">{m.label}</span>
                <span className="mo-switcher__option-desc">{m.desc}</span>
              </span>
              <span className="mo-switcher__check" aria-hidden="true">*</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   <ModeHost /> — renderless dispatcher for alt-modes
   Returns null when mode === 'default'. Otherwise lazy-loads the chosen
   alt-mode and renders it inside <Suspense>, passing onExit.
   ════════════════════════════════════════════════════════════════════ */
export function ModeHost() {
  const { mode, setMode, modes } = useMode();

  if (mode === DEFAULT_MODE) return null;

  const onExit = () => setMode(DEFAULT_MODE);
  const current = modes.find((m) => m.id === mode);
  const shortName = current ? current.short : String(mode).toUpperCase();

  let Comp = null;
  switch (mode) {
    case 'a3':       Comp = A3Report;      break;
    case 'terminal':   Comp = Terminal;      break;
    case 'engine':     Comp = EngineDiagram; break;
    case 'sketchbook': Comp = Sketchbook;    break;
    case 'neural':     Comp = Neural;        break;
    case 'magazine':   Comp = Magazine;      break;
    default:           Comp = null;
  }
  if (!Comp) return null;

  return (
    <Suspense
      fallback={
        <div className="mo-loading" role="status" aria-live="polite">
          <span className="mo-loading__inner">
            <span className="mo-loading__block" aria-hidden="true">&#9618;</span>
            <span className="mo-loading__text">
              initializing %{shortName}%&hellip;
            </span>
          </span>
        </div>
      }
    >
      <Comp onExit={onExit} />
    </Suspense>
  );
}

export default ModeProvider;
