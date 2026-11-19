import { Sep, separate } from '../ui/Sep'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useMotion } from '../lib/motion'
import { ActionRow, Page, PermitChip } from '../shell/AppShell'
import { copy, data, isMasked, nav, usd, useStore, type Sym } from '../state/store'
import ActivityList from '../ui/ActivityList'
import Button from '../ui/Button'
import Chip from '../ui/Chip'
import Icon from '../ui/Icon'
import Masked from '../ui/Masked'
import RatioBar from '../ui/RatioBar'
import TokenRow from '../ui/TokenRow'

const card = 'border border-line bg-surface'
const HERO_GRADIENT: 'A' | 'B' = 'A'
const HISTORY_KEY = 'fhenix.history'
const SYMS: Sym[] = ['USDC', 'ETH']

/* ---------- desktop chart ---------- */
const RANGES = ['1W', '1M', '3M', '1Y'] as const
const LABELS: Record<string, string[]> = {
  '1W': ['Nov 10', 'Nov 12', 'Nov 14', 'Nov 16'],
  '1M': ['Oct 17', 'Oct 24', 'Oct 31', 'Nov 7', 'Nov 16'],
  '3M': ['Aug 16', 'Sep 16', 'Oct 16', 'Nov 16'],
  '1Y': ['Nov 2025', 'Feb', 'May', 'Aug', 'Nov 2026'],
}
function Chart({ masked }: { masked: boolean }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>('1M')
  const { top, priv, events } = useMemo(() => {
    const n = 48
    const seed = RANGES.indexOf(range) * 1.7
    const ev = [0.2, 0.47, 0.73, 0.9].map(x => x + (seed % 0.9) * 0.03)
    const levels = [0.1, 0.16, 0.2, 0.3, 0.34]
    const top: [number, number][] = []
    const priv: [number, number][] = []
    for (let i = 0; i <= n; i++) {
      const x = i / n
      const total = 0.64 + 0.1 * x + 0.025 * Math.sin(i * 0.5 + seed) + (x > 0.93 ? (x - 0.93) * 1.6 : 0)
      const k = ev.filter(e => x >= e).length
      top.push([x, total])
      priv.push([x, levels[k] + 0.004 * Math.sin(i + seed)])
    }
    return { top, priv, events: ev.map((e, k) => ({ x: e, y: levels[k + 1] })) }
  }, [range])
  const X = (x: number) => x * 1000
  const Y = (v: number) => 180 - v * 190
  const line = (p: [number, number][]) => p.map(([x, v], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ')
  const area = (p: [number, number][]) => `${line(p)} L1000 180 L0 180 Z`
  return (
    <section className="pt-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <h2 className="text-[15px] font-medium">Confidential vs public over time</h2>
          <span className="flex items-center gap-1.5 text-[13px] text-ink3">
            <span className="h-2 w-2 bg-accent" /> Confidential
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-ink3">
            <span className="h-2 w-2 bg-line" /> Public
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-ink3">
            <span className="h-2 w-2 rotate-45 border border-accentInk bg-surface" /> Shield event
          </span>
        </div>
        <div className="flex bg-surface2 p-0.5" role="group" aria-label="Range">
          {RANGES.map(r => (
            <button key={r} type="button" aria-pressed={r === range} onClick={() => setRange(r)} className={`mono px-2.5 py-1.5 text-[12px] font-medium leading-4 ${r === range ? 'border border-line bg-surface text-ink' : 'border border-transparent text-ink3 hover:text-ink'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="relative mt-4 h-[168px]">
        <svg viewBox="0 0 1000 180" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label="Area chart of public and confidential balance over time">
          <path d={area(top)} fill="var(--color-line)" opacity=".5" />
          <path d={line(top)} stroke="var(--chart-stroke)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
          {!masked && (
            <>
              <path d={area(priv)} fill="var(--color-accent)" opacity=".28" />
              <path d={line(priv)} stroke="var(--color-accent-ink)" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
              {events.map(e => (
                <path key={e.x} d={`M${X(e.x)} ${Y(e.y)} V180`} stroke="var(--color-accent-ink)" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
              ))}
            </>
          )}
        </svg>
        {!masked &&
          events.map(e => <span key={e.x} className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-accentInk bg-surface" style={{ left: `${e.x * 100}%`, top: `${(Y(e.y) / 180) * 100}%` }} />)}
        {masked && <span className="mono absolute bottom-2 left-0 bg-surface/80 px-2 py-1 text-[12px] text-ink3">Confidential series hidden</span>}
      </div>
      <div className="mono mt-2 flex flex-wrap justify-between gap-2 text-[12px] text-ink3">
        {LABELS[range].map(l => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </section>
  )
}

/* ---------- empty state ---------- */
function FundCard({ mobile }: { mobile: boolean }) {
  const { s, act } = useStore()
  const net = data.networks[s.networkIdx].name
  const tiles = [
    { t: 'Receive from another wallet', d: <span className="mono text-[12px]">{data.account.short}</span>, a: 'Copy address', on: act.copyAddress },
    { t: 'Bridge from another network', d: 'From Ethereum or another L2', a: 'Open bridge ↗' },
    { t: 'Get test tokens', d: 'Testnet faucet\u001fUSDC and ETH', a: 'Open faucet ↗' },
  ]
  return (
    <section className={`${card} ${mobile ? 'p-5' : 'p-6'}`}>
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-accentSoft text-accentInk">
          <Icon name="wallet" />
        </span>
        <div>
          <h2 className="text-[19px] font-medium leading-6 tracking-[-0.01em]">Fund your account</h2>
          <p className="mt-1 text-[13px] leading-[18px] text-ink2">Add USDC or ETH on {net} (your wallet's network) to start. Public balances show up here first, then you can shield them.</p>
        </div>
      </div>
      <div className={`mt-4 grid gap-2 ${mobile ? '' : 'grid-cols-3'}`}>
        {tiles.map(x => (
          <div key={x.t} className="bg-surface2 p-4">
            <div className="text-[14px] font-medium">{x.t}</div>
            <div className="mt-1 text-[13px] leading-[18px] text-ink3">{x.d}</div>
            <button type="button" onClick={x.on} className="mt-1 py-1 text-[13px] font-medium text-accentInk hover:underline">
              {x.a}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Dashboard() {
  const { s, act, mobile } = useStore()
  const masked = isMasked(s)
  const u = usd(s.balances)
  const total = u.pub + u.priv
  const net = data.networks[s.networkIdx]
  const empty = total === 0 && s.activity.length === 0
  const pad = mobile ? 'p-5' : 'p-6'
  const { t } = useMotion()
  const [history, setHistory] = useState(() => {
    try { return sessionStorage.getItem(HISTORY_KEY) === 'open' } catch { return false }
  })
  const tab = s.activityOpen ? 'Activity' : 'Tokens'
  useEffect(() => {
    const openActivity = () => {
      if (location.hash === '#activity' || location.hash === '#/activity') act.set({ activityOpen: true })
    }
    openActivity()
    window.addEventListener('hashchange', openActivity)
    return () => window.removeEventListener('hashchange', openActivity)
  }, [act])
  const toggleHistory = () => {
    try { sessionStorage.setItem(HISTORY_KEY, history ? 'closed' : 'open') } catch { /* browsing session only */ }
    setHistory(!history)
  }
  const selectTab = (label: string) => {
    if (label === 'Tokens' && /^#\/?activity$/.test(location.hash)) window.history.replaceState(null, '', '#/dashboard')
    act.set({ activityOpen: label === 'Activity' })
  }
  const permitCta = s.permit === 'expired' ? 'Renew' : 'Create permit'

  return (
    <Page>
      <div className="flex flex-col gap-6">
        {s.permit !== 'active' && !empty && (
          <div data-tour="permit-banner" className={`flex items-center gap-3 ${s.permit === 'expired' ? 'bg-dangerSoft' : 'border border-line bg-surface'} ${mobile ? 'p-3 pl-4' : 'px-5 py-3'}`} role="status">
            <Icon name="permit-key" className={s.permit === 'expired' ? 'text-danger' : 'text-accentInk'} />
            <p className="flex-1 text-[13px] leading-[18px] text-ink">{s.permit === 'expired' ? copy.expired : copy.none}</p>
            <Button size={44} onClick={act.renew}>
              {permitCta}
            </Button>
          </div>
        )}

        <section data-tour="hero" data-hero-gradient={HERO_GRADIENT} className={`${card} overview-hero ${pad}`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow text-ink3">Net worth</span>
            {mobile && s.connected && <PermitChip />}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Masked value={total} hidden={masked && !empty} bare prefix="$" className={`font-semibold tracking-[-0.03em] ${mobile ? 'text-[38px] leading-[44px]' : 'text-[44px] leading-[48px]'}`} />
            <button type="button" onClick={act.toggleHidden} aria-label={masked ? 'Reveal confidential balances' : 'Hide confidential balances'} aria-pressed={!masked} className="flex size-11 shrink-0 items-center justify-center border border-line bg-surface hover:border-lineStrong">
              <Icon name={masked ? 'eye' : 'eye-off'} size={18} />
            </button>
            {!mobile && <Button size={48} arrow className="ml-auto w-[168px]" onClick={() => nav('shield')}>Shield</Button>}
          </div>
          {mobile ? <div className="mt-4"><ActionRow stretch /></div> : <p className="mt-2 text-[13px] text-ink3">{separate(empty ? `No balances yet\u001f${net.name}` : `2 assets\u001f${net.name}${net.unsupported ? '' : ' Sepolia'}`)}</p>}
          <div className={mobile ? 'mt-4' : 'mt-6'}>
            <RatioBar priv={u.priv} pub={u.pub} hidden={masked && !empty} compact={mobile} />
          </div>
          {!empty && (
            <div className="mt-6 border-t border-line pt-2">
              <button type="button" aria-expanded={history} aria-controls="balance-history" onClick={toggleHistory} className="mx-auto flex min-h-10 items-center gap-2 px-3 text-[14px] font-medium text-accentInk">
                {history ? 'Hide history' : 'Show history'} <Icon name="chevron-down" size={14} className={history ? 'rotate-180' : ''} />
              </button>
              <div id="balance-history" hidden={!history}>
                {history && <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: t(160) }}><Chart masked={masked} /></motion.div>}
              </div>
            </div>
          )}
        </section>

        {empty && <FundCard mobile={mobile} />}

        <section className={`${card} ${pad}`}>
          <div className="flex items-center justify-between gap-3">
            <div role="tablist" aria-label="Overview details" className="flex gap-6" onKeyDown={event => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              const next = event.key === 'Home' ? 'Tokens' : event.key === 'End' ? 'Activity' : tab === 'Tokens' ? 'Activity' : 'Tokens'
              selectTab(next)
              document.getElementById(`overview-tab-${next}`)?.focus()
            }}>
              {['Tokens', 'Activity'].map(label => <button key={label} id={`overview-tab-${label}`} type="button" role="tab" aria-selected={label === tab} aria-controls="overview-panel" tabIndex={label === tab ? 0 : -1} onClick={() => selectTab(label)} className={`min-h-10 border-b-2 text-[19px] font-semibold ${label === tab ? 'border-accent text-ink' : 'border-transparent text-ink3'}`}>{label}</button>)}
            </div>
            {tab === 'Tokens' && (
            <button type="button" onClick={s.permit === 'active' ? act.toggleHidden : act.renew} className="flex items-center gap-1.5 py-1 text-[13px] font-medium text-accentInk hover:underline">
              {s.permit === 'expired' ? 'Renew permit' : s.permit === 'none' ? 'Create permit' : masked ? 'Reveal all' : mobile ? 'Hide' : 'Hide all'}
              <Icon name={s.permit !== 'active' ? 'permit-key' : masked ? 'eye' : 'eye-off'} size={14} />
            </button>
            )}
          </div>
          <div id="overview-panel" role="tabpanel" aria-labelledby={`overview-tab-${tab}`}>
          {tab === 'Activity' ? <ActivityList items={s.activity} hidden={masked} /> : net.unsupported ? (
            <p className="mt-4 flex items-start gap-2 bg-surface2 p-4 text-[13px] leading-[18px] text-ink2" role="status">
              <Icon name="info" className="mt-0.5 text-ink3" />
              {copy.unsupported.replace('{network}', net.name)}
            </p>
          ) : (
            <>
              {!mobile && (
                <div className="eyebrow mt-4 grid grid-cols-[1fr_180px_180px_24px] gap-4 px-2 text-ink3" style={{ fontSize: 11 }}>
                  <span>Asset</span>
                  <span className="text-right">Confidential</span>
                  <span className="text-right">Public</span>
                  <span />
                </div>
              )}
              {mobile && <div className="eyebrow mt-3 flex flex-wrap gap-4 text-ink3"><span className="flex items-center gap-2"><span className="size-2 bg-accent" />Confidential</span><span className="flex items-center gap-2"><span className="size-2 bg-lineStrong" />Public</span></div>}
              <div className="mt-1">
                {SYMS.map(sym => (
                  <TokenRow key={sym} sym={sym} pub={s.balances[sym].pub} priv={s.balances[sym].priv} hidden={masked} mobile={mobile} onClick={() => act.openSheet('token', sym)} />
                ))}
              </div>
              {!mobile && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Chip tone="neutral" className="eyebrow !py-1 !text-[11px]">Sample values</Chip>
                  <span className="text-[13px] text-ink3">Select an asset to see both balances and shield or unshield it.</span>
                </div>
              )}
            </>
          )}
          </div>
        </section>

      </div>
    </Page>
  )
}
