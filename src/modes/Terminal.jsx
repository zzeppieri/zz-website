/* ============================================================
   Terminal.jsx — full-screen CRT/CLI portfolio takeover
   Zeppieri Industries TermLink v3.2.1

   Usage:
     import Terminal from './modes/Terminal'
     <Terminal onExit={() => setMode('default')} />

   Inline app integration (snake / printer / lego):
     window.addEventListener('terminal:run', (e) => {
       // e.detail.app === 'snake' | 'printer' | 'lego'
       // Render the corresponding component however you like.
       // Dispatch 'terminal:close-app' to dismiss.
     })
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './terminal.css'

/* ── Reduced-motion detection ── */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ── ASCII portrait (boot + whoami) ── */
const ASCII_PORTRAIT = `
        .-=========-.
       /     ___     \\
      |    .=---=.    |
      |   //  _  \\\\   |
      |  ||  (o)  ||  |
      |   \\\\  _  //   |
      |    '=---='    |
       \\    \\___/    /
        '-=========-'
       /==[ Z. Z. ]==\\
      / Sr CI Engineer\\
     '------------------'
`

const ASCII_MINI = `
   .--.
  ( :: )   Zeppieri
   '--'    Industries
`

/* ── Resume / Portfolio data ── */
const DATA = {
  bio_short:
    'Senior Continuous Improvement Engineer @ Chromalloy NY. Aerospace MRO. Lean + MES + AI-augmented engineering. Patent pending. 30,000+ verified hrs saved.',
  bio_long: [
    'Zachary Zeppieri',
    'Senior Continuous Improvement Engineer — Chromalloy Gas Turbine, LLC',
    '',
    'Sole CI practitioner at a Tier-1 aerospace MRO through multi-year workforce reductions.',
    'Promoted twice in three years (Associate -> CI Analyst -> Sr CI Analyst).',
    'Currently leading the Chromalloy customer side of a multi-million-dollar Tulip MES',
    'deployment at the Windsor (CT) site with PwC as implementation partner — driving',
    'Project Plan, Validation Approach, and core architecture toward a May 2026 pilot',
    'and Sept 2026 go-live.',
    '',
    'My work sits at the intersection of lean manufacturing, MES platform implementation,',
    'and AI-augmented engineering — decomposing operations problems and shipping the',
    'production tooling the floor actually needs.',
    '',
    'B.S. Mechanical Engineering, SUNY New Paltz.',
    'Six Sigma Green Belt. Patent pending (Baffle Extraction Tool, 2024).',
  ],
  contact: {
    email: 'zzeppieri@chromalloy.com',
    linkedin: 'linkedin.com/in/zacharyzeppieri',
    github: 'github.com/zzeppieri',
    website: 'zeppieri.dev',
    location: 'New York / Connecticut, USA',
  },
  experience: [
    {
      slug: 'sr-ci-analyst',
      title: 'Senior Continuous Improvement Analyst',
      company: 'Chromalloy Gas Turbine, LLC',
      period: '2025 — Present',
      bullets: [
        'Lead the customer side of a multi-million-dollar Tulip MES deployment at the Windsor (CT) site with PwC — driving Project Plan, Validation Approach, Base Layout, and core architecture toward a May 2026 pilot and Sept 2026 go-live.',
        'Architected an AI-augmented PM toolchain — custom Claude-based PM framework, offline Obsidian-style D3 knowledge graph with prompt-engineered context retention, Microsoft Copilot automations ingesting emails and Teams messages, and a Smartsheet writeback pipeline (via Model Context Protocol) for bi-weekly executive updates.',
        'Delivered ~30,000 hours of verified productivity savings across all product lines (2024–2025), exceeding the 2025 target by 30%.',
        'Mentored a continuous-improvement intern who was hired full-time as an engineer; preparing to manage two co-ops in 2026.',
      ],
    },
    {
      slug: 'ci-analyst',
      title: 'Continuous Improvement Analyst',
      company: 'Chromalloy Gas Turbine, LLC',
      period: '2023 — 2025',
      bullets: [
        'Reduced Blade Cell Gate 1 turnaround time (TAT) from 14 days to 4.75 days against a 4-day target — designed the Line of Balance board, standardized Op20 induction, and led the Wax-area improvement Kaizen.',
        'Drove a 5S Go-To-Gemba program from a 15-point baseline to 85 points by end of 2024 — 16 Bronze, 17 Silver, and 3 Gold-rated areas.',
        'Facilitated 29 Kaizen events across five Chromalloy sites including five external multi-day cross-functional engagements.',
        'Designed and ran a Continuous Improvement Lunch-and-Learn program — 14 sessions reaching 77+ employees across all three shifts.',
        'Designed and developed a patent-pending fixture enabling in-house baffle refurbishment — estimated $100K+ annual savings.',
        "Sole CI practitioner at the NY site through a multi-year workforce reduction — sustained and grew the lean program's measurable output.",
      ],
    },
    {
      slug: 'associate',
      title: 'Associate, Continuous Improvement Analyst',
      company: 'Chromalloy Gas Turbine, LLC',
      period: '2022 — 2023',
      bullets: [
        'Led the deployment of a $2.4M Blade Cell capital project (CapEx approved Nov 2022) — directed a team of 20, applied 3P / cellular-flow design, and returned $350K to budget for critical spares.',
        'Drove site fundamentals — 5S+1 deployment, Ideas Program participation, and Lean Leadership Week engagements at sister facilities.',
        'Earned Six Sigma Green Belt certification.',
      ],
    },
  ],
  projects: [
    {
      slug: 'tulip-mes',
      title: 'Tulip MES @ Windsor, CT',
      period: 'Feb 2026 → Present',
      kind: 'MES Deployment',
      body: [
        'Leading the Chromalloy customer side of a multi-million-dollar Tulip MES',
        'rollout at the Windsor (CT) site with PwC as implementation partner.',
        '',
        'Owning Project Plan, Validation Approach, Base Layout, and core',
        'architecture decisions through pilot (May 2026) and go-live (Sept 2026).',
        '',
        'Built an AI-augmented PM toolchain alongside delivery:',
        '  - Custom Claude-based PM framework',
        '  - Offline D3 knowledge graph with prompt-engineered context retention',
        '  - Microsoft Copilot automations ingesting emails / Teams messages',
        '  - Smartsheet writeback pipeline (via MCP) for bi-weekly exec updates',
      ],
    },
    {
      slug: 'baffle-tool',
      title: 'Baffle Extraction Tool',
      period: '2024 — Patent Pending',
      kind: 'Engineered Fixture',
      body: [
        'Designed and developed an engineered fixture that enables in-house baffle',
        'refurbishment instead of OEM purchase. Estimated $100K+/yr potential savings.',
        '',
        'SOLIDWORKS design + 3D-printed prototype iterations.',
        'Currently in patent application. Follow-on automation work scoped.',
      ],
    },
    {
      slug: 'blade-cell',
      title: 'Blade Cell — $2.4M Capital Project',
      period: 'Nov 2022 → Jun 2023',
      kind: 'Capital / Cellular-Flow',
      body: [
        'Led from CapEx approval through deployment. Team of 20.',
        '3P methodology, cellular-flow design, cross-functional coordination.',
        'Returned $350K to budget for critical spares.',
        '',
        'Follow-on: TAT 14d -> 4.75d (Gate 1) post-deployment.',
      ],
    },
    {
      slug: 'oem-tracker',
      title: 'OEM Tracker (Python desktop + web)',
      period: '2025 — 2026',
      kind: 'Software / Automation',
      body: [
        'Replaced a 14 MB / 70-sheet VBA Excel macro tracker with:',
        '  - Python desktop app (PySide6, SQLite) packaged as a Windows .exe',
        '  - Parallel Python web version with zero external dependencies',
        '',
        'Distributed to multiple sites. Eliminated the macro-fragility tax.',
      ],
    },
    {
      slug: 'reporting-automation',
      title: 'Monthly Reporting + VSM Automation',
      period: '2024 — Present',
      kind: 'Automation Toolkit',
      body: [
        'Monthly reporting automation: 4+ hrs -> <30 min.',
        'VSM generation: >40 hrs -> near-zero, for ~100 operations.',
        'Built with Python, custom templating, and PptxGenJS for slide output.',
      ],
    },
    {
      slug: 'shop-floor-tooling',
      title: '3D-Printed Shop-Floor Tooling',
      period: '2024 — Present',
      kind: 'Engineering / Rapid Prototyping',
      body: [
        'Dozens of in-house 3D-printed fixtures delivered.',
        'Highlights:',
        '  - CBN boot molds — under 24 hr turnaround, saved 2–3 days vendor TAT',
        '    on 59 repair blades (vs $521 SLA print order).',
        '  - Polishing-disc contamination stand.',
        '  - CFM blistering grit boot with positive-pressure inserts.',
        '  - LM9000 plasma-tape escape alignment tool.',
      ],
    },
  ],
  skills: {
    lean: {
      label: 'Lean & Continuous Improvement',
      items: [
        'Six Sigma Green Belt',
        'Kaizen / K3 Facilitation',
        'Value Stream Mapping',
        'Total Productive Maintenance',
        '3P (Production-Preparation-Process)',
        '5S+1',
        'Toyota Production System',
        'Standard Work',
        'Line of Balance',
        'Kamishibai',
      ],
    },
    mes: {
      label: 'Manufacturing Execution Systems',
      items: [
        'Tulip MES (PM + Custom App Dev)',
        'MES Router Framework Design',
        'Work-Instruction Digitization',
        'SyteLine ERP Integration',
        'Model Context Protocol (MCP)',
      ],
    },
    pm: {
      label: 'Program & Project Management',
      items: [
        'Multi-Million-Dollar Programs',
        'RACI Design',
        'Risk Register / RAID',
        'Vendor Commercials',
        'Cross-Functional Steering',
        'Change Management',
      ],
    },
    coaching: {
      label: 'Coaching & Training',
      items: [
        'Lunch-and-Learn Program Design',
        'Operator Coaching',
        'Leadership Accountability Systems',
        'Employee Ideas Program',
        'People Leadership (Intern -> FT Hire)',
      ],
    },
    software: {
      label: 'Software & Automation (AI-Augmented)',
      items: [
        'Python (PySide6, SQLite)',
        'JavaScript / D3.js',
        'HTML / CSS',
        'Power Automate + Forms',
        'Claude / Copilot Orchestration',
      ],
    },
    cad: {
      label: 'CAD & Engineering',
      items: [
        'SOLIDWORKS',
        'Siemens NX',
        'Visio / SketchUp',
        '3D Printing (Production Tooling)',
        'GD&T',
        'FEA',
      ],
    },
  },
  fortunes: [
    '"The best way to learn something is to do it. The second best is to write the code." — A. Karpathy (paraphrased)',
    '"Make the change easy, then make the easy change." — K. Beck',
    '"Move slowly and fix things." — Tooling > heroics.',
    '"Standard work is the baseline for kaizen." — Taiichi Ohno',
    '"In God we trust. All others must bring data." — W.E. Deming',
    '"If you cannot measure it, you cannot improve it." — Lord Kelvin',
    '"The most dangerous kind of waste is the waste we do not recognize." — Shigeo Shingo',
    '"Without standards, there can be no improvement." — Taiichi Ohno',
    '"Engineering is the art of directing the great sources of power in nature for the use and convenience of man." — Thomas Tredgold',
    '"Premature optimization is the root of all evil." — D. Knuth',
    '"Simple is better than complex. Complex is better than complicated." — The Zen of Python',
  ],
}

/* ── Boot sequence lines ── */
const BOOT_LINES = [
  { text: '[ OK ] ZEPPIERI INDUSTRIES TERMLINK v3.2.1', cls: 'tm-ok', delay: 220 },
  { text: '[ OK ] Loading kernel modules ........... done', cls: 'tm-ok', delay: 280 },
  { text: '[ OK ] Mounting /home/zach .............. done', cls: 'tm-ok', delay: 260 },
  { text: '[ OK ] Authenticating credentials ....... ok', cls: 'tm-ok', delay: 280 },
  { text: '[ OK ] Starting portfolio service ....... ok', cls: 'tm-ok', delay: 280 },
  { text: '', cls: '', delay: 200 },
  { text: 'Welcome to Zeppieri Industries TermLink.', cls: 'tm-bright', delay: 200 },
  { text: "Type `help` to see available commands.", cls: 'tm-dim', delay: 200 },
  { text: '', cls: '', delay: 100 },
]

/* ── Commands catalog (used by help, man, autocomplete) ── */
const COMMANDS = [
  { name: 'help', desc: 'List all available commands' },
  { name: 'whoami', desc: 'Short bio. Pass --verbose for the long version.' },
  { name: 'cat', desc: 'Print a file. e.g. cat about, cat resume, cat projects/<name>' },
  { name: 'ls', desc: 'List entries. ls projects | ls skills | ls experience' },
  { name: 'tree', desc: 'Print the portfolio directory tree' },
  { name: 'contact', desc: 'Display contact info' },
  { name: 'download', desc: 'download resume — triggers a download of /resume.pdf' },
  { name: 'run', desc: 'Launch an embedded app. run snake | run printer | run lego' },
  { name: 'theme', desc: 'Switch theme. theme blueprint | factory | executive | default' },
  { name: 'clear', desc: 'Clear the scrollback (alias: Ctrl+L)' },
  { name: 'history', desc: 'Show the last 30 commands' },
  { name: 'man', desc: 'man <command> — show extended help' },
  { name: 'fortune', desc: 'Print a random engineering / lean / hacker quote' },
  { name: 'sl', desc: '(easter egg)' },
  { name: 'sudo', desc: '(easter egg)' },
  { name: 'echo', desc: 'echo <text> — print arguments' },
  { name: 'date', desc: 'Print the current date/time' },
  { name: 'uptime', desc: 'How long this session has been running' },
  { name: 'exit', desc: 'Leave terminal mode (alias: quit, logout)' },
]

const VALID_FILES = ['about', 'resume', 'whoami']
const PROJECT_SLUGS = DATA.projects.map((p) => p.slug)
const SKILL_KEYS = Object.keys(DATA.skills)
const EXP_SLUGS = DATA.experience.map((e) => e.slug)

/* ── Helpers ── */
const fmtUptime = (ms) => {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

const longestCommonPrefix = (arr) => {
  if (!arr.length) return ''
  let p = arr[0]
  for (let i = 1; i < arr.length; i++) {
    while (arr[i].indexOf(p) !== 0) {
      p = p.slice(0, -1)
      if (!p) return ''
    }
  }
  return p
}

/* ── Terminal Component ── */
export default function Terminal({ onExit = () => {} }) {
  const reducedMotion = useMemo(() => prefersReducedMotion(), [])

  const [lines, setLines] = useState([])
  const [input, setInput] = useState('')
  const [historyList, setHistoryList] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const [pendingInput, setPendingInput] = useState('') // saved input when browsing history
  const [theme, setTheme] = useState('default')
  const [booted, setBooted] = useState(false)
  const [trainKey, setTrainKey] = useState(0) // re-trigger train animation
  const [appRunning, setAppRunning] = useState(null) // 'snake' | 'printer' | 'lego' | null

  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const sessionStart = useRef(Date.now())
  const lineKey = useRef(0)
  const typingLockRef = useRef(null) // chained promise for typing-animation queue

  /* ── Auto-scroll on new lines ── */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [lines])

  /* ── Keep input focused ── */
  useEffect(() => {
    const handleClick = (e) => {
      // Don't yank focus if user is clicking inside an embedded app
      if (e.target.closest('.tm-app-slot')) return
      inputRef.current?.focus()
    }
    inputRef.current?.focus()
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  /* ── Listen for app-close events ── */
  useEffect(() => {
    const close = () => setAppRunning(null)
    window.addEventListener('terminal:close-app', close)
    return () => window.removeEventListener('terminal:close-app', close)
  }, [])

  /* ── Theme application on root ── */
  const rootRef = useRef(null)

  /* ── Push a line (or array) into scrollback ── */
  const pushLines = useCallback((items, opts = {}) => {
    const arr = Array.isArray(items) ? items : [items]
    const normalized = arr.map((it) => {
      if (typeof it === 'string') return { text: it, cls: '', block: false }
      return { text: it.text || '', cls: it.cls || '', block: !!it.block }
    })
    setLines((prev) => [
      ...prev,
      ...normalized.map((n) => ({ ...n, id: ++lineKey.current })),
    ])
  }, [])

  /* ── Typing animation: type out first chunk char-by-char, then bulk ── */
  const TYPE_BUDGET = 200 // chars typed slowly before the rest is instant
  const typeOutput = useCallback(
    async (lineObjs) => {
      // If reduced motion, just push everything immediately.
      if (reducedMotion) {
        pushLines(lineObjs)
        return
      }

      // Serialize concurrent calls — wait for the previous typing run to finish,
      // then chain ours onto it. Each call extends the same promise queue.
      const prev = typingLockRef.current || Promise.resolve()
      const run = async () => {
        await prev
        let budget = TYPE_BUDGET
        for (let i = 0; i < lineObjs.length; i++) {
          const obj = lineObjs[i]
          if (budget <= 0 || !obj.text) {
            pushLines(obj)
            continue
          }
          const cls = obj.cls || ''
          const full = obj.text
          if (full.length > budget) {
            // type only the first `budget` chars, then push the full line as final
            const lineId = ++lineKey.current
            setLines((p) => [...p, { id: lineId, text: '', cls, block: !!obj.block }])
            for (let c = 0; c < budget; c++) {
              await new Promise((r) => setTimeout(r, 7))
              // eslint-disable-next-line no-loop-func
              setLines((p) =>
                p.map((ln) =>
                  ln.id === lineId ? { ...ln, text: full.slice(0, c + 1) } : ln,
                ),
              )
            }
            // finalize with full string
            setLines((p) =>
              p.map((ln) => (ln.id === lineId ? { ...ln, text: full } : ln)),
            )
            budget = 0
          } else {
            const lineId = ++lineKey.current
            setLines((p) => [...p, { id: lineId, text: '', cls, block: !!obj.block }])
            for (let c = 0; c < full.length; c++) {
              await new Promise((r) => setTimeout(r, 8))
              // eslint-disable-next-line no-loop-func
              setLines((p) =>
                p.map((ln) =>
                  ln.id === lineId ? { ...ln, text: full.slice(0, c + 1) } : ln,
                ),
              )
            }
            budget -= full.length
          }
        }
      }
      const p = run()
      typingLockRef.current = p.catch(() => {})
      await p
    },
    [pushLines, reducedMotion],
  )

  /* ── Boot sequence ── */
  useEffect(() => {
    let cancelled = false
    const runBoot = async () => {
      if (reducedMotion) {
        // Skip animation; just push everything.
        BOOT_LINES.forEach((b) => pushLines({ text: b.text, cls: b.cls }))
        setBooted(true)
        return
      }
      for (const b of BOOT_LINES) {
        if (cancelled) return
        await new Promise((r) => setTimeout(r, b.delay))
        pushLines({ text: b.text, cls: b.cls })
      }
      if (cancelled) return
      setBooted(true)
    }
    runBoot()
    return () => {
      cancelled = true
    }
  }, [pushLines, reducedMotion])

  /* ── Render the prompt line for echo'd commands ── */
  const echoPrompt = useCallback(
    (cmdStr) => {
      pushLines({ text: `zach@zeppieri:~$ ${cmdStr}`, cls: 'tm-prompt-line' })
    },
    [pushLines],
  )

  /* ── Command handlers ── */
  const cmdHelp = () => {
    const out = [
      { text: 'Available commands:', cls: 'tm-bright' },
      { text: '', cls: '' },
    ]
    COMMANDS.forEach((c) => {
      const pad = c.name.padEnd(12, ' ')
      out.push({ text: `  ${pad}  ${c.desc}`, cls: 'tm-ok' })
    })
    out.push({ text: '', cls: '' })
    out.push({ text: 'Tip: Tab for autocomplete · Up/Down for history · Ctrl+L to clear · Ctrl+C to cancel', cls: 'tm-dim' })
    return out
  }

  const cmdWhoami = (verbose) => {
    if (verbose) {
      const out = [
        { text: ASCII_PORTRAIT, cls: 'tm-bright', block: true },
        { text: '', cls: '' },
      ]
      DATA.bio_long.forEach((l) => out.push({ text: l, cls: 'tm-ok' }))
      return out
    }
    return [{ text: DATA.bio_short, cls: 'tm-ok' }]
  }

  const cmdCat = (arg) => {
    if (!arg) return [{ text: 'cat: missing operand. Try: cat about | cat resume | cat projects/<name>', cls: 'tm-err' }]
    if (arg === 'about' || arg === 'whoami') {
      return cmdWhoami(true)
    }
    if (arg === 'resume') {
      return cmdResume()
    }
    if (arg.startsWith('projects/')) {
      const slug = arg.slice('projects/'.length)
      const p = DATA.projects.find((x) => x.slug === slug)
      if (!p) return [{ text: `cat: projects/${slug}: no such project. Try 'ls projects'.`, cls: 'tm-err' }]
      const out = [
        { text: `── ${p.title} ──`, cls: 'tm-bright' },
        { text: `${p.kind}  ·  ${p.period}`, cls: 'tm-dim' },
        { text: '', cls: '' },
      ]
      p.body.forEach((l) => out.push({ text: l, cls: 'tm-ok' }))
      return out
    }
    if (arg.startsWith('skills/')) {
      return cmdCatSkills(arg.slice('skills/'.length))
    }
    if (arg.startsWith('experience/')) {
      return cmdCatExperience(arg.slice('experience/'.length))
    }
    return [{ text: `cat: ${arg}: no such file. Try 'ls' or 'tree'.`, cls: 'tm-err' }]
  }

  const cmdCatSkills = (key) => {
    const s = DATA.skills[key]
    if (!s) return [{ text: `cat: skills/${key}: no such cluster. Try 'ls skills'.`, cls: 'tm-err' }]
    const out = [
      { text: `── ${s.label} ──`, cls: 'tm-bright' },
      { text: '', cls: '' },
    ]
    s.items.forEach((it) => out.push({ text: `  ▸ ${it}`, cls: 'tm-ok' }))
    return out
  }

  const cmdCatExperience = (slug) => {
    const e = DATA.experience.find((x) => x.slug === slug)
    if (!e) return [{ text: `cat: experience/${slug}: not found. Try 'ls experience'.`, cls: 'tm-err' }]
    const out = [
      { text: `── ${e.title} ──`, cls: 'tm-bright' },
      { text: `${e.company}  ·  ${e.period}`, cls: 'tm-dim' },
      { text: '', cls: '' },
    ]
    e.bullets.forEach((b) => out.push({ text: `  ▸ ${b}`, cls: 'tm-ok' }))
    return out
  }

  const cmdResume = () => {
    const div = '═'.repeat(60)
    const out = [
      { text: div, cls: 'tm-divider' },
      { text: '  ZACHARY ZEPPIERI — RESUME', cls: 'tm-bright' },
      { text: '  Senior Continuous Improvement Engineer', cls: 'tm-dim' },
      { text: div, cls: 'tm-divider' },
      { text: '', cls: '' },
      { text: '── CONTACT ──', cls: 'tm-bright' },
      { text: `  ${DATA.contact.email}`, cls: 'tm-ok' },
      { text: `  ${DATA.contact.linkedin}`, cls: 'tm-ok' },
      { text: `  ${DATA.contact.location}`, cls: 'tm-ok' },
      { text: '', cls: '' },
      { text: '── SUMMARY ──', cls: 'tm-bright' },
      { text: DATA.bio_short, cls: 'tm-ok' },
      { text: '', cls: '' },
      { text: '── EXPERIENCE ──', cls: 'tm-bright' },
    ]
    DATA.experience.forEach((e) => {
      out.push({ text: '', cls: '' })
      out.push({ text: `${e.title}`, cls: 'tm-bright' })
      out.push({ text: `${e.company}  ·  ${e.period}`, cls: 'tm-dim' })
      e.bullets.forEach((b) => out.push({ text: `  ▸ ${b}`, cls: 'tm-ok' }))
    })
    out.push({ text: '', cls: '' })
    out.push({ text: '── EDUCATION ──', cls: 'tm-bright' })
    out.push({ text: '  B.S. Mechanical Engineering — SUNY New Paltz', cls: 'tm-ok' })
    out.push({ text: '  Six Sigma Green Belt', cls: 'tm-ok' })
    out.push({ text: '', cls: '' })
    out.push({ text: '── HIGHLIGHTS ──', cls: 'tm-bright' })
    out.push({ text: '  30,000+ hrs productivity savings (2024–2025)', cls: 'tm-ok' })
    out.push({ text: '  29 Kaizen events across 5 sites', cls: 'tm-ok' })
    out.push({ text: '  Patent pending (Baffle Extraction Tool, 2024)', cls: 'tm-ok' })
    out.push({ text: '  2 promotions in 3 years', cls: 'tm-ok' })
    out.push({ text: '', cls: '' })
    out.push({ text: 'Tip: download resume — to grab the PDF.', cls: 'tm-dim' })
    out.push({ text: div, cls: 'tm-divider' })
    return out
  }

  const cmdLs = (arg) => {
    if (!arg || arg === '/' || arg === '.' || arg === '~') {
      return [
        { text: 'about      resume     contact', cls: 'tm-ok' },
        { text: 'projects/  skills/    experience/', cls: 'tm-ok' },
      ]
    }
    if (arg === 'projects' || arg === 'projects/') {
      const out = [{ text: '── projects/ ──', cls: 'tm-bright' }]
      DATA.projects.forEach((p) =>
        out.push({ text: `  ${p.slug.padEnd(22, ' ')} ${p.title}`, cls: 'tm-ok' }),
      )
      out.push({ text: '', cls: '' })
      out.push({ text: "Use: cat projects/<name>", cls: 'tm-dim' })
      return out
    }
    if (arg === 'skills' || arg === 'skills/') {
      const out = [{ text: '── skills/ ──', cls: 'tm-bright' }]
      Object.entries(DATA.skills).forEach(([k, v]) =>
        out.push({ text: `  ${k.padEnd(12, ' ')} ${v.label}`, cls: 'tm-ok' }),
      )
      out.push({ text: '', cls: '' })
      out.push({ text: 'Use: cat skills/<cluster>', cls: 'tm-dim' })
      return out
    }
    if (arg === 'experience' || arg === 'experience/') {
      const out = [{ text: '── experience/ ──', cls: 'tm-bright' }]
      DATA.experience.forEach((e) =>
        out.push({ text: `  ${e.slug.padEnd(20, ' ')} ${e.title}  ·  ${e.period}`, cls: 'tm-ok' }),
      )
      out.push({ text: '', cls: '' })
      out.push({ text: 'Use: cat experience/<title-slug>', cls: 'tm-dim' })
      return out
    }
    return [{ text: `ls: cannot access '${arg}': not a directory`, cls: 'tm-err' }]
  }

  const cmdTree = () => {
    const out = [{ text: '~/portfolio', cls: 'tm-bright' }]
    out.push({ text: '├── about', cls: 'tm-ok' })
    out.push({ text: '├── resume', cls: 'tm-ok' })
    out.push({ text: '├── contact', cls: 'tm-ok' })
    out.push({ text: '├── projects/', cls: 'tm-ok' })
    DATA.projects.forEach((p, i) => {
      const last = i === DATA.projects.length - 1
      out.push({ text: `│   ${last ? '└──' : '├──'} ${p.slug}`, cls: 'tm-ok' })
    })
    out.push({ text: '├── skills/', cls: 'tm-ok' })
    SKILL_KEYS.forEach((k, i) => {
      const last = i === SKILL_KEYS.length - 1
      out.push({ text: `│   ${last ? '└──' : '├──'} ${k}`, cls: 'tm-ok' })
    })
    out.push({ text: '└── experience/', cls: 'tm-ok' })
    DATA.experience.forEach((e, i) => {
      const last = i === DATA.experience.length - 1
      out.push({ text: `    ${last ? '└──' : '├──'} ${e.slug}`, cls: 'tm-ok' })
    })
    return out
  }

  const cmdContact = () => [
    { text: '── Contact ──', cls: 'tm-bright' },
    { text: `  Email     : ${DATA.contact.email}`, cls: 'tm-ok' },
    { text: `  LinkedIn  : ${DATA.contact.linkedin}`, cls: 'tm-ok' },
    { text: `  GitHub    : ${DATA.contact.github}`, cls: 'tm-ok' },
    { text: `  Website   : ${DATA.contact.website}`, cls: 'tm-ok' },
    { text: `  Location  : ${DATA.contact.location}`, cls: 'tm-ok' },
  ]

  const cmdDownload = (arg) => {
    if (arg !== 'resume') {
      return [{ text: `download: unknown target '${arg || ''}'. Try: download resume`, cls: 'tm-err' }]
    }
    try {
      const a = document.createElement('a')
      a.href = '/resume.pdf'
      a.download = 'Zachary_Zeppieri_Resume.pdf'
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      return [{ text: `download: failed (${e?.message || 'unknown'})`, cls: 'tm-err' }]
    }
    return [
      { text: 'Initiating transfer ......... ok', cls: 'tm-ok' },
      { text: '  /resume.pdf -> Zachary_Zeppieri_Resume.pdf', cls: 'tm-dim' },
    ]
  }

  const cmdRun = (arg) => {
    const known = ['snake', 'printer', 'lego']
    if (!known.includes(arg)) {
      return [{ text: `run: unknown app '${arg || ''}'. Available: ${known.join(', ')}`, cls: 'tm-err' }]
    }
    // Fire integration event for the host app + open inline slot stub
    try {
      window.dispatchEvent(
        new CustomEvent('terminal:run', { detail: { app: arg } }),
      )
    } catch {
      /* no-op */
    }
    setAppRunning(arg)
    return [
      { text: `[ launching ${arg} ... ]`, cls: 'tm-bright' },
      { text: '  Host may render inline. Dispatch "terminal:close-app" to dismiss.', cls: 'tm-dim' },
    ]
  }

  const cmdTheme = (arg) => {
    const allowed = ['default', 'blueprint', 'factory', 'executive']
    if (!arg) {
      return [
        { text: 'Usage: theme <name>', cls: 'tm-warn' },
        { text: `Available: ${allowed.join(', ')}`, cls: 'tm-dim' },
        { text: `Current  : ${theme}`, cls: 'tm-dim' },
      ]
    }
    if (!allowed.includes(arg)) {
      return [{ text: `theme: unknown theme '${arg}'. Try: ${allowed.join(', ')}`, cls: 'tm-err' }]
    }
    setTheme(arg)
    // Mirror onto :root so external pages can read it too, per spec
    try {
      document.documentElement.dataset.theme = arg
    } catch {
      /* no-op */
    }
    return [{ text: `theme: switched to '${arg}'`, cls: 'tm-ok' }]
  }

  const cmdHistory = () => {
    if (!historyList.length) return [{ text: 'No history yet.', cls: 'tm-dim' }]
    const last30 = historyList.slice(-30)
    return last30.map((h, i) => ({
      text: `  ${String(historyList.length - last30.length + i + 1).padStart(4, ' ')}  ${h}`,
      cls: 'tm-ok',
    }))
  }

  const cmdMan = (arg) => {
    if (!arg) return [{ text: 'What manual page do you want? Try: man help', cls: 'tm-warn' }]
    const c = COMMANDS.find((x) => x.name === arg)
    if (!c) return [{ text: `No manual entry for '${arg}'.`, cls: 'tm-err' }]
    const usage = {
      help: 'help',
      whoami: 'whoami [--verbose]',
      cat: 'cat <file>     # about | resume | projects/<slug> | skills/<key> | experience/<slug>',
      ls: 'ls [path]      # projects | skills | experience',
      tree: 'tree',
      contact: 'contact',
      download: 'download resume',
      run: 'run <snake|printer|lego>',
      theme: 'theme <default|blueprint|factory|executive>',
      clear: 'clear         # alias: Ctrl+L',
      history: 'history',
      man: 'man <command>',
      fortune: 'fortune',
      sl: 'sl            # surely you mean ls?',
      sudo: 'sudo <cmd>',
      echo: 'echo <text>',
      date: 'date',
      uptime: 'uptime',
      exit: 'exit          # aliases: quit, logout',
    }
    return [
      { text: `NAME`, cls: 'tm-bright' },
      { text: `  ${c.name} — ${c.desc}`, cls: 'tm-ok' },
      { text: '', cls: '' },
      { text: 'SYNOPSIS', cls: 'tm-bright' },
      { text: `  ${usage[c.name] || c.name}`, cls: 'tm-ok' },
      { text: '', cls: '' },
      { text: 'AUTHOR', cls: 'tm-bright' },
      { text: '  Zachary Zeppieri  <zzeppieri@chromalloy.com>', cls: 'tm-ok' },
    ]
  }

  const cmdFortune = () => {
    const f = DATA.fortunes[Math.floor(Math.random() * DATA.fortunes.length)]
    return [{ text: f, cls: 'tm-bright' }]
  }

  const cmdSl = () => {
    setTrainKey((k) => k + 1)
    return [
      { text: '(I think you meant `ls`?)', cls: 'tm-dim' },
      { text: '         🚂💨', cls: 'tm-bright' },
    ]
  }

  const cmdSudo = (rest) => {
    if (!rest) return [{ text: 'sudo: a password is required. (Just kidding. There is no sudo.)', cls: 'tm-warn' }]
    return [
      { text: `[sudo] password for zach: `, cls: 'tm-warn' },
      { text: 'Sorry, user zach is not in the sudoers file. This incident will be reported.', cls: 'tm-err' },
    ]
  }

  const cmdEcho = (rest) => [{ text: rest || '', cls: 'tm-ok' }]

  const cmdDate = () => [{ text: new Date().toString(), cls: 'tm-ok' }]

  const cmdUptime = () => [
    { text: `up ${fmtUptime(Date.now() - sessionStart.current)} · 1 user · load avg: 0.42`, cls: 'tm-ok' },
  ]

  const cmdClear = () => {
    setLines([])
    return null
  }

  const cmdExit = () => {
    pushLines({ text: 'logout', cls: 'tm-dim' })
    setTimeout(() => onExit?.(), reducedMotion ? 0 : 250)
    return null
  }

  /* ── Dispatcher ── */
  const dispatch = useCallback(
    async (raw) => {
      const trimmed = raw.trim()
      echoPrompt(trimmed)
      if (!trimmed) return
      // Update history
      setHistoryList((prev) => {
        const next = [...prev, trimmed]
        return next.length > 200 ? next.slice(-200) : next
      })

      // Tokenize (very simple — split on whitespace)
      const tokens = trimmed.split(/\s+/)
      const cmd = tokens[0].toLowerCase()
      const args = tokens.slice(1)
      const rest = trimmed.slice(cmd.length).trim()

      let out
      switch (cmd) {
        case 'help':
          out = cmdHelp()
          break
        case 'whoami':
          out = cmdWhoami(args.includes('--verbose') || args.includes('-v'))
          break
        case 'cat':
          out = cmdCat(args[0])
          break
        case 'ls':
          out = cmdLs(args[0])
          break
        case 'tree':
          out = cmdTree()
          break
        case 'contact':
          out = cmdContact()
          break
        case 'download':
          out = cmdDownload(args[0])
          break
        case 'run':
          out = cmdRun(args[0])
          break
        case 'theme':
          out = cmdTheme(args[0])
          break
        case 'clear':
        case 'cls':
          out = cmdClear()
          break
        case 'history':
          out = cmdHistory()
          break
        case 'man':
          out = cmdMan(args[0])
          break
        case 'fortune':
          out = cmdFortune()
          break
        case 'sl':
          out = cmdSl()
          break
        case 'sudo':
          out = cmdSudo(rest.slice(cmd.length).trim())
          break
        case 'echo':
          out = cmdEcho(rest)
          break
        case 'date':
          out = cmdDate()
          break
        case 'uptime':
          out = cmdUptime()
          break
        case 'exit':
        case 'quit':
        case 'logout':
          out = cmdExit()
          break
        default:
          out = [{ text: `command not found: ${cmd}. Type 'help' for available commands.`, cls: 'tm-err' }]
      }

      if (out && out.length) {
        await typeOutput(out)
      }
    },
    [echoPrompt, historyList, theme, typeOutput],
  )

  /* ── Tab autocomplete ── */
  const handleTab = useCallback(() => {
    const text = input
    if (!text.trim()) return
    const tokens = text.split(/\s+/)

    if (tokens.length === 1) {
      // command completion
      const partial = tokens[0]
      const cands = COMMANDS.map((c) => c.name).filter((n) => n.startsWith(partial))
      if (!cands.length) return
      if (cands.length === 1) {
        setInput(cands[0] + ' ')
        return
      }
      const lcp = longestCommonPrefix(cands)
      if (lcp.length > partial.length) setInput(lcp)
      else {
        echoPrompt(text)
        pushLines({ text: cands.join('  '), cls: 'tm-dim' })
      }
      return
    }

    // Path-like completion for cat/ls
    const cmd = tokens[0]
    const last = tokens[tokens.length - 1]
    let cands = []
    if (cmd === 'cat') {
      if (last.startsWith('projects/')) {
        const p = last.slice('projects/'.length)
        cands = PROJECT_SLUGS.filter((s) => s.startsWith(p)).map((s) => 'projects/' + s)
      } else if (last.startsWith('skills/')) {
        const p = last.slice('skills/'.length)
        cands = SKILL_KEYS.filter((s) => s.startsWith(p)).map((s) => 'skills/' + s)
      } else if (last.startsWith('experience/')) {
        const p = last.slice('experience/'.length)
        cands = EXP_SLUGS.filter((s) => s.startsWith(p)).map((s) => 'experience/' + s)
      } else {
        const top = [...VALID_FILES, 'projects/', 'skills/', 'experience/']
        cands = top.filter((s) => s.startsWith(last))
      }
    } else if (cmd === 'ls') {
      cands = ['projects', 'skills', 'experience'].filter((s) => s.startsWith(last))
    } else if (cmd === 'run') {
      cands = ['snake', 'printer', 'lego'].filter((s) => s.startsWith(last))
    } else if (cmd === 'theme') {
      cands = ['default', 'blueprint', 'factory', 'executive'].filter((s) => s.startsWith(last))
    } else if (cmd === 'man') {
      cands = COMMANDS.map((c) => c.name).filter((s) => s.startsWith(last))
    } else if (cmd === 'download') {
      cands = ['resume'].filter((s) => s.startsWith(last))
    }

    if (!cands.length) return
    if (cands.length === 1) {
      const newTokens = [...tokens.slice(0, -1), cands[0]]
      setInput(newTokens.join(' ') + (cmd === 'cat' && cands[0].endsWith('/') ? '' : ' '))
    } else {
      const lcp = longestCommonPrefix(cands)
      if (lcp.length > last.length) {
        const newTokens = [...tokens.slice(0, -1), lcp]
        setInput(newTokens.join(' '))
      } else {
        echoPrompt(text)
        pushLines({ text: cands.join('  '), cls: 'tm-dim' })
      }
    }
  }, [input, echoPrompt, pushLines])

  /* ── Key handling ── */
  const handleKey = useCallback(
    (e) => {
      // Ctrl+L: clear
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        setLines([])
        return
      }
      // Ctrl+C: cancel current input
      if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        if (input) {
          echoPrompt(input)
          pushLines({ text: '^C', cls: 'tm-dim' })
          setInput('')
          setHistIdx(-1)
        } else {
          pushLines({ text: '^C', cls: 'tm-dim' })
        }
        return
      }
      // Tab: autocomplete
      if (e.key === 'Tab') {
        e.preventDefault()
        handleTab()
        return
      }
      // Up/Down: history
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (!historyList.length) return
        if (histIdx === -1) setPendingInput(input)
        const newIdx = histIdx === -1 ? historyList.length - 1 : Math.max(0, histIdx - 1)
        setHistIdx(newIdx)
        setInput(historyList[newIdx])
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (histIdx === -1) return
        const newIdx = histIdx + 1
        if (newIdx >= historyList.length) {
          setHistIdx(-1)
          setInput(pendingInput)
        } else {
          setHistIdx(newIdx)
          setInput(historyList[newIdx])
        }
        return
      }
      // Enter: submit
      if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = input
        setInput('')
        setHistIdx(-1)
        setPendingInput('')
        dispatch(cmd)
        return
      }
    },
    [
      input,
      echoPrompt,
      pushLines,
      handleTab,
      historyList,
      histIdx,
      pendingInput,
      dispatch,
    ],
  )

  /* ── Tiny live system info (cosmetic) ── */
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const cpuLoad = useMemo(() => 12 + Math.round(8 * Math.sin(tick / 4)), [tick])
  const memUsed = useMemo(() => 38 + Math.round(6 * Math.sin(tick / 6 + 1)), [tick])
  const uptimeStr = fmtUptime(Date.now() - sessionStart.current)

  /* ── ESC closes embedded app (if any), otherwise no-op ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && appRunning) {
        setAppRunning(null)
        try {
          window.dispatchEvent(new CustomEvent('terminal:close-app'))
        } catch {
          /* no-op */
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [appRunning])

  /* ── Cleanup theme on unmount ── */
  useEffect(() => {
    return () => {
      try {
        delete document.documentElement.dataset.theme
      } catch {
        /* no-op */
      }
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className={`tm-root${reducedMotion ? ' tm-no-motion' : ''}`}
      data-theme={theme === 'default' ? undefined : theme}
      role="application"
      aria-label="Terminal portfolio mode"
    >
      {/* CRT visual layers */}
      <div className="tm-crt-vignette" />
      <div className="tm-crt-scanlines" />
      <div className="tm-crt-glow" />

      {/* Status bar */}
      <div className="tm-statusbar">
        <div className="tm-status-left">
          <span><span className="tm-status-pulse" />zach@zeppieri</span>
          <span>tty1</span>
          <span>theme: {theme}</span>
        </div>
        <div className="tm-status-right">
          <span>load {cpuLoad}%</span>
          <span>mem {memUsed}%</span>
          <span>up {uptimeStr}</span>
          <button
            type="button"
            className="tm-exit"
            aria-label="Exit terminal mode"
            title="Exit (or type `exit` / ESC)"
            onClick={() => { try { onExit && onExit() } catch (e) {} }}
          >×</button>
        </div>
      </div>

      <div className="tm-main">
        {/* Side panel (desktop only — hidden on mobile via CSS) */}
        <aside className="tm-sidepanel" aria-hidden="true">
          <div className="tm-section">
            <h4>SYSTEM</h4>
            <div className="tm-kv"><span>host</span><span>zeppieri</span></div>
            <div className="tm-kv"><span>kernel</span><span>3.2.1</span></div>
            <div className="tm-kv"><span>shell</span><span>bash</span></div>
            <div className="tm-kv"><span>uptime</span><span>{uptimeStr}</span></div>
          </div>
          <div className="tm-section">
            <h4>CPU</h4>
            <div className="tm-meter"><div className="tm-meter-fill" style={{ width: `${cpuLoad * 3}%` }} /></div>
          </div>
          <div className="tm-section">
            <h4>MEM</h4>
            <div className="tm-meter"><div className="tm-meter-fill" style={{ width: `${memUsed * 1.8}%` }} /></div>
          </div>
          <div className="tm-section">
            <h4>OPERATOR</h4>
            <pre>{ASCII_MINI}</pre>
          </div>
          <div className="tm-section">
            <h4>HINT</h4>
            <div className="tm-kv"><span>type</span><span>help</span></div>
            <div className="tm-kv"><span>tab</span><span>autocomplete</span></div>
            <div className="tm-kv"><span>ctrl+l</span><span>clear</span></div>
            <div className="tm-kv"><span>exit</span><span>leave</span></div>
          </div>
        </aside>

        {/* Scrollback + input */}
        <div className="tm-scrollback-wrap">
          <div className="tm-scrollback" ref={scrollRef}>
            {lines.map((ln) => (
              <div key={ln.id} className={`tm-line ${ln.cls}`}>
                {ln.block ? <pre className="tm-block">{ln.text}</pre> : ln.text || ' '}
              </div>
            ))}
          </div>

          <form
            className="tm-inputrow"
            onSubmit={(e) => {
              e.preventDefault()
              const cmd = input
              setInput('')
              setHistIdx(-1)
              setPendingInput('')
              dispatch(cmd)
            }}
          >
            <span className="tm-prompt">zach@zeppieri:~$ </span>
            <div className="tm-input-wrap">
              <input
                ref={inputRef}
                className="tm-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                aria-label="Terminal input"
                disabled={!booted}
              />
              <span className="tm-cursor" aria-hidden="true" />
            </div>
          </form>
        </div>
      </div>

      {/* Train easter egg */}
      <div
        key={trainKey}
        className={`tm-train ${trainKey ? 'tm-train-go' : ''}`}
        aria-hidden="true"
      >
{`         ====        ________                ___________
    _D _|  |_______/        \\__I_I_____===__|_________|
     |(_)---  |   H\\________/ |   |        =|___ ___|      _________________
     /     |  |   H  |  |     |   |         ||_| |_||     _|                \\_____A
    |      |  |   H  |__--------------------| [___] |   =|                        |
    | ________|___H__/__|_____/[][]~\\_______|       |   -|                        |
    |/ |   |-----------I_____I [][] []  D   |=======|____|________________________|_
  __/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_
   |/-=|___|=    ||    ||    ||    |_____/~\\___/        |_D__D__D_|  |_D__D__D_|
    \\_/      \\O=====O=====O=====O_/      \\_/               \\_/   \\_/    \\_/   \\_/`}
      </div>

      {/* Embedded app slot (host renders the actual game in response to event) */}
      {appRunning && (
        <div className="tm-app-slot" role="dialog" aria-label={`Embedded ${appRunning}`}>
          <div className="tm-app-slot-header">
            <span>/usr/local/bin/{appRunning}  (esc to close)</span>
            <button
              className="tm-app-slot-close"
              onClick={() => {
                setAppRunning(null)
                try {
                  window.dispatchEvent(new CustomEvent('terminal:close-app'))
                } catch {
                  /* no-op */
                }
              }}
            >
              close
            </button>
          </div>
          <div className="tm-app-slot-body">
            <div style={{ color: 'var(--tm-fg)', fontSize: 12 }}>
              [ {appRunning} ] launching — listening for host render on the
              'terminal:run' event (detail.app = "{appRunning}"). The host page
              should mount the game inside this slot or in its own overlay.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
