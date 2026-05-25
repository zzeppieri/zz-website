import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { DevModeProvider, DevModeHUD } from './lib/DevMode.jsx'
import { AchievementsProvider, AchievementsHUD, useAchievements } from './lib/Achievements.jsx'
import { AudioProvider, AudioHUD, useAudio } from './lib/Audio.jsx'
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
      ['achievement:konami',            'konami'],
      ['achievement:lean-lego-win',     'kaizen_master'],   // 5S puzzle = kaizen master
      ['achievement:resume-downloaded', 'card_flipped'],    // proxy until a real id added
      ['achievement:dev-mode-unlocked', 'dev_mode'],
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
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
        </DevModeProvider>
      </AchievementsProvider>
    </AudioProvider>
  </React.StrictMode>
)
