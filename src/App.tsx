import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useSettingsStore } from './store'
import { applyTheme } from './themes'
import HomeScreen from './screens/HomeScreen'
import GameScreen from './screens/GameScreen'
import SettingsScreen from './screens/SettingsScreen'

export default function App() {
  const { settings } = useSettingsStore()

  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
    </BrowserRouter>
  )
}
