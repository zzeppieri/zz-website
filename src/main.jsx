import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { DevModeProvider, DevModeHUD } from './lib/DevMode.jsx'
import { AchievementsProvider, AchievementsHUD, useAchievements } from './lib/Achievements.jsx'
import { AudioProvider, AudioHUD, useAudio } from './lib/Audio.jsx'
import { ModeProvider, ModeSwitcher, ModeHost, useMode } from './lib/Mode.jsx'
import TerminalAppHost from './lib/TerminalAppHost.jsx'
import ShortcutsOverlay from './lib/Shortcuts.jsx'
import ThemeSwitcher from './widgets/ThemeSwitcher.jsx'
import './index.css'

/* Tiny bridge: expose play() globally so achievement / resume-button / others
 * can opt-in to sound effects without prop-drilling the hook. */
function AudioBridge() {
  const { play } = useAudio()
  React.useEffect(() => {
    window.audioPlay = play
    return () => { if (window.audioPlay === play) delete window.audioPlay }
  }, [play])
  return null
}

/* Bridge: translate cross-component achievement events into unlock() calls.
 * Each external event ID → an achievement catalog ID. */
function AchievementsBridge() {
  const { unlock } = useAchievements()
  React.useEffect(() => {
    const map = [
      ['achievement:konami',             'konami'],
      ['achievement:lean-lego-win',      'kaizen_master'],
      ['achievement:dev-mode-unlocked',  'dev_mode'],
      ['achievement:card-flipped',       'card_flipped'],
      ['achievement:printer-completed',  'printer_complete'],
      ['achievement:snake-played',       'snake_played'],
      ['achievement:snake-score-100',    'snake_score_100'],
    ]
    const handlers = map.map(([evt, id]) => {
      const h = () => unlock(id)
      window.addEventListener(evt, h)
      return [evt, h]
    })
    return () => { handlers.forEach(([evt, h]) => window.removeEventListener(evt, h)) }
  }, [unlock])
  return null
}

/* Error boundary for the alt-mode dispatcher — if a lazy-loaded mode
 * fails (chunk error, missing file, etc.), drop back to 'default'
 * instead of leaving the user with a stuck CRT loader. */
class ModeErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidUpdate(_, prev) {
    if (prev.modeKey !== this.props.modeKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }
  componentDidCatch(err) {
    // eslint-disable-next-line no-console
    console.error('[ModeHost] alt-mode failed to load:', err)
    try { this.props.onError && this.props.onError() } catch (e) { /* noop */ }
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

/* Wraps the ModeHost so a failure resets the mode to 'default'. */
function SafeModeHost() {
  const { mode, setMode } = useMode()
  return (
    <ModeErrorBoundary modeKey={mode} onError={() => setMode('default')}>
      <ModeHost />
    </ModeErrorBoundary>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ModeProvider>
      <AudioProvider>
        <AchievementsProvider>
          <DevModeProvider>
            <App />
            <AudioBridge />
            <AchievementsBridge />
            <DevModeHUD />
            <AchievementsHUD />
            <AudioHUD />
            <ThemeSwitcher />
            <ModeSwitcher />
            <SafeModeHost />
            <TerminalAppHost />
            <ShortcutsOverlay />
          </DevModeProvider>
        </AchievementsProvider>
      </AudioProvider>
    </ModeProvider>
  </React.StrictMode>
)
