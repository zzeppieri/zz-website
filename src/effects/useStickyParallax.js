import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useStickyParallax
 *
 * Adds 3D parallax tilt to an element by writing two CSS custom properties:
 *   --tilt-x  (rotateX in deg)
 *   --tilt-y  (rotateY in deg)
 *
 * It deliberately does NOT touch `transform` or `animation` directly, so it
 * composes cleanly with the existing `floatBubble` keyframe animation on
 * `.sticky-bubble`. The companion CSS (`sticky-parallax.css`) consumes the
 * vars when the `.sticky-bubble--parallax` opt-in class is present.
 *
 * @param {React.RefObject<HTMLElement>} elementRef  Ref to the bubble element.
 * @param {Object}  [opts]
 * @param {number}  [opts.maxTilt=12]  Maximum tilt in degrees on each axis.
 * @param {number}  [opts.lerp=0.12]   Easing factor per frame (0–1).
 * @param {boolean} [opts.mobile=false] Opt-in to DeviceOrientation fallback.
 */
export function useStickyParallax(elementRef, opts = {}) {
  const { maxTilt = 12, lerp = 0.12, mobile = false } = opts;

  // Targets + current values live in refs so we don't re-render on every frame.
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const rafId = useRef(0);
  const isActive = useRef(false);

  // Mobile orientation fallback hook (only its state if `mobile` opt-in).
  const orientation = useDeviceOrientation(mobile);

  // Feed orientation values into the same target ref.
  useEffect(() => {
    if (!mobile) return;
    if (orientation.beta == null || orientation.gamma == null) return;
    // gamma: left/right tilt [-90, 90], beta: front/back tilt [-180, 180]
    const nx = clamp(orientation.gamma / 45, -1, 1); // -1..1
    const ny = clamp(orientation.beta / 45, -1, 1);
    target.current.x = -ny * maxTilt; // rotateX (pitch) inverted feels natural
    target.current.y = nx * maxTilt;  // rotateY (yaw)
    isActive.current = true;
  }, [mobile, orientation.beta, orientation.gamma, maxTilt]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return undefined;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Normalize cursor to -1..1 across the element bounds.
      const nx = clamp((e.clientX - cx) / (rect.width / 2), -1, 1);
      const ny = clamp((e.clientY - cy) / (rect.height / 2), -1, 1);
      // rotateX driven by Y axis (pitch), rotateY by X axis (yaw).
      target.current.x = -ny * maxTilt;
      target.current.y = nx * maxTilt;
      isActive.current = true;
    };

    const handleEnter = (e) => {
      isActive.current = true;
      handleMove(e);
    };

    const handleLeave = () => {
      target.current.x = 0;
      target.current.y = 0;
      // keep loop running until current values relax to ~0
    };

    const tick = () => {
      const tx = target.current.x;
      const ty = target.current.y;
      const cx = current.current.x;
      const cy = current.current.y;
      const nextX = cx + (tx - cx) * lerp;
      const nextY = cy + (ty - cy) * lerp;
      current.current.x = nextX;
      current.current.y = nextY;

      el.style.setProperty('--tilt-x', `${nextX.toFixed(2)}deg`);
      el.style.setProperty('--tilt-y', `${nextY.toFixed(2)}deg`);

      // Stop the loop once we're effectively at rest AND no target set.
      const atRest =
        Math.abs(tx) < 0.01 &&
        Math.abs(ty) < 0.01 &&
        Math.abs(nextX) < 0.05 &&
        Math.abs(nextY) < 0.05;
      if (atRest) {
        current.current.x = 0;
        current.current.y = 0;
        el.style.setProperty('--tilt-x', '0deg');
        el.style.setProperty('--tilt-y', '0deg');
        isActive.current = false;
        rafId.current = 0;
        return;
      }
      rafId.current = requestAnimationFrame(tick);
    };

    const ensureLoop = () => {
      if (!rafId.current) rafId.current = requestAnimationFrame(tick);
    };

    const onEnter = (e) => {
      handleEnter(e);
      ensureLoop();
    };
    const onMove = (e) => {
      handleMove(e);
      ensureLoop();
    };
    const onLeave = () => {
      handleLeave();
      ensureLoop();
    };

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    // Initialize vars so CSS always has a value, even before first interaction.
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');

    // If mobile orientation is feeding values, keep the loop running.
    if (mobile) ensureLoop();

    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }
    };
  }, [elementRef, maxTilt, lerp, mobile]);
}

/**
 * useDeviceOrientation
 *
 * Sub-hook that surfaces { beta, gamma, permission, request }. On iOS 13+
 * Safari, DeviceOrientationEvent.requestPermission() must be called from a
 * user gesture — `request()` exposes that. Other browsers attach listeners
 * immediately.
 *
 * Graceful degradation: if the API is unsupported or permission is denied,
 * beta/gamma remain null and callers fall back to mouse-only behavior.
 *
 * @param {boolean} enabled
 */
export function useDeviceOrientation(enabled = true) {
  const [state, setState] = useState({
    beta: null,
    gamma: null,
    permission: 'unknown', // 'unknown' | 'granted' | 'denied' | 'unsupported'
  });

  const handlerRef = useRef(null);

  const attach = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.DeviceOrientationEvent === 'undefined') {
      setState((s) => ({ ...s, permission: 'unsupported' }));
      return;
    }
    const onOrient = (e) => {
      setState((s) => ({
        ...s,
        beta: typeof e.beta === 'number' ? e.beta : s.beta,
        gamma: typeof e.gamma === 'number' ? e.gamma : s.gamma,
        permission: 'granted',
      }));
    };
    handlerRef.current = onOrient;
    window.addEventListener('deviceorientation', onOrient);
  }, []);

  // Caller-invoked permission request (must be in a user gesture on iOS).
  const request = useCallback(async () => {
    if (typeof window === 'undefined') return 'unsupported';
    const DOE = window.DeviceOrientationEvent;
    if (typeof DOE === 'undefined') {
      setState((s) => ({ ...s, permission: 'unsupported' }));
      return 'unsupported';
    }
    if (typeof DOE.requestPermission === 'function') {
      try {
        const res = await DOE.requestPermission();
        if (res === 'granted') {
          attach();
          setState((s) => ({ ...s, permission: 'granted' }));
          return 'granted';
        }
        setState((s) => ({ ...s, permission: 'denied' }));
        return 'denied';
      } catch {
        setState((s) => ({ ...s, permission: 'denied' }));
        return 'denied';
      }
    }
    // Non-iOS path: no permission needed.
    attach();
    return 'granted';
  }, [attach]);

  useEffect(() => {
    if (!enabled) return undefined;
    // On platforms without permission gate, attach immediately.
    if (
      typeof window !== 'undefined' &&
      typeof window.DeviceOrientationEvent !== 'undefined' &&
      typeof window.DeviceOrientationEvent.requestPermission !== 'function'
    ) {
      attach();
    }
    return () => {
      if (handlerRef.current) {
        window.removeEventListener('deviceorientation', handlerRef.current);
        handlerRef.current = null;
      }
    };
  }, [enabled, attach]);

  return { ...state, request };
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
