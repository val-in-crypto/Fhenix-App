import { useSyncExternalStore } from 'react'
import tokens from '../assets/tokens.json'

export const M = tokens.motion
export const easeInOut = [0.45, 0, 0.55, 1] as const
export const easeOut = [0.16, 1, 0.3, 1] as const

type Settings = { speed: number; reduce: boolean }
let settings: Settings = { speed: 1, reduce: false }
const subs = new Set<() => void>()
const sys = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null
sys?.addEventListener?.('change', () => {
  settings = { ...settings }
  subs.forEach(f => f())
})

export function setMotion(p: Partial<Settings>) {
  settings = { ...settings, ...p }
  subs.forEach(f => f())
}
export const getMotion = () => ({ speed: settings.speed, reduced: settings.reduce || !!sys?.matches })
/** scale a timeout (ms) by demo speed */
export const scaled = (ms: number) => ms / settings.speed

const subscribe = (f: () => void) => {
  subs.add(f)
  return () => {
    subs.delete(f)
  }
}

/** useReducedMotion wrapper + speed multiplier. t(ms) → seconds for Framer Motion. */
export function useMotion() {
  const s = useSyncExternalStore(subscribe, () => settings)
  const reduced = s.reduce || !!sys?.matches
  return { reduced, speed: s.speed, t: (ms: number) => (reduced ? 0 : ms / 1000 / s.speed) }
}
