import { useEffect, useRef, useState, useCallback } from 'react';
import './magazine.css';

/**
 * Magazine — full-screen takeover presenting Zach's career as a Time/Newsweek-
 * style magazine cover. Editorial layout: masthead, hero illustration with
 * floating callouts, massive serif headline, and a bottom story strip.
 */

const CALLOUTS = [
  { id: 'co-hours', label: '30,000+ HRS SAVED', arrow: '→', x: 8, y: 18, point: { x: 36, y: 42 } },
  { id: 'co-patent', label: 'PATENT PENDING', arrow: '★', x: 60, y: 12, point: { x: 52, y: 28 } },
  { id: 'co-mes', label: 'MES PILOT · MAY 2026', arrow: '→', x: 4, y: 68, point: { x: 28, y: 58 } },
  { id: 'co-sites', label: '1 ENGINEER · 5 SITES', arrow: '◆', x: 62, y: 74, point: { x: 50, y: 70 } },
];

const STORIES = [
  {
    id: 'st-cell',
    kicker: 'PROFILE',
    title: 'How a $2.4M Cell Saved $350K a Year',
    blurb: 'The Pratt 3-spool teardown line that became a CI proving ground.',
    body: 'Five months. One pilot cell. A standardized teardown sequence that cut WIP by 38% and recovered roughly $350K in annualized hours. The blueprint now ships to four sister sites.',
  },
  {
    id: 'st-tulip',
    kicker: 'TECH',
    title: 'The Python Framework That Ships MES Apps',
    blurb: 'A custom code-gen toolkit drops Tulip apps in hours, not weeks.',
    body: 'Built in evenings and weekends. A prompt-engineered visualizer, a Claude-driven PM framework, and a Smartsheet MCP that turns RFIs into a board. Phase 3 pilot launches at Windsor, CT.',
  },
  {
    id: 'st-opinion',
    kicker: 'OPINION',
    title: 'Why Your CI Team Needs an AI Co-Pilot',
    blurb: 'Continuous Improvement is a writing job. AI writes alongside you.',
    body: 'The bottleneck in CI is rarely the data — it is the documentation, the rollout deck, the 27 follow-up emails. Pair a CI engineer with a model and you compress weeks into a long afternoon.',
  },
  {
    id: 'st-letters',
    kicker: 'LETTERS',
    title: 'A Working Operator’s View',
    blurb: 'Floor feedback from the first wave of Tulip MES users.',
    body: 'Operators say the app reads like the job actually runs — not like a binder somebody stapled together in 1998. The next release adds barcode kitting and live takt indicators.',
  },
];

function HeroIllustration() {
  return (
    <svg
      className="mag-hero-svg"
      viewBox="0 0 600 760"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mag-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1f2e" />
          <stop offset="55%" stopColor="#2a1f3d" />
          <stop offset="100%" stopColor="#3d1f2a" />
        </linearGradient>
        <linearGradient id="mag-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1418" />
          <stop offset="100%" stopColor="#0a0608" />
        </linearGradient>
        <linearGradient id="mag-crt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c1a1f" />
          <stop offset="100%" stopColor="#040a0c" />
        </linearGradient>
        <radialGradient id="mag-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#5ee2c8" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#1e9c8a" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0a3a36" stopOpacity="0" />
        </radialGradient>
        <pattern id="mag-grain" patternUnits="userSpaceOnUse" width="3" height="3">
          <rect width="3" height="3" fill="transparent" />
          <circle cx="1" cy="1" r="0.3" fill="#000" opacity="0.06" />
        </pattern>
      </defs>

      {/* sky / wall */}
      <rect x="0" y="0" width="600" height="500" fill="url(#mag-sky)" />
      {/* floor */}
      <rect x="0" y="500" width="600" height="260" fill="url(#mag-floor)" />
      {/* horizon line accent */}
      <rect x="0" y="498" width="600" height="2" fill="#e63946" opacity="0.7" />

      {/* perspective floor lines */}
      <g stroke="#3a2028" strokeWidth="1" opacity="0.55">
        <line x1="0" y1="540" x2="600" y2="540" />
        <line x1="0" y1="600" x2="600" y2="600" />
        <line x1="0" y1="680" x2="600" y2="680" />
      </g>

      {/* CRT glow halo */}
      <circle cx="300" cy="360" r="200" fill="url(#mag-glow)" />

      {/* desk */}
      <rect x="120" y="540" width="360" height="14" fill="#221820" />
      <rect x="135" y="554" width="330" height="6" fill="#150d12" />
      <rect x="160" y="560" width="14" height="120" fill="#1a1118" />
      <rect x="426" y="560" width="14" height="120" fill="#1a1118" />

      {/* CRT monitor body */}
      <rect x="210" y="320" width="180" height="160" rx="14" fill="#181216" stroke="#0a0608" strokeWidth="2" />
      <rect x="226" y="336" width="148" height="116" rx="6" fill="url(#mag-crt)" />
      {/* screen scanlines */}
      <g stroke="#5ee2c8" strokeWidth="0.5" opacity="0.18">
        <line x1="230" y1="346" x2="370" y2="346" />
        <line x1="230" y1="356" x2="370" y2="356" />
        <line x1="230" y1="366" x2="370" y2="366" />
        <line x1="230" y1="376" x2="370" y2="376" />
        <line x1="230" y1="386" x2="370" y2="386" />
        <line x1="230" y1="396" x2="370" y2="396" />
        <line x1="230" y1="406" x2="370" y2="406" />
        <line x1="230" y1="416" x2="370" y2="416" />
        <line x1="230" y1="426" x2="370" y2="426" />
        <line x1="230" y1="436" x2="370" y2="436" />
      </g>
      {/* terminal text */}
      <g fontFamily="ui-monospace, 'Courier New', monospace" fontSize="7" fill="#5ee2c8">
        <text x="232" y="354">$ deploy --site=windsor</text>
        <text x="232" y="366">> building tulip app</text>
        <text x="232" y="378">> kitting.module ok</text>
        <text x="232" y="390">> ops.tracker ok</text>
        <text x="232" y="402">> rollout 100%</text>
        <text x="232" y="420" fill="#f4b942">// READY</text>
      </g>
      <rect x="270" y="426" width="6" height="8" fill="#5ee2c8">
        <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite" />
      </rect>
      {/* monitor stand */}
      <rect x="290" y="480" width="20" height="18" fill="#221820" />
      <rect x="270" y="498" width="60" height="6" fill="#181216" />

      {/* engineer silhouette */}
      <g fill="#0e0608">
        {/* shoulders / torso */}
        <path d="M 230 700 Q 230 590 300 590 Q 370 590 370 700 L 370 760 L 230 760 Z" />
        {/* neck */}
        <rect x="285" y="560" width="30" height="36" />
        {/* head */}
        <ellipse cx="300" cy="540" rx="34" ry="40" />
        {/* ear silhouette hint */}
        <ellipse cx="266" cy="540" rx="4" ry="6" fill="#1a1218" />
      </g>
      {/* head rim light (amber) */}
      <path
        d="M 270 510 Q 268 540 274 568"
        stroke="#f4b942"
        strokeWidth="2"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M 280 502 Q 268 522 270 540"
        stroke="#f4b942"
        strokeWidth="1.3"
        fill="none"
        opacity="0.6"
      />
      {/* shoulder rim light (cyan from CRT) */}
      <path
        d="M 232 700 Q 234 624 290 596"
        stroke="#5ee2c8"
        strokeWidth="2"
        fill="none"
        opacity="0.65"
      />

      {/* floating tool icons (orbiting around figure) */}
      <g opacity="0.9">
        {/* gear top-left */}
        <g transform="translate(78 120)">
          <circle cx="0" cy="0" r="22" fill="none" stroke="#f4b942" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="8" fill="none" stroke="#f4b942" strokeWidth="2" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect
              key={deg}
              x="-3"
              y="-26"
              width="6"
              height="10"
              fill="#f4b942"
              transform={`rotate(${deg})`}
            />
          ))}
        </g>
        {/* wrench top-right */}
        <g transform="translate(500 90) rotate(35)">
          <rect x="-6" y="-44" width="12" height="60" fill="#e63946" />
          <circle cx="0" cy="-50" r="14" fill="none" stroke="#e63946" strokeWidth="6" />
          <circle cx="0" cy="20" r="9" fill="#e63946" />
        </g>
        {/* turbine blade mid-left */}
        <g transform="translate(70 320)">
          <circle cx="0" cy="0" r="6" fill="#5ee2c8" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <path
              key={deg}
              d="M 0 -4 Q 18 -18 24 -2 Q 18 2 0 4 Z"
              fill="#5ee2c8"
              opacity="0.85"
              transform={`rotate(${deg})`}
            />
          ))}
        </g>
        {/* code brackets bottom-right */}
        <g transform="translate(520 360)" fontFamily="'Times New Roman', serif" fontSize="56" fill="#f4b942">
          <text x="-32" y="0">{'{ }'}</text>
        </g>
        {/* graph spark bottom-left */}
        <g transform="translate(80 480)" stroke="#5ee2c8" strokeWidth="2.5" fill="none">
          <polyline points="0,30 10,22 20,26 30,12 40,16 50,2" />
          <circle cx="50" cy="2" r="3" fill="#5ee2c8" stroke="none" />
        </g>
      </g>

      {/* grain overlay */}
      <rect x="0" y="0" width="600" height="760" fill="url(#mag-grain)" />
      {/* subtle vignette */}
      <radialGradient id="mag-vignette" cx="0.5" cy="0.5" r="0.8">
        <stop offset="60%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
      </radialGradient>
      <rect x="0" y="0" width="600" height="760" fill="url(#mag-vignette)" />
    </svg>
  );
}

function Barcode() {
  // Deterministic-looking barcode strip
  const bars = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 2, 1, 3, 1, 2, 1, 1, 3];
  let x = 0;
  return (
    <div className="mag-barcode" aria-label="barcode">
      <svg viewBox="0 0 80 32" preserveAspectRatio="none">
        {bars.map((w, i) => {
          const rect = (
            <rect
              key={i}
              x={x}
              y={0}
              width={i % 2 === 0 ? w : 0}
              height={26}
              fill="#0a0608"
            />
          );
          x += w;
          return rect;
        })}
      </svg>
      <div className="mag-barcode-num">0 74470 12345 7</div>
    </div>
  );
}

export default function Magazine({ onExit = () => {} }) {
  const [openStory, setOpenStory] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (openStory) setOpenStory(null);
        else onExit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit, openStory]);

  const handleExit = useCallback(() => onExit(), [onExit]);

  return (
    <div
      ref={rootRef}
      className={`mag-root${reduceMotion ? ' mag-reduce' : ''}`}
      role="dialog"
      aria-label="Magazine cover view"
    >
      {/* corner registration ticks */}
      <span className="mag-tick mag-tick-tl" aria-hidden="true" />
      <span className="mag-tick mag-tick-tr" aria-hidden="true" />
      <span className="mag-tick mag-tick-bl" aria-hidden="true" />
      <span className="mag-tick mag-tick-br" aria-hidden="true" />
      <span className="mag-safe-area" aria-hidden="true">PRINT-SAFE AREA</span>

      {/* ROW 1 — masthead */}
      <header className="mag-masthead">
        <div className="mag-masthead-left">
          <span className="mag-title">ZEPPIERI INDUSTRIES</span>
        </div>
        <div className="mag-masthead-center">
          <span className="mag-issue">VOL. III &middot; ISSUE 12 &middot; MAY 2026</span>
        </div>
        <div className="mag-masthead-right">
          <span className="mag-price">$0.00 &middot; SUBSCRIBE FREE</span>
          <button type="button" className="mag-exit" onClick={handleExit} aria-label="Exit magazine">
            EXIT MAGAZINE <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="mag-mastrule" />
      </header>

      {/* ROW 2 — cover */}
      <main className="mag-cover">
        <div className="mag-photo">
          <div className="mag-photo-frame">
            <HeroIllustration />
            {/* floating callouts */}
            {CALLOUTS.map((c) => (
              <div
                key={c.id}
                className="mag-callout"
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
              >
                <svg
                  className="mag-callout-arrow"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <line
                    x1="50"
                    y1="50"
                    x2={c.point.x - c.x + 50}
                    y2={c.point.y - c.y + 50}
                    stroke="#1a1a1a"
                    strokeWidth="1.4"
                  />
                </svg>
                <span className="mag-callout-label">
                  {c.label} <span className="mag-callout-glyph">{c.arrow}</span>
                </span>
              </div>
            ))}
            <div className="mag-photo-caption">
              PHOTO ILLUSTRATION &middot; Z. ZEPPIERI AT WORK &middot; CHROMALLOY NY
            </div>
          </div>
        </div>

        <div className="mag-headline">
          <div className="mag-eyebrow">THE FUTURE OF MANUFACTURING</div>
          <h1 className="mag-h1">
            The Engineer
            <br />
            Who Builds
            <br />
            <em>His Own</em> Tools.
          </h1>
          <p className="mag-sub">
            Inside Zachary Zeppieri&rsquo;s 4-year run reshaping an aerospace MRO
            floor &mdash; and the AI-augmented toolchain he built to run the
            next phase.
          </p>
          <div className="mag-byline">
            BY THE EDITORS <span className="mag-byline-dot">&bull;</span> 12 MIN READ
          </div>
        </div>
      </main>

      {/* ROW 3 — story strip */}
      <footer className="mag-strip">
        <div className="mag-strip-label">ALSO INSIDE</div>
        <div className="mag-strip-scroll">
          {STORIES.map((s) => (
            <button
              key={s.id}
              type="button"
              className="mag-card"
              onClick={() => setOpenStory(s)}
            >
              <span className="mag-card-kicker">{s.kicker}</span>
              <span className="mag-card-title">{s.title}</span>
              <span className="mag-card-blurb">{s.blurb}</span>
              <span className="mag-card-cta">Read story <span aria-hidden="true">&rarr;</span></span>
            </button>
          ))}
        </div>
        <div className="mag-strip-tail">
          <Barcode />
          <div className="mag-issn">ISSN 2026-0512</div>
        </div>
      </footer>

      {/* story detail panel */}
      {openStory && (
        <div
          className="mag-detail"
          role="dialog"
          aria-label={openStory.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenStory(null);
          }}
        >
          <div className="mag-detail-panel">
            <div className="mag-detail-kicker">{openStory.kicker}</div>
            <h2 className="mag-detail-title">{openStory.title}</h2>
            <p className="mag-detail-blurb">{openStory.blurb}</p>
            <p className="mag-detail-body">{openStory.body}</p>
            <button
              type="button"
              className="mag-detail-close"
              onClick={() => setOpenStory(null)}
              aria-label="Close story"
            >
              CLOSE <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
