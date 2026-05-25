import { useCallback, useEffect, useRef, useState } from 'react';
import './themes.css';

/**
 * ThemeSwitcher
 * ----------------------------------------------------------------------------
 * Self-contained floating widget that swaps the site palette by toggling
 * `document.documentElement.dataset.theme`. The actual color overrides live
 * in ./themes.css under `:root[data-theme="..."]` selectors, so every CSS
 * custom property used by src/index.css (--bg, --text, --accent, --border,
 * --cyan, --term-green, etc.) cascades site-wide without touching any
 * existing file.
 *
 * Persists selection in localStorage under the key `theme` and rehydrates
 * on mount. Default theme is `blueprint` (the original look).
 */

const STORAGE_KEY = 'theme';
const DEFAULT_THEME = 'blueprint';

const THEMES = [
  {
    id: 'blueprint',
    name: 'Blueprint',
    blurb: 'Navy + CRT cyan',
    swatches: ['#1a2332', '#4ec9d4', '#ff6b4a', '#e0e8f0'],
  },
  {
    id: 'factory',
    name: 'Factory Floor',
    blurb: 'Amber + steel',
    swatches: ['#2a1e10', '#f4d35e', '#ff8c42', '#c0c0c8'],
  },
  {
    id: 'terminal',
    name: 'Shop Terminal',
    blurb: 'Green on black',
    swatches: ['#050d05', '#33ff33', '#1a6b1a', '#b6ff6b'],
  },
  {
    id: 'executive',
    name: 'Executive',
    blurb: 'Off-white + gold',
    swatches: ['#f5f1e8', '#18243a', '#b8902a', '#5a6478'],
  },
];

function applyTheme(themeId) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (!themeId || themeId === DEFAULT_THEME) {
    // Default: leave the original CSS in src/index.css untouched.
    // We still set the attribute so the matching :root[data-theme="blueprint"]
    // block (a no-op clone of the defaults) can apply where helpful.
    root.setAttribute('data-theme', DEFAULT_THEME);
  } else {
    root.setAttribute('data-theme', themeId);
  }
}

function readStoredTheme() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && THEMES.some((t) => t.id === v)) return v;
  } catch (_) {
    /* localStorage may be unavailable (SSR, privacy mode) */
  }
  return DEFAULT_THEME;
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const firstOptionRef = useRef(null);

  // Rehydrate on mount
  useEffect(() => {
    const stored = readStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  // Persist + apply whenever theme changes
  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {
      /* ignore */
    }
  }, [theme]);

  // Close on outside click / Esc
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

  // Move focus into the panel when it opens
  useEffect(() => {
    if (open && firstOptionRef.current) {
      firstOptionRef.current.focus();
    }
  }, [open]);

  const choose = useCallback((id) => {
    setTheme(id);
    setOpen(false);
  }, []);

  const current = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div
      ref={rootRef}
      className={`zz-theme-switcher${open ? ' zz-theme-switcher--open' : ''}`}
    >
      <button
        type="button"
        className="zz-theme-switcher__puck"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Theme: ${current.name}. Click to change.`}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="zz-theme-switcher__dot"
          style={{ background: current.swatches[1], boxShadow: `0 0 8px ${current.swatches[1]}` }}
          aria-hidden="true"
        />
        <span className="zz-theme-switcher__label">{current.name}</span>
        <span className="zz-theme-switcher__caret" aria-hidden="true">v</span>
      </button>

      <div
        className="zz-theme-switcher__panel"
        role="listbox"
        aria-label="Choose theme"
      >
        {THEMES.map((t, idx) => {
          const selected = t.id === theme;
          return (
            <button
              key={t.id}
              ref={idx === 0 ? firstOptionRef : undefined}
              type="button"
              role="option"
              aria-checked={selected}
              aria-selected={selected}
              className="zz-theme-switcher__option"
              onClick={() => choose(t.id)}
            >
              <span className="zz-theme-switcher__check" aria-hidden="true">*</span>
              <span className="zz-theme-switcher__name">
                {t.name}
                <span style={{ opacity: 0.55, marginLeft: 8, fontSize: 10 }}>
                  {t.blurb}
                </span>
              </span>
              <span className="zz-theme-switcher__swatches" aria-hidden="true">
                {t.swatches.map((c, i) => (
                  <span
                    key={i}
                    className="zz-theme-switcher__swatch"
                    style={{ background: c }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
