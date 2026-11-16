import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import logoRaw from '../assets/logo-fhenix-app.svg?raw'
import tokens from '../assets/tokens.json'
import { useMotion } from '../lib/motion'
import { data, nav, useStore, type Route } from '../state/store'
import Button from '../ui/Button'
import Chip from '../ui/Chip'
import Icon from '../ui/Icon'

const NAV: { route: Route; label: string; icon: string; badge?: string; also?: Route[] }[] = [
  { route: 'dashboard', label: 'Dashboard', icon: 'wallet', also: ['welcome'] },
  { route: 'shield', label: 'Shield', icon: 'shield', also: ['unshield', 'success'] },
  { route: 'send', label: 'Send', icon: 'send' },
  { route: 'apps', label: 'Apps', icon: 'apps-grid', badge: String(data.apps.length) },
  { route: 'permits', label: 'Permits', icon: 'permit-key' },
]
const isActive = (n: (typeof NAV)[number], r: Route) => n.route === r || !!n.also?.includes(r)

function useGo() {
  const { s, act } = useStore()
  return (r: Route) => (s.connected ? nav(r) : act.startConnect(false))
}

export const Logo = ({ height = 25 }: { height?: number }) => (
  <span aria-label="Fhenix App" role="img" className="inline-flex [&>svg]:h-full [&>svg]:w-auto" style={{ height }} dangerouslySetInnerHTML={{ __html: logoRaw }} />
)

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
            className={`absolute top-full z-30 mt-1 min-w-[220px] border border-line bg-white py-1 shadow-[0_12px_32px_rgba(0,22,35,.12)] ${align === 'right' ? 'right-0' : 'left-0'}`}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
const MenuItem = ({ icon, children, onClick, right }: { icon?: ReactNode; children: ReactNode; onClick: () => void; right?: ReactNode }) => (
  <button type="button" role="menuitem" onClick={onClick} className="flex h-11 w-full items-center gap-2.5 px-3 text-left text-[14px] hover:bg-surface2">
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
      <div className="eyebrow px-3 pb-1 pt-2 text-ink3" style={{ fontSize: 11 }}>Wallet network</div>
      {data.networks.map((n, i) => (
        <MenuItem
          key={n.chainId}
          icon={<span className="round h-2 w-2" style={{ background: n.dot }} />}
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
      align={mobile ? 'right' : 'left'}
      button={(open, toggle) => (
        <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={toggle} className="flex h-11 items-center gap-2 border border-line bg-white pl-2 pr-2.5 hover:border-lineStrong">
          <span className="round h-6 w-6" style={{ background: 'conic-gradient(from 210deg, #001623, #007A7E, #0AD9DC, #001623)' }} />
          <span className="mono text-[12px] font-medium">{data.account.short}</span>
          {mobile && <Icon name="copy" size={14} className="text-ink3" />}
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
      button={(open, toggle) => (
        <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={toggle} className="flex h-11 items-center gap-2 border border-line bg-white px-3 text-[13px] font-medium hover:border-lineStrong">
          <span key={n.chainId} className="round dot-pulse h-2 w-2" style={{ background: n.dot }} />
          {n.name}
        </button>
      )}
    >
      {close => <NetworkItems close={close} />}
    </Dropdown>
  )
}

/** Shield · Unshield · Send — top-right on desktop, under the hero on mobile */
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
        <Button key={r} variant="secondary" size={44} icon={icon} onClick={() => go(r)} className={stretch ? 'flex-1 !px-2 text-[14px]' : 'min-w-[124px]'}>
          {label}
        </Button>
      ))}
    </div>
  )
}

/* ---------- desktop ---------- */
function Sidebar({ route }: { route: Route }) {
  const go = useGo()
  return (
    <aside className="flex h-full shrink-0 flex-col px-4 pb-14 pt-7" style={{ width: tokens.size.sidebar }}>
      <button type="button" className="self-start px-2" onClick={() => go('dashboard')} aria-label="Fhenix App home">
        <Logo />
      </button>
      <div className="eyebrow mt-6 px-2 text-ink3" style={{ fontSize: 11 }}>Menu</div>
      <nav className="mt-2 flex flex-col gap-1" aria-label="Main">
        {NAV.map(n => {
          const on = isActive(n, route) && route !== 'welcome'
          return (
            <button key={n.route} type="button" aria-current={on ? 'page' : undefined} onClick={() => go(n.route)} className={`relative flex h-10 items-center gap-3 px-4 text-left text-[14px] ${on ? 'bg-white font-medium text-ink' : 'text-ink2 hover:bg-white/60'}`}>
              {on && <motion.span layoutId="nav-bar" className="absolute bottom-0 left-0 top-0 w-[3px] bg-accent" />}
              <Icon name={n.icon} size={20} />
              <span className="flex-1">{n.label}</span>
              {n.badge && <span className="mono bg-surface2 px-2 py-0.5 text-[11px] text-ink2">{n.badge}</span>}
            </button>
          )
        })}
        <button type="button" disabled aria-disabled className="flex h-10 items-center gap-3 px-4 text-left text-[14px] text-ink3">
          <Icon name="trading-candles" size={20} />
          <span className="flex-1">Trading</span>
          <span className="mono bg-surface2 px-2 py-0.5 text-[11px]">Soon</span>
        </button>
      </nav>
      <div className="mt-auto">
        <div className="border border-line bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-ink2" style={{ fontSize: 11 }}>CoFHE network</span>
            <Chip tone="live" dot className="!px-2 !py-1 !text-[11px]">LIVE</Chip>
          </div>
          <p className="mt-2 text-[12px] leading-4 text-ink3">Coprocessor online. State stays encrypted on-chain.</p>
        </div>
        <a href="#" onClick={e => e.preventDefault()} className="mt-2 flex h-10 items-center gap-3 px-4 text-[14px] text-ink2 hover:bg-white/60">
          <Icon name="book" size={20} />
          <span className="flex-1">Docs</span>
          <Icon name="arrow-up-right" />
        </a>
        <div className="flex h-10 items-center gap-3 px-4 text-[14px] text-ink2">
          <Icon name="moon" size={20} />
          <span className="flex-1">Dark mode</span>
          <span role="img" aria-label="Dark mode off (not available in the prototype)" className="flex h-3.5 w-7 items-center bg-line p-0.5">
            <span className="h-2.5 w-2.5 bg-white" />
          </span>
        </div>
      </div>
    </aside>
  )
}

function TopBar({ route }: { route: Route }) {
  const { s, act, mobile } = useStore()
  if (mobile)
    return (
      <header className="flex shrink-0 items-center justify-between px-5" style={{ height: tokens.size.topBarMobile }}>
        <Logo height={22} />
        {s.connected ? (
          <WalletChip />
        ) : (
          <Button size={44} onClick={() => act.startConnect(false)} className="!text-[15px]">
            Connect
          </Button>
        )}
      </header>
    )
  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between gap-4 px-8">
      {s.connected ? (
        <div className="flex items-center gap-2">
          <WalletChip />
          <NetworkChip />
        </div>
      ) : (
        <span />
      )}
      {!s.connected ? (
        <Button size={44} icon="wallet" onClick={() => act.startConnect(false)}>
          Connect
        </Button>
      ) : route === 'dashboard' ? (
        <ActionRow />
      ) : null}
    </header>
  )
}

/* ---------- mobile ---------- */
function StatusBar() {
  return (
    <div className="flex shrink-0 items-end justify-between px-7 pb-2.5 text-[15px] font-semibold" style={{ height: tokens.size.statusBar }} aria-hidden>
      <span>9:41</span>
      <span className="flex items-center gap-1.5 pb-1">
        <span className="flex items-end gap-[2px]">
          {[4, 6, 8, 10].map(h => (
            <span key={h} className="w-[3px] bg-ink" style={{ height: h }} />
          ))}
        </span>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <path d="M1 4.2C4.6 0.9 10.4 0.9 14 4.2M3.3 6.6C5.7 4.5 9.3 4.5 11.7 6.6M5.7 9C6.8 8.1 8.2 8.1 9.3 9" stroke="#001623" strokeWidth="1.6" />
        </svg>
        <span className="flex h-[11px] w-[22px] items-center border border-ink p-[1.5px]">
          <span className="h-full w-full bg-ink" />
        </span>
      </span>
    </div>
  )
}

function TabBar({ route }: { route: Route }) {
  const go = useGo()
  return (
    <nav className="shrink-0 border-t border-line bg-bg" style={{ height: tokens.size.tabBar }} aria-label="Main">
      <div className="flex px-2">
        {NAV.map(n => {
          const on = isActive(n, route)
          return (
            <button key={n.route} type="button" aria-current={on ? 'page' : undefined} onClick={() => go(n.route)} className={`relative flex flex-1 flex-col items-center gap-1 pb-1 pt-2.5 text-[12px] leading-4 ${on ? 'font-semibold text-ink' : 'font-medium text-ink3'}`}>
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
type PageProps = { children: ReactNode; bottom?: ReactNode; narrow?: boolean; card?: boolean }
/** Mobile: scroll area + pinned bottom bar (CTA → 12 → helper → 16 → tabs). Desktop: content column, optional centred 536 card. */
export function Page({ children, bottom, narrow, card }: PageProps) {
  const { mobile } = useStore()
  if (mobile)
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-2" data-scroll>
          {children}
        </div>
        {bottom && <div className="shrink-0 px-5 pb-4 pt-3">{bottom}</div>}
      </div>
    )
  return (
    <div className="px-8 pb-10 pt-1">
      <div className={narrow ? 'mx-auto' : 'max-w-[1184px]'} style={narrow ? { width: 536 } : undefined}>
        {card ? (
          <div className="border border-line bg-white p-6">
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
  if (mobile)
    return (
      <div className="flex h-full flex-col bg-bg">
        <StatusBar />
        <TopBar route={route} />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <TabBar route={route} />
      </div>
    )
  return (
    <div className="flex h-full bg-bg">
      <Sidebar route={route} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar route={route} />
        <main className={`min-h-0 flex-1 ${route === 'welcome' ? 'overflow-hidden' : 'overflow-y-auto'}`} data-scroll>
          {children}
        </main>
      </div>
    </div>
  )
}
