import type { CSSProperties } from 'react'

const files = import.meta.glob('../assets/icons/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const tint = (svg: string) => svg.replace(/(stroke|fill)="#[0-9A-Fa-f]{3,8}"/g, '$1="currentColor"')
const icons: Record<string, string> = {}
for (const [path, raw] of Object.entries(files)) icons[path.split('/').pop()!.replace('.svg', '')] = tint(raw)

// Small state glyphs that are not in the Figma export (same 20px / 1.46 line style).
const line = (d: string, vb = 20) =>
  `<svg width="${vb}" height="${vb}" viewBox="0 0 ${vb} ${vb}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${d}" stroke="currentColor" stroke-width="1.46" stroke-linecap="square" stroke-linejoin="miter"/></svg>`
Object.assign(icons, {
  check: line('M4.5 10.5L8.5 14.5L15.5 6'),
  close: line('M5 5L15 15M15 5L5 15'),
  unlock: line('M4.5 9.5H15.5V17H4.5V9.5ZM7 9.5V6.5C7 4.8 8.3 3.5 10 3.5C11.3 3.5 12.4 4.3 12.8 5.4'),
  'eye-off': line('M2 10C4 6.3 6.8 4.6 10 4.6C13.2 4.6 16 6.3 18 10C16 13.7 13.2 15.4 10 15.4C6.8 15.4 4 13.7 2 10ZM3.5 16.5L16.5 3.5'),
  clock: line('M10 17.5C14.1 17.5 17.5 14.1 17.5 10C17.5 5.9 14.1 2.5 10 2.5C5.9 2.5 2.5 5.9 2.5 10C2.5 14.1 5.9 17.5 10 17.5ZM10 5.8V10L12.8 11.6'),
  alert: line('M10 3L18 16.5H2L10 3ZM10 8.5V12M10 14.2V14.3'),
  minus: line('M5 10H15'),
  spinner: line('M10 2.5A7.5 7.5 0 1 1 2.5 10'),
})

export type IconName = string

export default function Icon({ name, size, className = '', style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  const svg = icons[name]
  if (!svg) return null
  const h = size ?? Number(/height="(\d+)"/.exec(svg)?.[1] ?? 20)
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center [&>svg]:h-full [&>svg]:w-auto ${name === 'spinner' ? 'spin' : ''} ${className}`}
      style={{ height: h, ...style }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
