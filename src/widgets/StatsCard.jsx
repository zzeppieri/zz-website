import React, { useEffect, useRef, useState, useCallback } from 'react';
import './stats-card.css';

/* ─── Data ───────────────────────────────────────────────────────────────── */
const STATS = [
  { label: 'HP',         value: 100, a: '#7fdb9c', b: '#d4af37' },
  { label: 'Lean',       value: 95,  a: '#7fdb9c', b: '#4ec9d4' },
  { label: 'Software',   value: 85,  a: '#6cb8ff', b: '#c79bff' },
  { label: 'Engineering',value: 90,  a: '#ff8d6c', b: '#d4af37' },
  { label: 'Leadership', value: 80,  a: '#ffb84a', b: '#7fdb9c' },
  { label: 'AI Ops',     value: 92,  a: '#c79bff', b: '#4ec9d4' },
];

const MOVES = [
  {
    name: 'Kaizen Strike',
    type: 'Lean',
    typeClass: 'sc-type--lean',
    power: 95,
    desc: 'Eliminate waste, reduce TAT by 60%.',
  },
  {
    name: 'Six Sigma Slash',
    type: 'Quality',
    typeClass: 'sc-type--quality',
    power: 80,
    desc: 'Reduce variation. Slash defect rate.',
  },
  {
    name: 'Python Bolt',
    type: 'Software',
    typeClass: 'sc-type--software',
    power: 85,
    desc: 'Generate apps from scripts. 50+ rules codified.',
  },
  {
    name: '3D Print Forge',
    type: 'Engineering',
    typeClass: 'sc-type--engineering',
    power: 90,
    desc: 'Print a fixture. Patent pending.',
  },
];

/* ─── Stylized SVG portrait — engineer silhouette + circuit halo ─────────── */
function PortraitSVG() {
  return (
    <svg
      className="sc-portrait-svg"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="sc-halo" cx="50%" cy="40%" r="55%">
          <stop offset="0%"   stopColor="#7fdb9c" stopOpacity="0.45" />
          <stop offset="55%"  stopColor="#4ec9d4" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0a1320" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sc-body" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor="#1c2940" />
          <stop offset="100%" stopColor="#0a1320" />
        </linearGradient>
        <linearGradient id="sc-edge" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%"   stopColor="#f5d56b" />
          <stop offset="100%" stopColor="#8a6f1c" />
        </linearGradient>
      </defs>

      {/* halo */}
      <circle cx="100" cy="90" r="78" fill="url(#sc-halo)" />

      {/* circuit ring */}
      <g stroke="#7fdb9c" strokeWidth="0.7" fill="none" opacity="0.55">
        <circle cx="100" cy="100" r="72" strokeDasharray="2 4" />
        <circle cx="100" cy="100" r="62" strokeDasharray="6 3" opacity="0.4" />
      </g>
      <g fill="#7fdb9c" opacity="0.85">
        <circle cx="172" cy="100" r="1.5" />
        <circle cx="28"  cy="100" r="1.5" />
        <circle cx="100" cy="28"  r="1.5" />
        <circle cx="100" cy="172" r="1.5" />
      </g>

      {/* head */}
      <circle cx="100" cy="78" r="22" fill="url(#sc-body)" stroke="url(#sc-edge)" strokeWidth="1.2" />
      {/* visor (CRT-green) */}
      <rect x="82" y="72" width="36" height="7" rx="2" fill="#0a1320" stroke="#7fdb9c" strokeWidth="0.8" />
      <rect x="84" y="73.5" width="32" height="4" fill="#7fdb9c" opacity="0.85" />
      {/* visor highlight */}
      <rect x="86" y="73.8" width="6" height="1.2" fill="#e8fff0" opacity="0.9" />

      {/* shoulders / torso */}
      <path
        d="M 50 170 Q 50 130 80 118 L 120 118 Q 150 130 150 170 Z"
        fill="url(#sc-body)"
        stroke="url(#sc-edge)"
        strokeWidth="1.2"
      />
      {/* shirt collar / vee */}
      <path d="M 88 118 L 100 140 L 112 118" fill="none" stroke="#7fdb9c" strokeWidth="0.8" opacity="0.7" />

      {/* badge / pocket pen */}
      <rect x="115" y="128" width="2" height="9" fill="#d4af37" />
      <circle cx="116" cy="127" r="1.2" fill="#f5d56b" />

      {/* gear in corner */}
      <g transform="translate(160 38)" opacity="0.85">
        <circle r="6" fill="none" stroke="#d4af37" strokeWidth="1" />
        <circle r="2" fill="#d4af37" />
        <g stroke="#d4af37" strokeWidth="1">
          <line x1="0" y1="-9" x2="0" y2="-7" />
          <line x1="0" y1="9"  x2="0" y2="7"  />
          <line x1="-9" y1="0" x2="-7" y2="0" />
          <line x1="9"  y1="0" x2="7"  y2="0" />
          <line x1="-6.4" y1="-6.4" x2="-5" y2="-5" />
          <line x1="6.4"  y1="6.4"  x2="5"  y2="5"  />
          <line x1="-6.4" y1="6.4"  x2="-5" y2="5"  />
          <line x1="6.4"  y1="-6.4" x2="5"  y2="-5" />
        </g>
      </g>
    </svg>
  );
}

function LevelIcon() {
  return (
    <svg className="sc-level-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 L15 9 L22 10 L17 15 L18.5 22 L12 18.5 L5.5 22 L7 15 L2 10 L9 9 Z" />
    </svg>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function StatsCard() {
  const rootRef = useRef(null);
  const rafRef = useRef(0);
  const tiltState = useRef({ tx: 0, ty: 0, mx: 50, my: 50, holo: 0 });
  const animatedRef = useRef(false);

  const [flipped, setFlipped] = useState(false);
  const [statValues, setStatValues] = useState(() => STATS.map(() => 0));
  const [orientPermission, setOrientPermission] = useState('unknown'); // 'unknown'|'granted'|'denied'|'unsupported'

  /* ── Animated count-up on mount ── */
  useEffect(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;
    const start = performance.now();
    const duration = 1300;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    let raf;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const k = ease(t);
      setStatValues(STATS.map((s) => Math.round(s.value * k)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── Apply tilt + holo via CSS vars on rAF for 60fps ── */
  const applyTransform = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const { tx, ty, mx, my, holo } = tiltState.current;
    el.style.setProperty('--sc-rx', `${tx.toFixed(2)}deg`);
    el.style.setProperty('--sc-ry', `${ty.toFixed(2)}deg`);
    el.style.setProperty('--sc-mx', `${mx.toFixed(1)}%`);
    el.style.setProperty('--sc-my', `${my.toFixed(1)}%`);
    el.style.setProperty('--sc-holo-opacity', holo.toFixed(2));
    el.style.setProperty('--sc-angle', `${((mx + my) * 1.5).toFixed(1)}`);
    rafRef.current = 0;
  }, []);

  const schedule = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(applyTransform);
  }, [applyTransform]);

  /* ── Mouse handlers ── */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;   // 0..1
      const py = (e.clientY - rect.top) / rect.height;   // 0..1
      const max = 12; // deg
      // ty (rotateY) responds to X; tx (rotateX) responds to Y (inverted)
      tiltState.current.ty = (px - 0.5) * 2 * max;
      tiltState.current.tx = -(py - 0.5) * 2 * max;
      tiltState.current.mx = px * 100;
      tiltState.current.my = py * 100;
      tiltState.current.holo = 0.85;
      schedule();
    };

    const onLeave = () => {
      tiltState.current.tx = 0;
      tiltState.current.ty = 0;
      tiltState.current.holo = 0;
      schedule();
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [schedule]);

  /* ── deviceorientation (mobile tilt) ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('DeviceOrientationEvent' in window)) {
      setOrientPermission('unsupported');
      return;
    }
    // iOS 13+: requires explicit permission via user gesture (handled on tap below).
    const needsPermission =
      typeof window.DeviceOrientationEvent.requestPermission === 'function';
    if (!needsPermission) {
      setOrientPermission('granted'); // attach immediately on Android / non-iOS
    }
  }, []);

  useEffect(() => {
    if (orientPermission !== 'granted') return;
    const onOrient = (e) => {
      // gamma: left/right [-90..90]; beta: front/back [-180..180]
      const g = Math.max(-30, Math.min(30, e.gamma || 0));
      const b = Math.max(-30, Math.min(30, (e.beta || 0) - 30)); // bias toward upright hold
      tiltState.current.ty = (g / 30) * 10;
      tiltState.current.tx = -(b / 30) * 10;
      tiltState.current.holo = 0.55;
      // shift holo center subtly so the shimmer still tracks
      tiltState.current.mx = 50 + (g / 30) * 30;
      tiltState.current.my = 50 + (b / 30) * 30;
      schedule();
    };
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, [orientPermission, schedule]);

  /* ── Fire achievement event on every flip ── */
  const fireFlipEvent = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.dispatchEvent(new CustomEvent('achievement:card-flipped'));
    } catch {
      /* CustomEvent unsupported — silently noop */
    }
  }, []);

  /* ── Click / tap: flip + (on iOS) request orientation permission ── */
  const onCardClick = useCallback(async () => {
    setFlipped((f) => !f);
    fireFlipEvent();
    if (
      typeof window !== 'undefined' &&
      'DeviceOrientationEvent' in window &&
      typeof window.DeviceOrientationEvent.requestPermission === 'function' &&
      orientPermission !== 'granted'
    ) {
      try {
        const res = await window.DeviceOrientationEvent.requestPermission();
        setOrientPermission(res === 'granted' ? 'granted' : 'denied');
      } catch {
        setOrientPermission('denied');
      }
    }
  }, [orientPermission, fireFlipEvent]);

  /* ── Keyboard accessibility ── */
  const onKey = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setFlipped((f) => !f);
      fireFlipEvent();
    }
  }, [fireFlipEvent]);

  /* ───────────────────── Render ───────────────────── */
  return (
    <div
      className={`sc-root ${flipped ? 'is-flipped' : ''}`}
      ref={rootRef}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label="Trading card for Zachary Zeppieri. Activate to flip."
      onClick={onCardClick}
      onKeyDown={onKey}
    >
      <div className="sc-flipper">
        {/* ─── FRONT ─── */}
        <div className="sc-face sc-face--front">
          <div className="sc-frame">
            <div className="sc-inner">
              <div className="sc-scan" />
              <div className="sc-holo-rainbow" />
              <div className="sc-holo" />

              <div className="sc-topbar">
                <div>
                  <div className="sc-name">ZACHARY ZEPPIERI</div>
                  <span className="sc-subtitle">Sr CI Engineer</span>
                </div>
                <div className="sc-level" title="Level 27">
                  <LevelIcon />
                  Lv. 27
                </div>
              </div>

              <div className="sc-portrait">
                <PortraitSVG />
                <span className="sc-portrait-tag">CHROMALLOY / MRO</span>
                <span className="sc-portrait-corner">★ HOLO</span>
              </div>

              <div className="sc-types">
                <span className="sc-type sc-type--lean">LEAN</span>
                <span className="sc-type sc-type--mes">MES</span>
                <span className="sc-type sc-type--ai">AI-AUGMENTED</span>
              </div>

              <div className="sc-stats">
                {STATS.map((s, i) => (
                  <div className="sc-stat-row" key={s.label}>
                    <div className="sc-stat-label">{s.label}</div>
                    <div className="sc-stat-bar">
                      <div
                        className="sc-stat-fill"
                        style={{
                          '--sc-target': `${statValues[i]}%`,
                          '--sc-fill-a': s.a,
                          '--sc-fill-b': s.b,
                        }}
                      />
                    </div>
                    <div className="sc-stat-val">{statValues[i]}</div>
                  </div>
                ))}
              </div>

              <div className="sc-moves">
                {MOVES.map((m) => (
                  <div className="sc-move" key={m.name}>
                    <div className="sc-move-name">
                      {m.name}
                      <span className={`sc-move-type ${m.typeClass}`}>{m.type}</span>
                    </div>
                    <div className="sc-move-power">{m.power}</div>
                    <div className="sc-move-desc">{m.desc}</div>
                  </div>
                ))}
              </div>

              <div className="sc-footer">
                <span>© 2026 Zeppieri Industries</span>
                <span className="sc-serial">Card 001/001</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── BACK ─── */}
        <div className="sc-face sc-face--back">
          <div className="sc-frame">
            <div className="sc-back-inner">
              <div className="sc-scan" />
              <div className="sc-holo-rainbow" />
              <div className="sc-holo" />

              <div className="sc-back-seal" aria-hidden="true">ZZ</div>
              <div className="sc-back-title">// FIELD NOTES</div>
              <div className="sc-back-divider" />

              <div className="sc-back-lore">
                <p>
                  Mechanical engineer turned continuous-improvement operator at an
                  aerospace MRO. Spent five years turning shop-floor pain into
                  systems — Kaizen events, Tulip MES rollouts, and a Python
                  framework that generates internal apps from plain English.
                </p>
                <p>
                  Holds a patent-pending baffle extraction fixture. Built a
                  Claude-powered PM toolchain that ingests Copilot transcripts,
                  drafts schedules, and writes back to Smartsheet. Specializes in
                  shipping AI-augmented tooling that the floor actually uses.
                </p>
                <p>
                  Six Sigma Green Belt. B.S. Mechanical Engineering, SUNY New
                  Paltz. Believes the best automation is the kind that an operator
                  can read, trust, and turn off.
                </p>
              </div>

              <div className="sc-back-divider" />

              <div className="sc-back-stats">
                <div className="sc-back-stat"><span>Hours Saved</span><span>30,000+</span></div>
                <div className="sc-back-stat"><span>Kaizen Events</span><span>29</span></div>
                <div className="sc-back-stat"><span>Sites</span><span>5</span></div>
                <div className="sc-back-stat"><span>Patents</span><span>1 pending</span></div>
              </div>

              <div className="sc-back-footer">
                Tap / click to return to front
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sc-hint" aria-hidden="true">
        {flipped ? '⟵ tap to flip back' : 'tap to reveal lore ⟶'}
      </div>
    </div>
  );
}
