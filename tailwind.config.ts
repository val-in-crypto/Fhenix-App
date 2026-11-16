import type { Config } from 'tailwindcss'
import tokens from './src/assets/tokens.json'

const c = tokens.color
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: c.bg, surface: c.surface, surface2: c.surface2, stage: c.stage,
        ink: c.ink, ink2: c.ink2, ink3: c.ink3, line: c.line, lineStrong: c.lineStrong,
        accent: c.accent, accentHover: c.accentHover, accentSoft: c.accentSoft, accentInk: c.accentInk, cyanMid: c.cyanMid,
        navy: c.navy, disabledFill: c.disabledFill, live: c.live, liveSoft: c.liveSoft, danger: c.danger, dangerSoft: c.dangerSoft,
      },
      fontFamily: {
        sans: ['"Geist Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
