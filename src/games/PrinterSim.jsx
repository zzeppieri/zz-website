import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import './printer-sim.css'

/* ──────────────────────────────────────────────────────────
   PARTS CATALOG — Zach's actual production tooling
   Each part has:
     - id, name, sub: menu copy
     - layers: total layer count for the print
     - shape(t, layerN): function returning bed-relative outline points
         t in [0..1]    = print progress within this layer (head sweep)
         layerN         = 0-based layer index
       Returns:
         { outline: [[x,y], ...]  bed-relative shape silhouette polygon
         , head: [x, y]            current extruder head position on this layer
         , filledOutline: ...       polygon for the already-printed portion
         }
     - icon(): JSX SVG silhouette for menu thumbnail
   ────────────────────────────────────────────────────────── */

const BED_SIZE = 200 // mm — printer build plate size (logical units)

// ── Shape generators (procedural part outlines) ──────────────
// All return polygons in mm centered around bed center (100,100).

function shapeCircle(cx, cy, r, segments = 36) {
  const pts = []
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return pts
}

// Baffle Extraction Fixture — irregular trapezoidal body with a circular cut + tab
function baffleOutline(layerN, totalLayers) {
  const taper = 1 - 0.15 * (layerN / totalLayers) // upper layers narrower
  const w = 110 * taper, h = 70
  return [
    [100 - w/2, 100 - h/2],
    [100 + w/2 - 12, 100 - h/2],
    [100 + w/2,      100 - h/2 + 18],
    [100 + w/2,      100 + h/2 - 8],
    [100 + w/2 - 16, 100 + h/2],
    [100 - w/2 + 8,  100 + h/2],
    [100 - w/2,      100 + h/2 - 18],
    [100 - w/2,      100 - h/2 + 8],
  ]
}

// CBN Boot Mold — tall cylindrical body, narrower at top (boot shape)
function bootMoldOutline(layerN, totalLayers) {
  const t = layerN / totalLayers
  // Narrows toward the toe
  const r = 32 - 10 * t * t
  return shapeCircle(100, 100, r, 32)
}

// Polishing-Disc Contamination Stand — outer ring with internal cells
function polishStandOutline(layerN, totalLayers) {
  // Lower layers: wide circular base. Mid layers: square frame. Upper layers: cell grid.
  const t = layerN / totalLayers
  if (t < 0.25) return shapeCircle(100, 100, 48, 36)
  return [
    [55, 55], [145, 55], [145, 145], [55, 145]
  ]
}

// LM9000 Plasma-Tape Escape Alignment Tool — long, slender, slotted
function alignToolOutline() {
  return [
    [40, 90], [160, 90], [160, 96],
    [148, 96], [148, 104], [160, 104],
    [160, 110], [40, 110], [40, 104],
    [52, 104], [52, 96], [40, 96],
  ]
}

// Generic Fixture — chamfered rectangle
function genericOutline() {
  return [
    [55, 70], [145, 70],
    [150, 75], [150, 125],
    [145, 130], [55, 130],
    [50, 125], [50, 75],
  ]
}

// Catalog
const PARTS = [
  {
    id: 'baffle',
    name: 'Baffle Extraction Fixture',
    sub: 'patent-pending',
    layers: 48,
    color: '#ffb547',
    outline: baffleOutline,
    icon: () => (
      <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
        <path d="M5 10 L24 10 L27 14 L27 22 L23 26 L8 26 L5 22 Z"
              fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <circle cx="16" cy="18" r="3" fill="none" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    id: 'cbn',
    name: 'CBN Boot Mold',
    sub: '< 24 hr turnaround',
    layers: 56,
    color: '#7fdb9c',
    outline: bootMoldOutline,
    icon: () => (
      <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
        <path d="M11 5 L21 5 L19 16 L25 22 L25 27 L7 27 L7 22 Z"
              fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <line x1="11" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
      </svg>
    ),
  },
  {
    id: 'polish',
    name: 'Polishing-Disc Stand',
    sub: 'contamination guard',
    layers: 40,
    color: '#4ec9d4',
    outline: polishStandOutline,
    icon: () => (
      <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
        <rect x="6" y="6" width="20" height="20" rx="1.5"
              fill="none" stroke="currentColor" strokeWidth="1.4"/>
        <line x1="16" y1="6" x2="16" y2="26" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        <line x1="6" y1="16" x2="26" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        <circle cx="11" cy="11" r="2" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.7"/>
        <circle cx="21" cy="11" r="2" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.7"/>
        <circle cx="11" cy="21" r="2" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.7"/>
        <circle cx="21" cy="21" r="2" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.7"/>
      </svg>
    ),
  },
  {
    id: 'lm9000',
    name: 'LM9000 Alignment Tool',
    sub: 'plasma-tape escape',
    layers: 32,
    color: '#ff6b4a',
    outline: alignToolOutline,
    icon: () => (
      <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
        <path d="M3 14 L29 14 L29 16 L24 16 L24 18 L29 18 L29 20 L3 20 L3 18 L8 18 L8 16 L3 16 Z"
              fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'generic',
    name: 'Generic Fixture',
    sub: 'custom geometry',
    layers: 38,
    color: '#e0e8f0',
    outline: genericOutline,
    icon: () => (
      <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
        <path d="M8 6 L24 6 L26 8 L26 24 L24 26 L8 26 L6 24 L6 8 Z"
              fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <circle cx="11" cy="11" r="1" fill="currentColor" opacity="0.6"/>
        <circle cx="21" cy="11" r="1" fill="currentColor" opacity="0.6"/>
        <circle cx="11" cy="21" r="1" fill="currentColor" opacity="0.6"/>
        <circle cx="21" cy="21" r="1" fill="currentColor" opacity="0.6"/>
      </svg>
    ),
  },
]

/* ──────────────────────────────────────────────────────────
   G-CODE GENERATOR
   Emits plausible Marlin-flavored G-code as the print runs.
   ────────────────────────────────────────────────────────── */

function startupGcode(part) {
  return [
    { text: '; ' + part.name.toUpperCase(), tone: 'dim' },
    { text: '; layers=' + part.layers + ' nozzle=0.4mm bed=60C', tone: 'dim' },
    { text: 'M73 P0 ; progress', tone: 'normal' },
    { text: 'M140 S60 ; bed', tone: 'normal' },
    { text: 'M104 S210 ; extruder', tone: 'normal' },
    { text: 'G28 ; home all axes', tone: 'bright' },
    { text: 'G29 ; auto-level', tone: 'normal' },
    { text: 'M190 S60 ; wait bed', tone: 'dim' },
    { text: 'M109 S210 ; wait nozzle', tone: 'dim' },
    { text: 'G92 E0', tone: 'normal' },
    { text: 'G1 Z0.2 F300', tone: 'normal' },
  ]
}

function rng(seed) {
  // Tiny seedable PRNG (mulberry32) so each layer's noise is deterministic
  let s = seed | 0
  return () => {
    s = (s + 0x6D2B79F5) | 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function layerGcode(layerN, totalLayers, part) {
  const z = (0.2 + layerN * 0.2).toFixed(2)
  const r = rng(layerN * 31 + part.id.charCodeAt(0))
  // Build a sequence of moves around the perimeter + infill swirls
  const lines = [
    { text: `; --- layer ${layerN + 1}/${totalLayers}  z=${z} ---`, tone: 'bright' },
    { text: `G1 Z${z} F600`, tone: 'normal' },
  ]
  const moveCount = 3 + Math.floor(r() * 3)
  let lastX = 100, lastY = 100
  for (let i = 0; i < moveCount; i++) {
    const x = (40 + r() * 120).toFixed(1)
    const y = (40 + r() * 120).toFixed(1)
    const feed = 1200 + Math.floor(r() * 1800)
    const e = (5 + r() * 4).toFixed(2)
    lines.push({ text: `G1 X${x} Y${y} E${e} F${feed}`, tone: 'normal' })
    lastX = parseFloat(x); lastY = parseFloat(y)
  }
  // Occasional retract
  if (r() > 0.6) {
    lines.push({ text: 'G1 E-1.5 F2400 ; retract', tone: 'dim' })
  }
  // Progress comment
  const pct = Math.floor(((layerN + 1) / totalLayers) * 100)
  lines.push({ text: `M73 P${pct} ; ${pct}%`, tone: 'dim' })
  return lines
}

function finishGcode() {
  return [
    { text: '; print complete', tone: 'bright' },
    { text: 'G91 ; relative', tone: 'normal' },
    { text: 'G1 E-2 F2400 ; final retract', tone: 'normal' },
    { text: 'G1 Z10 F600 ; lift', tone: 'normal' },
    { text: 'G90 ; absolute', tone: 'normal' },
    { text: 'G28 X0 Y0 ; home XY', tone: 'normal' },
    { text: 'M104 S0 ; nozzle off', tone: 'normal' },
    { text: 'M140 S0 ; bed off', tone: 'normal' },
    { text: 'M84 ; disable motors', tone: 'bright' },
  ]
}

/* ──────────────────────────────────────────────────────────
   ISOMETRIC PROJECTION
   Project bed coords (x_mm, y_mm, z_mm) -> canvas (px, py)
   ────────────────────────────────────────────────────────── */
const ISO_ANGLE = Math.PI / 7 // mild tilt

function makeProjector(canvasW, canvasH, scale) {
  // origin of bed (0,0,0) drawn at center bottom-ish of canvas
  const cosA = Math.cos(ISO_ANGLE)
  const sinA = Math.sin(ISO_ANGLE)
  const cx = canvasW / 2
  const cy = canvasH / 2 + canvasH * 0.18
  return (x, y, z) => {
    // x_mm runs right, y_mm runs into the page (away from viewer), z_mm up
    // Bed center is at mm (100,100,0)
    const xm = x - 100
    const ym = y - 100
    const px = cx + (xm - ym * cosA) * scale
    const py = cy + (ym * sinA - z) * scale
    return [px, py]
  }
}

/* ──────────────────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────────────────── */

const SPEEDS = [1, 5, 100]
const BASE_LAYER_TIME_MS = 1400 // ms per layer at 1x

export default function PrinterSim() {
  const [selectedId, setSelectedId] = useState(PARTS[0].id)
  const [status, setStatus] = useState('idle') // idle | printing | paused | done
  const [speed, setSpeed] = useState(1)
  const [layer, setLayer] = useState(0)        // current layer index (0-based)
  const [layerT, setLayerT] = useState(0)      // 0..1 progress within current layer (drives head)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [gcodeLines, setGcodeLines] = useState([])

  const part = useMemo(() => PARTS.find(p => p.id === selectedId) || PARTS[0], [selectedId])

  // Refs for animation loop
  const rafRef = useRef(0)
  const lastTickRef = useRef(0)
  const layerRef = useRef(0)
  const layerTRef = useRef(0)
  const elapsedRef = useRef(0)
  const speedRef = useRef(1)
  const statusRef = useRef('idle')
  const partRef = useRef(part)
  const emittedLayerHeaderRef = useRef(-1) // last layer whose G-code we emitted

  const canvasRef = useRef(null)
  const gcodeStreamRef = useRef(null)

  // Keep refs in sync with state
  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { partRef.current = part }, [part])

  // Cleanup rAF on unmount
  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  // Auto-scroll G-code panel when new lines arrive
  useEffect(() => {
    const el = gcodeStreamRef.current
    if (!el) return
    // Defer to next frame so DOM has updated
    const id = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
    return () => cancelAnimationFrame(id)
  }, [gcodeLines.length])

  // ── Append helpers ──
  const appendGcode = useCallback((lines) => {
    setGcodeLines(prev => {
      // Cap buffer to avoid unbounded growth on long sessions
      const next = prev.concat(lines)
      const MAX = 400
      return next.length > MAX ? next.slice(next.length - MAX) : next
    })
  }, [])

  // ── Animation tick ──
  const tick = useCallback((now) => {
    if (statusRef.current !== 'printing') {
      // Loop is owned by start/resume; bail if not printing
      return
    }
    const last = lastTickRef.current || now
    const dt = Math.min(now - last, 60) // clamp to avoid huge jumps after tab inactivity
    lastTickRef.current = now

    const layerTimeMs = BASE_LAYER_TIME_MS / speedRef.current
    const advance = dt / layerTimeMs

    let lt = layerTRef.current + advance
    let li = layerRef.current
    elapsedRef.current += dt

    const total = partRef.current.layers
    let newLayers = 0

    while (lt >= 1 && li < total - 1) {
      lt -= 1
      li += 1
      newLayers += 1
    }
    // Clamp to last layer
    if (li >= total - 1) {
      if (lt >= 1) {
        lt = 1
        li = total - 1
      }
    }

    layerRef.current = li
    layerTRef.current = lt

    // Emit g-code for any layers we just crossed into
    if (newLayers > 0) {
      const batches = []
      for (let i = li - newLayers + 1; i <= li; i++) {
        if (i > emittedLayerHeaderRef.current) {
          batches.push(...layerGcode(i, total, partRef.current))
          emittedLayerHeaderRef.current = i
        }
      }
      if (batches.length) appendGcode(batches)
    }

    // Check completion
    const isLastLayer = li >= total - 1
    if (isLastLayer && lt >= 1) {
      statusRef.current = 'done'
      setStatus('done')
      setLayer(li)
      setLayerT(1)
      setElapsedMs(elapsedRef.current)
      appendGcode(finishGcode())
      return
    }

    // Throttle state updates to 30fps so React doesn't re-render every frame
    // (the canvas still gets every frame via direct draw)
    setLayer(li)
    setLayerT(lt)
    setElapsedMs(elapsedRef.current)

    rafRef.current = requestAnimationFrame(tick)
  }, [appendGcode])

  // ── Canvas draw (separate rAF-driven loop, runs continuously while mounted) ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let rafId = 0
    let lastDpr = 0
    let lastW = 0, lastH = 0

    const resize = () => {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
      const rect = canvas.getBoundingClientRect()
      const w = Math.max(1, Math.floor(rect.width))
      const h = Math.max(1, Math.floor(rect.height))
      if (dpr !== lastDpr || w !== lastW || h !== lastH) {
        canvas.width  = w * dpr
        canvas.height = h * dpr
        canvas.style.width = w + 'px'
        canvas.style.height = h + 'px'
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        lastDpr = dpr; lastW = w; lastH = h
      }
      return { w, h }
    }

    const ro = new ResizeObserver(() => resize())
    ro.observe(canvas)

    const draw = () => {
      const { w, h } = resize()
      // Scale: fit bed into canvas with some breathing room
      const scale = Math.min(w, h * 1.6) / (BED_SIZE * 1.55)
      const project = makeProjector(w, h, scale)

      // ── Clear ──
      ctx.fillStyle = '#0e1726'
      ctx.fillRect(0, 0, w, h)

      // Background glow
      const grad = ctx.createRadialGradient(w/2, h*0.55, 10, w/2, h*0.55, Math.max(w, h)*0.7)
      grad.addColorStop(0, 'rgba(78,201,212,0.06)')
      grad.addColorStop(1, 'rgba(78,201,212,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // ── Print bed ──
      const bedCorners = [
        project(0,   0,   0),
        project(200, 0,   0),
        project(200, 200, 0),
        project(0,   200, 0),
      ]
      ctx.beginPath()
      ctx.moveTo(bedCorners[0][0], bedCorners[0][1])
      for (let i = 1; i < 4; i++) ctx.lineTo(bedCorners[i][0], bedCorners[i][1])
      ctx.closePath()
      ctx.fillStyle = '#1b2a3e'
      ctx.fill()
      ctx.strokeStyle = 'rgba(78,201,212,0.5)'
      ctx.lineWidth = 1.2
      ctx.stroke()

      // Bed grid
      ctx.strokeStyle = 'rgba(78,201,212,0.12)'
      ctx.lineWidth = 0.6
      for (let g = 20; g < 200; g += 20) {
        const a = project(g,   0,   0)
        const b = project(g,   200, 0)
        const c = project(0,   g,   0)
        const d = project(200, g,   0)
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke()
      }

      // Build plate frame posts (z = 0..120)
      const postH = 120
      ctx.strokeStyle = 'rgba(78,201,212,0.18)'
      ctx.lineWidth = 1
      for (const [bx, by] of [[0,0],[200,0],[200,200],[0,200]]) {
        const bot = project(bx, by, 0)
        const top = project(bx, by, postH)
        ctx.beginPath(); ctx.moveTo(bot[0], bot[1]); ctx.lineTo(top[0], top[1]); ctx.stroke()
      }
      // Top crossbar (gantry rail) at z = 110
      const railZ = 110
      const railA = project(0,   100, railZ)
      const railB = project(200, 100, railZ)
      ctx.strokeStyle = 'rgba(78,201,212,0.28)'
      ctx.lineWidth = 1.4
      ctx.beginPath(); ctx.moveTo(railA[0], railA[1]); ctx.lineTo(railB[0], railB[1]); ctx.stroke()

      // ── Part: printed layers (filled stack) ──
      const p = partRef.current
      const totalLayers = p.layers
      const printedLayers = Math.min(layerRef.current, totalLayers - 1)
      const layerHeight = 0.6 // mm — exaggerate so the stack is visible

      // Draw each printed layer as a filled polygon at its z height
      for (let li = 0; li <= printedLayers; li++) {
        const outline = p.outline(li, totalLayers)
        const z = (li + 1) * layerHeight
        // Top face
        ctx.beginPath()
        const pt0 = project(outline[0][0], outline[0][1], z)
        ctx.moveTo(pt0[0], pt0[1])
        for (let i = 1; i < outline.length; i++) {
          const [x, y] = outline[i]
          const pt = project(x, y, z)
          ctx.lineTo(pt[0], pt[1])
        }
        ctx.closePath()

        // Color gradient: cooler at bottom, warmer up top
        const t = li / Math.max(1, totalLayers - 1)
        const r = Math.round(60 + 80 * t)
        const g = Math.round(140 + 60 * t)
        const b = Math.round(200 - 80 * t)
        const alpha = 0.18 + 0.55 * t
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        ctx.fill()
        ctx.strokeStyle = `rgba(78, 201, 212, ${0.15 + 0.35 * t})`
        ctx.lineWidth = 0.7
        ctx.stroke()
      }

      // ── Current (partial) layer being printed ──
      const printing = statusRef.current === 'printing' || statusRef.current === 'paused'
      const showCurrent = statusRef.current !== 'idle' && layerRef.current < totalLayers
      if (showCurrent) {
        const li = layerRef.current
        const outline = p.outline(li, totalLayers)
        const z = (li + 1) * layerHeight
        const t = layerTRef.current

        // Partial fill: clip outline by sweeping along Y
        const ys = outline.map(o => o[1])
        const yMin = Math.min(...ys)
        const yMax = Math.max(...ys)
        const sweepY = yMin + (yMax - yMin) * t

        // Draw outline ghost (faint)
        ctx.beginPath()
        const o0 = project(outline[0][0], outline[0][1], z)
        ctx.moveTo(o0[0], o0[1])
        for (let i = 1; i < outline.length; i++) {
          const pt = project(outline[i][0], outline[i][1], z)
          ctx.lineTo(pt[0], pt[1])
        }
        ctx.closePath()
        ctx.fillStyle = 'rgba(78,201,212,0.05)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(78,201,212,0.35)'
        ctx.lineWidth = 0.8
        ctx.setLineDash([3, 3])
        ctx.stroke()
        ctx.setLineDash([])

        // Filled portion (below sweep line) — clip polygon by y < sweepY
        const filled = clipPolygonAtY(outline, sweepY)
        if (filled.length >= 3) {
          ctx.beginPath()
          const f0 = project(filled[0][0], filled[0][1], z)
          ctx.moveTo(f0[0], f0[1])
          for (let i = 1; i < filled.length; i++) {
            const pt = project(filled[i][0], filled[i][1], z)
            ctx.lineTo(pt[0], pt[1])
          }
          ctx.closePath()
          ctx.fillStyle = 'rgba(255, 181, 71, 0.55)'
          ctx.fill()
          ctx.strokeStyle = 'rgba(255, 181, 71, 0.85)'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // ── Extrusion head ──
        // Position head at (centerX of sweep slice, sweepY)
        // Use rough midpoint of outline at sweepY for X
        const headX = headXAtY(outline, sweepY)
        const headBase = project(headX, sweepY, z)
        const headTop  = project(headX, sweepY, z + 35)

        // Gantry beam (across X at this Y, at top z)
        const gantryL = project(0,   sweepY, z + 35)
        const gantryR = project(200, sweepY, z + 35)
        ctx.strokeStyle = 'rgba(78,201,212,0.4)'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(gantryL[0], gantryL[1])
        ctx.lineTo(gantryR[0], gantryR[1])
        ctx.stroke()

        // Vertical arm
        ctx.strokeStyle = 'rgba(255, 181, 71, 0.7)'
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.moveTo(headTop[0], headTop[1])
        ctx.lineTo(headBase[0], headBase[1])
        ctx.stroke()

        // Glowing nozzle
        const glow = ctx.createRadialGradient(headBase[0], headBase[1], 0, headBase[0], headBase[1], 22)
        glow.addColorStop(0, 'rgba(255, 220, 130, 0.95)')
        glow.addColorStop(0.3, 'rgba(255, 181, 71, 0.55)')
        glow.addColorStop(1, 'rgba(255, 107, 74, 0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(headBase[0], headBase[1], 22, 0, Math.PI * 2)
        ctx.fill()

        // Solid head body
        ctx.fillStyle = '#2a3a52'
        ctx.strokeStyle = 'rgba(255, 181, 71, 0.9)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.rect(headBase[0] - 6, headBase[1] - 14, 12, 10)
        ctx.fill(); ctx.stroke()

        // Hot tip
        ctx.fillStyle = '#ffe39a'
        ctx.beginPath()
        ctx.arc(headBase[0], headBase[1] - 1, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── Confetti sparks on completion ──
      if (statusRef.current === 'done') {
        drawConfetti(ctx, w, h)
      }

      rafId = requestAnimationFrame(draw)
    }
    rafId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [])

  // ── Controls ──
  const startPrint = useCallback(() => {
    if (statusRef.current === 'printing') return
    // Fresh start from idle or done
    if (statusRef.current === 'idle' || statusRef.current === 'done') {
      layerRef.current = 0
      layerTRef.current = 0
      elapsedRef.current = 0
      emittedLayerHeaderRef.current = -1
      setLayer(0); setLayerT(0); setElapsedMs(0)
      setGcodeLines(startupGcode(partRef.current))
    }
    lastTickRef.current = 0
    statusRef.current = 'printing'
    setStatus('printing')
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const pausePrint = useCallback(() => {
    if (statusRef.current !== 'printing') return
    statusRef.current = 'paused'
    setStatus('paused')
    cancelAnimationFrame(rafRef.current)
    appendGcode([{ text: '; --- paused ---', tone: 'dim' }])
  }, [appendGcode])

  const resumePrint = useCallback(() => {
    if (statusRef.current !== 'paused') return
    lastTickRef.current = 0
    statusRef.current = 'printing'
    setStatus('printing')
    appendGcode([{ text: '; --- resumed ---', tone: 'dim' }])
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }, [appendGcode, tick])

  const cancelPrint = useCallback(() => {
    if (statusRef.current === 'idle') return
    statusRef.current = 'idle'
    setStatus('idle')
    cancelAnimationFrame(rafRef.current)
    layerRef.current = 0
    layerTRef.current = 0
    elapsedRef.current = 0
    emittedLayerHeaderRef.current = -1
    setLayer(0); setLayerT(0); setElapsedMs(0)
    appendGcode([
      { text: '; *** print cancelled ***', tone: 'bright' },
      { text: 'M104 S0 ; nozzle off', tone: 'normal' },
      { text: 'M140 S0 ; bed off',    tone: 'normal' },
      { text: 'G28 X0 Y0',            tone: 'normal' },
    ])
  }, [appendGcode])

  const selectPart = useCallback((id) => {
    if (statusRef.current === 'printing') return // disabled while printing
    setSelectedId(id)
    if (statusRef.current !== 'idle') {
      // Reset if a different part was previously printed/paused
      statusRef.current = 'idle'
      setStatus('idle')
      cancelAnimationFrame(rafRef.current)
      layerRef.current = 0
      layerTRef.current = 0
      elapsedRef.current = 0
      emittedLayerHeaderRef.current = -1
      setLayer(0); setLayerT(0); setElapsedMs(0)
      setGcodeLines([])
    }
  }, [])

  // ── Derived display values ──
  const pct = useMemo(() => {
    const total = part.layers
    const done = (layer + layerT) / total
    return Math.max(0, Math.min(100, Math.round(done * 100)))
  }, [layer, layerT, part.layers])

  const elapsedDisplay = useMemo(() => {
    const totalSec = Math.floor(elapsedMs / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`
  }, [elapsedMs])

  const statusText =
    status === 'printing' ? 'PRINTING' :
    status === 'paused'   ? 'PAUSED' :
    status === 'done'     ? 'COMPLETE' : 'IDLE'

  return (
    <div className="ps-root" role="region" aria-label="3D printer simulator">
      {/* ── PARTS PANEL ── */}
      <div className="ps-parts">
        <div className="ps-panel-title">PART QUEUE</div>
        {PARTS.map(p => {
          const Icon = p.icon
          const isActive = p.id === selectedId
          return (
            <button
              key={p.id}
              type="button"
              className={`ps-part${isActive ? ' active' : ''}`}
              onClick={() => selectPart(p.id)}
              disabled={status === 'printing' && !isActive}
              aria-pressed={isActive}
            >
              <span className="ps-part-icon"><Icon /></span>
              <span className="ps-part-text">
                <span className="ps-part-name">{p.name}</span>
                <span className="ps-part-sub">{p.sub}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* ── CANVAS ── */}
      <div className="ps-canvas-wrap">
        <canvas ref={canvasRef} className="ps-canvas" />
        <div className="ps-hud">
          <div className="ps-hud-row"><span className="ps-hud-key">PART</span><span className="ps-hud-val">{part.name}</span></div>
          <div className="ps-hud-row"><span className="ps-hud-key">Z</span><span className="ps-hud-val">{((layer + (status !== 'idle' ? 1 : 0)) * 0.2).toFixed(2)} mm</span></div>
        </div>
        <div className="ps-status-led">
          <span className={`ps-led ${status}`} /> {statusText}
        </div>
        {status === 'done' && (
          <div className="ps-canvas-overlay">
            <div className="ps-banner">PRINT COMPLETE</div>
          </div>
        )}
      </div>

      {/* ── G-CODE PANEL ── */}
      <div className="ps-gcode">
        <div className="ps-gcode-header">
          <span>G-CODE STREAM</span>
          <span className="ps-gcode-count">{gcodeLines.length} lines</span>
        </div>
        <div className="ps-gcode-stream" ref={gcodeStreamRef}>
          {gcodeLines.length === 0 && (
            <div className="ps-gcode-line dim">; awaiting start command_<span className="ps-gcode-cursor" /></div>
          )}
          {gcodeLines.map((ln, i) => (
            <div
              key={i}
              className={`ps-gcode-line ${ln.tone === 'dim' ? 'dim' : ln.tone === 'bright' ? 'bright' : ''}`}
            >
              {ln.text}
              {i === gcodeLines.length - 1 && status === 'printing' && <span className="ps-gcode-cursor" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTROLS ── */}
      <div className="ps-controls">
        <div className="ps-btn-group">
          {status === 'paused' ? (
            <button type="button" className="ps-btn start" onClick={resumePrint}>Resume</button>
          ) : (
            <button
              type="button"
              className="ps-btn start"
              onClick={startPrint}
              disabled={status === 'printing'}
            >
              {status === 'done' ? 'Restart' : 'Start'}
            </button>
          )}
          <button
            type="button"
            className="ps-btn pause"
            onClick={pausePrint}
            disabled={status !== 'printing'}
          >
            Pause
          </button>
          <button
            type="button"
            className="ps-btn cancel"
            onClick={cancelPrint}
            disabled={status === 'idle'}
          >
            Cancel
          </button>
        </div>

        <div className="ps-speed" role="radiogroup" aria-label="Print speed">
          <span className="ps-speed-label">SPEED</span>
          {SPEEDS.map(s => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={speed === s}
              className={`ps-speed-btn${speed === s ? ' active' : ''}`}
              onClick={() => setSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>

        <div className="ps-meter">
          <div className="ps-meter-row">
            <span className="ps-meter-label">LAYER {String(Math.min(layer + (status !== 'idle' ? 1 : 0), part.layers)).padStart(2, '0')} / {part.layers}</span>
            <span className="ps-meter-val">{pct}%  ·  {elapsedDisplay}</span>
          </div>
          <div className="ps-meter-bar">
            <div className="ps-meter-fill" style={{ width: pct + '%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   HELPERS — kept at module scope so they don't reallocate
   ────────────────────────────────────────────────────────── */

// Clip a polygon to the half-plane y <= sweepY using Sutherland–Hodgman.
function clipPolygonAtY(poly, sweepY) {
  if (poly.length < 3) return []
  const out = []
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const cur = poly[i]
    const nxt = poly[(i + 1) % n]
    const curIn = cur[1] <= sweepY
    const nxtIn = nxt[1] <= sweepY
    if (curIn) out.push(cur)
    if (curIn !== nxtIn) {
      // Compute intersection
      const dy = nxt[1] - cur[1]
      const t = dy === 0 ? 0 : (sweepY - cur[1]) / dy
      const ix = cur[0] + t * (nxt[0] - cur[0])
      out.push([ix, sweepY])
    }
  }
  return out
}

// Find a representative X at a given sweepY by averaging polygon edge crossings.
function headXAtY(poly, sweepY) {
  const n = poly.length
  const xs = []
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n]
    const minY = Math.min(a[1], b[1])
    const maxY = Math.max(a[1], b[1])
    if (sweepY >= minY && sweepY <= maxY && a[1] !== b[1]) {
      const t = (sweepY - a[1]) / (b[1] - a[1])
      xs.push(a[0] + t * (b[0] - a[0]))
    }
  }
  if (xs.length === 0) return 100
  xs.sort((a, b) => a - b)
  // Midpoint of leftmost and rightmost crossings = horizontal center of the slice
  return (xs[0] + xs[xs.length - 1]) / 2
}

// Confetti state stored at module level (single sim per page assumed; we re-seed each completion).
let _confettiState = null
function drawConfetti(ctx, w, h) {
  // Lazy seed; reset whenever banner re-mounts (status changes drive re-render but draw loop is steady).
  if (!_confettiState || _confettiState.w !== w || _confettiState.h !== h || (performance.now() - _confettiState.born) > 60000) {
    const colors = ['#ffb547', '#7fdb9c', '#4ec9d4', '#ff6b4a', '#e0e8f0']
    const particles = []
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: w / 2 + (Math.random() - 0.5) * w * 0.4,
        y: h * 0.4 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 4,
        vy: -3 - Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[(Math.random() * colors.length) | 0],
        size: 3 + Math.random() * 4,
        life: 0,
      })
    }
    _confettiState = { particles, born: performance.now(), w, h }
  }
  const st = _confettiState
  for (const p of st.particles) {
    p.life += 1
    p.vy += 0.15 // gravity
    p.x += p.vx
    p.y += p.vy
    p.rot += p.vr
    const alpha = Math.max(0, 1 - p.life / 200)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot)
    ctx.fillStyle = p.color
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
    ctx.restore()
  }
}
