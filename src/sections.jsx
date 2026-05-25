import { useEffect } from 'react'
import { DevEditable } from './lib/DevMode'
import StatsCard from './widgets/StatsCard'
import CircuitSnake from './games/CircuitSnake'
import PrinterSim from './games/PrinterSim'
import CareerTimeline from './widgets/CareerTimeline'
import ProductivityCounter from './widgets/ProductivityCounter'
import SkillsConstellation from './widgets/SkillsConstellation'
import LeanLego from './games/LeanLego'
import ResumeButton from './widgets/ResumeButton'
import ActivityFeed from './widgets/ActivityFeed'
import ScrambleText from './effects/ScrambleText'

/* ── Helper: dispatch section-visited event on mount (drives achievements) ── */
function useSectionVisit(id) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('achievement:section-visited', { detail: { id } }))
  }, [id])
}

/* ── About Me ── */
function AboutMe() {
  useSectionVisit('about')
  return (
    <div className="section-page">
      <div className="sec-inner">
        <p className="sec-eyebrow"><DevEditable id="about.eyebrow">01 — About</DevEditable></p>
        <h1 className="sec-title"><DevEditable id="about.title">About<br />Me</DevEditable></h1>
        <p className="sec-body">
          <DevEditable id="about.body1">
            Senior continuous improvement leader and sole CI practitioner at a Tier-1 aerospace MRO through workforce reductions — promoted twice in three years and trusted with a multi-million-dollar Manufacturing Execution System (MES) program.
          </DevEditable>
        </p>
        <div className="sec-divider" />
        <p className="sec-body" style={{ marginTop: '1.5rem' }}>
          <DevEditable id="about.body2">
            My work sits at the intersection of lean manufacturing, MES platform implementation, and AI-augmented engineering — decomposing operations problems and shipping the production tooling the floor actually needs.
          </DevEditable>
        </p>
        <div className="placeholder-grid" style={{ marginTop: '3rem' }}>
          {[
            { label: 'Productivity Saved', value: '30,000+ hrs', sub: '2024–2025 across all product lines' },
            { label: 'Kaizen Events Led', value: '29', sub: '5 sites, 5 external multi-day events' },
            { label: 'Promotions', value: '2 in 3 yrs', sub: 'Associate → Sr CI Analyst' },
            { label: 'Patent', value: 'Pending', sub: 'Baffle Extraction Tool (2024)' },
          ].map((c, i) => (
            <div key={c.label} className="placeholder-card" style={{ '--i': i }}>
              <div className="card-label">{c.label}</div>
              <div className="card-value">{c.value}</div>
              <div className="card-sub">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Live productivity counter */}
        <div style={{ marginTop: '3rem', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
          <p className="sec-eyebrow" style={{ textAlign: 'center' }}>live · cumulative impact</p>
          <ProductivityCounter />
        </div>

        {/* Career Stats Card — Pokemon-style holographic widget */}
        <div style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <p className="sec-eyebrow" style={{ textAlign: 'center' }}>collectible · 001/001</p>
          <StatsCard />
        </div>

        {/* Resume download with celebration */}
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
          <ResumeButton />
        </div>
      </div>
    </div>
  )
}

/* ── Work Experience ── */
function WorkExperience() {
  useSectionVisit('experience')
  const jobs = [
    {
      title: 'Senior Continuous Improvement Analyst',
      company: 'Chromalloy Gas Turbine, LLC',
      period: '2025 — Present',
      bullets: [
        'Lead the Chromalloy customer side of a multi-million-dollar Tulip MES deployment at the Windsor (CT) site with PwC as implementation partner — driving Project Plan, Validation Approach, Base Layout, and core architecture decisions toward a May 2026 pilot and Sept 2026 go-live.',
        'Architected an AI-augmented PM toolchain to run the in-flight program — custom Claude-based PM framework, offline Obsidian-style D3 knowledge graph with prompt-engineered context retention, Microsoft Copilot automations ingesting emails and Teams messages, and a Smartsheet writeback pipeline (via Model Context Protocol) for bi-weekly executive updates.',
        'Delivered ~30,000 hours of verified productivity savings across all product lines (2024–2025), exceeding the 2025 target by 30%.',
        'Mentored a continuous-improvement intern who was hired full-time as an engineer; preparing to manage two co-ops in 2026.',
      ],
    },
    {
      title: 'Continuous Improvement Analyst',
      company: 'Chromalloy Gas Turbine, LLC',
      period: '2023 — 2025',
      bullets: [
        'Reduced Blade Cell Gate 1 turnaround time (TAT) from 14 days to 4.75 days against a 4-day target — designed the Line of Balance board, standardized Op20 induction, and led the Wax-area improvement Kaizen.',
        'Drove a 5S Go-To-Gemba program from a 15-point baseline to 85 points by end of 2024 — 16 Bronze, 17 Silver, and 3 Gold-rated areas.',
        'Facilitated 29 Kaizen events across five Chromalloy sites including five external multi-day cross-functional engagements — CFM56-7B 3P, Plasma / LPPS / EPS / Vac36 TPMs, and the CSD Lean Leadership Week engine bay overhaul.',
        'Designed and ran a Continuous Improvement Lunch-and-Learn program — 14 sessions reaching 77+ employees across all three shifts.',
        'Designed and developed a patent-pending fixture enabling in-house baffle refurbishment — estimated $100K+ annual savings.',
        'Sole CI practitioner at the New York site through a multi-year workforce reduction — sustained and grew the lean program\'s measurable output.',
      ],
    },
    {
      title: 'Associate, Continuous Improvement Analyst',
      company: 'Chromalloy Gas Turbine, LLC',
      period: '2022 — 2023',
      bullets: [
        'Led the deployment of a $2.4M Blade Cell capital project (CapEx approved Nov 2022) — directed a team of 20, applied 3P / cellular-flow design, and returned $350K to budget for critical spares.',
        'Drove site fundamentals — 5S+1 deployment, Ideas Program participation, and Lean Leadership Week engagements at sister facilities.',
        'Earned Six Sigma Green Belt certification.',
      ],
    },
  ]

  return (
    <div className="section-page">
            <div className="sec-inner">
        <p className="sec-eyebrow">02 — Career</p>
        <h1 className="sec-title">Work<br />Experience</h1>
        <p className="sec-body" style={{ marginBottom: '2rem' }}>
          One company. Three titles. Two promotions in three years. Same site through workforce reductions — measurable lean and operational outcomes the whole way through.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {jobs.map((j, i) => (
            <div key={i} className="job-entry" style={{ '--i': i }}>
              <div>
                <div className="job-period">{j.period}</div>
                <div className="job-company">{j.company}</div>
              </div>
              <div>
                <h3 className="job-title">{j.title}</h3>
                <ul className="job-bullets">
                  {j.bullets.map((b, bi) => (
                    <li key={bi} className="job-bullet">
                      <span className="job-bullet-marker">▸</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive career timeline — 2022 → Q4 2026 */}
        <div style={{ marginTop: '3rem' }}>
          <p className="sec-eyebrow">interactive · scroll, drag, or click stops</p>
          <h2 className="sec-title" style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>Career<br/>Timeline</h2>
          <div style={{ width: '100%', height: 'clamp(520px, 70vh, 680px)' }}>
            <CareerTimeline />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Skills ── */
function Skills() {
  useSectionVisit('skills')
  const cats = [
    { name: 'Lean & Continuous Improvement', color: '#a855f7', items: ['Six Sigma Green Belt', 'Kaizen / K3 Facilitation', 'Value Stream Mapping', 'Total Productive Maintenance', '3P (Production-Preparation-Process)', '5S+1', 'Toyota Production System', 'Standard Work', 'Line of Balance', 'Kamishibai'] },
    { name: 'Manufacturing Execution Systems', color: '#a855f7', items: ['Tulip MES (PM + Custom App Dev)', 'MES Router Framework Design', 'Work-Instruction Digitization', 'SyteLine ERP Integration', 'Model Context Protocol (MCP)'] },
    { name: 'Program & Project Management', color: '#a855f7', items: ['Multi-Million-Dollar Programs', 'RACI Design', 'Risk Register / RAID', 'Vendor Commercials', 'Cross-Functional Steering', 'Change Management'] },
    { name: 'Coaching & Training', color: '#a855f7', items: ['Lunch-and-Learn Program Design', 'Operator Coaching', 'Leadership Accountability Systems', 'Employee Ideas Program', 'People Leadership (Intern → FT Hire)'] },
    { name: 'Software & Automation (AI-Augmented)', color: '#a855f7', items: ['Python (PySide6, SQLite)', 'JavaScript / D3.js', 'HTML / CSS', 'Power Automate + Forms', 'Claude / Copilot Orchestration'] },
    { name: 'CAD & Engineering', color: '#a855f7', items: ['SOLIDWORKS', 'Siemens NX', 'Visio / SketchUp', '3D Printing (Production Tooling)', 'GD&T', 'FEA'] },
  ]

  return (
    <div className="section-page">
            <div className="sec-inner">
        <p className="sec-eyebrow">03 — Capabilities</p>
        <h1 className="sec-title">Skills</h1>
        <div className="placeholder-grid">
          {cats.map((c, i) => (
            <div key={c.name} className="placeholder-card" style={{ '--i': i }}>
              <div className="card-label">{c.name}</div>
              <ul style={{ listStyle: 'none', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {c.items.map(item => (
                  <li key={item} className="list-item">
                    <span className="list-marker" style={{ color: 'var(--accent)' }}>▸</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Interactive skills constellation — force-directed graph */}
        <div style={{ marginTop: '3rem' }}>
          <p className="sec-eyebrow">interactive · drag a node, hover to highlight cluster</p>
          <h2 className="sec-title" style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>Skills<br/>Constellation</h2>
          <div style={{ width: '100%', height: 560 }}>
            <SkillsConstellation />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Projects ── */
function Projects() {
  useSectionVisit('projects')
  return (
    <div className="section-page">
            <div className="sec-inner">
        <p className="sec-eyebrow">04 — Work</p>
        <h1 className="sec-title">Projects</h1>
        <p className="sec-body">Manufacturing programs, software builds, and engineered tooling shipped to production.</p>
        <div className="sec-divider" />
        <div className="placeholder-grid" style={{ marginTop: 0 }}>
          {[
            { label: 'MES Deployment · Feb 2026 → Present', value: 'Tulip MES @ Windsor, CT', sub: 'Leading a multi-million-dollar Tulip MES rollout with PwC as implementation partner. Built an AI-augmented PM toolchain — custom Claude PM framework, prompt-engineered knowledge graph, Copilot automations consuming emails / Teams, and a Smartsheet writeback pipeline (via MCP) automating bi-weekly executive updates.' },
            { label: 'Capital Project · Nov 2022 → Jun 2023', value: 'Blade Cell — $2.4M, team of 20', sub: 'Led from CapEx approval through deployment. Cellular-flow / 3P design, cross-functional coordination, returned $350K to budget for critical spares.' },
            { label: 'Software / Automation · 2025–2026', value: 'OEM Tracker (Python desktop + web)', sub: 'Replaced a 14 MB / 70-sheet VBA Excel macro tracker with a Python desktop app (PySide6, SQLite) distributed as a Windows executable, plus a parallel Python web version with zero external dependencies.' },
            { label: 'Patent Pending · 2024', value: 'Baffle Extraction Tool', sub: 'Designed and developed an engineered fixture enabling in-house baffle refurbishment instead of OEM purchase — estimated $100K+/yr potential savings. Currently in patent application.' },
            { label: 'Automation Toolkit · 2024–Present', value: 'Reporting + 3D-Printed Tooling', sub: 'Monthly reporting automation (4+ hrs → <30 min), VSM generation (>40 hrs → near zero) for ~100 operations, and dozens of 3D-printed shop-floor fixtures — including CBN boot molds delivered in under 24 hours that saved 2–3 days of vendor TAT for 59 repair blades.' },
          ].map((c, i) => (
            <div key={c.label} className="placeholder-card" style={{ cursor: 'pointer', '--i': i }}>
              <div className="card-label">{c.label}</div>
              <div className="card-value" style={{ fontSize: '1.1rem' }}>{c.value}</div>
              <div className="card-sub">{c.sub}</div>
            </div>
          ))}
        </div>
        <div
          className="github-card"
          onClick={() => window.open('https://github.com/zzeppieri', '_blank', 'noopener,noreferrer')}
          style={{ cursor: 'pointer' }}
        >
          <div className="github-card-icon">💻</div>
          <div className="github-card-text">
            <div className="github-card-label">GitHub</div>
            <div className="github-card-desc">View my code & open-source work →</div>
          </div>
          <div className="github-card-arrow">→</div>
        </div>
      </div>
    </div>
  )
}

/* ── CAD & 3D Print ── */
function CadProjects() {
  useSectionVisit('cad')
  return (
    <div className="section-page">
            <div className="sec-inner">
        <p className="sec-eyebrow">05 — Engineering</p>
        <h1 className="sec-title">CAD &<br />3D Print</h1>
        <p className="sec-body">Engineered fixtures, rapid shop-floor tooling, and cellular-flow layouts. Where mechanical engineering meets the actual production floor.</p>
        <div className="sec-divider" />
        <div className="placeholder-grid" style={{ marginTop: 0 }}>
          {[
            { label: 'Patent Pending', value: 'Baffle Extraction Fixture', sub: 'SOLIDWORKS design + 3D-printed prototype iterations for in-house gas turbine engine baffle removal without significant damage. Currently in patent application; follow-on automation work scoped.' },
            { label: '3D Printing', value: 'CBN Boot Molds (<24 hr turnaround)', sub: 'Delivered in under 24 hours for 59 repair blades — saved 2–3 days of vendor TAT and replaced a $521 SLA print order.' },
            { label: '3D Printing', value: 'Shop-Floor Fixture Library', sub: 'Dozens of in-house printed solutions — polishing-disc contamination stand, CFM blistering grit boot with positive-pressure inserts, LM9000 plasma-tape escape alignment tool, more.' },
            { label: 'Capital Project Layouts', value: 'Cellular-Flow Design', sub: 'Blade Cell layout (3P methodology), TSTL / GE future-state capacity planning, coater prep and LPPS14 work layouts.' },
          ].map((c, i) => (
            <div key={c.label} className="placeholder-card" style={{ '--i': i }}>
              <div className="card-label">{c.label}</div>
              <div className="card-value" style={{ fontSize: '1.1rem' }}>{c.value}</div>
              <div className="card-sub">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* 3D Printer Simulator — interactive demo */}
        <div style={{ marginTop: '3rem' }}>
          <p className="sec-eyebrow">live demo · click a part and press start</p>
          <h2 className="sec-title" style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>3D Print<br/>Simulator</h2>
          <PrinterSim />
        </div>
      </div>
    </div>
  )
}

/* ── Tools ── */
function Tools() {
  useSectionVisit('tools')

  const tools = [
    { cat: 'CAD / Design', items: ['SOLIDWORKS', 'Siemens NX', 'Visio Professional', 'SketchUp', '3D Printing (FDM)'] },
    { cat: 'Manufacturing Systems', items: ['Tulip MES', 'SyteLine ERP', 'Model Context Protocol (MCP)', 'Smartsheet'] },
    { cat: 'Software & Scripting', items: ['Python (PySide6, SQLite)', 'JavaScript / D3.js', 'HTML / CSS', 'PptxGenJS'] },
    { cat: 'AI Co-Pilots', items: ['Claude (Anthropic)', 'Microsoft Copilot', 'Custom Claude PM Framework', 'AI-Augmented Engineering'] },
    { cat: 'Data & Analytics', items: ['Minitab', 'MATLAB', 'Advanced Excel', 'Power Automate', 'Microsoft Forms'] },
    { cat: 'Lean Tools', items: ['Value Stream Mapping', 'A3 Problem Solving', 'PFMEA', 'Kamishibai Accountability', 'Line of Balance Boards', 'T3 / T5 Tier Boards'] },
  ]

  return (
    <div className="section-page">
            <div className="sec-inner">
        <p className="sec-eyebrow"><ScrambleText text="06 — Stack" duration={600} /></p>
        <h1 className="sec-title">Tools</h1>
        <div className="placeholder-grid">
          {tools.map((t, i) => (
            <div key={t.cat} className="placeholder-card" style={{ '--i': i }}>
              <div className="card-label">{t.cat}</div>
              <ul style={{ listStyle: 'none', marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {t.items.map(item => (
                  <li key={item} className="list-item">
                    <span className="list-marker" style={{ color: 'var(--accent)' }}>▸</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Live activity feed */}
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}

/* ── Hobbies ── */
function Hobbies() {
  useSectionVisit('hobbies')
  const items = [
    { emoji: '🖨️', label: '3D Printing & Design', desc: 'Designing and printing — fixtures, tools, and side projects that scratch the engineering itch.' },
    { emoji: '🎳', label: 'Bowling', desc: 'League nights and weekend games.' },
    { emoji: '🥾', label: 'Hiking', desc: 'Trails and weekend ridge climbs around the Hudson Valley.' },
    { emoji: '💪', label: 'Physical Fitness', desc: 'Strength and conditioning — staying sharp body and mind.' },
    { emoji: '🎮', label: 'PC Gaming', desc: 'Strategy and immersive games when the brain needs a different problem to solve.' },
    { emoji: '📸', label: 'Photography & Audio', desc: 'Quiet hobbies — composition and signal chains are engineering in different languages.' },
  ]

  return (
    <div className="section-page">
            <div className="sec-inner">
        <p className="sec-eyebrow"><ScrambleText text="07 — Life" duration={600} /></p>
        <h1 className="sec-title">Hobbies</h1>
        <p className="sec-body">What I'm up to when I'm not optimizing manufacturing processes.</p>
        <div className="placeholder-grid" style={{ marginTop: '2rem' }}>
          {items.map((h, i) => (
            <div key={h.label} className="placeholder-card" style={{ '--i': i }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{h.emoji}</div>
              <div className="card-label">{h.label}</div>
              <div className="card-sub" style={{ marginTop: '0.3rem' }}>{h.desc}</div>
            </div>
          ))}
        </div>

        {/* Snake on a Circuit Board — easter-egg mini game */}
        <div style={{ marginTop: '3rem' }}>
          <p className="sec-eyebrow">easter egg · arrow keys or swipe</p>
          <h2 className="sec-title" style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>Snake on a<br/>Circuit Board</h2>
          <CircuitSnake />
        </div>

        {/* Lean Lego — 5S drag-and-drop puzzle game */}
        <div style={{ marginTop: '3rem' }}>
          <p className="sec-eyebrow">on-brand mini-game · drag tools into the correct 5S zones</p>
          <h2 className="sec-title" style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>Lean Lego<br/>5S Workshop</h2>
          <div style={{ width: '100%', maxWidth: 1100, height: 720, margin: '0 auto' }}>
            <LeanLego />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Export map ── */
export default {
  about:      AboutMe,
  experience: WorkExperience,
  skills:     Skills,
  projects:   Projects,
  cad:        CadProjects,
  tools:      Tools,
  hobbies:    Hobbies,
}
