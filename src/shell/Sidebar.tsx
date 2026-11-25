import { data, useStore, type Route } from '../state/store'
import { DOCS_URL, EXPLORER_URL } from '../config/links'
import BrandLogo from '../ui/BrandLogo'
import Icon from '../ui/Icon'
import ThemeSwitch from '../ui/ThemeSwitch'

export default function Sidebar({ route, darkMode, onNavigate }: { route: Route; darkMode: 'off' | 'on'; onNavigate: (route: Route) => void }) {
  const { s } = useStore()
  const item = (label: string, target: Route, icon: string, badge?: string) => {
    const active = route === target || target === 'shield' && route === 'unshield'
    return <button type="button" onClick={() => onNavigate(target)} aria-current={active ? 'page' : undefined} className={`r5-nav ${active ? 'bg-surface text-ink' : 'text-ink2 hover:bg-surface/60'}`}>
      <span aria-hidden className={`h-[18px] w-[3px] shrink-0 ${active ? 'bg-accent' : ''}`} /><Icon name={icon} size={20} /><span className="flex-1">{label}</span>{badge && <span className="bg-surface2 px-2.5 py-1.5 text-ink3">{badge}</span>}
    </button>
  }
  const soon = (label: string, icon: string) => <button type="button" disabled title="Coming soon" className="r5-nav text-ink2"><span className="h-[18px] w-[3px] shrink-0" /><Icon name={icon} size={20} /><span className="flex-1">{label}</span><span className="bg-surface2 px-2.5 py-1.5 text-ink3">Soon</span></button>
  const link = (label: string, href: string, icon: string, compact = false) => <a href={href} target="_blank" rel="noopener noreferrer" className={`flex shrink-0 items-center gap-3 pl-[15px] pr-3 text-body text-ink2 hover:bg-surface/60 ${compact ? 'h-9' : 'h-10'}`}><Icon name={icon} size={18} /><span className="flex-1">{label}</span><Icon name="arrow-up-right" size={15} /></a>
  const divider = <div aria-hidden className="py-3"><div className="h-px bg-line" /></div>
  return <aside data-dark-mode={darkMode} className="r5-sidebar no-scrollbar relative flex h-full w-64 shrink-0 flex-col gap-1 overflow-y-auto px-4 pb-5 pt-6">
    <button type="button" onClick={() => onNavigate('dashboard')} aria-label="Fhenix home" className="mb-[22px] shrink-0 self-start pl-3"><BrandLogo /></button>
    <nav aria-label="Main" className="flex flex-col gap-1">
      {item('Dashboard', 'dashboard', 'wallet')}{item('Shield', 'shield', 'shield')}{item('Send', 'send', 'send')}{soon('Trading', 'trading-candles')}
      {divider}<span className="text-caption text-ink3">Ecosystem</span>
      {item('Apps', 'apps', 'apps-grid', String(data.apps.length))}{soon('TGE', 'tge')}{link('Fhenix Explorer', EXPLORER_URL, 'explorer')}
    </nav>
    <div className="min-h-6 flex-1" />
    {s.connected && <div className="flex h-[108px] shrink-0 flex-col gap-2.5 border border-line bg-surface p-[14px]">
      <div className="flex items-center justify-between"><span className="text-caption text-ink2">CoFHE network</span><span className="flex items-center gap-1.5 bg-liveSoft px-2.5 py-1.5 text-caption text-live"><span className="round size-1.5 bg-live" />Live</span></div>
      <p className="text-body text-ink3">Coprocessor online. State stays confidential on-chain.</p>
    </div>}
    {divider}{link('Docs', DOCS_URL, 'book', true)}<ThemeSwitch compact />
  </aside>
}
