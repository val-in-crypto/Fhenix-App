import { setTheme, useTheme } from '../lib/theme'
import Icon from './Icon'

export default function ThemeSwitch({ compact = false }: { compact?: boolean }) {
  const dark = useTheme() === 'dark'
  return (
    <button type="button" role="switch" aria-checked={dark} onClick={() => setTheme(dark ? 'light' : 'dark')} className={`flex w-full shrink-0 items-center gap-3 pl-[15px] pr-3 text-left text-body text-ink2 hover:bg-surface ${compact ? 'h-9' : 'min-h-11'}`}>
      <Icon name="moon" size={18} />
      <span className="flex-1">Dark mode</span>
      <span aria-hidden className={`flex h-[18px] w-[30px] items-center p-0.5 ${dark ? 'bg-accent' : 'bg-line'}`}>
        <span className="size-3.5 bg-surface" style={{ transform: `translateX(${dark ? 12 : 0}px)`, transition: 'transform 120ms ease' }} />
      </span>
    </button>
  )
}
