/* ── Shared back button ── */
function BackBtn({ onBack }) {
  return (
    <button className="back-btn" onClick={onBack}>
      ← Back
    </button>
  )
}

/* ── About Me ── */
function AboutMe({ onBack }) {
  return (
    <div className="section-page">
      <BackBtn onBack={onBack} />
      <div className="sec-inner">
        <p className="sec-eyebrow">01 — About</p>
        <h1 className="sec-title">About<br />Me</h1>
        <p className="sec-body">
          I'm a Lean Manufacturing Engineer and Project Manager passionate about designing
          smarter systems, eliminating waste, and leading cross-functional teams toward
          measurable improvement.
        </p>
        <div className="sec-divider" />
        <p className="sec-body" style={{ marginTop: '1.5rem' }}>
          My work sits at the intersection of <strong style={{ color: '#f0ede8' }}>process engineering,
          operational excellence, and human-centered design</strong> — combining technical rigor
          with the ability to align people and projects around a shared goal.
        </p>
        <div className="placeholder-grid" style={{ marginTop: '3rem' }}>
          {[
            { label: 'Experience', value: '5+ Years', sub: 'Manufacturing & PM' },
            { label: 'Projects Led', value: '20+', sub: 'End-to-end delivery' },
            { label: 'Methodology', value: 'Lean', sub: 'TPS / Kaizen driven' },
            { label: 'Certified', value: 'PMP', sub: 'Project Management' },
          ].map(c => (
            <div key={c.label} className="placeholder-card">
              <div className="card-label">{c.label}</div>
              <div className="card-value">{c.value}</div>
              <div className="card-sub">{c.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Work Experience ── */
function WorkExperience({ onBack }) {
  const jobs = [
    {
      title: 'Lean Manufacturing Engineer',
      company: 'Your Current Company',
      period: '2022 — Present',
      bullets: [
        'Led value stream mapping workshops reducing cycle time by X%',
        'Facilitated kaizen events across multiple manufacturing cells',
        'Implemented visual management systems plant-wide',
        'Drove 5S initiatives and standardized work documentation',
      ],
    },
    {
      title: 'Project Manager',
      company: 'Previous Company',
      period: '2020 — 2022',
      bullets: [
        'Managed portfolio of capital and CI projects from initiation to close',
        'Improved on-time delivery rate by introducing project governance framework',
        'Coordinated cross-functional stakeholders across 4 departments',
        'Maintained project schedules, budgets, and risk registers',
      ],
    },
    {
      title: 'Manufacturing Engineer',
      company: 'Earlier Company',
      period: '2018 — 2020',
      bullets: [
        'Supported production floor with engineering analysis and tooling design',
        'Collaborated with quality teams on root cause analysis',
        'Documented process workflows and work instructions',
      ],
    },
  ]

  return (
    <div className="section-page">
      <BackBtn onBack={onBack} />
      <div className="sec-inner">
        <p className="sec-eyebrow">02 — Career</p>
        <h1 className="sec-title">Work<br />Experience</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {jobs.map((j, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--border)', padding: '2.5rem 0', display: 'grid', gridTemplateColumns: '180px 1fr', gap: '3rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#4f9cf9', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{j.period}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.4rem' }}>{j.company}</div>
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.06em', marginBottom: '1rem' }}>{j.title}</h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {j.bullets.map((b, bi) => (
                    <li key={bi} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#8080a8', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', lineHeight: '1.6' }}>
                      <span style={{ color: '#4f9cf9', flexShrink: 0 }}>▸</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Skills ── */
function Skills({ onBack }) {
  const cats = [
    { name: 'Lean & CI', color: '#a855f7', items: ['Value Stream Mapping', 'Kaizen / PDCA', '5S Visual Management', 'Waste Elimination', 'Standardized Work'] },
    { name: 'Project Mgmt', color: '#a855f7', items: ['Planning & Scheduling', 'Stakeholder Comms', 'Risk Management', 'Budget Tracking', 'Change Management'] },
    { name: 'Engineering', color: '#a855f7', items: ['Root Cause Analysis', 'FMEA / DMAIC', 'Process Capability', 'SPC & Data Analysis', 'Six Sigma'] },
    { name: 'Software', color: '#a855f7', items: ['AutoCAD / SolidWorks', 'MS Project', 'Excel / Power BI', 'SAP / Oracle ERP', 'Minitab'] },
    { name: 'Leadership', color: '#a855f7', items: ['Team Facilitation', 'Executive Presentations', 'Mentoring & Coaching', 'Cross-functional Teams'] },
    { name: 'Certs', color: '#a855f7', items: ['PMP Certified', 'LSSGB', 'OSHA 30-Hour', 'B.S. Industrial Engineering'] },
  ]

  return (
    <div className="section-page">
      <BackBtn onBack={onBack} />
      <div className="sec-inner">
        <p className="sec-eyebrow">03 — Capabilities</p>
        <h1 className="sec-title">Skills</h1>
        <div className="placeholder-grid">
          {cats.map(c => (
            <div key={c.name} className="placeholder-card">
              <div className="card-label" style={{ color: '#a855f7' }}>{c.name}</div>
              <ul style={{ listStyle: 'none', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {c.items.map(item => (
                  <li key={item} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#a855f7', fontSize: '0.5rem' }}>▸</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Projects ── */
function Projects({ onBack }) {
  return (
    <div className="section-page">
      <BackBtn onBack={onBack} />
      <div className="sec-inner">
        <p className="sec-eyebrow">04 — Work</p>
        <h1 className="sec-title">Projects</h1>
        <p className="sec-body">A selection of process improvement, engineering, and project management work.</p>
        <div className="sec-divider" />
        <div className="placeholder-grid" style={{ marginTop: 0 }}>
          {[
            { label: 'Process Improvement', value: 'Line Rebalancing', sub: 'Reduced cycle time 18% through cell redesign and operator cross-training' },
            { label: 'Capital Project', value: 'Equipment Install', sub: 'Managed $2M equipment installation from RFQ through commissioning' },
            { label: 'Quality Initiative', value: 'Defect Reduction', sub: 'Dropped scrap rate 32% using DMAIC framework and poka-yoke implementation' },
            { label: 'Lean Deployment', value: '5S Plant-Wide', sub: 'Led facility-wide 5S rollout across 120,000 sq ft manufacturing floor' },
          ].map(c => (
            <div key={c.label} className="placeholder-card" style={{ cursor: 'pointer' }}>
              <div className="card-label" style={{ color: '#22c55e' }}>{c.label}</div>
              <div className="card-value" style={{ fontSize: '1.1rem' }}>{c.value}</div>
              <div className="card-sub">{c.sub}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>
          → More projects coming soon. Replace these cards with your real work!
        </p>
      </div>
    </div>
  )
}

/* ── CAD Projects ── */
function CadProjects({ onBack }) {
  return (
    <div className="section-page">
      <BackBtn onBack={onBack} />
      <div className="sec-inner">
        <p className="sec-eyebrow">05 — Engineering</p>
        <h1 className="sec-title">CAD<br />Projects</h1>
        <p className="sec-body">3D models, engineering drawings, tooling designs, and fixture work.</p>
        <div className="sec-divider" />
        <div className="placeholder-grid" style={{ marginTop: 0 }}>
          {[
            { label: 'SolidWorks', value: 'Fixture Design', sub: 'Custom assembly fixture reducing setup time by 40%' },
            { label: 'AutoCAD', value: 'Floor Layout', sub: 'Optimized cell layout for new product line launch' },
            { label: '3D Printing', value: 'Jig Prototype', sub: 'Rapid-prototyped quality inspection jig in 2 days vs 3-week lead time' },
            { label: 'GD&T', value: 'Drawing Package', sub: 'Full engineering drawing package for machined component family' },
          ].map(c => (
            <div key={c.label} className="placeholder-card">
              <div className="card-label" style={{ color: '#f59e0b' }}>{c.label}</div>
              <div className="card-value" style={{ fontSize: '1.1rem' }}>{c.value}</div>
              <div className="card-sub">{c.sub}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>
          → Add screenshots or renderings of your actual CAD work here!
        </p>
      </div>
    </div>
  )
}

/* ── Tools ── */
function Tools({ onBack }) {
  const tools = [
    { cat: 'CAD / Design', items: ['SolidWorks', 'AutoCAD', 'Fusion 360'] },
    { cat: 'Data & Analytics', items: ['Minitab', 'Excel / Power Query', 'Power BI', 'Tableau'] },
    { cat: 'Project Mgmt', items: ['MS Project', 'Smartsheet', 'Jira', 'Monday.com'] },
    { cat: 'ERP / MES', items: ['SAP', 'Oracle', 'Plex', 'Arena PLM'] },
    { cat: 'Lean Tools', items: ['VSM (draw.io)', 'A3 Problem Solving', 'PFMEA', 'Control Plans'] },
    { cat: 'Productivity', items: ['Microsoft 365', 'SharePoint', 'Teams', 'Visio'] },
  ]

  return (
    <div className="section-page">
      <BackBtn onBack={onBack} />
      <div className="sec-inner">
        <p className="sec-eyebrow">06 — Stack</p>
        <h1 className="sec-title">Tools</h1>
        <div className="placeholder-grid">
          {tools.map(t => (
            <div key={t.cat} className="placeholder-card">
              <div className="card-label" style={{ color: '#06b6d4' }}>{t.cat}</div>
              <ul style={{ listStyle: 'none', marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {t.items.map(i => (
                  <li key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#06b6d4', fontSize: '0.5rem' }}>▸</span>{i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Hobbies ── */
function Hobbies({ onBack }) {
  const items = [
    { emoji: '🔩', label: 'Building Things', desc: 'Weekend projects — woodworking, home improvement, whatever needs fixing' },
    { emoji: '🎮', label: 'Gaming', desc: 'Strategy and immersive RPGs. Big Portal fan (obviously)' },
    { emoji: '🏃', label: 'Running', desc: 'Clearing my head, one mile at a time' },
    { emoji: '📚', label: 'Reading', desc: 'Systems thinking, biographies, and the occasional sci-fi novel' },
    { emoji: '⚙️', label: 'Continuous Improvement', desc: 'It\'s not just a job — I genuinely love optimizing everyday processes' },
    { emoji: '🤔', label: 'Problem Solving', desc: 'Give me a tough puzzle and I\'m happy' },
  ]

  return (
    <div className="section-page">
      <BackBtn onBack={onBack} />
      <div className="sec-inner">
        <p className="sec-eyebrow">07 — Life</p>
        <h1 className="sec-title">Hobbies</h1>
        <p className="sec-body">What I'm up to when I'm not optimizing manufacturing processes.</p>
        <div className="placeholder-grid" style={{ marginTop: '2rem' }}>
          {items.map(h => (
            <div key={h.label} className="placeholder-card">
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{h.emoji}</div>
              <div className="card-label" style={{ color: '#ec4899' }}>{h.label}</div>
              <div className="card-sub" style={{ marginTop: '0.3rem' }}>{h.desc}</div>
            </div>
          ))}
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
