import { useState, useEffect, useCallback, useRef } from 'react'

const GRID = 40

function snap(v) {
  return Math.round(v / GRID) * GRID
}

function dimGeometry(x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return null

  // Unit normal perpendicular to line
  const nx = -dy / len
  const ny = dx / len
  const off = 14

  // Offset endpoints for dimension line
  const d1x = x1 + nx * off, d1y = y1 + ny * off
  const d2x = x2 + nx * off, d2y = y2 + ny * off

  // Extension lines (from endpoint toward offset, shorter)
  const ext1 = { x1, y1, x2: x1 + nx * (off + 4), y2: y1 + ny * (off + 4) }
  const ext2 = { x1: x2, y1: y2, x2: x2 + nx * (off + 4), y2: y2 + ny * (off + 4) }

  // Text position at midpoint of dimension line
  const tx = (d1x + d2x) / 2
  const ty = (d1y + d2y) / 2

  // Rotation angle matching line direction, flipped if upside-down
  let angle = Math.atan2(dy, dx) * (180 / Math.PI)
  if (angle > 90) angle -= 180
  if (angle < -90) angle += 180

  const value = (len / GRID).toFixed(2)

  return { d1x, d1y, d2x, d2y, ext1, ext2, tx, ty, angle, value }
}

export default function CadDrawingLayer({ viewW, viewH, containerRef, paused, fading }) {
  const [lines, setLines] = useState([])
  const [startPoint, setStartPoint] = useState(null)
  const [previewEnd, setPreviewEnd] = useState(null)
  const disabled = paused || fading

  // Click handler — filters out clicks on interactive elements
  const handleClick = useCallback((e) => {
    if (disabled) return

    // Only activate on empty background clicks
    const t = e.target
    const isBackground =
      t.classList.contains('blueprint-bg') ||
      t.tagName === 'CANVAS' ||
      (t === containerRef.current)
    if (!isBackground) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = snap(e.clientX - rect.left)
    const y = snap(e.clientY - rect.top)

    if (!startPoint) {
      setStartPoint({ x, y })
      setPreviewEnd({ x, y })
    } else {
      if (x !== startPoint.x || y !== startPoint.y) {
        setLines(prev => [...prev, { x1: startPoint.x, y1: startPoint.y, x2: x, y2: y }])
      }
      setStartPoint(null)
      setPreviewEnd(null)
    }
  }, [disabled, startPoint, containerRef])

  // Mouse move for rubber-band preview
  const handleMove = useCallback((e) => {
    if (!startPoint || disabled) return
    const rect = containerRef.current.getBoundingClientRect()
    setPreviewEnd({ x: snap(e.clientX - rect.left), y: snap(e.clientY - rect.top) })
  }, [startPoint, disabled, containerRef])

  // Keyboard shortcuts
  const handleKey = useCallback((e) => {
    if (disabled) return
    if (e.key === 'Escape') {
      setStartPoint(null)
      setPreviewEnd(null)
    } else if (e.key === 'z' || e.key === 'Z') {
      if (!e.ctrlKey && !e.metaKey) {
        setLines(prev => prev.slice(0, -1))
      }
    } else if (e.key === 'c' || e.key === 'C') {
      if (!e.ctrlKey && !e.metaKey) {
        setLines([])
        setStartPoint(null)
        setPreviewEnd(null)
      }
    }
  }, [disabled])

  // Attach listeners to container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('click', handleClick)
    el.addEventListener('mousemove', handleMove)
    return () => {
      el.removeEventListener('click', handleClick)
      el.removeEventListener('mousemove', handleMove)
    }
  }, [handleClick, handleMove, containerRef])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Cancel in-progress drawing on navigation, but keep completed lines
  const prevDisabled = useRef(disabled)
  useEffect(() => {
    if (disabled && !prevDisabled.current) {
      setStartPoint(null)
      setPreviewEnd(null)
    }
    prevDisabled.current = disabled
  }, [disabled])

  const renderDimension = (x1, y1, x2, y2, key, isPreview) => {
    const dim = dimGeometry(x1, y1, x2, y2)
    if (!dim) return null
    return (
      <g key={key}>
        <line x1={x1} y1={y1} x2={x2} y2={y2}
          className={`cad-line${isPreview ? ' preview' : ''}`} />
        {!isPreview && (
          <>
            <line x1={dim.d1x} y1={dim.d1y} x2={dim.d2x} y2={dim.d2y} className="cad-dim-line" />
            <line x1={dim.ext1.x1} y1={dim.ext1.y1} x2={dim.ext1.x2} y2={dim.ext1.y2} className="cad-ext-line" />
            <line x1={dim.ext2.x1} y1={dim.ext2.y1} x2={dim.ext2.x2} y2={dim.ext2.y2} className="cad-ext-line" />
            <text x={dim.tx} y={dim.ty}
              transform={`rotate(${dim.angle},${dim.tx},${dim.ty})`}
              className="cad-dim-text">
              {dim.value}
            </text>
          </>
        )}
      </g>
    )
  }

  return (
    <>
      <svg className="cad-drawing-svg" viewBox={`0 0 ${viewW} ${viewH}`}
        preserveAspectRatio="xMidYMid meet">
        {lines.map((l, i) => renderDimension(l.x1, l.y1, l.x2, l.y2, i, false))}
        {startPoint && previewEnd && (
          <>
            {renderDimension(startPoint.x, startPoint.y, previewEnd.x, previewEnd.y, 'preview', true)}
            <circle cx={startPoint.x} cy={startPoint.y} r="6" className="cad-start-marker" />
            <line x1={startPoint.x - 10} y1={startPoint.y} x2={startPoint.x + 10} y2={startPoint.y} className="cad-start-marker-cross" />
            <line x1={startPoint.x} y1={startPoint.y - 10} x2={startPoint.x} y2={startPoint.y + 10} className="cad-start-marker-cross" />
          </>
        )}
      </svg>
      {(lines.length > 0 || startPoint) && (
        <div className="cad-instructions">
          Click to place points · Esc cancel · Z undo · C clear
        </div>
      )}
    </>
  )
}
