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
const LEADERBOARD_KEY = 'lean_lego_leaderboard';
const ACHIEVEMENT_EVENT = 'achievement:lean-lego-win';

/* Fixed tile dimensions used by chaosLayout to position tiles in pixels.
 * Keep in sync with .ll-tool-chaos width/height in CSS. */
const TILE_W = 120;
const TILE_H = 78;
const CHAOS_PAD = 12;
const CHAOS_TOP_PAD = 28; // leaves room for the "CHAOS ZONE" label

/* Deterministic-ish shuffled layout for the chaos zone so items don't
 * pile on top of each other. Returns {x, y} px per id. */
function chaosLayout(items, width = 760, height = 230) {
  const layout = {};
  const innerW = Math.max(width - CHAOS_PAD * 2, TILE_W);
  const innerH = Math.max(height - CHAOS_TOP_PAD - CHAOS_PAD, TILE_H);
  // Compute columns/rows that fit
  const colGap = 14;
  const rowGap = 12;
  const cols = Math.max(1, Math.floor((innerW + colGap) / (TILE_W + colGap)));
  const rows = Math.max(1, Math.ceil(items.length / cols));
  // Center the grid horizontally
  const usedW = cols * TILE_W + (cols - 1) * colGap;
  const startX = CHAOS_PAD + Math.max(0, Math.floor((innerW - usedW) / 2));
  const startY = CHAOS_TOP_PAD;
  const verticalSpace = Math.max(0, innerH - rows * TILE_H);
  const rowExtraGap = rows > 1 ? Math.min(rowGap, Math.floor(verticalSpace / (rows - 1))) : 0;

  items.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const baseX = startX + col * (TILE_W + colGap);
    const baseY = startY + row * (TILE_H + rowExtraGap);
    // jitter so it feels like clutter, not a grid (kept small to avoid overlap)
    const jitterX = ((i * 37) % 9) - 4;
    const jitterY = ((i * 53) % 7) - 3;
    layout[item.id] = {
      x: baseX + jitterX,
      y: baseY + jitterY,
    };
  });
  return layout;
}

function clampToChaos(x, y, width, height) {
  const maxX = Math.max(0, width - TILE_W - CHAOS_PAD);
  const maxY = Math.max(0, height - TILE_H - CHAOS_PAD);
  const minX = CHAOS_PAD;
  const minY = CHAOS_TOP_PAD;
  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y)),
  };
}

function fmtTime(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((e) => e && typeof e.timeMs === 'number')
      .sort((a, b) => a.timeMs - b.timeMs)
      .slice(0, 10);
  } catch (e) {
    return [];
  }
}

function saveLeaderboard(entries) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch (e) { /* ignore */ }
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

  /* ── Leaderboard ── */
  const [leaderboard, setLeaderboard] = useState([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingScore, setPendingScore] = useState(null); // { timeMs, errors }
  const [nameInput, setNameInput] = useState('');
  const [leaderboardOpen, setLeaderboardOpen] = useState(false); // mobile collapsible

  /* ── Drag state (refs to avoid re-renders during pointermove) ── */
  const dragRef = useRef(null);
  const [dragView, setDragView] = useState(null); // {id, x, y} — drives render
  const boardRef = useRef(null);
  const chaosRef = useRef(null);
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

  /* ── Best time + leaderboard hydrate ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BEST_TIME_KEY);
      if (raw) {
        const n = parseInt(raw, 10);
        if (Number.isFinite(n) && n > 0) setBestTime(n);
      }
    } catch (e) { /* localStorage unavailable — fine */ }
    setLeaderboard(loadLeaderboard());
  }, []);

  /* ── Reflow chaos positions when chaos size becomes known / changes ── */
  useEffect(() => {
    const el = chaosRef.current;
    if (!el) return undefined;
    const apply = () => {
      const rect = el.getBoundingClientRect();
      // Only auto-place ids that don't yet have a saved position (e.g. on first paint
      // when default % positions were estimated, or on reset).
      setChaosPositions((prev) => {
        const next = { ...prev };
        const layout = chaosLayout(items, rect.width, rect.height);
        items.forEach((t) => {
          const cur = prev[t.id];
          if (!cur || typeof cur.x !== 'number' || typeof cur.y !== 'number') {
            next[t.id] = layout[t.id];
          }
        });
        return next;
      });
    };
    apply();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        // Don't fully relayout on resize — only fill in missing positions
        apply();
      });
      ro.observe(el);
      return () => ro.disconnect();
    }
    return undefined;
  }, [items]);

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
      // Open the name modal for the leaderboard.
      setPendingScore({ timeMs: finalMs, errors });
      setNameInput('');
      setShowNameModal(true);
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
    setShowNameModal(false);
    setPendingScore(null);
    dragRef.current = null;
    startedAtRef.current = Date.now();
    const rect = chaosRef.current ? chaosRef.current.getBoundingClientRect() : null;
    setChaosPositions(chaosLayout(TOOL_LIBRARY, rect ? rect.width : undefined, rect ? rect.height : undefined));
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
    setShowNameModal(false);
    setPendingScore(null);
    dragRef.current = null;
    startedAtRef.current = Date.now();
    const rect = chaosRef.current ? chaosRef.current.getBoundingClientRect() : null;
    setChaosPositions(chaosLayout(shuffled, rect ? rect.width : undefined, rect ? rect.height : undefined));
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
    const chaosRect = chaosRef.current ? chaosRef.current.getBoundingClientRect() : null;
    const startPos = chaosPositions[item.id] || { x: 0, y: 0 };
    dragRef.current = {
      id: item.id,
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      startX: startPos.x,
      startY: startPos.y,
      chaosLeft: chaosRect ? chaosRect.left : 0,
      chaosTop: chaosRect ? chaosRect.top : 0,
      chaosW: chaosRect ? chaosRect.width : 760,
      chaosH: chaosRect ? chaosRect.height : 230,
    };
    setDragView({ id: item.id, x: e.clientX, y: e.clientY });
  }, [placement, won, chaosPositions]);

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
      // Correct drop — place into the zone (no chaos position needed)
      setPlacement((prev) => ({ ...prev, [item.id]: z }));
      setScore((s) => s + 1);
      setFlash({ zoneId: z, kind: 'ok' });
      setTimeout(() => setFlash(null), 450);
      tone(true);
      return;
    }

    if (z) {
      // Wrong zone — shake, count error, then return to wherever the user dragged it last
      setErrors((n) => n + 1);
      setShakeId(item.id);
      setTimeout(() => setShakeId(null), 420);
      setFlash({ zoneId: z, kind: 'bad' });
      setTimeout(() => setFlash(null), 450);
      tone(false);
    }

    // For both wrong-zone and dropped-on-nothing cases: persist the
    // new chaos position so the user can pre-organize before sorting.
    const relX = e.clientX - d.chaosLeft - d.offsetX;
    const relY = e.clientY - d.chaosTop - d.offsetY;
    const clamped = clampToChaos(relX, relY, d.chaosW, d.chaosH);
    setChaosPositions((prev) => ({ ...prev, [item.id]: clamped }));
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

  /* ── Leaderboard submit ── */
  const submitScore = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!pendingScore) {
      setShowNameModal(false);
      return;
    }
    const trimmed = (nameInput || '').trim().slice(0, 24);
    const entry = {
      name: trimmed || 'Anonymous',
      timeMs: pendingScore.timeMs,
      errors: pendingScore.errors,
      date: new Date().toISOString(),
    };
    const next = [...leaderboard, entry]
      .sort((a, b) => a.timeMs - b.timeMs)
      .slice(0, 10);
    setLeaderboard(next);
    saveLeaderboard(next);
    setShowNameModal(false);
    setPendingScore(null);
  }, [leaderboard, nameInput, pendingScore]);

  /* ── Derived ── */
  const placedCount = useMemo(
    () => Object.values(placement).filter((z) => z !== 'chaos').length,
    [placement],
  );
  const total = TOOL_LIBRARY.length;
  const accuracy = score + errors > 0 ? Math.round((score / (score + errors)) * 100) : 100;

  /* ───────────────────────────── RENDER ───────────────────────────── */
  return (
    <div className="ll-shell">
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
        <div className="ll-chaos" ref={chaosRef}>
          <div className="ll-chaos-label">CHAOS ZONE — drag tools into the correct 5S category (or rearrange here)</div>
          {items.map((item) => {
            const placed = placement[item.id];
            if (placed && placed !== 'chaos') return null; // rendered inside its zone
            const isDragging = dragView && dragView.id === item.id;
            const pos = chaosPositions[item.id] || { x: 12, y: CHAOS_TOP_PAD };
            const hintZone = helpOn ? ZONES.find((z) => z.id === item.zone) : null;
            return (
              <div
                key={item.id}
                className={`ll-tool ll-tool-chaos${isDragging ? ' ll-tool-dragging' : ''}${shakeId === item.id ? ' ll-tool-shake' : ''}`}
                style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                onPointerDown={(e) => onPointerDown(e, item)}
                role="button"
                tabIndex={0}
                aria-label={`${item.name}, drag to a 5S zone`}
              >
                <span className="ll-tool-icon" aria-hidden="true">{item.icon}</span>
                <span className="ll-tool-name" title={item.name}>{item.name}</span>
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
                    <div key={t.id} className="ll-tool ll-tool-placed" title={t.name}>
                      <span className="ll-tool-icon" aria-hidden="true">{t.icon}</span>
                      <span className="ll-tool-name ll-tool-name-placed">{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile leaderboard toggle */}
        <button
          type="button"
          className={`ll-lb-toggle${leaderboardOpen ? ' ll-lb-toggle-open' : ''}`}
          onClick={() => setLeaderboardOpen((v) => !v)}
          aria-expanded={leaderboardOpen}
          aria-controls="ll-leaderboard-mobile"
        >
          LEADERBOARD {leaderboardOpen ? '▴' : '▾'}
        </button>
        {leaderboardOpen && (
          <div id="ll-leaderboard-mobile" className="ll-lb-mobile">
            <LeaderboardList entries={leaderboard} />
          </div>
        )}

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

        {/* NAME MODAL — appears first on win, before the win card */}
        {showNameModal && pendingScore && (
          <div className="ll-win-overlay" role="dialog" aria-modal="true" aria-label="Enter name for leaderboard">
            <form className="ll-win-card ll-name-card" onSubmit={submitScore}>
              <div className="ll-win-title">5S COMPLETE</div>
              <div className="ll-win-sub">Workshop organized in {fmtTime(pendingScore.timeMs)}</div>
              <label className="ll-name-label" htmlFor="ll-name-input">YOUR NAME</label>
              <input
                id="ll-name-input"
                type="text"
                className="ll-name-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Anonymous"
                maxLength={24}
                autoFocus
              />
              <div className="ll-win-stats">
                <div><span className="ll-hud-label">TIME</span><span className="ll-mono">{fmtTime(pendingScore.timeMs)}</span></div>
                <div><span className="ll-hud-label">ERRORS</span><span className="ll-mono">{pendingScore.errors}</span></div>
              </div>
              <button type="submit" className="ll-btn ll-btn-primary">SUBMIT</button>
            </form>
          </div>
        )}

        {/* WIN OVERLAY — shown after name submission */}
        {won && !showNameModal && (
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

      {/* Desktop side leaderboard */}
      <aside className="ll-lb-side" aria-label="Leaderboard">
        <div className="ll-lb-head">LEADERBOARD</div>
        <LeaderboardList entries={leaderboard} />
      </aside>
    </div>
  );
}

/* ── Leaderboard list (shared by side + mobile) ── */
function LeaderboardList({ entries }) {
  if (!entries || entries.length === 0) {
    return <div className="ll-lb-empty">No scores yet — be the first to complete 5S.</div>;
  }
  return (
    <ol className="ll-lb-list">
      {entries.map((e, i) => (
        <li key={`${e.date}-${i}`} className={`ll-lb-row ll-lb-rank-${i + 1}`}>
          <span className="ll-lb-rank">{i + 1}.</span>
          <span className="ll-lb-name" title={e.name}>{e.name}</span>
          <span className="ll-lb-time ll-mono">{fmtTime(e.timeMs)}</span>
          <span className="ll-lb-err" title="errors">{e.errors}E</span>
        </li>
      ))}
    </ol>
  );
}
