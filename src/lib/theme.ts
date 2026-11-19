import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'
const key = 'fhenix.theme'
const system = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()
const read = (): Theme => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'

const preference = (): Theme | undefined => {
  try {
    const saved = localStorage.getItem(key)
    if (saved === 'dark' || saved === 'light') return saved
  } catch { /* private browsing */ }
  return undefined
}
let explicit = preference()

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()
  listeners.forEach(listener => listener())
}

export function setTheme(theme: Theme) {
  explicit = theme
  try { localStorage.setItem(key, theme) } catch { /* keep the choice for this page */ }
  apply(theme)
}

export function clearTheme() {
  explicit = undefined
  try { localStorage.removeItem(key) } catch { /* keep following the system */ }
  apply(system.matches ? 'dark' : 'light')
}

system.addEventListener('change', () => {
  if (!explicit) apply(system.matches ? 'dark' : 'light')
})
window.addEventListener('storage', event => {
  if (event.key !== key && event.key !== null) return
  explicit = preference()
  apply(explicit ?? (system.matches ? 'dark' : 'light'))
})

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const useTheme = () => useSyncExternalStore(subscribe, read)
