import type { ThemeId } from './types'

export interface Theme {
  id: ThemeId
  name: string
  emoji: string
  from: string
  to: string
  primary: string
}

export const THEMES: Theme[] = [
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', from: '#6c5ce7', to: '#fd79a8', primary: '#6c5ce7' },
  { id: 'ocean',   name: 'Ocean',   emoji: '🌊', from: '#0984e3', to: '#74b9ff', primary: '#0984e3' },
  { id: 'forest',  name: 'Forest',  emoji: '🌲', from: '#00b894', to: '#55efc4', primary: '#00b894' },
  { id: 'sunset',  name: 'Sunset',  emoji: '🌅', from: '#e17055', to: '#fdcb6e', primary: '#e17055' },
  { id: 'space',   name: 'Space',   emoji: '🚀', from: '#2d3436', to: '#6c5ce7', primary: '#6c5ce7' },
  { id: 'candy',   name: 'Candy',   emoji: '🍬', from: '#fd79a8', to: '#a29bfe', primary: '#fd79a8' },
]

export function applyTheme(themeId: ThemeId) {
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0]
  const root = document.documentElement
  root.style.setProperty('--theme-from', theme.from)
  root.style.setProperty('--theme-to', theme.to)
  root.style.setProperty('--theme-primary', theme.primary)
}
