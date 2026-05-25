import { useEffect, useRef, useState, useCallback } from 'react';
import './a3-report.css';

/**
 * A3Report — full-screen takeover that presents Zach's career as a lean A3
 * problem-solving document. Designed to look like an 11x17 engineering A3
 * printout: paper background, two-column grid, red/orange section stamps,
 * serif headers + monospace body. Print-ready via window.print().
 */

const SECTIONS = [
  { id: 'sec-1', label: '1', title: 'Background' },
  { id: 'sec-2', label: '2', title: 'Current State' },
  { id: 'sec-3', label: '3', title: 'Goal / Target' },
  { id: 'sec-4', label: '4', title: 'Root Cause' },
  { id: 'sec-5', label: '5', title: 'Counter-Measures' },
  { id: 'sec-6', label: '6', title: 'Plan' },
  { id: 'sec-7', label: '7', title: 'Results' },
];

const TODAY = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

function KaizenBurst() {
  return (
    <svg className="a3-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 1 L13.5 8.5 L20 4 L16 11 L23 12 L16 13 L20 20 L13.5 15.5 L12 23 L10.5 15.5 L4 20 L8 13 L1 12 L8 11 L4 4 L10.5 8.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PdcaWheel() {
  return (
    <svg className="a3-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3 L12 12 L21 12" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 12 L3 12" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 12 L12 21" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <text x="7.5" y="9" fontSize="4.5" fontFamily="Georgia, serif" fill="currentColor">P</text>
      <text x="14" y="9" fontSize="4.5" fontFamily="Georgia, serif" fill="currentColor">D</text>
      <text x="14" y="18.5" fontSize="4.5" fontFamily="Georgia, serif" fill="currentColor">C</text>
      <text x="7.5" y="18.5" fontSize="4.5" fontFamily="Georgia, serif" fill="currentColor">A</text>
    </svg>
  );
}

function FiveSStar() {
  return (
    <svg className="a3-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <text x="12" y="14.5" textAnchor="middle" fontSize="7" fontFamily="Georgia, serif" fontWeight="700" fill="currentColor">5S</text>
    </svg>
  );
}

function SectionStamp({ num, title, icon }) {
  return (
    <header className="a3-section-stamp">
      <span className="a3-stamp-num" aria-hidden="true">{num}</span>
      <h2 className="a3-stamp-title">{title}</h2>
      {icon && <span className="a3-stamp-icon">{icon}</span>}
    </header>
  );
}

export default function A3Report({ onExit = () => {} }) {
  const rootRef = useRef(null);
  const [activeSection, setActiveSection] = useState('sec-1');
  const reducedMotion = useRef(false);

  // Detect reduced motion preference
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = mql.matches;
    const onChange = (e) => { reducedMotion.current = e.matches; };
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);

  // Lock body scroll while takeover is active
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // ESC closes
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  // Active-section tracker via IntersectionObserver
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = SECTIONS
      .map((s) => root.querySelector(`#${s.id}`))
      .filter(Boolean);
    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top that is intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { root, rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  const jumpTo = useCallback((id) => {
    const root = rootRef.current;
    const el = root?.querySelector(`#${id}`);
    if (!el) return;
    el.scrollIntoView({
      behavior: reducedMotion.current ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  const handlePrint = useCallback(() => {
    // Brief delay lets the @media print styles settle when triggered.
    window.print();
  }, []);

  return (
    <div className="a3-takeover" role="document" aria-label="A3 Problem-Solving Report">
      {/* Top toolbar — hidden in print */}
      <div className="a3-toolbar no-print">
        <nav className="a3-tabs" aria-label="A3 section navigation">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`a3-tab ${activeSection === s.id ? 'is-active' : ''}`}
              onClick={() => jumpTo(s.id)}
              aria-current={activeSection === s.id ? 'true' : 'false'}
            >
              <span className="a3-tab-num">{s.label}</span>
              <span className="a3-tab-label">{s.title}</span>
            </button>
          ))}
        </nav>
        <div className="a3-toolbar-actions">
          <button type="button" className="a3-btn a3-btn-print" onClick={handlePrint}>
            Print / Export PDF
          </button>
          <button
            type="button"
            className="a3-btn a3-btn-close"
            onClick={onExit}
            aria-label="Close A3 report"
            title="Close (Esc)"
          >
            ×
          </button>
        </div>
      </div>

      <div className="a3-scroll" ref={rootRef}>
        <article className="a3-sheet">
          {/* ── HEADER BAR ── */}
          <header className="a3-header">
            <div className="a3-header-title">
              <div className="a3-title-main">A3 PROBLEM-SOLVING REPORT</div>
              <div className="a3-title-sub">
                Project: Career Transition — From Generalist CI to Senior MES Systems Engineer
              </div>
            </div>
            <div className="a3-header-meta">
              <dl>
                <div><dt>Date</dt><dd>{TODAY}</dd></div>
                <div><dt>Owner</dt><dd>Zachary Zeppieri</dd></div>
                <div><dt>Prepared by</dt><dd>Zachary Zeppieri</dd></div>
                <div><dt>Revision</dt><dd>v3.2</dd></div>
              </dl>
            </div>
          </header>

          {/* ── BODY GRID ── */}
          <div className="a3-grid">
            {/* ============ LEFT COLUMN (40%) ============ */}
            <div className="a3-col a3-col-left">

              {/* 1. BACKGROUND */}
              <section id="sec-1" className="a3-section">
                <SectionStamp num="1" title="Background" icon={<KaizenBurst />} />
                <p className="a3-body">
                  Senior CI leader and sole CI practitioner at a Tier-1 aerospace MRO.
                  Three years in: hit every performance target, ran <strong>29 Kaizen
                  events across 5 sites</strong>, saved <strong>30,000+ verified labor
                  hours</strong>, hold a <strong>patent-pending fixture</strong>, shipped
                  a Python framework + custom MES toolchain. Now seeking to deploy the
                  same lean + AI-augmented discipline at scale.
                </p>
              </section>

              {/* 2. CURRENT STATE */}
              <section id="sec-2" className="a3-section">
                <SectionStamp num="2" title="Current State" icon={<FiveSStar />} />
                <ul className="a3-bullets">
                  <li>Sole CI practitioner at Chromalloy NY site</li>
                  <li>Sustained KPIs through multi-year workforce reductions</li>
                  <li>$2.4M Blade Cell capital project delivered <strong>$350K under budget</strong></li>
                  <li><strong>30,000+ hrs</strong> productivity savings (2024–2025)</li>
                  <li>5S Go-To-Gemba score: <strong>15 → 85</strong> points</li>
                  <li>Baffle Extraction Tool — patent pending, <strong>$100K+ / yr</strong></li>
                  <li>Tulip MES Windsor site PM — Feb 2026 onward</li>
                </ul>
              </section>

              {/* 4. ROOT CAUSE / 5 WHYS */}
              <section id="sec-4" className="a3-section">
                <SectionStamp num="4" title="Root Cause — 5 Whys" />
                <ol className="a3-whys">
                  <li>
                    <span className="a3-why-q">Why is career growth ceilinged at site-only role?</span>
                    <span className="a3-why-a">→ Single-site scope caps measurable impact for next promotion gate.</span>
                  </li>
                  <li>
                    <span className="a3-why-q">Why does site scope cap the next gate?</span>
                    <span className="a3-why-a">→ Multi-site authority requires a platform / systems mandate, not a site CI mandate.</span>
                  </li>
                  <li>
                    <span className="a3-why-q">Why no systems mandate yet?</span>
                    <span className="a3-why-a">→ MES + tooling work has been delivered as side-of-desk, not as a recognized role.</span>
                  </li>
                  <li>
                    <span className="a3-why-q">Why delivered side-of-desk?</span>
                    <span className="a3-why-a">→ Org chart treats CI + digital tooling as separate disciplines; the AI-augmented hybrid has no slot.</span>
                  </li>
                  <li>
                    <span className="a3-why-q">Why no slot for the hybrid?</span>
                    <span className="a3-why-a">
                      → <strong>Root cause:</strong> Insufficient external visibility of the
                      full AI-augmented technical breadth — résumés and titles under-state
                      the actual scope shipped.
                    </span>
                  </li>
                </ol>
              </section>
            </div>

            {/* ============ RIGHT COLUMN (60%) ============ */}
            <div className="a3-col a3-col-right">

              {/* 3. GOAL / TARGET STATE */}
              <section id="sec-3" className="a3-section">
                <SectionStamp num="3" title="Goal / Target State" icon={<PdcaWheel />} />
                <div className="a3-target-grid">
                  <div className="a3-target-card">
                    <div className="a3-target-k">Role</div>
                    <div className="a3-target-v">Manufacturing systems / MES engineering</div>
                  </div>
                  <div className="a3-target-card">
                    <div className="a3-target-k">Scope</div>
                    <div className="a3-target-v">Multi-site or platform-wide</div>
                  </div>
                  <div className="a3-target-card">
                    <div className="a3-target-k">Position</div>
                    <div className="a3-target-v">Bridge between lean ops and digital tooling</div>
                  </div>
                  <div className="a3-target-card">
                    <div className="a3-target-k">Comp</div>
                    <div className="a3-target-v">Aligned with software + ops leadership market</div>
                  </div>
                </div>
              </section>

              {/* 5. COUNTER-MEASURES */}
              <section id="sec-5" className="a3-section">
                <SectionStamp num="5" title="Counter-Measures" />
                <ul className="a3-bullets a3-bullets-checked">
                  <li><span className="a3-check">✓</span>Multi-format portfolio (this website, A3, terminal mode, corkboard)</li>
                  <li><span className="a3-check">✓</span>Patent application filed — in review</li>
                  <li><span className="a3-check">✓</span>Cross-site Kaizen leadership (5 facilities and counting)</li>
                  <li><span className="a3-check">✓</span>Lunch-and-Learn training program (<strong>77+ trained</strong>)</li>
                  <li><span className="a3-check">✓</span>Open development of MES tooling (Python framework, AI PM toolchain)</li>
                </ul>
              </section>

              {/* 6. IMPLEMENTATION PLAN */}
              <section id="sec-6" className="a3-section">
                <SectionStamp num="6" title="Implementation Plan" />
                <div className="a3-table-wrap">
                  <table className="a3-table">
                    <thead>
                      <tr>
                        <th>Phase</th>
                        <th>Owner</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Portfolio + brand build</td>
                        <td>Zach</td>
                        <td>Q4 2025</td>
                        <td>Q1 2026</td>
                        <td><span className="a3-pill a3-pill-done">Complete</span></td>
                      </tr>
                      <tr>
                        <td>Tulip MES Windsor pilot</td>
                        <td>Zach + PwC</td>
                        <td>Feb 2026</td>
                        <td>May 2026</td>
                        <td><span className="a3-pill a3-pill-track">On track</span></td>
                      </tr>
                      <tr>
                        <td>MES go-live</td>
                        <td>Joint</td>
                        <td>Sep 2026</td>
                        <td>Sep 2026</td>
                        <td><span className="a3-pill a3-pill-plan">Planned</span></td>
                      </tr>
                      <tr>
                        <td>Manage 2 CI Practitioners</td>
                        <td>Zach</td>
                        <td>Q4 2026</td>
                        <td>—</td>
                        <td><span className="a3-pill a3-pill-track">Hiring</span></td>
                      </tr>
                      <tr>
                        <td>External role transition</td>
                        <td>Zach</td>
                        <td>Q1 2027</td>
                        <td>TBD</td>
                        <td><span className="a3-pill a3-pill-active">Active</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 7. FOLLOW-UP / RESULTS */}
              <section id="sec-7" className="a3-section">
                <SectionStamp num="7" title="Follow-Up / Results" icon={<KaizenBurst />} />
                <div className="a3-table-wrap">
                  <table className="a3-table a3-table-results">
                    <thead>
                      <tr>
                        <th>KPI</th>
                        <th>2023</th>
                        <th>2024</th>
                        <th>2025</th>
                        <th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Productivity hrs saved</td>
                        <td>~8,500</td>
                        <td>~14,200</td>
                        <td><strong>15,800+</strong></td>
                        <td><span className="a3-trend a3-trend-up">▲</span></td>
                      </tr>
                      <tr>
                        <td>Kaizen events led</td>
                        <td>6</td>
                        <td>11</td>
                        <td><strong>12</strong></td>
                        <td><span className="a3-trend a3-trend-up">▲</span></td>
                      </tr>
                      <tr>
                        <td>5S Go-To-Gemba score</td>
                        <td>15</td>
                        <td>58</td>
                        <td><strong>85</strong></td>
                        <td><span className="a3-trend a3-trend-up">▲</span></td>
                      </tr>
                      <tr>
                        <td>Sites worked</td>
                        <td>1</td>
                        <td>3</td>
                        <td><strong>5</strong></td>
                        <td><span className="a3-trend a3-trend-up">▲</span></td>
                      </tr>
                      <tr>
                        <td>People trained (L&amp;L)</td>
                        <td>—</td>
                        <td>32</td>
                        <td><strong>77+</strong></td>
                        <td><span className="a3-trend a3-trend-up">▲</span></td>
                      </tr>
                      <tr>
                        <td>Capital projects led</td>
                        <td>0</td>
                        <td>1</td>
                        <td><strong>2</strong></td>
                        <td><span className="a3-trend a3-trend-up">▲</span></td>
                      </tr>
                      <tr>
                        <td>Patents filed</td>
                        <td>0</td>
                        <td>0</td>
                        <td><strong>1</strong></td>
                        <td><span className="a3-trend a3-trend-up">▲</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="a3-footnote">
                  PDCA cycle in flight — next review gate at MES Windsor go-live (Sep 2026).
                </p>
              </section>
            </div>
          </div>

          {/* ── FOOTER STRIP ── */}
          <footer className="a3-footer">
            <span>Chromalloy NY · Continuous Improvement</span>
            <span>Form: A3-CI-001 · Rev. v3.2</span>
            <span>Page 1 of 1</span>
          </footer>
        </article>
      </div>
    </div>
  );
}
