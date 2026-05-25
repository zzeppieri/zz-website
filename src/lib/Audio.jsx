import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import './audio.css';

/* ──────────────────────────────────────────────────────────────────────
   Audio.jsx — Web Audio API synthesis (no audio files)
   - AudioProvider:   wraps the app, owns the AudioContext + master gain
   - useAudio():      { enabled, toggle, play(soundName) }
   - <AudioHUD />:    floating toggle button (top-right, under achievements HUD)

   AudioContext is created lazily on the first user gesture (browser policy).
   ────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'audio_enabled';
const MASTER_GAIN = 0.18; // overall ceiling; per-sound gains stay quiet
const HUM_GAIN = 0.012;   // CRT hum: just barely there

const AudioCtx = createContext(null);

/* ── helper: read persisted preference (default OFF) ─────────────────── */
function readPersisted() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writePersisted(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/* ── helper: graceful AudioContext constructor lookup ────────────────── */
function getAudioContextClass() {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

/* ====================================================================
   AudioProvider
   ==================================================================== */
export function AudioProvider({ children }) {
  const [enabled, setEnabled] = useState(false); // default OFF; bumped from storage in effect
  const ctxRef = useRef(null);          // AudioContext
  const masterRef = useRef(null);       // GainNode — master volume
  const humNodesRef = useRef(null);     // { osc, gain } for the CRT hum loop
  const supportedRef = useRef(true);    // false if browser lacks Web Audio

  // hydrate from storage after mount (avoid SSR hiccups)
  useEffect(() => {
    setEnabled(readPersisted());
  }, []);

  /* ── lazy bring-up of AudioContext (must follow a user gesture) ───── */
  const ensureContext = useCallback(() => {
    if (ctxRef.current || !supportedRef.current) return ctxRef.current;
    const Ctor = getAudioContextClass();
    if (!Ctor) {
      supportedRef.current = false;
      return null;
    }
    try {
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = enabled ? MASTER_GAIN : 0;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
      return ctx;
    } catch {
      supportedRef.current = false;
      return null;
    }
  }, [enabled]);

  /* ── CRT hum: 60Hz sine + tiny 120Hz harmonic via slight detune ───── */
  const startHum = useCallback(() => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master || humNodesRef.current) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 60;
    gain.gain.value = 0;
    osc.connect(gain).connect(master);
    osc.start();
    // soft fade-in to avoid pop
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(HUM_GAIN, now + 0.4);
    humNodesRef.current = { osc, gain };
  }, []);

  const stopHum = useCallback(() => {
    const ctx = ctxRef.current;
    const nodes = humNodesRef.current;
    if (!ctx || !nodes) return;
    const now = ctx.currentTime;
    try {
      nodes.gain.gain.cancelScheduledValues(now);
      nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, now);
      nodes.gain.gain.linearRampToValueAtTime(0, now + 0.25);
      nodes.osc.stop(now + 0.3);
    } catch {
      /* node may already be stopped */
    }
    humNodesRef.current = null;
  }, []);

  /* ── react to enabled flag changes ─────────────────────────────────── */
  useEffect(() => {
    writePersisted(enabled);
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return; // nothing live yet — toggle will take effect on first gesture
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(enabled ? MASTER_GAIN : 0, now + 0.12);
    if (enabled) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      startHum();
    } else {
      stopHum();
    }
  }, [enabled, startHum, stopHum]);

  /* ── unmount cleanup ───────────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      stopHum();
      const ctx = ctxRef.current;
      if (ctx) {
        try { ctx.close(); } catch { /* ignore */ }
      }
      ctxRef.current = null;
      masterRef.current = null;
    };
  }, [stopHum]);

  /* ── envelope helpers ──────────────────────────────────────────────── */
  // Schedule a tone with attack/release shape. peak is the gain peak.
  const scheduleTone = useCallback((opts) => {
    const {
      type = 'sine',
      freq = 440,
      startAt = 0,
      duration = 0.2,
      peak = 0.3,
      attack = 0.005,
      release = 0.06,
      sweepTo = null, // optional: linear frequency sweep to this Hz
    } = opts;
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    const t0 = ctx.currentTime + startAt;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweepTo != null) {
      osc.frequency.linearRampToValueAtTime(sweepTo, t0 + duration);
    }
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + attack);
    gain.gain.setValueAtTime(peak, t0 + Math.max(attack, duration - release));
    gain.gain.linearRampToValueAtTime(0, t0 + duration);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }, []);

  /* ── sound library ─────────────────────────────────────────────────── */
  const playSound = useCallback((name) => {
    // Don't even bring up the context if user has audio disabled
    if (!enabled) return;
    const ctx = ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    switch (name) {
      case 'achievement': {
        // C5 → E5 arpeggio, sine, ~400ms total
        scheduleTone({ type: 'sine', freq: 523.25, startAt: 0,    duration: 0.18, peak: 0.32 });
        scheduleTone({ type: 'sine', freq: 659.25, startAt: 0.18, duration: 0.22, peak: 0.32 });
        break;
      }
      case 'click': {
        // 1kHz square, 30ms, rapid envelope
        scheduleTone({ type: 'square', freq: 1000, duration: 0.03, peak: 0.18, attack: 0.001, release: 0.015 });
        break;
      }
      case 'hover': {
        // very subtle 800Hz sine, 20ms
        scheduleTone({ type: 'sine', freq: 800, duration: 0.02, peak: 0.05, attack: 0.002, release: 0.012 });
        break;
      }
      case 'success': {
        // C5 / E5 / G5 ascending, sine, ~500ms total
        scheduleTone({ type: 'sine', freq: 523.25, startAt: 0,    duration: 0.16, peak: 0.30 });
        scheduleTone({ type: 'sine', freq: 659.25, startAt: 0.15, duration: 0.16, peak: 0.30 });
        scheduleTone({ type: 'sine', freq: 783.99, startAt: 0.30, duration: 0.22, peak: 0.32 });
        break;
      }
      case 'error': {
        // G3 → C3 descending, square, ~300ms total
        scheduleTone({ type: 'square', freq: 196.00, startAt: 0,    duration: 0.14, peak: 0.18 });
        scheduleTone({ type: 'square', freq: 130.81, startAt: 0.14, duration: 0.18, peak: 0.18 });
        break;
      }
      case 'open': {
        // upward chirp 400 → 800Hz, 150ms
        scheduleTone({ type: 'sine', freq: 400, sweepTo: 800, duration: 0.15, peak: 0.22, attack: 0.005, release: 0.06 });
        break;
      }
      case 'close': {
        // downward chirp 800 → 400Hz, 150ms
        scheduleTone({ type: 'sine', freq: 800, sweepTo: 400, duration: 0.15, peak: 0.22, attack: 0.005, release: 0.06 });
        break;
      }
      default:
        // unknown sound name — silently ignore
        break;
    }
  }, [enabled, ensureContext, scheduleTone]);

  /* ── toggle: this is the canonical "user gesture" entry point ─────── */
  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      // bring the context up on the *gesture* if we're enabling
      if (next) {
        const ctx = ensureContext();
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
      }
      return next;
    });
  }, [ensureContext]);

  const value = {
    enabled,
    toggle,
    play: playSound,
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

/* ====================================================================
   useAudio hook
   ==================================================================== */
export function useAudio() {
  const ctx = useContext(AudioCtx);
  // Safe fallback so consumers don't crash when used outside the provider
  if (!ctx) {
    return {
      enabled: false,
      toggle: () => {},
      play: () => {},
    };
  }
  return ctx;
}

/* ====================================================================
   <AudioHUD /> — floating toggle button
   ==================================================================== */
export function AudioHUD() {
  const { enabled, toggle, play } = useAudio();

  const handleClick = () => {
    // Click sound only when enabling (so the toggle-on click is audible feedback);
    // when disabling, fire the click *before* mute takes hold via short delay.
    if (enabled) {
      // play a click while still audible, then disable
      play('click');
      // give the click a moment to render before the master ramps to 0
      window.setTimeout(toggle, 40);
    } else {
      toggle();
      // After turning on, the context resumes; queue a small confirmation tick
      window.setTimeout(() => play('click'), 80);
    }
  };

  return (
    <button
      type="button"
      className={`au-hud ${enabled ? 'au-hud--on' : 'au-hud--off'}`}
      onClick={handleClick}
      aria-label={enabled ? 'Mute sound effects' : 'Enable sound effects'}
      aria-pressed={enabled}
      title={enabled ? 'Sound on (click to mute)' : 'Sound off (click to enable)'}
    >
      <span className="au-hud__icon" aria-hidden="true">
        {enabled ? (
          // speaker + waves
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 10 8 10 13 5 13 19 8 14 3 14 3 10" fill="currentColor" stroke="none" />
            <path d="M16 8.5a4 4 0 0 1 0 7" />
            <path d="M18.5 5.5a8 8 0 0 1 0 13" />
          </svg>
        ) : (
          // speaker + X
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 10 8 10 13 5 13 19 8 14 3 14 3 10" fill="currentColor" stroke="none" />
            <line x1="17" y1="9" x2="22" y2="14" />
            <line x1="22" y1="9" x2="17" y2="14" />
          </svg>
        )}
      </span>
      <span className="au-hud__label">{enabled ? 'SND ON' : 'SND OFF'}</span>
    </button>
  );
}

export default AudioProvider;
