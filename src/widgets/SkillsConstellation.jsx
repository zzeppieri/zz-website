import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './skills-constellation.css'

/* ─────────────────────────────────────────────────────────────────────────
 * Skills Constellation — self-contained force-directed graph.
 *
 *   No D3, no external sim libs. ~250 LOC of vanilla physics:
 *     - Spring force on edges (Hooke)
 *     - Coulomb-style global repulsion
 *     - Mild gravity toward center
 *     - Velocity damping
 *     - Euler integration in a rAF loop
 *
 *   Renders to SVG. Drag pins a node while held; release returns it
 *   to the sim. Hover highlights node + direct neighbors. Click shows
 *   a tooltip + blip ring. Respects prefers-reduced-motion.
 * ───────────────────────────────────────────────────────────────────────── */

/* ── Cluster palette (matches site CRT/blueprint aesthetic) ─────────────── */
const CLUSTERS = {
  lean:        { label: 'Lean / CI',     color: '#33ff66' },
  mes:         { label: 'MES',           color: '#4ec9d4' },
  pm:          { label: 'Program Mgmt',  color: '#f5c451' },
  coaching:    { label: 'Coaching',      color: '#ffb347' },
  software:    { label: 'Software',      color: '#e066d8' },
  engineering: { label: 'Engineering',   color: '#ff7a3a' },
}

/* ── Nodes ──────────────────────────────────────────────────────────────── */
const NODES = [
  // Lean & CI
  { id: 'six_sigma',     label: 'Six Sigma GB',     cluster: 'lean',        desc: 'Green-Belt certified DMAIC practitioner.' },
  { id: 'kaizen',        label: 'Kaizen',           cluster: 'lean',        desc: '29 Kaizen events facilitated (2024–25).' },
  { id: 'vsm',           label: 'VSM',              cluster: 'lean',        desc: 'Value Stream Mapping — current/future state.' },
  { id: 'tpm',           label: 'TPM',              cluster: 'lean',        desc: 'Total Productive Maintenance pillars.' },
  { id: 'threep',        label: '3P',               cluster: 'lean',        desc: 'Production Preparation Process — layout design.' },
  { id: 'fives',         label: '5S',               cluster: 'lean',        desc: 'Workplace organization standard.' },
  { id: 'tps',           label: 'TPS',              cluster: 'lean',        desc: 'Toyota Production System fundamentals.' },
  { id: 'std_work',      label: 'Standard Work',    cluster: 'lean',        desc: 'Document the best-known method.' },
  { id: 'lob',           label: 'Line of Balance',  cluster: 'lean',        desc: 'Takt-driven flow balancing.' },
  { id: 'kamishibai',    label: 'Kamishibai',       cluster: 'lean',        desc: 'Card-based audit / sustainment.' },

  // MES
  { id: 'tulip',         label: 'Tulip MES',        cluster: 'mes',         desc: 'Site-wide deployment + Windsor rollout.' },
  { id: 'router',        label: 'MES Router',       cluster: 'mes',         desc: 'App routing / workflow orchestration.' },
  { id: 'wi_digital',    label: 'WI Digitization',  cluster: 'mes',         desc: 'Paper SOPs → interactive Tulip apps.' },
  { id: 'syteline',      label: 'SyteLine ERP',     cluster: 'mes',         desc: 'Infor ERP integration & shop-floor data.' },
  { id: 'mcp',           label: 'MCP',              cluster: 'mes',         desc: 'Model Context Protocol — Smartsheet bridge.' },

  // Program Mgmt
  { id: 'multimill',     label: 'Multi-$M Programs',cluster: 'pm',          desc: 'Owned multi-million-dollar program scopes.' },
  { id: 'raci',          label: 'RACI',             cluster: 'pm',          desc: 'Clear accountability matrices.' },
  { id: 'risk_reg',      label: 'Risk Register',    cluster: 'pm',          desc: 'Live mitigation tracking.' },
  { id: 'vendor',        label: 'Vendor Commercials',cluster: 'pm',         desc: 'Quotes, SOWs, change orders.' },
  { id: 'steering',      label: 'Steering Comm.',   cluster: 'pm',          desc: 'Cross-functional executive cadence.' },

  // Coaching
  { id: 'lunch_learn',   label: 'Lunch-and-Learn',  cluster: 'coaching',    desc: 'Lean training series — 77+ trained.' },
  { id: 'op_coach',      label: 'Operator Coaching',cluster: 'coaching',    desc: 'Floor-side improvement coaching.' },
  { id: 'eip',           label: 'Employee Ideas',   cluster: 'coaching',    desc: 'Employee Ideas Program admin.' },
  { id: 'people',        label: 'People Leadership',cluster: 'coaching',    desc: 'Mentor & develop direct reports.' },

  // Software
  { id: 'python',        label: 'Python',           cluster: 'software',    desc: 'Data, automation, glue code.' },
  { id: 'js',            label: 'JavaScript',       cluster: 'software',    desc: 'React, Vite, vanilla DOM.' },
  { id: 'd3',            label: 'D3.js',            cluster: 'software',    desc: 'Data viz / SVG graphics.' },
  { id: 'html_css',      label: 'HTML / CSS',       cluster: 'software',    desc: 'Layout, theming, animation.' },
  { id: 'pa',            label: 'Power Automate',   cluster: 'software',    desc: 'Flows + business-process glue.' },
  { id: 'ai_copilot',    label: 'Claude / Copilot', cluster: 'software',    desc: 'AI-augmented dev workflow.' },

  // Engineering
  { id: 'solidworks',    label: 'SOLIDWORKS',       cluster: 'engineering', desc: 'Parametric 3D CAD.' },
  { id: 'nx',            label: 'Siemens NX',       cluster: 'engineering', desc: 'High-end CAD + CAM.' },
  { id: 'printing',      label: '3D Printing',      cluster: 'engineering', desc: 'FDM / SLA rapid prototyping.' },
  { id: 'gdt',           label: 'GD&T',             cluster: 'engineering', desc: 'ASME Y14.5 tolerancing.' },
  { id: 'fea',           label: 'FEA',              cluster: 'engineering', desc: 'Finite element stress / thermal.' },
  { id: 'patent',        label: 'Patent-Pending',   cluster: 'engineering', desc: 'Patent-pending mechanical design.' },
]

/* ── Edges (skills → skills). Cross-cluster bridges intentional. ────────── */
const EDGES = [
  // Lean intra
  ['kaizen','six_sigma'], ['kaizen','vsm'], ['kaizen','std_work'], ['kaizen','fives'],
  ['vsm','lob'], ['vsm','std_work'], ['tps','kaizen'], ['tps','std_work'], ['tps','fives'],
  ['tpm','kamishibai'], ['fives','kamishibai'], ['threep','vsm'], ['lob','std_work'],
  // MES intra
  ['tulip','router'], ['tulip','wi_digital'], ['tulip','syteline'], ['router','wi_digital'],
  ['tulip','mcp'],
  // PM intra
  ['multimill','raci'], ['multimill','risk_reg'], ['multimill','vendor'], ['multimill','steering'],
  ['raci','steering'], ['risk_reg','steering'],
  // Coaching intra
  ['lunch_learn','op_coach'], ['lunch_learn','eip'], ['op_coach','eip'], ['people','op_coach'],
  ['people','lunch_learn'],
  // Software intra
  ['python','js'], ['python','ai_copilot'], ['js','d3'], ['js','html_css'], ['d3','html_css'],
  ['python','pa'], ['ai_copilot','js'],
  // Engineering intra
  ['solidworks','nx'], ['solidworks','gdt'], ['nx','gdt'], ['solidworks','fea'], ['nx','fea'],
  ['printing','solidworks'], ['patent','printing'], ['patent','solidworks'],
  // Cross-cluster bridges
  ['tulip','python'],
  ['tulip','js'],
  ['mcp','ai_copilot'],
  ['wi_digital','std_work'],
  ['tulip','kaizen'],
  ['lunch_learn','kaizen'],
  ['op_coach','std_work'],
  ['multimill','tulip'],
  ['multimill','kaizen'],
  ['patent','threep'],
  ['fea','solidworks'],
  ['pa','syteline'],
  ['ai_copilot','python'],
]

/* ── Physics tuning ─────────────────────────────────────────────────────── */
const SIM = {
  springK:       0.012,   // edge stiffness
  springRest:    90,      // edge rest length
  repulsion:     2400,    // node-node repulsion strength
  gravity:       0.012,   // pull toward center
  damping:       0.86,    // per-frame velocity damping
  maxVel:        18,
  dtCap:         1.6,
  coolingFrames: 600,     // additional cooling after which we lower work
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function seedLayout(nodes, w, h) {
  // Cluster-anchored seeding so the sim converges fast and looks deliberate.
  const cx = w / 2, cy = h / 2
  const clusterIds = Object.keys(CLUSTERS)
  const r = Math.min(w, h) * 0.32
  const centers = {}
  clusterIds.forEach((c, i) => {
    const a = (i / clusterIds.length) * Math.PI * 2 - Math.PI / 2
    centers[c] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
  })
  return nodes.map((n) => {
    const c = centers[n.cluster] || { x: cx, y: cy }
    const jitter = 30
    return {
      ...n,
      x: c.x + (Math.random() - 0.5) * jitter,
      y: c.y + (Math.random() - 0.5) * jitter,
      vx: 0,
      vy: 0,
      pinned: false,
    }
  })
}

/* ───────────────────────────── component ───────────────────────────────── */
export default function SkillsConstellation() {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const svgRef = useRef(null)
  const rafRef = useRef(0)
  const simStateRef = useRef(null)        // mutable physics state
  const dragRef = useRef(null)            // { id, offsetX, offsetY, pointerId }
  const frameCountRef = useRef(0)

  const [size, setSize] = useState({ w: 900, h: 560 })
  const [, forceRender] = useState(0)     // we trigger re-render after each frame from rAF
  const [hoverId, setHoverId] = useState(null)
  const [selected, setSelected] = useState(null) // { id, x, y } in svg coords
  const [blipId, setBlipId] = useState(null)
  const reducedMotion = useMemo(prefersReducedMotion, [])

  // Pre-compute adjacency for hover highlight
  const adjacency = useMemo(() => {
    const map = new Map()
    NODES.forEach((n) => map.set(n.id, new Set()))
    EDGES.forEach(([a, b]) => {
      map.get(a)?.add(b)
      map.get(b)?.add(a)
    })
    return map
  }, [])

  /* ── Measure the simulation stage (NOT the root, which also contains the
       legend). This way the physics bounds match the actual SVG area. ──── */
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.max(320, Math.floor(e.contentRect.width))
        const h = Math.max(280, Math.floor(e.contentRect.height))
        setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* ── Initialize / re-seed sim when size changes (or first mount) ────── */
  useLayoutEffect(() => {
    simStateRef.current = seedLayout(NODES, size.w, size.h)
    frameCountRef.current = 0
    forceRender((n) => n + 1)
  }, [size.w, size.h])

  /* ── Simulation loop ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!simStateRef.current) return

    if (reducedMotion) {
      // Run a quick synchronous relaxation so layout still looks good, then stop.
      stepSimulation(150, simStateRef.current, size.w, size.h)
      forceRender((n) => n + 1)
      return
    }

    let last = performance.now()
    const loop = (now) => {
      const dt = Math.min(SIM.dtCap, (now - last) / 16.6667)
      last = now
      stepSimulation(1, simStateRef.current, size.w, size.h, dt)
      frameCountRef.current += 1
      forceRender((n) => n + 1)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [size.w, size.h, reducedMotion])

  /* ── Pointer interaction (drag) ─────────────────────────────────────── */
  const onPointerDownNode = (e, id) => {
    if (!svgRef.current) return
    const svgPt = clientToSvg(svgRef.current, e.clientX, e.clientY, size)
    const node = simStateRef.current.find((n) => n.id === id)
    if (!node) return
    dragRef.current = {
      id,
      pointerId: e.pointerId,
      offsetX: svgPt.x - node.x,
      offsetY: svgPt.y - node.y,
      moved: false,
      downX: e.clientX,
      downY: e.clientY,
    }
    node.pinned = true
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* noop */ }
    e.stopPropagation()
  }

  const onPointerMove = (e) => {
    if (!dragRef.current || !svgRef.current) return
    if (e.pointerId !== dragRef.current.pointerId) return
    const svgPt = clientToSvg(svgRef.current, e.clientX, e.clientY, size)
    const node = simStateRef.current.find((n) => n.id === dragRef.current.id)
    if (!node) return
    node.x = svgPt.x - dragRef.current.offsetX
    node.y = svgPt.y - dragRef.current.offsetY
    node.vx = 0
    node.vy = 0
    if (Math.hypot(e.clientX - dragRef.current.downX, e.clientY - dragRef.current.downY) > 4) {
      dragRef.current.moved = true
    }
  }

  const onPointerUp = (e) => {
    if (!dragRef.current) return
    const { id, moved } = dragRef.current
    const node = simStateRef.current.find((n) => n.id === id)
    if (node) node.pinned = false
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* noop */ }
    if (!moved) {
      // Treat as click: blip + tooltip
      triggerBlip(id)
    }
    dragRef.current = null
  }

  const onPointerEnterNode = (id) => {
    if (dragRef.current) return
    setHoverId(id)
  }
  const onPointerLeaveNode = () => {
    if (dragRef.current) return
    setHoverId(null)
  }

  const triggerBlip = (id) => {
    const node = simStateRef.current.find((n) => n.id === id)
    if (!node) return
    setBlipId(null)            // reset so re-clicking same node re-fires
    requestAnimationFrame(() => setBlipId(id))
    setSelected({ id, x: node.x, y: node.y })
  }

  // Clear blip class after animation completes
  useEffect(() => {
    if (blipId == null) return
    const t = setTimeout(() => setBlipId(null), 650)
    return () => clearTimeout(t)
  }, [blipId])

  // Update tooltip position to track the selected node as sim moves it
  useEffect(() => {
    if (!selected || !simStateRef.current) return
    const id = setInterval(() => {
      const n = simStateRef.current.find((nd) => nd.id === selected.id)
      if (!n) return
      setSelected((s) => (s && s.id === n.id ? { id: s.id, x: n.x, y: n.y } : s))
    }, 80)
    return () => clearInterval(id)
  }, [selected?.id])

  // Click on empty SVG dismisses the tooltip
  const onSvgBackgroundDown = () => setSelected(null)

  /* ── Highlight set for hover ────────────────────────────────────────── */
  const highlightSet = useMemo(() => {
    if (!hoverId) return null
    const set = new Set([hoverId])
    const nb = adjacency.get(hoverId)
    if (nb) nb.forEach((n) => set.add(n))
    return set
  }, [hoverId, adjacency])

  const nodes = simStateRef.current || []
  const selectedNode = selected ? nodes.find((n) => n.id === selected.id) : null
  const selectedMeta = selectedNode ? NODES.find((n) => n.id === selectedNode.id) : null
  const tooltipCss = selectedNode ? {
    left: `${(selectedNode.x / size.w) * 100}%`,
    top:  `${(selectedNode.y / size.h) * 100}%`,
  } : null

  return (
    <div className="sk-root" ref={rootRef}>
      {/* Legend — sits ABOVE the simulation in a flex column so node labels
          can never render through it. */}
      <div className="sk-legend" role="list" aria-label="Skill clusters">
        {Object.entries(CLUSTERS).map(([key, c]) => (
          <span
            className="sk-legend-item"
            key={key}
            role="listitem"
            style={{ '--sk-cluster-color': c.color }}
          >
            <span className="sk-legend-swatch" aria-hidden />
            <span className="sk-legend-text">{c.label}</span>
          </span>
        ))}
      </div>

      <div className="sk-stage" ref={stageRef}>

      <svg
        ref={svgRef}
        className="sk-svg"
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerDown={onSvgBackgroundDown}
        role="img"
        aria-label="Interactive skills network graph"
      >
        {/* Faint grid */}
        <g aria-hidden>
          {Array.from({ length: Math.ceil(size.w / 80) }).map((_, i) => (
            <line key={`gv${i}`} className="sk-grid-line" x1={i * 80} y1={0} x2={i * 80} y2={size.h} />
          ))}
          {Array.from({ length: Math.ceil(size.h / 80) }).map((_, i) => (
            <line key={`gh${i}`} className="sk-grid-line" x1={0} y1={i * 80} x2={size.w} y2={i * 80} />
          ))}
        </g>

        {/* Edges */}
        <g>
          {EDGES.map(([a, b], i) => {
            const na = nodes.find((n) => n.id === a)
            const nb = nodes.find((n) => n.id === b)
            if (!na || !nb) return null
            let cls = 'sk-edge'
            if (highlightSet) {
              const isHi = highlightSet.has(a) && highlightSet.has(b) && (a === hoverId || b === hoverId)
              cls += isHi ? ' sk-edge-hi' : ' sk-edge-dim'
            }
            return (
              <line
                key={`e${i}`}
                className={cls}
                x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              />
            )
          })}
        </g>

        {/* Nodes */}
        <g>
          {nodes.map((n) => {
            const meta = CLUSTERS[n.cluster] || CLUSTERS.lean
            let cls = 'sk-node'
            const hi = highlightSet?.has(n.id)
            const dim = highlightSet && !hi
            if (hi) cls += ' sk-hi'
            if (dim) cls += ' sk-dim'
            if (blipId === n.id) cls += ' sk-blip'
            if (dragRef.current?.id === n.id) cls += ' sk-dragging'
            const r = nodeRadius(n.id, size)
            return (
              <g
                key={n.id}
                className={cls}
                style={{ color: meta.color, '--sk-r': r }}
                transform={`translate(${n.x},${n.y})`}
                onPointerDown={(e) => onPointerDownNode(e, n.id)}
                onPointerEnter={() => onPointerEnterNode(n.id)}
                onPointerLeave={onPointerLeaveNode}
              >
                <circle className="sk-node-glow" r={r * 2.4} />
                <circle className="sk-blip-ring" r={r} />
                <circle className="sk-node-core" r={r} />
                <text
                  className="sk-label"
                  x={r + 6}
                  y={3}
                  textAnchor="start"
                >
                  {n.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {selected && selectedMeta && (
        <div
          className={`sk-tooltip ${selected ? 'sk-tooltip-show' : ''}`}
          style={tooltipCss}
          role="tooltip"
        >
          <div className="sk-tooltip-cluster" style={{ color: CLUSTERS[selectedMeta.cluster].color }}>
            {CLUSTERS[selectedMeta.cluster].label}
          </div>
          <div className="sk-tooltip-title">{selectedMeta.label}</div>
          <div className="sk-tooltip-desc">{selectedMeta.desc}</div>
        </div>
      )}
      </div>
    </div>
  )
}

/* ──────────────────────── physics + helpers (pure) ─────────────────────── */
function nodeRadius(id, size) {
  // Slightly bigger for "anchor" skills; smaller on mobile.
  const big = new Set(['tulip', 'kaizen', 'python', 'multimill', 'solidworks', 'lunch_learn'])
  const mobile = size.w < 640
  const base = mobile ? 5 : 6.5
  return big.has(id) ? base + (mobile ? 2 : 2.5) : base
}

function clientToSvg(svg, clientX, clientY, size) {
  const rect = svg.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * size.w
  const y = ((clientY - rect.top) / rect.height) * size.h
  return { x, y }
}

function stepSimulation(steps, nodes, w, h, dtScale = 1) {
  // Pre-build edges with refs for cheap iteration
  const idToIdx = new Map()
  nodes.forEach((n, i) => idToIdx.set(n.id, i))
  const edgePairs = EDGES.map(([a, b]) => [idToIdx.get(a), idToIdx.get(b)]).filter(
    ([a, b]) => a != null && b != null,
  )
  const cx = w / 2, cy = h / 2

  for (let step = 0; step < steps; step++) {
    // 1) Repulsion (O(n^2), fine for ~36 nodes)
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]
        let dx = a.x - b.x
        let dy = a.y - b.y
        let dist2 = dx * dx + dy * dy
        if (dist2 < 0.01) {
          dx = (Math.random() - 0.5) * 0.5
          dy = (Math.random() - 0.5) * 0.5
          dist2 = dx * dx + dy * dy + 0.01
        }
        const dist = Math.sqrt(dist2)
        const force = SIM.repulsion / dist2
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx += fx
        a.vy += fy
        b.vx -= fx
        b.vy -= fy
      }
    }

    // 2) Spring forces along edges
    for (const [ai, bi] of edgePairs) {
      const a = nodes[ai]
      const b = nodes[bi]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.001
      const diff = dist - SIM.springRest
      const fx = (dx / dist) * diff * SIM.springK
      const fy = (dy / dist) * diff * SIM.springK
      a.vx += fx
      a.vy += fy
      b.vx -= fx
      b.vy -= fy
    }

    // 3) Gravity toward center + integrate + damping + bounds
    for (const n of nodes) {
      if (n.pinned) {
        n.vx = 0
        n.vy = 0
        continue
      }
      n.vx += (cx - n.x) * SIM.gravity * 0.06
      n.vy += (cy - n.y) * SIM.gravity * 0.06
      n.vx *= SIM.damping
      n.vy *= SIM.damping
      // Clamp velocity
      if (n.vx > SIM.maxVel) n.vx = SIM.maxVel
      else if (n.vx < -SIM.maxVel) n.vx = -SIM.maxVel
      if (n.vy > SIM.maxVel) n.vy = SIM.maxVel
      else if (n.vy < -SIM.maxVel) n.vy = -SIM.maxVel

      n.x += n.vx * dtScale
      n.y += n.vy * dtScale

      // Soft bounds (push back from edges, leaving room for labels)
      const padL = 60, padR = 140, padT = 30, padB = 30
      if (n.x < padL) { n.x = padL; n.vx *= -0.4 }
      else if (n.x > w - padR) { n.x = w - padR; n.vx *= -0.4 }
      if (n.y < padT) { n.y = padT; n.vy *= -0.4 }
      else if (n.y > h - padB) { n.y = h - padB; n.vy *= -0.4 }
    }
  }
}
