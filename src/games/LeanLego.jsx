import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './lean-lego.css';

/* ───────────────────────────── 5S ZONES ─────────────────────────────
 * Real lean methodology — Sort, Set in Order, Shine, Standardize, Sustain.
 * Each zone owns a colour token, a one-word ja-name (where relevant),
 * and a two-line description used as the hover tooltip.
 */
const ZONES = [
  {
    id: 'sort',
    label: 'SORT',
    ja: 'Seiri',
    color: '#ff5a6e',
    desc: ['Remove unneeded items.', 'Red-tag what does not belong.'],
  },
  {
    id: 'set',
    label: 'SET IN ORDER',
    ja: 'Seiton',
    color: '#ff9a3c',
    desc: ['A place for everything.', 'Visual location for every tool.'],
  },
  {
    id: 'shine',
    label: 'SHINE',
    ja: 'Seiso',
    color: '#f5d142',
    desc: ['Clean the workspace.', 'Inspect through cleaning.'],
  },
  {
    id: 'standardize',
    label: 'STANDARDIZE',
    ja: 'Seiketsu',
    color: '#4ec9d4',
    desc: ['Codify the best way.', 'Make the standard visible.'],
  },
  {
    id: 'sustain',
    label: 'SUSTAIN',
    ja: 'Shitsuke',
    color: '#7fdb9c',
    desc: ['Audit and improve.', 'Make the habit stick.'],
  },
];

/* ───────────────────────────── TOOLS (12) ─────────────────────────────
 * Each item has a correct 5S zone. Icons are emoji silhouettes for
 * portability — no asset pipeline required.
 */
const TOOL_LIBRARY = [
  // Sort — remove unneeded
  { id: 't1', icon: '📟', name: 'Broken Gauge', zone: 'sort' },
  { id: 't2', icon: '🏷️', name: 'Expired Calibration Sticker', zone: 'sort' },
  { id: 't3', icon: '🧤', name: 'Worn-Out Glove', zone: 'sort' },
  { id: 't4', icon: '📖', name: 'Unused Manual', zone: 'sort' },
  // Set in Order — a place for everything
  { id: 't5', icon: '🔧', name: 'Color-Coded Wrench', zone: 'set' },
  { id: 't6', icon: '🗂️', name: 'Tool Shadow Board', zone: 'set' },
  { id: 't7', icon: '🗄️', name: 'Labeled Drawer', zone: 'set' },
  // Shine — clean and inspect
  { id: 't8', icon: '🧴', name: 'Cleaning Solvent', zone: 'shine' },
  { id: 't9', icon: '🧻', name: 'Lint-Free Rag', zone: 'shine' },
  // Standardize — codify the best way
  { id: 't10', icon: '📋', name: 'SOP Document', zone: 'standardize' },
  { id: 't11', icon: '📊', name: 'Visual Work Instruction', zone: 'standardize' },
  // Sustain — audit and improve
  { id: 't12', icon: '✅', name: 'Kamishibai Card', zone: 'sustain' },
];

const BEST_TIME_KEY = 'lean_lego_best_time_ms';
const ACHIEVEMENT_EVENT = 'achievement:lean-lego-win';

/* Deterministic-ish shuffled layout for the chaos zone so items don't
 * pile on top of each other. Returns {left%, top%} per id. */
function chaosLayout(items) {
  const layout = {};
  const cols = 4;
  items.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    // jitter so it feels like clutter, not a grid
    const jitterX = ((i * 37) % 11) - 5;
    const jitterY = ((i * 53) % 9) - 4;
    layout[item.id] = {
      left: 6 + col * 23 + jitterX,
      top: 10 + row * 30 + jitterY,
    };
  });
  return layout;
}

function fmtTime(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function LeanLego() {
  /* ── State ── */
  const [items, setItems] = useState(TOOL_LIBRARY);
  // placement: { [itemId]: zoneId | 'chaos' }
  const [placement, setPlacement] = useState(() => {
    const p = {};
    TOOL_LIBRARY.forEach((t) => { p[t.id] = 'chaos'; });
    return p;
  });
  const [chaosPositions, setChaosPositions] = useState(() => chaosLayout(TOOL_LIBRARY));
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [helpOn, setHelpOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [won, setWon] = useState(false);
  const [bestTime, setBestTime] = useState(null);
  const [flash, setFlash] = useState(null); // { zoneId, kind: 'ok'|'bad' }
  const [shakeId, setShakeId] = useState(null);
  const [hoverZone, setHoverZone] = useState(null);

  /* ── Drag state (refs to avoid re-renders during pointermove) ── */
  const dragRef = useRef(null);
  const [dragView, setDragView] = useState(null); // {id, x, y} — drives render
  const boardRef = useRef(null);
  const zoneRefsRef = useRef({});

  /* ── Timer ── */
  const startedAtRef = useRef(Date.now());
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => {
      setElapsed(Date.now() - startedAtRef.current);
    }, 200);
    return () => clearInterval(t);
  }, [running]);

  /* ── Best time hydrate ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BEST_TIME_KEY);
      if (raw) {
        const n = parseInt(raw, 10);
        if (Number.isFinite(n) && n > 0) setBestTime(n);
      }
    } catch (e) { /* localStorage unavailable — fine */ }
  }, []);

  /* ── Win detection ── */
  useEffect(() => {
    if (won) return;
    const allPlaced = TOOL_LIBRARY.every((t) => {
      const z = placement[t.id];
      return z && z !== 'chaos' && z === t.zone;
    });
    if (allPlaced) {
      const finalMs = Date.now() - startedAtRef.current;
      setElapsed(finalMs);
      setRunning(false);
      setWon(true);
      try {
        const prev = localStorage.getItem(BEST_TIME_KEY);
        const prevN = prev ? parseInt(prev, 10) : Infinity;
        if (finalMs < prevN) {
          localStorage.setItem(BEST_TIME_KEY, String(finalMs));
          setBestTime(finalMs);
        }
      } catch (e) { /* ignore */ }
      try {
        window.dispatchEvent(new CustomEvent(ACHIEVEMENT_EVENT, {
          detail: { timeMs: finalMs, errors },
        }));
      } catch (e) { /* ignore */ }
    }
  }, [placement, won, errors]);

  /* ── Reset / New game ── */
  const reset = useCallback(() => {
    const p = {};
    TOOL_LIBRARY.forEach((t) => { p[t.id] = 'chaos'; });
    setPlacement(p);
    setScore(0);
    setErrors(0);
    setElapsed(0);
    setWon(false);
    setRunning(true);
    setFlash(null);
    setShakeId(null);
    setDragView(null);
    dragRef.current = null;
    startedAtRef.current = Date.now();
    setChaosPositions(chaosLayout(TOOL_LIBRARY));
    setItems(TOOL_LIBRARY);
  }, []);

  const newGame = useCallback(() => {
    // Reshuffle the chaos layout for a fresh feel.
    const shuffled = [...TOOL_LIBRARY].sort(() => Math.random() - 0.5);
    setItems(shuffled);
    const p = {};
    shuffled.forEach((t) => { p[t.id] = 'chaos'; });
    setPlacement(p);
    setScore(0);
    setErrors(0);
    setElapsed(0);
    setWon(false);
    setRunning(true);
    setFlash(null);
    setShakeId(null);
    setDragView(null);
    dragRef.current = null;
    startedAtRef.current = Date.now();
    setChaosPositions(chaosLayout(shuffled));
  }, []);

  /* ── Audio — silent if unavailable ── */
  const audioCtxRef = useRef(null);
  const tone = useCallback((ok) => {
    try {
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = ok ? 'sine' : 'square';
      o.frequency.value = ok ? 660 : 180;
      g.gain.value = 0.06;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + (ok ? 0.12 : 0.18));
    } catch (e) { /* silent */ }
  }, []);

  /* ── Hit-test against zone refs in client coords ── */
  const hitZone = useCallback((clientX, clientY) => {
    const refs = zoneRefsRef.current;
    for (const id of Object.keys(refs)) {
      const el = refs[id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return id;
      }
    }
    return null;
  }, []);

  /* ── Pointer handlers ── */
  const onPointerDown = useCallback((e, item) => {
    if (won) return;
    if (placement[item.id] && placement[item.id] !== 'chaos' && placement[item.id] === item.zone) {
      // Already correctly placed — locked in.
      return;
    }
    e.preventDefault();
    const target = e.currentTarget;
    try { target.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    const rect = target.getBoundingClientRect();
    dragRef.current = {
      id: item.id,
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
    setDragView({ id: item.id, x: e.clientX, y: e.clientY });
  }, [placement, won]);

  const onPointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    setDragView({ id: d.id, x: e.clientX, y: e.clientY });
    const z = hitZone(e.clientX, e.clientY);
    setHoverZone(z);
  }, [hitZone]);

  const onPointerUp = useCallback((e) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const z = hitZone(e.clientX, e.clientY);
    const item = TOOL_LIBRARY.find((t) => t.id === d.id);
    dragRef.current = null;
    setDragView(null);
    setHoverZone(null);

    if (!item) return;

    if (z && z === item.zone) {
      // Correct drop
      setPlacement((prev) => ({ ...prev, [item.id]: z }));
      setScore((s) => s + 1);
      setFlash({ zoneId: z, kind: 'ok' });
      setTimeout(() => setFlash(null), 450);
      tone(true);
    } else if (z) {
      // Wrong zone
      setErrors((n) => n + 1);
      setShakeId(item.id);
      setTimeout(() => setShakeId(null), 420);
      setFlash({ zoneId: z, kind: 'bad' });
      setTimeout(() => setFlash(null), 450);
      tone(false);
      // Snap back to chaos (no placement change since it was already chaos)
    } else {
      // Dropped on nothing — silent return
      // no-op
    }
  }, [hitZone, tone]);

  /* ── Global pointer listeners while dragging ── */
  useEffect(() => {
    if (!dragView) return undefined;
    const move = (e) => onPointerMove(e);
    const up = (e) => onPointerUp(e);
    const cancel = (e) => onPointerUp(e);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
  }, [dragView, onPointerMove, onPointerUp]);

  /* ── Derived ── */
  const placedCount = useMemo(
    () => Object.values(placement).filter((z) => z !== 'chaos').length,
    [placement],
  );
  const total = TOOL_LIBRARY.length;
  const accuracy = score + errors > 0 ? Math.round((score / (score + errors)) * 100) : 100;

  /* ───────────────────────────── RENDER ───────────────────────────── */
  return (
    <div className="ll-root" ref={boardRef}>
      {/* HUD */}
      <div className="ll-hud">
        <div className="ll-hud-left">
          <div className="ll-hud-stat">
            <span className="ll-hud-label">TIME</span>
            <span className="ll-hud-val ll-mono">{fmtTime(elapsed)}</span>
          </div>
          <div className="ll-hud-stat">
            <span className="ll-hud-label">PLACED</span>
            <span className="ll-hud-val ll-mono">{placedCount}/{total}</span>
          </div>
          <div className="ll-hud-stat">
            <span className="ll-hud-label">ACC</span>
            <span className="ll-hud-val ll-mono">{accuracy}%</span>
          </div>
          {bestTime != null && (
            <div className="ll-hud-stat ll-hud-best">
              <span className="ll-hud-label">BEST</span>
              <span className="ll-hud-val ll-mono">{fmtTime(bestTime)}</span>
            </div>
          )}
        </div>
        <div className="ll-hud-right">
          <button
            type="button"
            className={`ll-btn ll-btn-help${helpOn ? ' ll-btn-on' : ''}`}
            onClick={() => setHelpOn((v) => !v)}
            aria-pressed={helpOn}
          >
            HELP {helpOn ? 'ON' : 'OFF'}
          </button>
          <button type="button" className="ll-btn" onClick={reset}>RESET</button>
          <button type="button" className="ll-btn ll-btn-primary" onClick={newGame}>NEW GAME</button>
        </div>
      </div>

      {/* Title strip */}
      <div className="ll-title-strip">
        <span className="ll-title">LEAN LEGO</span>
        <span className="ll-subtitle">5S Workshop · Sort · Set in Order · Shine · Standardize · Sustain</span>
      </div>

      {/* CHAOS ZONE */}
      <div className="ll-chaos">
        <div className="ll-chaos-label">CHAOS ZONE — drag tools into the correct 5S category</div>
        {items.map((item) => {
          const placed = placement[item.id];
          if (placed && placed !== 'chaos') return null; // rendered inside its zone
          const isDragging = dragView && dragView.id === item.id;
          const pos = chaosPositions[item.id] || { left: 10, top: 10 };
          const hintZone = helpOn ? ZONES.find((z) => z.id === item.zone) : null;
          return (
            <div
              key={item.id}
              className={`ll-tool ll-tool-chaos${isDragging ? ' ll-tool-dragging' : ''}${shakeId === item.id ? ' ll-tool-shake' : ''}`}
              style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
              onPointerDown={(e) => onPointerDown(e, item)}
              role="button"
              tabIndex={0}
              aria-label={`${item.name}, drag to a 5S zone`}
            >
              <span className="ll-tool-icon" aria-hidden="true">{item.icon}</span>
              <span className="ll-tool-name">{item.name}</span>
              {hintZone && (
                <span
                  className="ll-tool-hint"
                  style={{ background: hintZone.color }}
                >{hintZone.label}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 5S ZONES */}
      <div className="ll-zones">
        {ZONES.map((z) => {
          const placedHere = TOOL_LIBRARY.filter((t) => placement[t.id] === z.id);
          const isHover = hoverZone === z.id && dragView;
          const flashing = flash && flash.zoneId === z.id ? flash.kind : null;
          return (
            <div
              key={z.id}
              ref={(el) => { zoneRefsRef.current[z.id] = el; }}
              className={`ll-zone${isHover ? ' ll-zone-hover' : ''}${flashing ? ` ll-zone-flash-${flashing}` : ''}`}
              style={{ '--zone-color': z.color }}
            >
              <div className="ll-zone-head">
                <span className="ll-zone-label">{z.label}</span>
                <span className="ll-zone-ja">{z.ja}</span>
              </div>
              <div className="ll-zone-desc">
                {z.desc.map((line) => (<div key={line}>{line}</div>))}
              </div>
              <div className="ll-zone-slots">
                {placedHere.length === 0 && (
                  <div className="ll-zone-empty">drop tools here</div>
                )}
                {placedHere.map((t) => (
                  <div key={t.id} className="ll-tool ll-tool-placed">
                    <span className="ll-tool-icon" aria-hidden="true">{t.icon}</span>
                    <span className="ll-tool-name">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* DRAG GHOST — floating clone follows pointer */}
      {dragView && (() => {
        const item = TOOL_LIBRARY.find((t) => t.id === dragView.id);
        const d = dragRef.current;
        if (!item || !d) return null;
        const left = dragView.x - d.offsetX;
        const top = dragView.y - d.offsetY;
        return (
          <div
            className="ll-drag-ghost"
            style={{ left, top, width: d.width, height: d.height }}
          >
            <span className="ll-tool-icon" aria-hidden="true">{item.icon}</span>
            <span className="ll-tool-name">{item.name}</span>
          </div>
        );
      })()}

      {/* WIN OVERLAY */}
      {won && (
        <div className="ll-win-overlay" role="dialog" aria-modal="true" aria-label="5S complete">
          <div className="ll-win-card">
            <div className="ll-win-title">5S COMPLETE</div>
            <div className="ll-win-sub">Workshop organized.</div>
            <div className="ll-win-stats">
              <div><span className="ll-hud-label">TIME</span><span className="ll-mono">{fmtTime(elapsed)}</span></div>
              <div><span className="ll-hud-label">ACCURACY</span><span className="ll-mono">{accuracy}%</span></div>
              <div><span className="ll-hud-label">ERRORS</span><span className="ll-mono">{errors}</span></div>
              {bestTime != null && (
                <div><span className="ll-hud-label">BEST</span><span className="ll-mono">{fmtTime(bestTime)}</span></div>
              )}
            </div>
            <button type="button" className="ll-btn ll-btn-primary" onClick={newGame}>PLAY AGAIN</button>
          </div>
        </div>
      )}
    </div>
  );
}
