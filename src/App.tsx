import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useSettingsStore } from './store'
import { applyTheme } from './themes'
import HomeScreen from './screens/HomeScreen'
import GameScreen from './screens/GameScreen'
import SettingsScreen from './screens/SettingsScreen'
import SplashScreen from './components/SplashScreen'

export default function App() {
  const { settings } = useSettingsStore()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme])

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/game" element={<GameScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}
