import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import './engine-diagram.css';

/* ─────────────────────────────────────────────────────────────────
   ENGINE GEOMETRY
   SVG viewBox: 1400 x 600. Engine centerline at y=300.
   Stations laid left → right with profile sweeping intake → nozzle.
───────────────────────────────────────────────────────────────── */

const VIEW_W = 1400;
const VIEW_H = 600;
const CL = 300;          // centerline Y
const NOSE_X = 120;      // spinner tip
const TAIL_X = 1300;     // nozzle exit

/* Each station owns a slice of the engine. xL..xR define horizontal extent,
   topY/botY define the outer wall at that station (mirrored across CL).      */
const STATIONS = [
  {
    id: 'fan',
    num: 1,
    name: 'FAN',
    tag: 'Productivity Intake',
    title: '30,000+ hrs saved (2024–2025)',
    snippet: '129% of target. Annualized savings across all product lines.',
    bullets: [
      'Verified ≈30,000 hours of savings booked across Chromalloy NY product lines for the 2024–2025 cycle',
      'Hit 129% of the assigned annual savings target',
      'Drove ROI on tooling, fixturing, and process-redesign initiatives feeding shop-floor lines',
      'Quantified in Dayforce performance review — independently audited',
    ],
    period: '2024 – 2025',
    xL: 130, xR: 290,
    topY: 110, botY: 490,
    calloutCx: 200, calloutCy: 50,
    cardX: 60,  cardY: 70,
    leader: [[200, 100], [200, 78], [200, 68]],
  },
  {
    id: 'lpc',
    num: 2,
    name: 'LOW-PRESSURE COMPRESSOR',
    tag: 'Lean Foundations',
    title: '29 Kaizen events · 5S 15→85',
    snippet: 'Lean program built up from scratch across 5 sites.',
    bullets: [
      '29 Kaizen events facilitated across 5 Chromalloy sites',
      'Site 5S audit score lifted from 15 to 85 points',
      '77+ operators, engineers, and supervisors trained in Lean tools',
      'Standard work, value-stream maps, and visual management deployed across multiple cells',
    ],
    period: '2023 – 2025',
    xL: 290, xR: 480,
    topY: 175, botY: 425,
    calloutCx: 385, calloutCy: 540,
    cardX: 280, cardY: 470,
    leader: [[385, 430], [385, 510], [385, 522]],
  },
  {
    id: 'hpc',
    num: 3,
    name: 'HIGH-PRESSURE COMPRESSOR',
    tag: 'Digital Systems',
    title: 'Tulip MES — Windsor (CT)',
    snippet: 'Multi-million-dollar deployment, Feb 2026 onward.',
    bullets: [
      'Lead CI engineer on Tulip Manufacturing Execution System rollout at Windsor (CT)',
      'Multi-million-dollar program spanning multiple shop-floor cells',
      'Built AI-augmented PM toolchain — Claude PM framework, prompt-engineered visualizer, Copilot ingestion, Smartsheet MCP',
      'Coordinating cross-site stakeholders, vendor scope, and integration with existing systems',
    ],
    period: 'Feb 2026 – ongoing',
    xL: 480, xR: 660,
    topY: 215, botY: 385,
    calloutCx: 570, calloutCy: 55,
    cardX: 470, cardY: 78,
    leader: [[570, 220], [570, 80], [570, 70]],
  },
  {
    id: 'combustor',
    num: 4,
    name: 'COMBUSTOR',
    tag: 'Where The Heat Hits',
    title: 'Patent-pending Baffle Tool',
    snippet: '$100K+/yr potential. Filed 2024.',
    bullets: [
      'Designed a Baffle Extraction Tool that removes a high-failure-mode bottleneck on combustor repair',
      'Patent application filed in 2024 — patent pending',
      '$100K+/yr potential savings if rolled across applicable product lines',
      'Cross-disciplinary: mechanical design + process redesign + operator-facing fixture',
    ],
    period: 'Filed 2024',
    xL: 660, xR: 820,
    topY: 235, botY: 365,
    calloutCx: 740, calloutCy: 555,
    cardX: 640, cardY: 480,
    leader: [[740, 370], [740, 525], [740, 537]],
    hot: true,
  },
  {
    id: 'hpt',
    num: 5,
    name: 'HIGH-PRESSURE TURBINE',
    tag: 'Material Handling Under Heat',
    title: 'Blade Cell — $2.4M capital',
    snippet: 'Team of 20, returned $350K to budget.',
    bullets: [
      'Capital project lead on Blade Cell — $2.4M scope',
      'Coordinated a cross-functional team of 20 (operators, technicians, engineering, finance)',
      'Returned $350K back to budget — under-spend with full scope delivered',
      'Project ran Nov 2022 – Jun 2023; cell on-line and producing per plan',
    ],
    period: 'Nov 2022 – Jun 2023',
    xL: 820, xR: 980,
    topY: 220, botY: 380,
    calloutCx: 900, calloutCy: 60,
    cardX: 810, cardY: 80,
    leader: [[900, 225], [900, 85], [900, 75]],
  },
  {
    id: 'lpt',
    num: 6,
    name: 'LOW-PRESSURE TURBINE',
    tag: 'Steady Mid-Level Work',
    title: 'TulipAppBuilder · 6 prod apps',
    snippet: 'Custom Python framework, 50+ reverse-engineered platform rules.',
    bullets: [
      'Built TulipAppBuilder, a custom Python framework that codifies 50+ reverse-engineered Tulip platform rules',
      '6 production applications shipped on the framework — live on the shop floor',
      'Reduced per-app build time and made future MES rollouts cheaper to scale',
      'AI-augmented authoring loop — design intent in, validated app out',
    ],
    period: '2024 – ongoing',
    xL: 980, xR: 1150,
    topY: 185, botY: 415,
    calloutCx: 1065, calloutCy: 560,
    cardX: 970, cardY: 478,
    leader: [[1065, 420], [1065, 530], [1065, 542]],
  },
  {
    id: 'nozzle',
    num: 7,
    name: 'NOZZLE',
    tag: 'Forward Thrust',
    title: 'Sole CI · scaling team',
    snippet: 'Sustained output through reductions. Q4 ’26 — 1–2 reports.',
    bullets: [
      'Sole CI practitioner at Chromalloy NY through multiple workforce reductions',
      'Sustained measurable program output (hours-saved, Kaizen, 5S) as a one-person function',
      'Title progression captured across 2024–2025 performance cycles',
      'Forward plan — Q4 2026 expansion to 1–2 direct reports as the CI function scales',
    ],
    period: 'Forward — Q4 2026',
    xL: 1150, xR: 1290,
    topY: 235, botY: 365,
    calloutCx: 1240, calloutCy: 70,
    cardX: 1160, cardY: 90,
    leader: [[1240, 245], [1240, 95], [1240, 84]],
  },
];

/* ─────────────────────────────────────────────────────────────────
   SVG path helpers — programmatic engine outline
───────────────────────────────────────────────────────────────── */

function buildOuterTopPath() {
  // Walk the top profile of the engine from spinner → tail.
  // Symmetric over the centerline; rendered twice (top + bottom).
  const pts = [
    [NOSE_X, CL],                     // spinner tip
    [NOSE_X + 20, CL - 70],           // spinner shoulder
    [STATIONS[0].xL + 10, CL - 130],  // fan leading edge tip
    [STATIONS[0].xR, CL - 190],       // fan housing crest
    [STATIONS[0].xR + 6, CL - 175],
    [STATIONS[1].xL + 30, CL - 125],
    [STATIONS[1].xR, CL - 90],        // LPC narrows down (compression)
    [STATIONS[2].xL + 20, CL - 80],
    [STATIONS[2].xR, CL - 78],        // HPC continues compression
    [STATIONS[3].xL + 10, CL - 70],
    [STATIONS[3].xR - 5, CL - 70],    // combustor can — straight
    [STATIONS[4].xL + 10, CL - 75],
    [STATIONS[4].xR, CL - 80],        // HPT expansion begins
    [STATIONS[5].xL + 20, CL - 105],
    [STATIONS[5].xR, CL - 130],       // LPT continues expansion
    [STATIONS[6].xL + 10, CL - 138],
    [TAIL_X - 30, CL - 95],           // nozzle convergence
    [TAIL_X, CL - 50],
  ];
  return ptsToPath(pts);
}

function buildOuterBottomPath() {
  const pts = [
    [NOSE_X, CL],
    [NOSE_X + 20, CL + 70],
    [STATIONS[0].xL + 10, CL + 130],
    [STATIONS[0].xR, CL + 190],
    [STATIONS[0].xR + 6, CL + 175],
    [STATIONS[1].xL + 30, CL + 125],
    [STATIONS[1].xR, CL + 90],
    [STATIONS[2].xL + 20, CL + 80],
    [STATIONS[2].xR, CL + 78],
    [STATIONS[3].xL + 10, CL + 70],
    [STATIONS[3].xR - 5, CL + 70],
    [STATIONS[4].xL + 10, CL + 75],
    [STATIONS[4].xR, CL + 80],
    [STATIONS[5].xL + 20, CL + 105],
    [STATIONS[5].xR, CL + 130],
    [STATIONS[6].xL + 10, CL + 138],
    [TAIL_X - 30, CL + 95],
    [TAIL_X, CL + 50],
  ];
  return ptsToPath(pts);
}

function ptsToPath(pts) {
  return pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
}

/* Per-station outer wall slice (used for the clickable section regions). */
function stationSectionPath(s) {
  const topPts = sliceTopPts(s);
  const botPts = sliceTopPts(s).map(([x, y]) => [x, 2 * CL - y]).reverse();
  return `M${topPts[0][0]} ${topPts[0][1]} ` +
    topPts.slice(1).map(([x, y]) => `L${x} ${y}`).join(' ') + ' ' +
    botPts.map(([x, y]) => `L${x} ${y}`).join(' ') + ' Z';
}

function sliceTopPts(s) {
  return [
    [s.xL, s.topY],
    [s.xL + (s.xR - s.xL) * 0.35, s.topY - 4],
    [s.xL + (s.xR - s.xL) * 0.65, s.topY - 4],
    [s.xR, s.topY],
  ];
}

/* Stylized blade stages — angled lines packed inside a station. */
function bladeLines(s, count, hot = false) {
  const lines = [];
  const span = s.xR - s.xL;
  const inset = 14;
  const usable = span - inset * 2;
  for (let i = 0; i < count; i++) {
    const x = s.xL + inset + (usable / (count - 1 || 1)) * i;
    const t = (i / Math.max(1, count - 1));
    const lean = 6 + t * 4;
    // top side
    lines.push({
      x1: x - lean, y1: s.topY + 10,
      x2: x + lean, y2: CL - 12,
      hot,
    });
    // bottom side (mirror)
    lines.push({
      x1: x - lean, y1: s.botY - 10,
      x2: x + lean, y2: CL + 12,
      hot,
    });
  }
  return lines;
}

/* ─────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────── */

export default function EngineDiagram({ onExit = () => {} }) {
  const [hoverId, setHoverId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [pulseId, setPulseId] = useState(STATIONS[0].id);
  const rootRef = useRef(null);
  const modalRef = useRef(null);
  const cardRefs = useRef({});

  const activeId = openId ?? hoverId;
  const focusing = !!activeId;

  /* Idle pulse cycle through stations */
  useEffect(() => {
    if (hoverId || openId) return;
    let i = 0;
    const tick = () => {
      setPulseId(STATIONS[i].id);
      i = (i + 1) % STATIONS.length;
    };
    tick();
    const id = setInterval(tick, 2100);
    return () => clearInterval(id);
  }, [hoverId, openId]);

  /* ESC: close modal first, then exit */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (openId) {
          setOpenId(null);
        } else {
          onExit();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId, onExit]);

  /* Click-outside on open card → close (only relevant when modal is open) */
  const onBackdrop = useCallback((e) => {
    if (e.target === e.currentTarget) setOpenId(null);
  }, []);

  /* Focus management for modal */
  useEffect(() => {
    if (openId && modalRef.current) {
      const btn = modalRef.current.querySelector('.ed-modal-close');
      if (btn) btn.focus();
    }
  }, [openId]);

  const openStation = useMemo(
    () => STATIONS.find((s) => s.id === openId) || null,
    [openId]
  );

  /* Outline paths memoized */
  const outerTop = useMemo(buildOuterTopPath, []);
  const outerBot = useMemo(buildOuterBottomPath, []);

  return (
    <div className="ed-root" ref={rootRef} role="region" aria-label="Engine cross-section portfolio">
      {/* Header */}
      <div className="ed-header">
        <button
          className="ed-exit"
          onClick={onExit}
          aria-label="Exit blueprint mode"
        >
          ← EXIT BLUEPRINT
        </button>
        <div className="ed-title" aria-hidden="false">
          ZACHARY ZEPPIERI
          <small>SENIOR CI ENGINEER · CHROMALLOY NY · BLUEPRINT MODE</small>
        </div>
        <div className="ed-meta" aria-hidden="true">
          DWG-001-Z<br />
          REV <span>2026.05</span><br />
          SHEET 1 OF 1
        </div>
      </div>

      {/* Stage */}
      <div className="ed-stage">
        <div className="ed-stage-inner">
          <div className="ed-scroll-hint">→ SCROLL HORIZONTALLY ←</div>

          <svg
            className={`ed-svg ${focusing ? 'is-focusing' : ''}`}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="xMidYMid meet"
            aria-label="Stylized aerospace turbofan engine cross-section"
            role="img"
          >
            <defs>
              <linearGradient id="ed-cl" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#4ec9d4" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#4ec9d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#4ec9d4" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            <g className="ed-vib">
              {/* Centerline */}
              <line
                className="ed-stroke-axis"
                x1={40} y1={CL} x2={VIEW_W - 40} y2={CL}
              />

              {/* Outer engine shell */}
              <path className="ed-stroke ed-draw d1" d={outerTop} />
              <path className="ed-stroke ed-draw d1" d={outerBot} />

              {/* Inner core shroud — small offset inside outer */}
              <path
                className="ed-stroke ed-stroke-thin ed-draw d2"
                d={buildInnerShroud('top')}
              />
              <path
                className="ed-stroke ed-stroke-thin ed-draw d2"
                d={buildInnerShroud('bot')}
              />

              {/* Spinner / nose cone */}
              <path
                className="ed-stroke ed-draw d1"
                d={`M${NOSE_X} ${CL} L${STATIONS[0].xL} ${CL - 95} M${NOSE_X} ${CL} L${STATIONS[0].xL} ${CL + 95}`}
              />

              {/* Rotating shaft (animated dash) */}
              <line
                className="ed-shaft"
                x1={STATIONS[0].xL} y1={CL}
                x2={STATIONS[6].xR} y2={CL}
              />

              {/* Blade stages per station */}
              {STATIONS.map((s) => {
                if (s.id === 'combustor') {
                  // Combustor: liner can + flame markers (no rotor blades)
                  return (
                    <g key={`blades-${s.id}`}>
                      <rect
                        x={s.xL + 12} y={CL - 38}
                        width={s.xR - s.xL - 24} height={20}
                        className="ed-stroke ed-stroke-thin"
                        rx={2}
                      />
                      <rect
                        x={s.xL + 12} y={CL + 18}
                        width={s.xR - s.xL - 24} height={20}
                        className="ed-stroke ed-stroke-thin"
                        rx={2}
                      />
                      {/* flame tick marks */}
                      {Array.from({ length: 5 }).map((_, i) => {
                        const x = s.xL + 22 + i * ((s.xR - s.xL - 44) / 4);
                        return (
                          <line
                            key={i}
                            className="ed-blades-hot"
                            x1={x} y1={CL - 14}
                            x2={x} y2={CL + 14}
                          />
                        );
                      })}
                    </g>
                  );
                }
                const count = bladeCount(s.id);
                const lines = bladeLines(s, count, false);
                return (
                  <g key={`blades-${s.id}`}>
                    {lines.map((l, i) => (
                      <line
                        key={i}
                        className="ed-blades"
                        x1={l.x1} y1={l.y1}
                        x2={l.x2} y2={l.y2}
                      />
                    ))}
                  </g>
                );
              })}

              {/* Station section dividers (vertical tick lines on the shell) */}
              {STATIONS.slice(1).map((s) => (
                <line
                  key={`div-${s.id}`}
                  className="ed-stroke ed-stroke-thin"
                  x1={s.xL} y1={s.topY}
                  x2={s.xL} y2={s.botY}
                />
              ))}

              {/* Clickable section regions — drawn last among engine bits so they catch pointer */}
              {STATIONS.map((s) => (
                <path
                  key={`sec-${s.id}`}
                  className={
                    'ed-section' +
                    (s.hot ? ' is-combustor' : '') +
                    (activeId === s.id ? ' is-active' : '')
                  }
                  d={stationSectionPath(s)}
                  onMouseEnter={() => setHoverId(s.id)}
                  onMouseLeave={() => setHoverId((h) => (h === s.id ? null : h))}
                  onClick={() => setOpenId(s.id)}
                  aria-hidden="true"
                />
              ))}

              {/* Callouts */}
              {STATIONS.map((s) => {
                const isActive = activeId === s.id;
                const isPulsing = !focusing && pulseId === s.id;
                return (
                  <g
                    key={`cal-${s.id}`}
                    className={`ed-callout ${isActive ? 'is-active' : ''}`}
                    onMouseEnter={() => setHoverId(s.id)}
                    onMouseLeave={() => setHoverId((h) => (h === s.id ? null : h))}
                    onClick={() => setOpenId(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpenId(s.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Station ${s.num}, ${s.name}: ${s.title}. Press enter for details.`}
                  >
                    <polyline
                      className="ed-callout-leader"
                      points={s.leader.map(([x, y]) => `${x},${y}`).join(' ')}
                    />
                    <circle
                      className="ed-callout-circle"
                      cx={s.calloutCx}
                      cy={s.calloutCy}
                      r={14}
                    />
                    {isPulsing && (
                      <circle
                        className="ed-pulse-ring"
                        cx={s.calloutCx}
                        cy={s.calloutCy}
                        r={14}
                      />
                    )}
                    <text
                      className="ed-callout-number"
                      x={s.calloutCx}
                      y={s.calloutCy}
                    >
                      {s.num}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Cards layer (desktop) — absolutely positioned over the SVG */}
        <div className="ed-cards" aria-hidden="false">
          {STATIONS.map((s, i) => {
            const isActive = activeId === s.id;
            // map svg coords → percentage within stage
            const leftPct = (s.cardX / VIEW_W) * 100;
            const topPct = (s.cardY / VIEW_H) * 100;
            return (
              <button
                key={`card-${s.id}`}
                ref={(el) => (cardRefs.current[s.id] = el)}
                className={
                  `ed-card s${i + 1}` +
                  (s.hot ? ' is-combustor' : '') +
                  (isActive ? ' is-active' : '')
                }
                style={{ left: `calc(${leftPct}% - 0px)`, top: `calc(${topPct}% - 0px)` }}
                onMouseEnter={() => setHoverId(s.id)}
                onMouseLeave={() => setHoverId((h) => (h === s.id ? null : h))}
                onClick={() => setOpenId(s.id)}
                aria-label={`${s.name}: ${s.title}. Open details.`}
              >
                <span className="ed-card-num">STA-{String(s.num).padStart(2, '0')} · {s.tag}</span>
                <div className="ed-card-station">{s.name}</div>
                <div className="ed-card-title">{s.title}</div>
                <div className="ed-card-body">{s.snippet}</div>
                <div className="ed-card-cta">[ CLICK FOR DETAIL → ]</div>
              </button>
            );
          })}
        </div>

        {/* Mobile / narrow-screen list */}
        <div className="ed-mobile-list" role="list">
          {STATIONS.map((s) => (
            <button
              key={`m-${s.id}`}
              className={`ed-mlist-item${s.hot ? ' is-combustor' : ''}`}
              onClick={() => setOpenId(s.id)}
              role="listitem"
              aria-label={`Station ${s.num}, ${s.name}: ${s.title}. Open details.`}
            >
              <div className="ed-mlist-num">{s.num}</div>
              <div className="ed-mlist-body">
                <div className="ed-mlist-station">{s.name}</div>
                <div className="ed-mlist-title">{s.title}</div>
                <div className="ed-mlist-snippet">{s.snippet}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {openStation && (
        <div
          className="ed-modal-back"
          onClick={onBackdrop}
          role="presentation"
        >
          <div
            ref={modalRef}
            className={`ed-modal${openStation.hot ? ' is-combustor' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ed-modal-heading"
          >
            <div className="ed-modal-head">
              <div>
                <div className="ed-modal-num">STA-{String(openStation.num).padStart(2, '0')}</div>
                <div className="ed-modal-station" id="ed-modal-heading">{openStation.name}</div>
                <div className="ed-modal-tag">{openStation.tag}</div>
              </div>
              <button
                className="ed-modal-close"
                onClick={() => setOpenId(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>
            <div className="ed-modal-title">{openStation.title}</div>
            <div className="ed-modal-body">
              <ul>
                {openStation.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
            <div className="ed-modal-foot">
              <span>PERIOD · {openStation.period}</span>
              <span>ESC OR CLICK OUTSIDE TO CLOSE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Inner core shroud (a parallel inner wall for depth) */
function buildInnerShroud(side) {
  const sign = side === 'top' ? -1 : 1;
  const pts = [
    [STATIONS[0].xR + 8, CL + sign * 95],
    [STATIONS[1].xL + 30, CL + sign * 78],
    [STATIONS[2].xL + 10, CL + sign * 50],
    [STATIONS[3].xL + 8,  CL + sign * 42],
    [STATIONS[3].xR - 4,  CL + sign * 42],
    [STATIONS[4].xL + 10, CL + sign * 50],
    [STATIONS[5].xL + 20, CL + sign * 70],
    [STATIONS[6].xL + 10, CL + sign * 85],
    [TAIL_X - 60, CL + sign * 60],
  ];
  return ptsToPath(pts);
}

/* Blade counts per compressor / turbine stage — stylized only */
function bladeCount(id) {
  switch (id) {
    case 'fan': return 7;
    case 'lpc': return 6;
    case 'hpc': return 9;
    case 'hpt': return 6;
    case 'lpt': return 7;
    case 'nozzle': return 3;
    default: return 5;
  }
}
