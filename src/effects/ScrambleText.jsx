import { useEffect, useMemo, useRef, useState, createElement } from 'react';
import './scramble-text.css';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*<>/\\|+=-_';
const CYCLE_MS = 50; // how often un-locked chars pick a new random glyph

function randChar() {
  return SCRAMBLE_CHARS.charAt(
    Math.floor(Math.random() * SCRAMBLE_CHARS.length)
  );
}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * ScrambleText — settles random chars into the target string.
 *
 * Props:
 *   text     (string, required)
 *   duration (number, default 800ms)
 *   as       (string, default 'span')
 *   trigger  ('mount' | 'hover' | 'inView', default 'mount')
 *   className, style, crt (visual flags) — forwarded
 */
export default function ScrambleText({
  text,
  duration = 800,
  as = 'span',
  trigger = 'mount',
  className = '',
  style,
  crt = false,
  ...rest
}) {
  const safeText = typeof text === 'string' ? text : String(text ?? '');

  // Per-character lock-in times. Spaces lock immediately so they stay as spaces.
  const lockTimes = useMemo(() => {
    const len = safeText.length;
    if (len === 0) return [];
    const step = duration / len;
    return Array.from({ length: len }, (_, i) => {
      if (safeText[i] === ' ' || safeText[i] === '\n' || safeText[i] === '\t') {
        return 0;
      }
      return i * step;
    });
  }, [safeText, duration]);

  const [display, setDisplay] = useState(() => safeText);
  const [isScrambling, setIsScrambling] = useState(false);

  const rafRef = useRef(0);
  const startRef = useRef(0);
  const lastCycleRef = useRef(0);
  const hostRef = useRef(null);
  const observerRef = useRef(null);
  const hasRunRef = useRef(false);
  const reducedMotionRef = useRef(false);

  // Snapshot reduced-motion once per mount.
  useEffect(() => {
    reducedMotionRef.current = prefersReducedMotion();
  }, []);

  const cancelAnim = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  };

  const snapToFinal = () => {
    cancelAnim();
    setDisplay(safeText);
    setIsScrambling(false);
  };

  const runScramble = () => {
    if (reducedMotionRef.current || safeText.length === 0 || duration <= 0) {
      snapToFinal();
      return;
    }

    cancelAnim();
    setIsScrambling(true);
    startRef.current = 0;
    lastCycleRef.current = 0;

    // Seed with an initial random buffer so frame 1 isn't the final text.
    const seed = safeText
      .split('')
      .map((c) => (c === ' ' || c === '\n' || c === '\t' ? c : randChar()))
      .join('');
    setDisplay(seed);

    const tick = (now) => {
      if (startRef.current === 0) {
        startRef.current = now;
        lastCycleRef.current = now;
      }
      const elapsed = now - startRef.current;
      const cycle = now - lastCycleRef.current >= CYCLE_MS;
      if (cycle) lastCycleRef.current = now;

      let out = '';
      let stillScrambling = false;
      for (let i = 0; i < safeText.length; i++) {
        const target = safeText[i];
        if (elapsed >= lockTimes[i]) {
          out += target;
        } else {
          stillScrambling = true;
          if (target === ' ' || target === '\n' || target === '\t') {
            out += target;
          } else if (cycle) {
            out += randChar();
          } else {
            // Reuse the previous random glyph between cycles for stability.
            const prev = display[i];
            out += prev && prev !== target ? prev : randChar();
          }
        }
      }

      setDisplay(out);

      if (stillScrambling && elapsed < duration) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(safeText);
        setIsScrambling(false);
        rafRef.current = 0;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  // Trigger: mount
  useEffect(() => {
    if (trigger !== 'mount') return undefined;
    runScramble();
    return cancelAnim;
    // Re-run when the target text changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeText, duration, trigger]);

  // Trigger: inView (once)
  useEffect(() => {
    if (trigger !== 'inView') return undefined;
    const node = hostRef.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: just run it.
      runScramble();
      hasRunRef.current = true;
      return cancelAnim;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasRunRef.current) {
            hasRunRef.current = true;
            runScramble();
            observerRef.current?.disconnect();
            observerRef.current = null;
            break;
          }
        }
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(node);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      cancelAnim();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeText, duration, trigger]);

  // Trigger: hover (re-scramble on each enter, snap on leave)
  const onMouseEnter = trigger === 'hover' ? () => runScramble() : undefined;
  const onMouseLeave = trigger === 'hover' ? () => snapToFinal() : undefined;

  // Unmount cleanup.
  useEffect(
    () => () => {
      cancelAnim();
      observerRef.current?.disconnect();
      observerRef.current = null;
    },
    []
  );

  const classes = [
    'st-root',
    crt ? 'st-crt' : '',
    isScrambling ? 'st-scrambling' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return createElement(
    as,
    {
      ref: hostRef,
      className: classes,
      style,
      onMouseEnter,
      onMouseLeave,
      'aria-label': safeText,
      ...rest,
    },
    display
  );
}
