import { useEffect, useRef, useState, useCallback } from 'react';
import './activity-feed.css';

/**
 * ActivityFeed — compact CRT-styled feed of plausible CI/MES updates.
 * Self-contained: no external deps, no props required.
 *
 * Behavior:
 *   - Seeds with 5 entries on mount
 *   - Every ~12s pushes a new entry at top, drops oldest
 *   - Timestamps tick up ("2m ago" → "5m ago" → …) every 60s
 *   - Pauses the rotation when document is hidden
 *   - Cleans up timers on unmount
 */

const POOL = [
  { icon: '✅', msg: 'Closed 3 RAID items on Tulip rollout',           badge: '3' },
  { icon: '📋', msg: 'Reviewed 2 Kaizen actions with floor leads',     badge: '2' },
  { icon: '🖨️', msg: 'Printed a CBN boot mold — 14m wall time',        badge: null },
  { icon: '📈', msg: 'OEM Tracker auto-import @ 06:00 — clean',        badge: 'OK' },
  { icon: '🔍', msg: 'Spot-checked 5S Gold zone in plasma',            badge: null },
  { icon: '🧠', msg: 'Drafted Lunch-and-Learn deck — 2-Second Lean',   badge: null },
  { icon: '🛠️', msg: 'Tweaked LOB board cadence — Gate 1 stable',      badge: null },
  { icon: '📡', msg: 'Synced Smartsheet writeback — bi-weekly ready',  badge: null },
  { icon: '🧪', msg: 'Validated baffle fixture v3 — patent draft in review', badge: 'v3' },
  { icon: '🎯', msg: 'Op20 induction standardized — TAT trending down',badge: null },
  { icon: '🤖', msg: 'Claude PM framework: 4 status drafts auto-generated', badge: '4' },
  { icon: '📝', msg: 'Captured 11 employee ideas via Forms',           badge: '11' },
  { icon: '🔧', msg: 'Polishing-disc stand v2 — printed, deployed',    badge: 'v2' },
  { icon: '🌐', msg: 'PwC sync 09:00 — Base Layout in 15-day review',  badge: null },
];

const MAX_VISIBLE = 5;
const TICK_MS = 12000;     // new entry every 12s
const AGE_MS = 60000;      // tick timestamps every 60s

/** Pick a random index from POOL avoiding recent ones */
function pickNext(recentPoolIdxs) {
  const avoid = new Set(recentPoolIdxs);
  // collect available
  const available = [];
  for (let i = 0; i < POOL.length; i++) if (!avoid.has(i)) available.push(i);
  // fall back if we've used everything
  const choices = available.length > 0 ? available : POOL.map((_, i) => i);
  return choices[Math.floor(Math.random() * choices.length)];
}

function formatAge(ageMin) {
  if (ageMin < 1) return 'now';
  if (ageMin < 60) return `${ageMin}m ago`;
  const h = Math.floor(ageMin / 60);
  return `${h}h ago`;
}

let _entryId = 0;
function makeEntry(poolIdx, ageMin) {
  const item = POOL[poolIdx];
  return {
    id: ++_entryId,
    poolIdx,
    icon: item.icon,
    msg: item.msg,
    badge: item.badge,
    bornAt: Date.now() - ageMin * 60_000,
  };
}

export default function ActivityFeed() {
  // Seed: 5 entries with staggered ages so the list feels alive on first paint
  const [entries, setEntries] = useState(() => {
    const seedAges = [2, 5, 8, 12, 18]; // minutes
    const used = [];
    return seedAges.map((age) => {
      const idx = pickNext(used);
      used.push(idx);
      return makeEntry(idx, age);
    });
  });

  // Force re-render every minute so timestamps refresh
  const [, setNowTick] = useState(0);

  // Hold last-N pool indexes to avoid back-to-back repeats
  const recentRef = useRef(entries.map((e) => e.poolIdx));

  const pushOne = useCallback(() => {
    setEntries((prev) => {
      const recent = recentRef.current.slice(-Math.min(6, POOL.length - 1));
      const nextIdx = pickNext(recent);
      recentRef.current = [...recent, nextIdx];

      const next = makeEntry(nextIdx, 0);
      const trimmed = [next, ...prev].slice(0, MAX_VISIBLE);
      return trimmed;
    });
  }, []);

  // Rotation interval — pauses when tab hidden
  useEffect(() => {
    let intervalId = null;

    const start = () => {
      if (intervalId == null) intervalId = setInterval(pushOne, TICK_MS);
    };
    const stop = () => {
      if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      start();
    } else {
      start(); // SSR-safe fallback
    }

    const onVis = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }

    return () => {
      stop();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }, [pushOne]);

  // Re-tick timestamps every 60s
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), AGE_MS);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();

  return (
    <aside
      className="af-panel"
      role="log"
      aria-live="polite"
      aria-label="Recent activity"
    >
      <div className="af-header">
        <div className="af-header-titles">
          <span className="af-title">ACTIVITY_LOG</span>
          <span className="af-subtitle">Last 30 min</span>
        </div>
        <span className="af-live" aria-hidden="true">
          <span className="af-live-dot" />
          LIVE
        </span>
      </div>

      <div className="af-list">
        {entries.map((e) => {
          const ageMin = Math.max(0, Math.floor((now - e.bornAt) / 60_000));
          return (
            <div className="af-entry" key={e.id}>
              <span className="af-time">{formatAge(ageMin)}</span>
              <span className="af-icon" aria-hidden="true">{e.icon}</span>
              <span className="af-msg">
                {e.msg}
                {e.badge && <span className="af-badge">{e.badge}</span>}
              </span>
            </div>
          );
        })}
      </div>

      <div className="af-footer">
        <span>{entries.length} events</span>
        <span>tail -f <span className="af-cursor">_</span></span>
      </div>
    </aside>
  );
}
