import { useCallback, useEffect, useRef, useState } from 'react';
import './resume-button.css';

/**
 * ResumeButton
 * Retro CRT-styled "DOWNLOAD RESUME.PDF" button with canvas confetti.
 *
 * On click:
 *   - Triggers download of /resume.pdf via a programmatic <a download>
 *   - Bursts ~80 confetti particles from the button center (gold/green/cyan/amber)
 *   - Dispatches window event "achievement:resume-downloaded"
 *   - If window.audioPlay is defined, plays a "success" cue (wrapped in try/catch)
 *   - Briefly displays "DOWNLOADING..." then returns to normal label
 *
 * Respects prefers-reduced-motion: skips confetti, still downloads.
 */

const CONFETTI_COLORS = [
  '#f7e98e', // gold
  '#ffd24a', // amber
  '#7fdb9c', // CRT green-soft
  '#33ff33', // CRT green-hot
  '#4ec9d4', // cyan
  '#ffb347', // amber-orange
];

const PARTICLE_COUNT = 80;
const GRAVITY = 0.28;
const DRAG = 0.992;
const FADE_START = 0.55; // life ratio at which fade begins

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function spawnParticles(originX, originY) {
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Burst: random direction within a slight upward bias
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 7;
    const upwardBias = -2 - Math.random() * 3;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + upwardBias,
      size: 4 + Math.random() * 5,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      life: 0,
      maxLife: 90 + Math.random() * 60, // frames
      shape: Math.random() < 0.5 ? 'rect' : 'circle',
    });
  }
  return particles;
}

function runConfetti(originX, originY, onComplete) {
  const canvas = document.createElement('canvas');
  canvas.className = 'rb-confetti-canvas';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let particles = spawnParticles(originX, originY);
  let rafId = 0;
  let cancelled = false;

  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);

  const cleanup = () => {
    if (cancelled) return;
    cancelled = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', handleResize);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    if (typeof onComplete === 'function') onComplete();
  };

  const frame = () => {
    if (cancelled) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let alive = 0;
    for (const p of particles) {
      p.vy += GRAVITY;
      p.vx *= DRAG;
      p.vy *= DRAG;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vRot;
      p.life += 1;

      // Cull when offscreen-bottom or expired
      if (p.y - p.size > canvas.height || p.life > p.maxLife) continue;
      alive++;

      const lifeRatio = p.life / p.maxLife;
      const alpha = lifeRatio < FADE_START
        ? 1
        : Math.max(0, 1 - (lifeRatio - FADE_START) / (1 - FADE_START));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (alive === 0) {
      cleanup();
      return;
    }
    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);
  return cleanup;
}

export default function ResumeButton() {
  const btnRef = useRef(null);
  const cleanupRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const downloadingTimerRef = useRef(null);

  // Tear down any in-flight confetti / timers on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
      if (downloadingTimerRef.current) clearTimeout(downloadingTimerRef.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    // 1) Trigger the download (the file may 404 — that's the host's problem)
    try {
      const a = document.createElement('a');
      a.href = '/resume.pdf';
      a.download = 'resume.pdf';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (_) {
      // Fall back to navigation if anchor synthesis fails
      try { window.location.href = '/resume.pdf'; } catch (__) { /* no-op */ }
    }

    // 2) Optional success sound
    try {
      if (typeof window !== 'undefined' && typeof window.audioPlay === 'function') {
        window.audioPlay('success');
      }
    } catch (_) { /* no-op */ }

    // 3) Achievement event
    try {
      window.dispatchEvent(new CustomEvent('achievement:resume-downloaded'));
    } catch (_) { /* no-op */ }

    // 4) Confetti from button center (unless reduced motion)
    if (!prefersReducedMotion() && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // If a previous burst is still running, cancel it before starting a new one
      if (cleanupRef.current) cleanupRef.current();
      cleanupRef.current = runConfetti(cx, cy, () => { cleanupRef.current = null; });
    }

    // 5) Brief "DOWNLOADING..." label state
    setDownloading(true);
    if (downloadingTimerRef.current) clearTimeout(downloadingTimerRef.current);
    downloadingTimerRef.current = setTimeout(() => {
      setDownloading(false);
      downloadingTimerRef.current = null;
    }, 1400);
  }, []);

  return (
    <button
      ref={btnRef}
      type="button"
      className={`rb-button${downloading ? ' rb-is-downloading' : ''}`}
      onClick={handleClick}
      aria-label="Download resume PDF"
    >
      <span className="rb-scanlines" aria-hidden="true" />
      <span className="rb-glow" aria-hidden="true" />
      <span className="rb-content">
        <svg
          className="rb-icon"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M12 3v11.5m0 0l-4.5-4.5M12 14.5l4.5-4.5M5 19h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
        <span className="rb-label">
          {downloading ? (
            <>
              <span className="rb-line rb-line-1">DOWNLOADING</span>
              <span className="rb-line rb-line-2 rb-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </>
          ) : (
            <>
              <span className="rb-line rb-line-1">DOWNLOAD</span>
              <span className="rb-line rb-line-2">RESUME.PDF</span>
            </>
          )}
        </span>
      </span>
    </button>
  );
}
