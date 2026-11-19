import { setTheme, useTheme } from '../lib/theme'
import Icon from './Icon'

export default function ThemeSwitch() {
  const dark = useTheme() === 'dark'
  return (
    <button type="button" role="switch" aria-checked={dark} onClick={() => setTheme(dark ? 'light' : 'dark')} className="flex min-h-11 w-full items-center gap-3 px-4 text-left text-[14px] text-ink2 hover:bg-surface">
      <Icon name="moon" size={18} />
      <span className="flex-1">Dark mode</span>
      <span aria-hidden className={`flex h-5 w-8 items-center p-0.5 ${dark ? 'justify-end bg-accent' : 'bg-line'}`}>
        <span className={`round size-4 ${dark ? 'bg-onAccent' : 'bg-surface'}`} />
      </span>
    </button>
  )
}
