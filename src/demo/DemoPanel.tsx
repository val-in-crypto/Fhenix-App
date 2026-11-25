import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import tokens from '../assets/tokens.json'
import { useMotion } from '../lib/motion'
import { data, fullBalances, useStore, zeroBalances, type Activity, type Permit, type Route, type State } from '../state/store'
import Icon from '../ui/Icon'

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-body text-ink2">{label}</span>
    {children}
  </div>
)
function Seg<T extends string | number>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="flex bg-surface2 p-0.5" role="group" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={String(v)} type="button" aria-pressed={v === value} onClick={() => onChange(v)} className={`px-2.5 py-1.5 text-caption font-medium  ${v === value ? 'bg-navy text-onNavy' : 'text-ink2 hover:text-ink'}`}>
          {l}
        </button>
      ))}
    </div>
  )
}
const Check = ({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <label className={`flex h-8 cursor-pointer items-center justify-between gap-3 text-body text-ink2 ${disabled ? 'opacity-50' : ''}`}>
    {label}
    <input type="checkbox" className="h-4 w-4 accent-accentInk" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
  </label>
)

const DEMO_KEY = 'fhx-demo'
const readVisible = () => {
  try {
    if (new URLSearchParams(location.search).get('demo') === '1') {
      localStorage.setItem(DEMO_KEY, '1')
      return true
    }
    return localStorage.getItem(DEMO_KEY) === '1'
  } catch {
    return false
  }
}

/** Presenter controls. Hidden by default: ?demo=1 or key D shows the "Demo" button, D again hides it (remembered). */
export default function DemoPanel() {
  const { s, act, mobile } = useStore()
  const { t } = useMotion()
  const [visible, setVisible] = useState(readVisible)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test(el.tagName)) return
      if (e.key !== 'd' && e.key !== 'D') return
      setOpen(false)
      setVisible(v => {
        try {
          localStorage.setItem(DEMO_KEY, v ? '0' : '1')
        } catch {
          /* ignore */
        }
        return !v
      })
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [])
  if (!visible) return null

  const bal = (dPub: number, dPriv: number) => {
    const b = fullBalances()
    b.USDC = { pub: b.USDC.pub + dPub, priv: b.USDC.priv + dPriv }
    return b
  }
  const pendingRow: Activity = { id: 'jump-u', kind: 'unshield', label: 'Unshield fUSDC → USDC', amount: '+500.00 USDC', when: 'Just now — decrypting', status: 'pending' }
  const unsh = (step: number, claimed = false): Partial<State> => ({
    unshieldStep: step,
    pendingUnshield: { id: 'jump-u', amount: 500 },
    balances: bal(claimed ? 500 : 0, -500),
    activity: [claimed ? { ...pendingRow, kind: 'unshield-claim', status: 'confirmed', when: 'Today — claimed' } : { ...pendingRow, when: step === 3 ? 'Just now — ready to claim' : pendingRow.when }, ...(data.activity as Activity[])],
  })
  const fail = () => act.toast({ kind: 'fail', title: 'Transaction failed', body: 'Not enough ETH for gas', action: { label: 'Try again' } })
  const J: [string, Partial<State>, Route, (() => void)?][] = [
    ['Welcome', { connected: false, permit: 'none' }, 'welcome'],
    ['Connect wallet', { connected: false, permit: 'none', sheet: { name: 'connect' } }, 'welcome'],
    ['Create permit', { permit: 'none', sheet: { name: 'permit' } }, 'dashboard'],
    ['Dashboard — default', {}, 'dashboard'],
    ['Dashboard — confidential (permit expired)', { permit: 'expired' }, 'dashboard'],
    ['Dashboard — no permit', { permit: 'none' }, 'dashboard'],
    ['Dashboard — empty', { permit: 'none', balances: zeroBalances(), activity: [] }, 'dashboard'],
    ['Dashboard — token detail', { sheet: { name: 'token', arg: 'USDC' } }, 'dashboard'],
    ['Dashboard — activity expanded', { activityOpen: true }, 'dashboard'],
    ['Shield — form', {}, 'shield'],
    ['Shield — step 1 approve', { shieldStep: 1 }, 'shield'],
    ['Shield — step 2 confirm in wallet', { shieldStep: 2, busy: true }, 'shield', act.shieldConfirm],
    ['Shield — everything is confidential now', { success: { kind: 'shield', amount: 500, asset: 'USDC', networkIdx: 0 }, amt: { shield: '', unshield: '', send: '' }, firstShieldDone: true, balances: bal(-500, 500) }, 'shield'],
    ['Unshield — form', {}, 'unshield'],
    ['Unshield — decrypting', unsh(2), 'unshield', act.runDecrypt],
    ['Unshield — claim ready', unsh(3), 'unshield'],
    ['Unshield — claimed', { ...unsh(0, true), pendingUnshield: null, success: { kind: 'unshield', amount: 500, asset: 'USDC', networkIdx: 0 }, amt: { shield: '', unshield: '', send: '' } }, 'unshield'],
    ['Send — form', {}, 'send'],
    ['Send — review & confirm', {}, 'send', act.sendOpen],
    ['Send — sent', { sendStep: 3, balances: bal(0, -100) }, 'send'],
    ['Apps', {}, 'apps'],
    ['Permits — active', {}, 'permits'],
    ['Permits — expired', { permit: 'expired' }, 'permits'],
    ['Permits — none', { permit: 'none' }, 'permits'],
    ['Tutorial 1/4 — your dashboard', { permit: 'none', tour: { status: 'active', step: 0 } }, 'dashboard'],
    ['Tutorial 2/4 — create permit', { permit: 'none', tour: { status: 'active', step: 1 } }, 'dashboard'],
    ['Tutorial 3/4 — shield a token', { tour: { status: 'active', step: 2 }, amt: { shield: '10.00', unshield: '500.00', send: '100.00' } }, 'shield'],
    ['Tutorial 4/4 — done', { tour: { status: 'active', step: 3 } }, 'dashboard'],
    ['State — transaction failed', {}, 'shield', fail],
  ]
  const toastSet = () => {
    act.toast({ kind: 'success', title: 'Shielded 500 USDC', body: '500.00 fUSDC is now confidential', action: { label: 'View', route: 'dashboard' } })
    setTimeout(() => act.toast({ kind: 'info', title: 'Unshield requested', body: 'Claim it from Activity on your Dashboard' }), 250)
    setTimeout(fail, 500)
  }

  return (
    <div className="absolute z-[35]" style={{ left: mobile ? 12 : 16, bottom: mobile ? tokens.size.tabBar + 12 : 12 }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: t(160) }}
            role="dialog"
            aria-label="Demo controls"
            className="absolute bottom-full left-0 mb-2 flex w-[300px] flex-col gap-3 border border-line bg-surface p-4 shadow-[0_16px_48px_rgb(var(--shadow-ink)_/_.22)]"
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow text-ink">Demo controls</span>
              <button type="button" onClick={act.resetAll} className="border border-line px-2.5 py-1.5 text-caption font-medium hover:bg-surface2">
                Reset all
              </button>
            </div>
            <label className="flex flex-col gap-1 text-body text-ink2">
              Jump to
              <select
                value=""
                onChange={e => {
                  const j = J[Number(e.target.value)]
                  if (j) { setOpen(false); act.jump(j[1], j[2], j[3]) }
                }}
                className="h-9 border border-line bg-surface px-2 text-body text-ink"
              >
                <option value="" disabled>
                  Choose a screen or state…
                </option>
                {J.map((j, i) => (
                  <option key={j[0]} value={i}>
                    {j[0]}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="min-h-10 text-body text-accentInk" onClick={()=>document.dispatchEvent(new Event('fhenix:replay-illustrations'))}>Replay illustrations</button>
              <Row label="Speed">
              <Seg label="Speed" value={s.speed} options={[[0.5, '0.5×'], [1, '1×'], [2, '2×']]} onChange={v => act.set({ speed: v })} />
            </Row>
            <Row label="Permit">
              <Seg<Permit> label="Permit" value={s.permit} options={[['none', 'None'], ['active', 'Active'], ['expired', 'Expired']]} onChange={v => act.set({ permit: v, ...(v === 'active' ? { hidden: false } : {}) })} />
            </Row>
            <Row label="Network">
              <select aria-label="Network" value={s.networkIdx} onChange={e => act.setNetwork(Number(e.target.value))} className="h-8 border border-line bg-surface px-2 text-body text-ink">
                {data.networks.map((n, i) => (
                  <option key={n.chainId} value={i}>
                    {n.name}
                  </option>
                ))}
              </select>
            </Row>
            <div className="border-t border-line pt-2">
              <Check label="Fail next transaction" checked={s.failNext} onChange={v => act.set({ failNext: v })} />
              <Check label="Device frame 390×844" checked={s.deviceFrame} onChange={v => act.set({ deviceFrame: v })} />
              <Check label="Reduce motion" checked={s.reduceMotion} onChange={v => act.set({ reduceMotion: v })} />
            </div>
            <button type="button" onClick={toastSet} className="h-9 border border-line text-body font-medium hover:bg-surface2">
              Show toast set
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)} className="flex h-8 items-center gap-1.5 bg-navy px-3 text-caption font-medium text-[var(--brand-white)] shadow-[0_4px_12px_rgb(var(--shadow-ink)_/_.25)] hover:bg-ink2">
        <Icon name={open ? 'close' : 'apps-grid'} size={12} />
        Demo
      </button>
    </div>
  )
}
