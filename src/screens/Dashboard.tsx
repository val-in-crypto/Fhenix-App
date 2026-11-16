import { useMemo, useState } from 'react'
import { ActionRow, Page } from '../shell/AppShell'
import { copy, data, isMasked, usd, useStore, type Sym } from '../state/store'
import ActivityList from '../ui/ActivityList'
import Button from '../ui/Button'
import Chip from '../ui/Chip'
import Icon from '../ui/Icon'
import Masked from '../ui/Masked'
import RatioBar from '../ui/RatioBar'
import TokenRow from '../ui/TokenRow'

const card = 'border border-line bg-white'
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
    <section className={`${card} p-6`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <h2 className="text-[15px] font-medium">Private vs public over time</h2>
          <span className="flex items-center gap-1.5 text-[13px] text-ink3">
            <span className="h-2 w-2 bg-accent" /> Encrypted
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-ink3">
            <span className="h-2 w-2 bg-line" /> Public
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-ink3">
            <span className="h-2 w-2 rotate-45 border border-accentInk bg-white" /> Shield event
          </span>
        </div>
        <div className="flex bg-surface2 p-0.5" role="group" aria-label="Range">
          {RANGES.map(r => (
            <button key={r} type="button" aria-pressed={r === range} onClick={() => setRange(r)} className={`mono px-2.5 py-1.5 text-[12px] font-medium leading-4 ${r === range ? 'border border-line bg-white text-ink' : 'border border-transparent text-ink3 hover:text-ink'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="relative mt-4 h-[168px]">
        <svg viewBox="0 0 1000 180" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label="Area chart of public and encrypted balance over time">
          <path d={area(top)} fill="#DDE4E8" opacity=".5" />
          <path d={line(top)} stroke="#8C99A3" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
          {!masked && (
            <>
              <path d={area(priv)} fill="#0AD9DC" opacity=".28" />
              <path d={line(priv)} stroke="#007A7E" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
              {events.map(e => (
                <path key={e.x} d={`M${X(e.x)} ${Y(e.y)} V180`} stroke="#007A7E" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
              ))}
            </>
          )}
        </svg>
        {!masked &&
          events.map(e => <span key={e.x} className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-accentInk bg-white" style={{ left: `${e.x * 100}%`, top: `${(Y(e.y) / 180) * 100}%` }} />)}
        {masked && <span className="mono absolute bottom-2 left-0 bg-white/80 px-2 py-1 text-[12px] text-ink3">Encrypted series hidden</span>}
      </div>
      <div className="mono mt-2 flex justify-between text-[12px] text-ink3">
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
    { t: 'Get test tokens', d: 'Testnet faucet · USDC and ETH', a: 'Open faucet ↗' },
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
  const permitCta = s.permit === 'expired' ? 'Renew' : 'Create permit'

  return (
    <Page>
      <div className="flex flex-col gap-6">
        {s.permit !== 'active' && !empty && (
          <div data-tour="permit-banner" className={`flex items-center gap-3 ${s.permit === 'expired' ? 'bg-dangerSoft' : 'border border-line bg-white'} ${mobile ? 'p-3 pl-4' : 'px-5 py-3'}`} role="status">
            <Icon name="permit-key" className={s.permit === 'expired' ? 'text-danger' : 'text-accentInk'} />
            <p className="flex-1 text-[13px] leading-[18px] text-ink">{s.permit === 'expired' ? copy.expired : copy.none}</p>
            <Button size={44} onClick={act.renew}>
              {permitCta}
            </Button>
          </div>
        )}

        <section data-tour="hero" className={`${card} ${pad}`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow text-ink3" style={mobile ? { fontSize: 11 } : undefined}>Net worth</span>
            {s.permit === 'active' ? (
              <Chip dot className="!py-1">Permit active · {mobile ? `${s.permitDays - 1}d` : `${s.permitDays - 1} days`}</Chip>
            ) : (
              <Chip dot tone={s.permit === 'expired' ? 'neutral' : 'accent'} className="!py-1">
                {s.permit === 'expired' ? 'Permit expired' : 'No permit yet'}
              </Chip>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Masked value={total} hidden={masked && !empty} bare prefix="$" className={`font-semibold tracking-[-0.03em] ${mobile ? 'text-[38px] leading-[44px]' : 'text-[64px] leading-[68px]'}`} />
            <button type="button" onClick={act.toggleHidden} aria-label={masked ? 'Reveal private balances' : 'Hide private balances'} aria-pressed={!masked} className="flex h-10 w-10 shrink-0 items-center justify-center border border-line bg-white hover:border-lineStrong">
              <Icon name={masked ? 'eye' : 'eye-off'} size={18} />
            </button>
          </div>
          {!mobile && <p className="mt-1 text-[13px] text-ink3">{empty ? `No balances yet · ${net.name}` : `2 assets · ${net.name}${net.unsupported ? '' : ' Sepolia'}`}</p>}
          {mobile && (
            <div className="mt-4">
              <ActionRow stretch />
            </div>
          )}
          <div className={mobile ? 'mt-4' : 'mt-6'}>
            <RatioBar priv={u.priv} pub={u.pub} hidden={masked && !empty} compact={mobile} />
          </div>
        </section>

        {empty && <FundCard mobile={mobile} />}
        {!mobile && !empty && <Chart masked={masked} />}

        <section className={`${card} ${pad}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[19px] font-medium leading-6 tracking-[-0.01em]">Tokens</h2>
            <button type="button" onClick={s.permit === 'active' ? act.toggleHidden : act.renew} className="flex items-center gap-1.5 py-1 text-[13px] font-medium text-accentInk hover:underline">
              {s.permit === 'expired' ? 'Renew permit' : s.permit === 'none' ? 'Create permit' : masked ? 'Reveal all' : mobile ? 'Hide' : 'Hide all'}
              <Icon name={s.permit !== 'active' ? 'permit-key' : masked ? 'eye' : 'eye-off'} size={14} />
            </button>
          </div>
          {net.unsupported ? (
            <p className="mt-4 flex items-start gap-2 bg-surface2 p-4 text-[13px] leading-[18px] text-ink2" role="status">
              <Icon name="info" className="mt-0.5 text-ink3" />
              {copy.unsupported.replace('{network}', net.name)}
            </p>
          ) : (
            <>
              {!mobile && (
                <div className="eyebrow mt-4 grid grid-cols-[1fr_180px_180px_24px] gap-4 px-2 text-ink3" style={{ fontSize: 11 }}>
                  <span>Asset</span>
                  <span className="text-right">Public</span>
                  <span className="text-right">Private</span>
                  <span />
                </div>
              )}
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
        </section>

        <section className={`${card} ${pad}`}>
          <ActivityList items={s.activity} hidden={masked} mobile={mobile} expanded={s.activityOpen} onToggle={() => act.set({ activityOpen: !s.activityOpen })} />
        </section>
      </div>
    </Page>
  )
}
