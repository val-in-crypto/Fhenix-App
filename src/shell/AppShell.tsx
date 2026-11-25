import { separate } from '../ui/Sep'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import BrandLogo from '../ui/BrandLogo'
import Sidebar from './Sidebar'
import { useTheme } from '../lib/theme'
import tokens from '../assets/tokens.json'
import { useMotion } from '../lib/motion'
import { data, nav, useStore, type Route } from '../state/store'
import Button from '../ui/Button'
import ChainIcon from '../ui/ChainIcon'
import ThemeSwitch from '../ui/ThemeSwitch'
import Icon from '../ui/Icon'

const NAV: { route: Route; label: string; icon: string; badge?: string; also?: Route[] }[] = [
  { route: 'dashboard', label: 'Dashboard', icon: 'wallet', also: ['welcome'] },
  { route: 'shield', label: 'Shield', icon: 'shield', also: ['unshield'] },
  { route: 'send', label: 'Send', icon: 'send' },
  { route: 'apps', label: 'Apps', icon: 'apps-grid', badge: String(data.apps.filter(app => app.tag === 'Live').length) },
  { route: 'permits', label: 'Permits', icon: 'permit-key' },
]
const isActive = (n: (typeof NAV)[number], r: Route) => n.route === r || !!n.also?.includes(r)

function useGo() {
  const { s, act } = useStore()
  return (r: Route) => (s.connected ? nav(r) : act.startConnect(false))
}

export const Logo = (_props: { height?: number }) => <BrandLogo />

/* ---------- dropdown ---------- */
function Dropdown({ button, children, align = 'left' }: { button: (open: boolean, toggle: () => void) => ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useMotion()
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('keydown', key)
    }
  }, [open])
  return (
    <div ref={ref} className="relative">
      {button(open, () => setOpen(o => !o))}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: t(120) }}
            className={`absolute top-full z-30 mt-1 min-w-[220px] border border-line bg-surface py-1 shadow-[0_12px_32px_rgb(var(--shadow-ink)_/_.12)] ${align === 'right' ? 'right-0' : 'left-0'}`}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
const MenuItem = ({ icon, children, onClick, right }: { icon?: ReactNode; children: ReactNode; onClick: () => void; right?: ReactNode }) => (
  <button type="button" role="menuitem" onClick={onClick} className="flex h-11 w-full items-center gap-2.5 px-3 text-left text-body hover:bg-surface2">
    {icon}
    <span className="flex-1">{children}</span>
    {right}
  </button>
)

/* ---------- chips ---------- */
function NetworkItems({ close }: { close: () => void }) {
  const { s, act } = useStore()
  return (
    <>
      <div className="eyebrow px-3 pb-1 pt-2 text-ink3" >Wallet network</div>
      {data.networks.map((n, i) => (
        <MenuItem
          key={n.chainId}
          icon={<ChainIcon chainId={n.chainId} />}
          right={i === s.networkIdx ? <Icon name="check" size={16} className="text-accentInk" /> : null}
          onClick={() => {
            if (i !== s.networkIdx) act.setNetwork(i)
            close()
          }}
        >
          {n.name}
        </MenuItem>
      ))}
    </>
  )
}

export function WalletChip() {
  const { act, mobile } = useStore()
  return (
    <Dropdown
      align="right"
      button={(open, toggle) => (
        <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={toggle} className="flex h-11 items-center gap-2 border border-line bg-surface pl-2 pr-2.5 hover:border-lineStrong">
          <span className="round h-6 w-6" style={{ background: 'var(--wallet-identicon)' }} />
          <span className="mono">{data.account.short}</span>
          <Icon name="copy" size={14} className="text-ink3" />
          <Icon name="chevron-down" className="text-ink3" />
        </button>
      )}
    >
      {close => (
        <>
          <MenuItem icon={<Icon name="copy" className="text-ink2" />} onClick={() => (act.copyAddress(), close())}>
            Copy address
          </MenuItem>
          {mobile && <NetworkItems close={close} />}
          <div className="my-1 h-px bg-line" />
          <MenuItem icon={<Icon name="close" size={16} className="text-ink2" />} onClick={() => (close(), act.disconnect())}>
            Disconnect
          </MenuItem>
        </>
      )}
    </Dropdown>
  )
}

export function NetworkChip() {
  const { s } = useStore()
  const n = data.networks[s.networkIdx]
  return (
    <Dropdown
      align="right"
      button={(open, toggle) => (
        <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={toggle} className="flex h-11 items-center gap-2 border border-line bg-surface px-3 text-body font-medium hover:border-lineStrong">
          <ChainIcon chainId={n.chainId} />
          {n.name}
        </button>
      )}
    >
      {close => <NetworkItems close={close} />}
    </Dropdown>
  )
}

/** Shield\u001fUnshield\u001fSend — top-right on desktop, under the hero on mobile */
export function ActionRow({ stretch }: { stretch?: boolean }) {
  const go = useGo()
  const items: [Route, string, string][] = [
    ['shield', 'Shield', 'shield'],
    ['unshield', 'Unshield', 'unlock'],
    ['send', 'Send', 'send'],
  ]
  return (
    <div className={`flex gap-2 ${stretch ? 'w-full' : ''}`}>
      {items.map(([r, label, icon]) => (
        <Button key={r} variant="secondary" size={44} icon={icon} onClick={() => go(r)} className={stretch ? 'flex-1 !px-2 text-body' : 'min-w-[124px]'}>
          {label}
        </Button>
      ))}
    </div>
  )
}

/* ---------- desktop ---------- */
export { EXPLORER_URL, DOCS_URL } from '../config/links'
import { EXPLORER_URL, DOCS_URL } from '../config/links'

const mobileTitles: Partial<Record<Route, string>> = { shield: 'Shield', unshield: 'Shield', send: 'Send', apps: 'Apps', permits: 'Permits' }

function TopBar({ route }: { route: Route }) {
  const { s, act, mobile } = useStore()
  const connect = <Button size={44} onClick={() => act.startConnect(false)} className="!text-body">Connect</Button>
  if (mobile) return (
    <header className="z-20 flex shrink-0 items-center justify-between gap-2 px-5" style={{ height: tokens.size.topBarMobile }}>
      {mobileTitles[route] ? <h1 className="text-title font-medium">{mobileTitles[route]}</h1> : <Logo height={22} />}
      {s.connected ? <WalletChip /> : connect}
    </header>
  )
  return (
    <header className="z-20 flex h-[108px] shrink-0 items-center justify-end gap-2 px-8">
      {s.connected ? <><NetworkChip /><WalletChip /></> : connect}
    </header>
  )
}

/* ---------- mobile ---------- */
function TabBar({ route }: { route: Route }) {
  const go = useGo()
  return (
    <nav className="mobile-tabs shrink-0 border-t border-line bg-bg" style={{ minHeight: `calc(${tokens.size.tabBar}px + env(safe-area-inset-bottom))` }} aria-label="Main">
      <div className="flex px-2">
        {NAV.map(n => {
          const on = isActive(n, route)
          return (
            <button key={n.route} type="button" aria-current={on ? 'page' : undefined} onClick={() => go(n.route)} className={`relative flex flex-1 flex-col items-center gap-1 pb-1 pt-2.5 text-caption  max-[369px]:text-caption ${on ? 'font-medium text-ink' : 'font-medium text-ink3'}`}>
              {on && <motion.span layoutId="tab-ind" className="absolute top-0 h-0.5 w-5 bg-accent" />}
              <Icon name={n.icon} size={20} />
              {n.label}
            </button>
          )
        })}
      </div>
      <div className="mt-2.5 flex justify-center" aria-hidden>
        <span className="round h-[5px] w-[134px] bg-ink" />
      </div>
    </nav>
  )
}

/* ---------- page layout ---------- */
type PageProps = { children: ReactNode; bottom?: ReactNode; narrow?: boolean; card?: boolean; desktopClassName?: string }

function MobileActionBar({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const bar = ref.current
    const root = bar?.closest<HTMLElement>('#app-root')
    if (!bar || !root) return
    const update = () => root.style.setProperty('--action-bar-height', `${bar.offsetHeight}px`)
    const observer = new ResizeObserver(update)
    observer.observe(bar)
    update()
    return () => {
      observer.disconnect()
      root.style.removeProperty('--action-bar-height')
    }
  }, [])
  return <div ref={ref} className="shrink-0 px-5 pb-4 pt-3">{children}</div>
}

/** Mobile: scroll area + pinned bottom bar (CTA → 12 → helper → 16 → tabs). Desktop: content column, optional centred 536 card. */
export function Page({ children, bottom, narrow, card, desktopClassName = '' }: PageProps) {
  const { mobile } = useStore()
  const theme = useTheme()
  const go = useGo()
  if (mobile)
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="no-scrollbar min-h-0 min-w-0 w-full flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-2" data-scroll>
          {children}
        </div>
        {bottom && <MobileActionBar>{bottom}</MobileActionBar>}
      </div>
    )
  return (
    <div className={`px-8 pb-10 pt-1 ${desktopClassName}`}>
      <div className={narrow ? 'mx-auto' : 'max-w-[1184px]'} style={narrow ? { width: 536 } : undefined}>
        {card ? (
          <div className="border border-line bg-surface p-6">
            {children}
            {bottom && <div className="mt-6">{bottom}</div>}
          </div>
        ) : (
          <>
            {children}
            {bottom && <div className="mt-4">{bottom}</div>}
          </>
        )}
      </div>
    </div>
  )
}

export default function AppShell({ route, children }: { route: Route; children: ReactNode }) {
  const { mobile } = useStore()
  const theme = useTheme()
  const go = useGo()
  if (mobile)
    return (
      <div className={`mobile-shell app-wash grid h-full bg-bg ${route === 'welcome' ? 'grid-rows-[auto_minmax(0,1fr)]' : 'grid-rows-[auto_minmax(0,1fr)_auto]'}`}>
        <TopBar route={route} />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
        {route !== 'welcome' && <TabBar route={route} />}
      </div>
    )
  return (
    <div className="app-wash flex h-full bg-bg">
      <Sidebar route={route} darkMode={theme === 'dark' ? 'on' : 'off'} onNavigate={go} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar route={route} />
        <main className={`min-h-0 flex-1 ${route === 'welcome' ? 'overflow-hidden' : 'overflow-y-auto'}`} data-scroll>
          {children}
        </main>
      </div>
    </div>
  )
}
