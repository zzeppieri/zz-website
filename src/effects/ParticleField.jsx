import { useEffect, useRef } from 'react';
import './particle-field.css';

/**
 * ParticleField
 * Self-contained mouse-reactive particle canvas. Mounts as a fixed,
 * pointer-events:none layer behind app content.
 *
 * Behaviors:
 *  - Slow drift, screen-wrap
 *  - Mouse attraction within ~150px (subtle, capped velocity)
 *  - Click pulse: outward repulsion burst (desktop only)
 *  - Faint motion trails via low-alpha clear
 *  - Optional connection lines between near neighbors (capped per particle)
 *  - Pauses on tab hidden, respects prefers-reduced-motion
 */
export default function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // ---------- Config ----------
    const isMobile = window.innerWidth < 768;
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const PALETTE = [
      'rgba(127, 219, 156, ALPHA)', // CRT green
      'rgba(120, 200, 220, ALPHA)', // cyan
      'rgba(240, 190, 110, ALPHA)', // amber
      'rgba(220, 230, 240, ALPHA)', // soft white
    ];

    const baseCount = isMobile ? 40 : 80;
    const PARTICLE_COUNT = reducedMotion ? Math.floor(baseCount * 0.5) : baseCount;
    const DRIFT = reducedMotion ? 0.04 : 0.1;
    const ATTRACT_RADIUS = 150;
    const ATTRACT_FORCE = 0.06;
    const MAX_SPEED = 1.6;
    const CONNECT_RADIUS = 80;
    const CONNECT_PER_PARTICLE = 3;
    const TRAIL_FADE = 0.12; // low-alpha clear -> trail effect
    const ENABLE_ATTRACT = !reducedMotion;
    const ENABLE_PULSES = !isMobile; // touch too easy to fire
    const PULSE_RADIUS = 180;
    const PULSE_FORCE = 6;
    const PULSE_LIFETIME = 450; // ms

    // ---------- Sizing ----------
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // ---------- Particles ----------
    const rand = (a, b) => a + Math.random() * (b - a);
    const colorFor = (i) => PALETTE[i % PALETTE.length];

    const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: rand(-DRIFT, DRIFT),
      vy: rand(-DRIFT, DRIFT),
      r: rand(0.7, 2.0),
      alpha: rand(0.35, 0.75),
      colorTpl: colorFor(i),
    }));

    // ---------- Mouse / Pulses ----------
    const mouse = { x: -9999, y: -9999, active: false };
    const pulses = []; // { x, y, t0 }

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onClick = (e) => {
      if (!ENABLE_PULSES) return;
      pulses.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
      if (pulses.length > 8) pulses.shift();
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('click', onClick);
    window.addEventListener('resize', resize);

    // ---------- Visibility pause ----------
    let paused = document.hidden;
    const onVis = () => {
      paused = document.hidden;
      if (!paused) {
        // reset timing reference so dt does not spike after resume
        lastTs = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    // ---------- Animation ----------
    let rafId = 0;
    let lastTs = performance.now();

    const tick = (ts) => {
      if (paused) return;
      const dt = Math.min(48, ts - lastTs); // clamp huge gaps
      lastTs = ts;
      const dtScale = dt / 16.67; // normalize to ~60fps frames

      // Trail effect: low-alpha clear instead of full clear
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${TRAIL_FADE})`;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';

      // Update + draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse attraction
        if (ENABLE_ATTRACT && mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < ATTRACT_RADIUS * ATTRACT_RADIUS && dist2 > 1) {
            const dist = Math.sqrt(dist2);
            const falloff = 1 - dist / ATTRACT_RADIUS; // 1 near, 0 at edge
            p.vx += (dx / dist) * ATTRACT_FORCE * falloff * dtScale;
            p.vy += (dy / dist) * ATTRACT_FORCE * falloff * dtScale;
          }
        }

        // Click pulses (repulsion)
        if (ENABLE_PULSES && pulses.length) {
          for (let k = 0; k < pulses.length; k++) {
            const pu = pulses[k];
            const age = ts - pu.t0;
            if (age > PULSE_LIFETIME) continue;
            const ageNorm = age / PULSE_LIFETIME; // 0 -> 1
            const ringR = PULSE_RADIUS * ageNorm;
            const dx = p.x - pu.x;
            const dy = p.y - pu.y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
            // narrow shell so the burst feels like an expanding ring
            const shell = Math.max(0, 1 - Math.abs(dist - ringR) / 60);
            const decay = 1 - ageNorm;
            const force = PULSE_FORCE * shell * decay;
            if (force > 0.001) {
              p.vx += (dx / dist) * force * dtScale;
              p.vy += (dy / dist) * force * dtScale;
            }
          }
        }

        // Speed cap
        const sp2 = p.vx * p.vx + p.vy * p.vy;
        if (sp2 > MAX_SPEED * MAX_SPEED) {
          const sp = Math.sqrt(sp2);
          p.vx = (p.vx / sp) * MAX_SPEED;
          p.vy = (p.vy / sp) * MAX_SPEED;
        }

        // Gentle drift damping so things return to baseline
        p.vx *= 0.985;
        p.vy *= 0.985;
        // Inject a touch of baseline drift so particles never freeze
        if (Math.abs(p.vx) < DRIFT * 0.5) p.vx += rand(-DRIFT, DRIFT) * 0.1;
        if (Math.abs(p.vy) < DRIFT * 0.5) p.vy += rand(-DRIFT, DRIFT) * 0.1;

        // Integrate
        p.x += p.vx * dtScale;
        p.y += p.vy * dtScale;

        // Wrap
        if (p.x < -5) p.x = width + 5;
        else if (p.x > width + 5) p.x = -5;
        if (p.y < -5) p.y = height + 5;
        else if (p.y > height + 5) p.y = -5;

        // Draw dot
        ctx.beginPath();
        ctx.fillStyle = p.colorTpl.replace('ALPHA', p.alpha.toFixed(3));
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cull dead pulses
      for (let k = pulses.length - 1; k >= 0; k--) {
        if (ts - pulses[k].t0 > PULSE_LIFETIME) pulses.splice(k, 1);
      }

      // Connection lines — cap per particle, only forward pairs to avoid dupes
      // Skip on mobile to save fillrate.
      if (!isMobile) {
        const r2 = CONNECT_RADIUS * CONNECT_RADIUS;
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          let connected = 0;
          for (let j = i + 1; j < particles.length; j++) {
            if (connected >= CONNECT_PER_PARTICLE) break;
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < r2) {
              const t = 1 - Math.sqrt(d2) / CONNECT_RADIUS;
              ctx.strokeStyle = `rgba(127, 219, 156, ${(t * 0.18).toFixed(3)})`;
              ctx.lineWidth = 0.6;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
              connected++;
            }
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    // ---------- Cleanup ----------
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('click', onClick);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div className="pf-root" aria-hidden="true">
      <canvas ref={canvasRef} className="pf-canvas" />
    </div>
  );
}
