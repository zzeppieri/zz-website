/* ============================================================
   Neural.jsx — full-screen knowledge-graph / neural-net takeover
   Zeppieri Industries · NEURAL GRAPH v1.0

   Usage:
     import Neural from './modes/Neural'
     <Neural onExit={() => setMode('default')} />

   Self-contained: no D3, no Three.js. Pure React + SVG + Canvas.
============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './neural.css'

/* ── Reduced-motion detection ── */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ── Mobile detection (for pulse caps + panel placement) ── */
const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth <= 720

/* ── Cluster palette ── */
const CLUSTER_COLOR = {
  root: '#e8f6ff',
  lean: '#4ade80',
  mes: '#22d3ee',
  ai: '#e879f9',
  capital: '#fbbf24',
  people: '#a78bfa',
  artifact: '#94a3b8',
}

/* ── Graph definition.
   Layout is computed at runtime from the layer/index pair.
   Layer 0 = root. Layers 1..3 are concentric rings.
*/
const RAW_NODES = [
  // Layer 0 — root
  {
    id: 'root',
    label: 'ZACHARY ZEPPIERI',
    layer: 0,
    cluster: 'root',
    parent: null,
    title: 'Senior Continuous Improvement Engineer',
    body: 'Chromalloy NY · MRO aerospace · AI-augmented problem decomposer who ships. ME, SUNY New Paltz. Hands on lean, MES, capital projects, and people leadership.',
    metric: '30,000+ hrs saved · 129% of target',
  },

  // Layer 1 — five immediate children
  {
    id: 'lean',
    label: 'LEAN OPS',
    layer: 1,
    cluster: 'lean',
    parent: 'root',
    title: 'Lean Operations',
    body: 'Daily-flow improvement, kaizen events, value-stream mapping, TPM rollouts, and Six Sigma rigor across the Chromalloy NY shop floor.',
    metric: '29 kaizen events run / supported',
  },
  {
    id: 'mes',
    label: 'MES SYSTEMS',
    layer: 1,
    cluster: 'mes',
    parent: 'root',
    title: 'MES & Shop-Floor Systems',
    body: 'Tulip MES rollout (NY + Windsor CT), MES routing logic, SyteLine ERP integration, and Model Context Protocol bridges for live shop data.',
    metric: 'Multi-site Tulip rollout',
  },
  {
    id: 'ai',
    label: 'AI-AUGMENTED',
    layer: 1,
    cluster: 'ai',
    parent: 'root',
    title: 'AI-Augmented Engineering',
    body: 'Claude-driven PM framework, Copilot ingestion pipelines, custom Python tooling, MCP servers — leverage > headcount.',
    metric: 'Internal toolchain shipped',
  },
  {
    id: 'capital',
    label: 'CAPITAL PROJECTS',
    layer: 1,
    cluster: 'capital',
    parent: 'root',
    title: 'Capital Projects',
    body: 'Multi-million-dollar cell builds, patent-pending fixturing, plasma and vane work — owned end to end.',
    metric: '$2.4M blade cell · patent pending',
  },
  {
    id: 'people',
    label: 'PEOPLE LEADERSHIP',
    layer: 1,
    cluster: 'people',
    parent: 'root',
    title: 'People Leadership',
    body: 'Lunch-and-learn series, intern mentorship, operator coaching, and cross-site kaizen leadership.',
    metric: '77+ trained',
  },

  // Layer 2 — clusters under each Layer 1 node
  // LEAN
  { id: 'lean-5s', label: '5S', layer: 2, cluster: 'lean', parent: 'lean', title: '5S Deployment', body: 'Sort/Set/Shine/Standardize/Sustain rolled across multiple cells; audit cadence baked into supervisor routines.' },
  { id: 'lean-kaizen', label: 'Kaizen', layer: 2, cluster: 'lean', parent: 'lean', title: 'Kaizen Events', body: '29 kaizen events run or directly supported across 2024–2025, spanning blade, vane, and combustor lines.' },
  { id: 'lean-vsm', label: 'VSM', layer: 2, cluster: 'lean', parent: 'lean', title: 'Value-Stream Mapping', body: 'Current/future-state VSMs on the highest-takt product families to expose hidden queue and rework time.' },
  { id: 'lean-tpm', label: 'TPM', layer: 2, cluster: 'lean', parent: 'lean', title: 'Total Productive Maintenance', body: 'Plasma TPM cadence + standard work that lifted utilization on bottleneck assets.' },
  { id: 'lean-ss', label: 'Six Sigma', layer: 2, cluster: 'lean', parent: 'lean', title: 'Six Sigma', body: 'DMAIC framing on chronic scrap drivers; data pulls direct from SyteLine + Tulip.' },

  // MES
  { id: 'mes-tulip', label: 'Tulip MES', layer: 2, cluster: 'mes', parent: 'mes', title: 'Tulip MES', body: 'No/low-code MES platform deployed at Chromalloy NY and rolled to Windsor CT. Operator apps, machine connectors, KPI walls.' },
  { id: 'mes-router', label: 'MES Router', layer: 2, cluster: 'mes', parent: 'mes', title: 'MES Routing Logic', body: 'Custom routing layer that pushes the right work instruction to the right station for the active part + operation.' },
  { id: 'mes-syteline', label: 'SyteLine', layer: 2, cluster: 'mes', parent: 'mes', title: 'SyteLine ERP', body: 'ERP system of record. Bridged with Tulip via MCP + middleware so shop-floor signals feed planning automatically.' },
  { id: 'mes-mcp', label: 'MCP', layer: 2, cluster: 'mes', parent: 'mes', title: 'Model Context Protocol', body: 'MCP servers expose Tulip, SyteLine, and Smartsheet data to Claude — agents can query live shop-floor state.' },
  { id: 'mes-wi', label: 'Work Instructions', layer: 2, cluster: 'mes', parent: 'mes', title: 'Digital Work Instructions', body: 'Versioned, image-rich, step-gated WIs replacing static PDFs — measurable first-pass-yield gains.' },

  // AI
  { id: 'ai-pm', label: 'Claude PM Framework', layer: 2, cluster: 'ai', parent: 'ai', title: 'Claude PM Framework', body: 'Reusable Claude prompt + skill stack for project management — schedule, risk, status, stakeholder comms — tuned for cap-ex rollout.' },
  { id: 'ai-copilot', label: 'Copilot Ingestion', layer: 2, cluster: 'ai', parent: 'ai', title: 'Copilot Ingestion Pipeline', body: 'Pipeline that ingests Chromalloy SharePoint + Teams artifacts into a queryable knowledge surface.' },
  { id: 'ai-tulip-py', label: 'Python TulipAppBuilder', layer: 2, cluster: 'ai', parent: 'ai', title: 'TulipAppBuilder (Python)', body: 'Internal generator that scaffolds Tulip apps from a spec — collapses days of clicking into minutes of code.' },
  { id: 'ai-ss-mcp', label: 'Smartsheet MCP', layer: 2, cluster: 'ai', parent: 'ai', title: 'Smartsheet MCP', body: 'MCP server exposing Smartsheet plans + rollups to Claude. PMs talk to their plan in natural language.' },

  // CAPITAL
  { id: 'cap-blade', label: 'Blade Cell ($2.4M)', layer: 2, cluster: 'capital', parent: 'capital', title: 'Blade Cell — $2.4M', body: 'Owned a $2.4M blade cell build: layout, equipment spec, vendor management, ramp.' },
  { id: 'cap-baffle', label: 'Baffle Patent', layer: 2, cluster: 'capital', parent: 'capital', title: 'Baffle Fixturing — Patent Pending', body: 'Novel baffle fixture concept filed as patent-pending; eliminated a chronic scrap driver.' },
  { id: 'cap-vane', label: 'Vane Cell', layer: 2, cluster: 'capital', parent: 'capital', title: 'Vane Cell', body: 'Vane cell build supporting expanded MRO scope. Tied to MES routing + WIs.' },
  { id: 'cap-plasma', label: 'Plasma TPMs', layer: 2, cluster: 'capital', parent: 'capital', title: 'Plasma TPMs', body: 'TPM standard work + spare strategy on plasma assets; uptime lift documented in Dayforce.' },

  // PEOPLE
  { id: 'ppl-ll', label: 'Lunch-Learn (77+)', layer: 2, cluster: 'people', parent: 'people', title: 'Lunch & Learn Series', body: '77+ engineers and operators trained across lean, MES, and AI-augmented workflow topics.' },
  { id: 'ppl-intern', label: 'Intern Mentorship', layer: 2, cluster: 'people', parent: 'people', title: 'Intern Mentorship', body: 'Direct mentorship of summer CI interns; structured project scopes and weekly readouts.' },
  { id: 'ppl-op', label: 'Operator Coaching', layer: 2, cluster: 'people', parent: 'people', title: 'Operator Coaching', body: 'Floor coaching during kaizens and new-cell ramp — translates lean theory into actual operator habits.' },
  { id: 'ppl-cross', label: 'Cross-Site Kaizens', layer: 2, cluster: 'people', parent: 'people', title: 'Cross-Site Kaizens', body: 'Kaizen leadership at sister sites — playbooks travel with the engineer, not the manual.' },

  // Layer 3 — artifact / metric badges
  { id: 'art-hours', label: '30,000 hrs', layer: 3, cluster: 'artifact', parent: 'lean-kaizen', title: 'Hours Saved', body: 'Verified ≈30,000 hours of savings booked across Chromalloy NY product lines, 2024–2025 cycle. Independently audited via Dayforce.' },
  { id: 'art-target', label: '129% of target', layer: 3, cluster: 'artifact', parent: 'lean-kaizen', title: '129% of Target', body: 'Annual savings target exceeded by 29% — documented in performance review.' },
  { id: 'art-events', label: '29 events', layer: 3, cluster: 'artifact', parent: 'lean-vsm', title: '29 Kaizen Events', body: '29 kaizen events directly run or supported in the 2024–2025 cycle.' },
  { id: 'art-patent', label: 'patent pending', layer: 3, cluster: 'artifact', parent: 'cap-baffle', title: 'Patent Pending', body: 'Baffle fixturing concept filed as patent-pending.' },
  { id: 'art-trained', label: '77+ trained', layer: 3, cluster: 'artifact', parent: 'ppl-ll', title: '77+ Trained', body: 'Lunch-and-learn attendance across multiple sessions; mix of engineers, supervisors, operators.' },
  { id: 'art-windsor', label: 'Windsor CT live', layer: 3, cluster: 'artifact', parent: 'mes-tulip', title: 'Windsor CT Deployment', body: 'Tulip MES live at the Windsor CT site — multi-site rollout pattern proven.' },
  { id: 'art-mcp', label: '3 MCP servers', layer: 3, cluster: 'artifact', parent: 'mes-mcp', title: 'MCP Servers Live', body: 'Tulip, SyteLine, and Smartsheet MCP servers internally available.' },
  { id: 'art-genpy', label: 'TulipAppBuilder shipped', layer: 3, cluster: 'artifact', parent: 'ai-tulip-py', title: 'Internal Tooling', body: 'Python TulipAppBuilder in active internal use.' },
]

/* ── Layout: compute (x,y) for each node from its layer + sibling index ── */
const RADIUS_BY_LAYER = [0, 180, 360, 540]

function buildLayout(nodes) {
  // Group children by parent so siblings get spread evenly
  const childrenOf = new Map()
  for (const n of nodes) {
    if (!n.parent) continue
    if (!childrenOf.has(n.parent)) childrenOf.set(n.parent, [])
    childrenOf.get(n.parent).push(n)
  }

  const placed = new Map()

  // Root at origin
  const root = nodes.find((n) => n.layer === 0)
  placed.set(root.id, { ...root, x: 0, y: 0, baseX: 0, baseY: 0, angle: 0 })

  // Layer 1: distribute evenly around root
  const layer1 = nodes.filter((n) => n.layer === 1)
  const l1Count = layer1.length
  layer1.forEach((n, i) => {
    const angle = (i / l1Count) * Math.PI * 2 - Math.PI / 2
    const r = RADIUS_BY_LAYER[1]
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    placed.set(n.id, { ...n, x, y, baseX: x, baseY: y, angle })
  })

  // Layer 2+: each child sits in an angular arc around its parent's bearing
  function placeChildren(parentId) {
    const kids = childrenOf.get(parentId) || []
    if (!kids.length) return
    const parent = placed.get(parentId)
    const parentAngle = parent.angle || 0
    const arcSpan = Math.PI / 2.2   // ~82° total spread
    const kidLayer = kids[0].layer
    const r = RADIUS_BY_LAYER[kidLayer]
    kids.forEach((k, i) => {
      const t = kids.length === 1 ? 0 : i / (kids.length - 1) - 0.5
      const angle = parentAngle + t * arcSpan
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      placed.set(k.id, { ...k, x, y, baseX: x, baseY: y, angle })
      placeChildren(k.id)
    })
  }

  for (const n of layer1) placeChildren(n.id)

  return Array.from(placed.values())
}

/* ── Edges: every node connects to its parent ── */
function buildEdges(nodes) {
  const map = new Map(nodes.map((n) => [n.id, n]))
  const edges = []
  for (const n of nodes) {
    if (!n.parent) continue
    const p = map.get(n.parent)
    if (!p) continue
    edges.push({ id: `${p.id}->${n.id}`, from: p.id, to: n.id })
  }
  return edges
}

/* ============================================================
   Component
============================================================ */
export default function Neural({ onExit = () => {} }) {
  const reduced = useMemo(prefersReducedMotion, [])
  const [mobile, setMobile] = useState(isMobileViewport)
  const [selected, setSelected] = useState(null)   // node object or null
  const [hovered, setHovered] = useState(null)     // node id or null

  // Camera (viewBox)
  const [cam, setCam] = useState({ x: -700, y: -450, w: 1400, h: 900 })
  const camRef = useRef(cam)
  useEffect(() => { camRef.current = cam }, [cam])

  // Layout
  const nodes = useMemo(() => buildLayout(RAW_NODES), [])
  const edges = useMemo(() => buildEdges(nodes), [nodes])
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const childrenOf = useMemo(() => {
    const m = new Map()
    for (const n of nodes) {
      if (!n.parent) continue
      if (!m.has(n.parent)) m.set(n.parent, [])
      m.get(n.parent).push(n.id)
    }
    return m
  }, [nodes])

  // Breathing offset per node (refs only — driven by rAF, no React re-render storm)
  const breatheRef = useRef(new Map())
  useEffect(() => {
    const m = new Map()
    nodes.forEach((n) => m.set(n.id, { dx: 0, dy: 0, phase: Math.random() * Math.PI * 2 }))
    breatheRef.current = m
  }, [nodes])

  const svgRef = useRef(null)
  const canvasRef = useRef(null)
  const groupRef = useRef(null)  // <g> holding nodes — we transform DOM directly for breathing
  const edgeRefs = useRef(new Map()) // edge id -> <line>
  const labelRefs = useRef(new Map()) // node id -> <g>

  /* ── Starfield ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let raf = 0
    const draw = () => {
      const w = canvas.width = canvas.clientWidth * window.devicePixelRatio
      const h = canvas.height = canvas.clientHeight * window.devicePixelRatio
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, w, h)
      // Deterministic-ish stars
      const count = Math.floor((canvas.clientWidth * canvas.clientHeight) / 4000)
      for (let i = 0; i < count; i++) {
        const x = ((i * 9301 + 49297) % 233280) / 233280 * w
        const y = ((i * 4561 + 8923) % 233280) / 233280 * h
        const a = 0.2 + ((i * 7) % 60) / 100
        const r = (i % 7 === 0 ? 1.5 : 0.7) * window.devicePixelRatio
        ctx.fillStyle = `rgba(180, 220, 255, ${a})`
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    draw()
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(draw)
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  /* ── Mobile flag tracking ── */
  useEffect(() => {
    const onResize = () => setMobile(isMobileViewport())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /* ── Breathing animation (rAF, direct DOM updates) ── */
  useEffect(() => {
    if (reduced) return
    let raf = 0
    let last = performance.now()
    const tick = (t) => {
      const dt = (t - last) / 1000
      last = t
      const m = breatheRef.current
      // Update breathe offsets
      m.forEach((entry) => {
        entry.phase += dt * 0.6
      })
      // Apply to DOM
      nodes.forEach((n) => {
        const entry = m.get(n.id)
        if (!entry) return
        const amp = n.layer === 0 ? 0 : 3 + n.layer * 1.5
        entry.dx = Math.cos(entry.phase) * amp
        entry.dy = Math.sin(entry.phase * 0.8) * amp
        const g = labelRefs.current.get(n.id)
        if (g) {
          g.setAttribute('transform', `translate(${n.baseX + entry.dx}, ${n.baseY + entry.dy})`)
        }
      })
      // Apply to edges (re-anchor endpoints)
      edges.forEach((e) => {
        const a = m.get(e.from)
        const b = m.get(e.to)
        const na = nodeById.get(e.from)
        const nb = nodeById.get(e.to)
        const line = edgeRefs.current.get(e.id)
        if (line && a && b && na && nb) {
          line.setAttribute('x1', na.baseX + a.dx)
          line.setAttribute('y1', na.baseY + a.dy)
          line.setAttribute('x2', nb.baseX + b.dx)
          line.setAttribute('y2', nb.baseY + b.dy)
        }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [nodes, edges, nodeById, reduced])

  /* ── Signal pulses ── */
  const [pulses, setPulses] = useState([])  // {id, edgeId, born, dur, color}
  const pulseSeq = useRef(0)

  useEffect(() => {
    if (reduced) return
    const cap = mobile ? 6 : 14
    const cadence = mobile ? 700 : 380
    const spawn = () => {
      setPulses((prev) => {
        if (prev.length >= cap) return prev
        const e = edges[Math.floor(Math.random() * edges.length)]
        if (!e) return prev
        const tgt = nodeById.get(e.to)
        const color = CLUSTER_COLOR[tgt?.cluster] || '#7dd3fc'
        const id = ++pulseSeq.current
        return [...prev, { id, edgeId: e.id, born: performance.now(), dur: 900 + Math.random() * 700, color }]
      })
    }
    const iv = setInterval(spawn, cadence)
    return () => clearInterval(iv)
  }, [edges, nodeById, reduced, mobile])

  // Pulse position tick — drive pulse DOM via rAF without thrashing React state
  const pulseRefs = useRef(new Map())  // pulse id -> <circle>
  useEffect(() => {
    if (reduced) return
    let raf = 0
    const tick = () => {
      const now = performance.now()
      const m = breatheRef.current
      let needsGC = false
      pulses.forEach((p) => {
        const el = pulseRefs.current.get(p.id)
        if (!el) return
        const t = (now - p.born) / p.dur
        if (t >= 1) {
          el.style.opacity = '0'
          needsGC = true
          return
        }
        const e = edges.find((x) => x.id === p.edgeId)
        if (!e) return
        const a = nodeById.get(e.from)
        const b = nodeById.get(e.to)
        if (!a || !b) return
        const da = m.get(e.from)
        const db = m.get(e.to)
        const ax = a.baseX + (da?.dx || 0)
        const ay = a.baseY + (da?.dy || 0)
        const bx = b.baseX + (db?.dx || 0)
        const by = b.baseY + (db?.dy || 0)
        const px = ax + (bx - ax) * t
        const py = ay + (by - ay) * t
        const fade = t < 0.1 ? t / 0.1 : t > 0.85 ? (1 - t) / 0.15 : 1
        el.setAttribute('cx', px)
        el.setAttribute('cy', py)
        el.style.opacity = String(0.9 * fade)
      })
      if (needsGC) {
        setPulses((prev) => prev.filter((p) => now - p.born < p.dur))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pulses, edges, nodeById, reduced])

  /* ── Pan + zoom ── */
  const dragRef = useRef(null)     // {x, y, cam}
  const pinchRef = useRef(null)    // {d0, cam}

  const screenToView = useCallback((sx, sy) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const c = camRef.current
    return {
      x: c.x + ((sx - rect.left) / rect.width) * c.w,
      y: c.y + ((sy - rect.top) / rect.height) * c.h,
    }
  }, [])

  const zoomAt = useCallback((sx, sy, factor) => {
    const before = screenToView(sx, sy)
    setCam((c) => {
      const newW = Math.min(3200, Math.max(400, c.w * factor))
      const newH = Math.min(2400, Math.max(300, c.h * factor))
      // Keep the world point under cursor stationary
      const svg = svgRef.current
      const rect = svg ? svg.getBoundingClientRect() : { width: 1, height: 1, left: 0, top: 0 }
      const fx = (sx - rect.left) / rect.width
      const fy = (sy - rect.top) / rect.height
      return {
        x: before.x - fx * newW,
        y: before.y - fy * newH,
        w: newW,
        h: newH,
      }
    })
  }, [screenToView])

  const onWheel = useCallback((ev) => {
    ev.preventDefault()
    const factor = ev.deltaY > 0 ? 1.12 : 0.89
    zoomAt(ev.clientX, ev.clientY, factor)
  }, [zoomAt])

  const onPointerDown = useCallback((ev) => {
    // Touch with 2 fingers handled in touch-specific block
    if (ev.target?.dataset?.nodeId) return  // clicks go to node
    const svg = svgRef.current
    if (!svg) return
    svg.setPointerCapture?.(ev.pointerId)
    dragRef.current = { x: ev.clientX, y: ev.clientY, cam: { ...camRef.current } }
  }, [])

  const onPointerMove = useCallback((ev) => {
    const d = dragRef.current
    if (!d) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const dx = (ev.clientX - d.x) * (d.cam.w / rect.width)
    const dy = (ev.clientY - d.y) * (d.cam.h / rect.height)
    setCam({ ...d.cam, x: d.cam.x - dx, y: d.cam.y - dy })
  }, [])

  const onPointerUp = useCallback((ev) => {
    dragRef.current = null
    const svg = svgRef.current
    if (svg) svg.releasePointerCapture?.(ev.pointerId)
  }, [])

  /* ── Touch (pinch) ── */
  const onTouchStart = useCallback((ev) => {
    if (ev.touches.length === 2) {
      const dx = ev.touches[0].clientX - ev.touches[1].clientX
      const dy = ev.touches[0].clientY - ev.touches[1].clientY
      pinchRef.current = {
        d0: Math.hypot(dx, dy) || 1,
        cam: { ...camRef.current },
        cx: (ev.touches[0].clientX + ev.touches[1].clientX) / 2,
        cy: (ev.touches[0].clientY + ev.touches[1].clientY) / 2,
      }
      dragRef.current = null  // pinch overrides drag
    }
  }, [])

  const onTouchMove = useCallback((ev) => {
    const p = pinchRef.current
    if (p && ev.touches.length === 2) {
      ev.preventDefault()
      const dx = ev.touches[0].clientX - ev.touches[1].clientX
      const dy = ev.touches[0].clientY - ev.touches[1].clientY
      const d = Math.hypot(dx, dy) || 1
      const factor = p.d0 / d
      const svg = svgRef.current
      const rect = svg ? svg.getBoundingClientRect() : { width: 1, height: 1, left: 0, top: 0 }
      const fx = (p.cx - rect.left) / rect.width
      const fy = (p.cy - rect.top) / rect.height
      const newW = Math.min(3200, Math.max(400, p.cam.w * factor))
      const newH = Math.min(2400, Math.max(300, p.cam.h * factor))
      // World point under pinch center, computed from snapshot cam
      const worldX = p.cam.x + fx * p.cam.w
      const worldY = p.cam.y + fy * p.cam.h
      setCam({
        x: worldX - fx * newW,
        y: worldY - fy * newH,
        w: newW,
        h: newH,
      })
    }
  }, [])

  const onTouchEnd = useCallback((ev) => {
    if (ev.touches.length < 2) {
      pinchRef.current = null
    }
  }, [])

  /* ── Keyboard: Escape exits ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (selected) setSelected(null)
        else onExit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, onExit])

  /* ── Hover / select highlight calc ── */
  const highlightSet = useMemo(() => {
    if (!hovered) return null
    const ids = new Set([hovered])
    const kids = childrenOf.get(hovered) || []
    kids.forEach((k) => ids.add(k))
    const self = nodeById.get(hovered)
    if (self?.parent) ids.add(self.parent)
    return ids
  }, [hovered, childrenOf, nodeById])

  const isDim = useCallback((id) => {
    if (!highlightSet) return false
    return !highlightSet.has(id)
  }, [highlightSet])

  const edgeDim = useCallback((e) => {
    if (!highlightSet) return false
    return !(highlightSet.has(e.from) && highlightSet.has(e.to))
  }, [highlightSet])

  /* ── Minimap geometry ── */
  const MM = { w: 140, h: 90, pad: 8 }
  const mmBounds = useMemo(() => {
    const xs = nodes.map((n) => n.baseX)
    const ys = nodes.map((n) => n.baseY)
    const minX = Math.min(...xs) - 40
    const maxX = Math.max(...xs) + 40
    const minY = Math.min(...ys) - 40
    const maxY = Math.max(...ys) + 40
    return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY }
  }, [nodes])

  const mmProject = useCallback((x, y) => {
    const sx = (x - mmBounds.minX) / mmBounds.w * (MM.w - MM.pad * 2) + MM.pad
    const sy = (y - mmBounds.minY) / mmBounds.h * (MM.h - MM.pad * 2) + MM.pad
    return { sx, sy }
  }, [mmBounds])

  const mmViewport = useMemo(() => {
    const a = mmProject(cam.x, cam.y)
    const b = mmProject(cam.x + cam.w, cam.y + cam.h)
    return { x: a.sx, y: a.sy, w: b.sx - a.sx, h: b.sy - a.sy }
  }, [cam, mmProject])

  /* ── Node sizing ── */
  const nodeRadius = (n) => {
    if (n.layer === 0) return 38
    if (n.layer === 1) return 22
    if (n.layer === 2) return 14
    return 10
  }

  const nodeFontSize = (n) => {
    if (n.layer === 0) return 14
    if (n.layer === 1) return 11
    if (n.layer === 2) return 9
    return 8
  }

  /* ── Click handler ── */
  const onNodeClick = useCallback((n) => (ev) => {
    ev.stopPropagation()
    setSelected(n)
  }, [])

  /* ── Render ── */
  return (
    <div
      className={`neural-root ${mobile ? 'is-mobile' : ''} ${reduced ? 'is-reduced' : ''}`}
      role="region"
      aria-label="Neural graph portfolio mode"
    >
      <canvas ref={canvasRef} className="neural-stars" />

      <svg
        ref={svgRef}
        className="neural-svg"
        viewBox={`${cam.x} ${cam.y} ${cam.w} ${cam.h}`}
        preserveAspectRatio="xMidYMid meet"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <defs>
          <filter id="nGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="nGlowBig" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="rootGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="55%" stopColor="#7dd3fc" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.4" />
          </radialGradient>
        </defs>

        {/* Edges */}
        <g className="neural-edges">
          {edges.map((e) => {
            const a = nodeById.get(e.from)
            const b = nodeById.get(e.to)
            if (!a || !b) return null
            return (
              <line
                key={e.id}
                ref={(el) => { if (el) edgeRefs.current.set(e.id, el); else edgeRefs.current.delete(e.id) }}
                x1={a.baseX} y1={a.baseY} x2={b.baseX} y2={b.baseY}
                className={`neural-edge ${edgeDim(e) ? 'dim' : ''}`}
              />
            )
          })}
        </g>

        {/* Pulses */}
        <g className="neural-pulses">
          {pulses.map((p) => (
            <circle
              key={p.id}
              ref={(el) => { if (el) pulseRefs.current.set(p.id, el); else pulseRefs.current.delete(p.id) }}
              r={3}
              fill={p.color}
              filter="url(#nGlow)"
              className="neural-pulse"
            />
          ))}
        </g>

        {/* Center rotating ring around root */}
        <g className="neural-rootring" transform={`translate(0,0)`}>
          <circle r="62" className="neural-ring outer" />
          <circle r="78" className="neural-ring middle" />
          <circle r="98" className="neural-ring inner" />
        </g>

        {/* Nodes */}
        <g className="neural-nodes">
          {nodes.map((n) => {
            const r = nodeRadius(n)
            const fs = nodeFontSize(n)
            const color = CLUSTER_COLOR[n.cluster] || '#7dd3fc'
            const dim = isDim(n.id)
            const isSelected = selected?.id === n.id
            return (
              <g
                key={n.id}
                ref={(el) => { if (el) labelRefs.current.set(n.id, el); else labelRefs.current.delete(n.id) }}
                transform={`translate(${n.baseX}, ${n.baseY})`}
                className={`neural-node layer-${n.layer} cluster-${n.cluster} ${dim ? 'dim' : ''} ${isSelected ? 'sel' : ''}`}
                data-node-id={n.id}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered((h) => (h === n.id ? null : h))}
                onClick={onNodeClick(n)}
                onTouchEnd={(ev) => { if (ev.touches.length === 0) { ev.preventDefault(); onNodeClick(n)(ev) } }}
                style={{ cursor: 'pointer' }}
              >
                {/* Halo */}
                <circle r={r * 1.9} className="neural-halo" fill={color} opacity="0.08" />
                {/* Core */}
                <circle
                  r={r}
                  fill={n.layer === 0 ? 'url(#rootGrad)' : color}
                  filter={n.layer === 0 ? 'url(#nGlowBig)' : 'url(#nGlow)'}
                  className="neural-core"
                  data-node-id={n.id}
                />
                {/* Inner pulse ring */}
                <circle r={r * 0.55} fill="rgba(255,255,255,0.6)" className="neural-inner" data-node-id={n.id} />
                {/* Label */}
                <text
                  y={n.layer === 0 ? 5 : r + fs + 4}
                  textAnchor="middle"
                  className="neural-label"
                  fontSize={fs}
                  data-node-id={n.id}
                >
                  {n.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {/* Top-left brand */}
      <div className="neural-brand">ZEPPIERI / NEURAL GRAPH v1.0</div>

      {/* Top-right exit */}
      <button className="neural-exit" onClick={onExit} aria-label="Exit Neural mode">
        EXIT NEURAL
      </button>

      {/* Bottom-left hint */}
      <div className="neural-hint">
        {mobile ? 'drag to pan · pinch to zoom · tap a node' : 'drag to pan · scroll to zoom · click a node'}
      </div>

      {/* Minimap */}
      <div className="neural-minimap" aria-hidden="true">
        <svg width={MM.w} height={MM.h} viewBox={`0 0 ${MM.w} ${MM.h}`}>
          <rect x="0" y="0" width={MM.w} height={MM.h} className="neural-mm-bg" />
          {edges.map((e) => {
            const a = nodeById.get(e.from)
            const b = nodeById.get(e.to)
            if (!a || !b) return null
            const pa = mmProject(a.baseX, a.baseY)
            const pb = mmProject(b.baseX, b.baseY)
            return <line key={e.id} x1={pa.sx} y1={pa.sy} x2={pb.sx} y2={pb.sy} className="neural-mm-edge" />
          })}
          {nodes.map((n) => {
            const p = mmProject(n.baseX, n.baseY)
            return <circle key={n.id} cx={p.sx} cy={p.sy} r={n.layer === 0 ? 2.2 : 1.4} fill={CLUSTER_COLOR[n.cluster] || '#7dd3fc'} />
          })}
          <rect
            x={mmViewport.x} y={mmViewport.y}
            width={Math.max(2, mmViewport.w)} height={Math.max(2, mmViewport.h)}
            className="neural-mm-viewport"
          />
        </svg>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className={`neural-panel ${mobile ? 'mobile' : ''}`} role="dialog" aria-label={selected.title || selected.label}>
          <div className="neural-panel-head" style={{ borderColor: CLUSTER_COLOR[selected.cluster] || '#7dd3fc' }}>
            <div className="neural-panel-cluster" style={{ color: CLUSTER_COLOR[selected.cluster] || '#7dd3fc' }}>
              {selected.cluster.toUpperCase()}
            </div>
            <button className="neural-panel-close" onClick={() => setSelected(null)} aria-label="Close detail panel">×</button>
          </div>
          <h2 className="neural-panel-title">{selected.title || selected.label}</h2>
          <p className="neural-panel-body">{selected.body}</p>
          {selected.metric && (
            <div className="neural-panel-metric">{selected.metric}</div>
          )}
          {(() => {
            const related = (childrenOf.get(selected.id) || []).map((id) => nodeById.get(id)).filter(Boolean)
            if (!related.length) return null
            return (
              <div className="neural-panel-related">
                <div className="neural-panel-label">CONNECTED</div>
                <ul>
                  {related.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => setSelected(r)}
                        style={{ color: CLUSTER_COLOR[r.cluster] || '#7dd3fc' }}
                      >
                        {r.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
