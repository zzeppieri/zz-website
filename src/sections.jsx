/* ── About Me ── */
function AboutMe() {
  return (
    <div className="section-page">
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
          My work sits at the intersection of <strong style={{ color: 'var(--text)' }}>process engineering,
          operational excellence, and human-centered design</strong> — combining technical rigor
          with the ability to align people and projects around a shared goal.
        </p>
        <div className="placeholder-grid" style={{ marginTop: '3rem' }}>
          {[
            { label: 'Experience', value: '5+ Years', sub: 'Manufacturing & PM' },
            { label: 'Projects Led', value: '20+', sub: 'End-to-end delivery' },
            { label: 'Methodology', value: 'Lean', sub: 'TPS / Kaizen driven' },
            { label: 'Certified', value: 'PMP', sub: 'Project Management' },
          ].map((c, i) => (
            <div key={c.label} className="placeholder-card" style={{ '--i': i }}>
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
function WorkExperience() {
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
            <div className="sec-inner">
        <p className="sec-eyebrow">02 — Career</p>
        <h1 className="sec-title">Work<br />Experience</h1>
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
      </div>
    </div>
  )
}

/* ── Skills ── */
function Skills() {
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
      </div>
    </div>
  )
}

/* ── Projects ── */
function Projects() {
  return (
    <div className="section-page">
            <div className="sec-inner">
        <p className="sec-eyebrow">04 — Work</p>
        <h1 className="sec-title">Other<br />Projects</h1>
        <p className="sec-body">A selection of process improvement, engineering, and project management work.</p>
        <div className="sec-divider" />
        <div className="placeholder-grid" style={{ marginTop: 0 }}>
          {[
            { label: 'Process Improvement', value: 'Line Rebalancing', sub: 'Reduced cycle time 18% through cell redesign and operator cross-training' },
            { label: 'Capital Project', value: 'Equipment Install', sub: 'Managed $2M equipment installation from RFQ through commissioning' },
            { label: 'Quality Initiative', value: 'Defect Reduction', sub: 'Dropped scrap rate 32% using DMAIC framework and poka-yoke implementation' },
            { label: 'Lean Deployment', value: '5S Plant-Wide', sub: 'Led facility-wide 5S rollout across 120,000 sq ft manufacturing floor' },
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
            <div className="github-card-desc">View my code & open source work →</div>
          </div>
          <div className="github-card-arrow">→</div>
        </div>
        <p style={{ marginTop: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          → More projects coming soon. Replace these cards with your real work!
        </p>
      </div>
    </div>
  )
}

/* ── CAD Projects ── */
function CadProjects() {
  return (
    <div className="section-page">
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
          ].map((c, i) => (
            <div key={c.label} className="placeholder-card" style={{ '--i': i }}>
              <div className="card-label">{c.label}</div>
              <div className="card-value" style={{ fontSize: '1.1rem' }}>{c.value}</div>
              <div className="card-sub">{c.sub}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          → Add screenshots or renderings of your actual CAD work here!
        </p>
      </div>
    </div>
  )
}

/* ── Tools ── */
function Tools() {
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
            <div className="sec-inner">
        <p className="sec-eyebrow">06 — Stack</p>
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
      </div>
    </div>
  )
}

/* ── Hobbies ── */
function Hobbies() {
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
            <div className="sec-inner">
        <p className="sec-eyebrow">07 — Life</p>
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
