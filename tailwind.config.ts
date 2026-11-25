import type { Config } from 'tailwindcss'
const token = (name: string) => ({ opacityValue }: { opacityValue?: string }) =>
  opacityValue === undefined ? `var(${name})` : `color-mix(in srgb, var(${name}) calc(${opacityValue} * 100%), transparent)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: Object.fromEntries(['value', 'title', 'heading', 'label', 'body', 'caption', 'mono'].map(name => [name, [`var(--text-${name})`, { lineHeight: `var(--line-${name})`, letterSpacing: `var(--tracking-${name})`, fontWeight: ['value', 'title', 'heading', 'label'].includes(name) ? '500' : '400', ...(name === 'mono' ? { fontFamily: 'var(--font-mono)' } : {}) }]])),
      colors: {
        bg: token('--color-bg'),
        surface: token('--color-surface'),
        surface2: token('--color-surface-2'),
        stage: token('--color-stage'),
        ink: token('--color-ink'),
        ink2: token('--color-ink-2'),
        ink3: token('--color-ink-3'),
        line: token('--color-line'),
        lineStrong: token('--color-line-strong'),
        accent: token('--color-accent'),
        onAccent: token('--color-on-accent'),
        accentHover: token('--button-primary-hover'),
        accentSoft: token('--color-accent-soft'),
        accentInk: token('--color-accent-ink'),
        cyanMid: token('--color-cyan-mid'),
        navy: token('--color-navy'),
        onNavy: token('--color-on-navy'),
        disabledFill: token('--button-disabled-fill'),
        disabledInk: token('--button-disabled-ink'),
        live: token('--color-live'),
        liveSoft: token('--color-live-soft'),
        danger: token('--color-danger'),
        dangerSoft: token('--color-danger-soft'),
        warn: token('--color-warn'),
      },
      fontFamily: {
        sans: ['"Geist Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
