import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './circuit-snake.css';

/* ───── constants ───── */
const GRID = 20;                       // 20×20 board
const START_LEN = 4;
const START_STEPS_PER_SEC = 6;         // ~6 cells/sec
const MAX_STEPS_PER_SEC = 15;
const SPEED_GROWTH = 1.05;             // +5% per food
const HS_KEY = 'circuit_snake_highscore';

/* Direction vectors */
const DIRS = {
  up:    { x: 0, y: -1 },
  down:  { x: 0, y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

/* ───── helpers ───── */
function randomEmptyCell(snake) {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
  // sample with cap to avoid pathological loops on near-full board
  for (let i = 0; i < 200; i++) {
    const x = Math.floor(Math.random() * GRID);
    const y = Math.floor(Math.random() * GRID);
    if (!occupied.has(`${x},${y}`)) return { x, y };
  }
  // fallback: linear scan
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!occupied.has(`${x},${y}`)) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

function initialSnake() {
  // horizontal snake near center, heading right
  const cy = Math.floor(GRID / 2);
  const cx = Math.floor(GRID / 2);
  const body = [];
  for (let i = 0; i < START_LEN; i++) body.push({ x: cx - i, y: cy });
  return body;
}

/* ───── component ───── */
export default function CircuitSnake() {
  /* visible (re-render) state */
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const stored = parseInt(window.localStorage.getItem(HS_KEY) || '0', 10);
    return Number.isFinite(stored) ? stored : 0;
  });
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [, forceRender] = useState(0);   // bump to redraw segments

  /* mutable refs — fast path, no re-renders */
  const screenRef = useRef(null);
  const snakeRef = useRef(initialSnake());
  const foodRef = useRef(randomEmptyCell(snakeRef.current));
  const dirRef = useRef('right');
  const dirQueueRef = useRef([]);           // pending direction inputs
  const stepsPerSecRef = useRef(START_STEPS_PER_SEC);
  const accumRef = useRef(0);
  const lastTsRef = useRef(0);
  const rafRef = useRef(0);
  const cellSizeRef = useRef(24);
  const [cellSize, setCellSize] = useState(24);
  const pausedRef = useRef(false);
  const gameOverRef = useRef(false);
  const startedRef = useRef(false);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);

  /* sync refs with state where the rAF loop needs to read them */
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { startedRef.current = started; }, [started]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);

  /* ───── responsive cell sizing ───── */
  useLayoutEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const size = Math.max(8, Math.floor(w / GRID));
      cellSizeRef.current = size;
      setCellSize(size);
      el.style.setProperty('--cs-cell', `${size}px`);
    };
    update();
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(el);
    } else {
      window.addEventListener('resize', update);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', update);
    };
  }, []);

  /* ───── reset / start ───── */
  const reset = useCallback(() => {
    snakeRef.current = initialSnake();
    foodRef.current = randomEmptyCell(snakeRef.current);
    dirRef.current = 'right';
    dirQueueRef.current = [];
    stepsPerSecRef.current = START_STEPS_PER_SEC;
    accumRef.current = 0;
    lastTsRef.current = 0;
    setScore(0);
    setGameOver(false);
    setPaused(false);
    forceRender((n) => n + 1);
  }, []);

  /* ───── direction queue ───── */
  const enqueueDir = useCallback((next) => {
    if (!DIRS[next]) return;
    const lastEffective = dirQueueRef.current.length
      ? dirQueueRef.current[dirQueueRef.current.length - 1]
      : dirRef.current;
    if (next === lastEffective || next === OPPOSITE[lastEffective]) return;
    // cap queue to avoid drift
    if (dirQueueRef.current.length < 2) dirQueueRef.current.push(next);
    // first input also "starts" the game
    if (!startedRef.current && !gameOverRef.current) {
      startedRef.current = true;
      setStarted(true);
    }
  }, []);

  /* ───── tick: advance one cell ───── */
  const step = useCallback(() => {
    if (dirQueueRef.current.length) dirRef.current = dirQueueRef.current.shift();
    const d = DIRS[dirRef.current];
    const snake = snakeRef.current;
    const head = snake[0];
    const nx = head.x + d.x;
    const ny = head.y + d.y;

    // wall collision
    if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) {
      endGame();
      return;
    }
    // self collision (ignore tail tip, which will move)
    for (let i = 0; i < snake.length - 1; i++) {
      if (snake[i].x === nx && snake[i].y === ny) {
        endGame();
        return;
      }
    }

    const newHead = { x: nx, y: ny };
    const food = foodRef.current;
    const ate = nx === food.x && ny === food.y;
    const next = [newHead, ...snake];
    if (!ate) next.pop();
    snakeRef.current = next;

    if (ate) {
      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      if (newScore > highScoreRef.current) {
        highScoreRef.current = newScore;
        setHighScore(newScore);
        try { window.localStorage.setItem(HS_KEY, String(newScore)); } catch (_) { /* ignore */ }
      }
      stepsPerSecRef.current = Math.min(
        MAX_STEPS_PER_SEC,
        stepsPerSecRef.current * SPEED_GROWTH
      );
      foodRef.current = randomEmptyCell(next);
    }
  }, []);

  const endGame = useCallback(() => {
    gameOverRef.current = true;
    setGameOver(true);
  }, []);

  /* ───── rAF loop ───── */
  useEffect(() => {
    const loop = (ts) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!lastTsRef.current) { lastTsRef.current = ts; return; }
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      if (pausedRef.current || gameOverRef.current || !startedRef.current) {
        accumRef.current = 0;
        return;
      }

      accumRef.current += dt;
      const stepDur = 1 / stepsPerSecRef.current;
      let stepped = false;
      // cap catch-up to prevent spiral of doom after tab-switch
      let safety = 4;
      while (accumRef.current >= stepDur && safety-- > 0) {
        accumRef.current -= stepDur;
        step();
        stepped = true;
        if (gameOverRef.current) break;
      }
      if (stepped) forceRender((n) => n + 1);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [step]);

  /* ───── keyboard ───── */
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key;
      let dir = null;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') dir = 'up';
      else if (k === 'ArrowDown' || k === 's' || k === 'S') dir = 'down';
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') dir = 'left';
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') dir = 'right';
      else if (k === ' ' || k === 'Spacebar') {
        if (gameOverRef.current) {
          reset();
          // first move resumes
        } else if (startedRef.current) {
          setPaused((p) => !p);
        }
        e.preventDefault();
        return;
      } else if ((k === 'Enter' || k === 'r' || k === 'R') && gameOverRef.current) {
        reset();
        e.preventDefault();
        return;
      }
      if (dir) {
        enqueueDir(dir);
        // arrows scroll the page — prevent only when our game owns input
        if (k.startsWith('Arrow') || k === ' ') e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [enqueueDir, reset]);

  /* ───── touch (swipe) ───── */
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    let sx = 0, sy = 0, active = false;
    const SWIPE_MIN = 18;

    const onStart = (e) => {
      if (!e.touches || !e.touches[0]) return;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      active = true;
      // prevent page-scroll while interacting with the board
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!active || !e.touches || !e.touches[0]) return;
      const dx = e.touches[0].clientX - sx;
      const dy = e.touches[0].clientY - sy;
      if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) {
        e.preventDefault();
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        enqueueDir(dx > 0 ? 'right' : 'left');
      } else {
        enqueueDir(dy > 0 ? 'down' : 'up');
      }
      // re-anchor so continued drag can chain
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      e.preventDefault();
    };
    const onEnd = () => { active = false; };

    // need non-passive to call preventDefault
    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: false });
    el.addEventListener('touchcancel', onEnd, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [enqueueDir]);

  /* ───── derived: render data ───── */
  const cell = cellSize;
  const snake = snakeRef.current;
  const food = foodRef.current;
  const segSize = Math.max(4, cell - 4);   // inset 2px each side
  const segInset = (cell - segSize) / 2;
  const foodSize = Math.max(4, cell - 6);
  const foodInset = (cell - foodSize) / 2;

  const segments = snake.map((s, i) => (
    <div
      key={i}
      className={`cs-seg${i === 0 ? ' cs-head' : ''}`}
      style={{
        width: segSize,
        height: segSize,
        left: s.x * cell + segInset,
        top: s.y * cell + segInset,
      }}
    />
  ));

  // traces (rectangles between consecutive segments) — gives "circuit" look
  const traces = [];
  for (let i = 1; i < snake.length; i++) {
    const a = snake[i - 1];
    const b = snake[i];
    if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) !== 1) continue; // skip wraps (shouldn't happen, defensive)
    const horizontal = a.y === b.y;
    const traceW = horizontal ? cell : Math.max(2, Math.floor(cell * 0.25));
    const traceH = horizontal ? Math.max(2, Math.floor(cell * 0.25)) : cell;
    const minX = Math.min(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const left = horizontal
      ? minX * cell + cell / 2
      : minX * cell + (cell - traceW) / 2;
    const top = horizontal
      ? minY * cell + (cell - traceH) / 2
      : minY * cell + cell / 2;
    traces.push(
      <div
        key={`t${i}`}
        className="cs-trace"
        style={{ left, top, width: traceW, height: traceH }}
      />
    );
  }

  const togglePause = () => {
    if (gameOverRef.current) { reset(); return; }
    if (!startedRef.current) { startedRef.current = true; setStarted(true); return; }
    setPaused((p) => !p);
  };

  return (
    <div className="cs-root" role="region" aria-label="Circuit Snake game">
      <div className="cs-hud">
        <div>
          <span className="cs-hud-label">SCORE</span>
          <span className="cs-hud-value">{String(score).padStart(4, '0')}</span>
        </div>
        <div className="cs-hud-right">
          <span className="cs-hud-label">HI</span>
          <span className="cs-hud-value">{String(highScore).padStart(4, '0')}</span>
        </div>
      </div>

      <div className="cs-bezel">
        <div className="cs-screen" ref={screenRef}>
          <div className="cs-grid" />
          <div className="cs-board">
            {traces}
            {segments}
            <div
              className="cs-food"
              style={{
                width: foodSize,
                height: foodSize,
                left: food.x * cell + foodInset,
                top: food.y * cell + foodInset,
              }}
            />
          </div>
          <div className="cs-vignette" />
          <div className="cs-scanlines" />

          <button
            type="button"
            className="cs-pause-btn"
            onClick={togglePause}
            aria-label={paused ? 'Resume' : 'Pause'}
          >
            {gameOver ? 'RESTART' : !started ? 'START' : paused ? 'RESUME' : 'PAUSE'}
          </button>

          {!started && !gameOver && (
            <div className="cs-overlay" onClick={() => { startedRef.current = true; setStarted(true); }}>
              <div className="cs-overlay-title">CIRCUIT SNAKE</div>
              <div className="cs-overlay-sub">SYSTEM READY</div>
              <button
                type="button"
                className="cs-btn"
                onClick={(e) => { e.stopPropagation(); startedRef.current = true; setStarted(true); }}
              >
                INITIATE
              </button>
              <div className="cs-overlay-hint">WASD / ARROWS &middot; SPACE TO PAUSE &middot; SWIPE ON MOBILE</div>
            </div>
          )}

          {paused && started && !gameOver && (
            <div className="cs-overlay" onClick={togglePause}>
              <div className="cs-overlay-title">// PAUSED</div>
              <div className="cs-overlay-hint">PRESS SPACE OR TAP TO RESUME</div>
            </div>
          )}

          {gameOver && (
            <div className="cs-overlay">
              <div className="cs-overlay-title cs-halt">SYSTEM HALT</div>
              <div className="cs-overlay-sub">SCORE: {score}</div>
              <button type="button" className="cs-btn" onClick={reset}>
                RESTART
              </button>
              <div className="cs-overlay-hint">PRESS R OR ENTER</div>
            </div>
          )}
        </div>
      </div>

      <div className="cs-footer">
        <div>
          <span className="cs-key">W</span><span className="cs-key">A</span><span className="cs-key">S</span><span className="cs-key">D</span>
          &nbsp;/&nbsp;
          <span className="cs-key">&larr;</span><span className="cs-key">&uarr;</span><span className="cs-key">&darr;</span><span className="cs-key">&rarr;</span>
        </div>
        <div>SPD <span className="cs-hud-value">{stepsPerSecRef.current.toFixed(1)}</span></div>
      </div>
    </div>
  );
}
