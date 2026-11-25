import { separate } from '../ui/Sep'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import BrandLogo from '../ui/BrandLogo'
import Sidebar from './Sidebar'
import { useTheme } from '../lib/theme'
import VerticalSeparator from '../ui/VerticalSeparator'
import Sheet, { SheetClose } from '../ui/Sheet'
import tokens from '../assets/tokens.json'
import { useMotion } from '../lib/motion'
import { data, nav, useStore, type Route } from '../state/store'
import Button from '../ui/Button'
import ChainIcon from '../ui/ChainIcon'
import ThemeSwitch from '../ui/ThemeSwitch'
import Icon from '../ui/Icon'

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
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector<HTMLButtonElement>('[aria-haspopup]')?.focus() }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
      const rows = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [])
      if (!rows.length) return
      e.preventDefault()
      const index = rows.indexOf(document.activeElement as HTMLElement)
      rows[e.key === 'Home' ? 0 : e.key === 'End' ? rows.length - 1 : (index + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length]?.focus()
    }
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
  const { s, act, mobile } = useStore()
  const [walletOpen, setWalletOpen] = useState(false)
  const network = data.networks[s.networkIdx]
  const contents = (close: () => void) => <>
    <MenuItem icon={<Icon name="copy" size={16} />} onClick={() => { act.copyAddress(); close() }}><span className="mono">{s.address.slice(0, 6)}…{s.address.slice(-4)}</span></MenuItem>
    <div className="my-1 h-px bg-line" /><NetworkItems close={close} />
    <div className="my-1 h-px bg-line" />
    <div className="flex items-center justify-between px-3 py-2 text-body"><span>Permit</span><span className={s.permit === 'active' ? 'text-live' : s.permit === 'expired' ? 'text-warn' : 'text-ink3'}>{s.permit === 'active' ? `Active | ${Math.max(0, s.permitDays - 1)} days` : s.permit === 'expired' ? 'Expired' : 'None'}</span></div>
    <MenuItem onClick={() => { close(); nav('permits') }}>Manage permits</MenuItem>
    {s.permit !== 'active' && <MenuItem onClick={() => { close(); act.renew() }}>{s.permit === 'expired' ? 'Renew' : '+ Create permit'}</MenuItem>}
    <div className="my-1 h-px bg-line" />
    <MenuItem icon={<Icon name="close" size={16} />} onClick={() => { close(); act.disconnect() }}>Disconnect</MenuItem>
  </>
  if (mobile) return <>
    <div className="flex h-11 w-48 shrink-0 items-center gap-2 border border-line bg-surface pl-1.5 pr-3" role="group" aria-label="Wallet">
      <ChainIcon chainId={network.chainId} size={20} /><VerticalSeparator />
      <button type="button" aria-label="Copy wallet address" onClick={act.copyAddress} className="flex h-full min-w-0 flex-1 items-center gap-1.5"><span className="mono whitespace-nowrap">{data.account.short}</span><Icon name="copy" size={16} /></button>
      <VerticalSeparator /><button type="button" aria-label="Open wallet" aria-haspopup="dialog" aria-expanded={walletOpen} onClick={() => setWalletOpen(true)} className="flex h-full shrink-0 items-center"><Icon name="chevron-down" size={16} /></button>
    </div>
    <Sheet open={walletOpen} onClose={() => setWalletOpen(false)} label="Wallet"><div className="flex items-center justify-between"><h2 className="text-title">Wallet</h2><SheetClose onClick={() => setWalletOpen(false)} /></div><div role="menu" aria-label="Wallet options">{contents(() => setWalletOpen(false))}</div></Sheet>
  </>
  return <Dropdown align="right" button={(open, toggle) => <button type="button" aria-label="Open wallet" aria-haspopup="menu" aria-expanded={open} onClick={toggle} className="flex h-11 items-center gap-2 border border-line bg-surface pl-[7px] pr-3"><ChainIcon chainId={network.chainId} size={20} /><VerticalSeparator /><span className="mono">{data.account.short}</span><Icon name="chevron-down" size={16} /></button>}>{contents}</Dropdown>
}

export function NetworkChip() {
  const { s, mobile } = useStore()
  const n = data.networks[s.networkIdx]
  return (
    <Dropdown
      align="right"
      button={(open, toggle) => (
        <button type="button" aria-label={`Network: ${n.name}`} aria-haspopup="menu" aria-expanded={open} onClick={toggle} className={`flex h-11 items-center gap-2 border border-line bg-surface text-body hover:border-lineStrong ${mobile ? 'w-11 justify-center' : 'px-3'}`}>
          <ChainIcon chainId={n.chainId} />
          {!mobile && n.name}
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
      {mobileTitles[route] ? <h1 className="text-title font-medium">{mobileTitles[route]}</h1> : <span className="max-[389px]:w-28 max-[389px]:[&_.r5-brand]:origin-left max-[389px]:[&_.r5-brand]:scale-[.86]"><Logo height={22} /></span>}
      {s.connected ? <WalletChip /> : connect}
    </header>
  )
  return (
    <header className="z-20 flex h-[116px] shrink-0 items-start justify-end gap-2 pb-6 pl-8 pr-10 pt-8">
      {s.connected ? <WalletChip /> : connect}
    </header>
  )
}

/* ---------- mobile ---------- */
function TabBar({ route }: { route: Route }) {
  const go = useGo()
  const theme = useTheme()
  const [menu,setMenu] = useState(false)
  const { t } = useMotion()
  const panel = useRef<HTMLDivElement>(null)
  useEffect(()=>{
    if(!menu)return
    const prev=document.activeElement as HTMLElement
    panel.current?.querySelector<HTMLElement>('button')?.focus()
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape')setMenu(false)
      if(e.key!=='Tab')return
      const items=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')??[])
      const current=items.indexOf(document.activeElement as HTMLElement)
      if(current<0||!e.shiftKey&&current===items.length-1||e.shiftKey&&current===0){e.preventDefault();items[e.shiftKey?items.length-1:0]?.focus()}
    }
    document.addEventListener('keydown',key,true)
    return()=>{document.removeEventListener('keydown',key,true);prev?.focus()}
  },[menu])
  const tabs=[{label:'Menu',icon:'menu',route:null},{label:'Dashboard',icon:'wallet',route:'dashboard'},{label:'Shield',icon:'shield',route:'shield'},{label:'Send',icon:'send',route:'send'},{label:'Trade',icon:'trading-candles',route:null}] as const
  return <>
    <nav className="mobile-tabs shrink-0 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)]" aria-label="Main tabs">
      <div className="flex px-2">{tabs.map(tab=>{const active=tab.label==='Menu'?menu||['apps','permits'].includes(route):tab.route===route||tab.route==='shield'&&route==='unshield';return <button key={tab.label} type="button" aria-current={active?'page':undefined} aria-label={tab.label==='Trade'?'Trade coming soon':tab.label} disabled={tab.label==='Trade'} onClick={()=>tab.label==='Menu'?setMenu(true):tab.route&&go(tab.route)} className={`relative flex min-h-16 flex-1 flex-col items-center gap-1 pb-2 pt-3 text-caption ${active?'text-ink':'text-ink3'}`}>
        {active&&<span className="absolute top-0 h-0.5 w-5 bg-accent"/>}{tab.label==='Menu'?<span aria-hidden className="flex size-5 flex-col justify-center gap-1"><span className="h-px w-4 bg-current"/><span className="h-px w-4 bg-current"/><span className="h-px w-4 bg-current"/></span>:<Icon name={tab.icon} size={20}/>}{tab.label}
      </button>})}</div>
    </nav>
    <AnimatePresence>{menu&&<div className="absolute inset-0 z-40"><motion.div className="absolute inset-0" style={{background:'var(--scrim)'}} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setMenu(false)}/><motion.div ref={panel} role="dialog" aria-modal="true" aria-label="Menu" className="absolute inset-y-0 left-0 bg-bg" initial={{x:'-100%'}} animate={{x:0}} exit={{x:'-100%'}} transition={{duration:t(200)}}><Sidebar route={route} darkMode={theme==='dark'?'on':'off'} onNavigate={target=>{setMenu(false);go(target)}}/></motion.div></div>}</AnimatePresence>
  </>
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
        <div className="no-scrollbar min-h-0 min-w-0 w-full flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-4" data-scroll>
          {children}
        </div>
        {bottom && <MobileActionBar>{bottom}</MobileActionBar>}
      </div>
    )
  return (
    <div className={`pl-8 pr-10 pb-10 pt-0 ${desktopClassName}`}>
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
