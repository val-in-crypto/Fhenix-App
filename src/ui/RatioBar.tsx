import { MASK, fmtPrivate, fmtUsd } from '../lib/format'

export function RatioTrack({ confidential, publicValue, hidden, small = false }: { confidential: number; publicValue: number; hidden: boolean; small?: boolean }) {
  const total = confidential + publicValue
  const pct = total ? confidential / total * 100 : 0
  return (
    <div className={`flex w-full gap-1 ${small ? 'h-[6px]' : 'h-[10px]'}`} role="img" aria-label={hidden ? 'Balance split hidden' : `${pct.toFixed(0)}% confidential`}>
      {hidden || !total ? <span className="h-full w-full bg-line" /> : <>
        <span className="hatch h-full bg-accent" style={{ width: `${pct}%` }} /><span className="h-full bg-line" style={{ width: `${100 - pct}%` }} />
      </>}
    </div>
  )
}

export default function RatioBar({ priv, pub, hidden, compact, detail }: { priv: number; pub: number; hidden: boolean; compact?: boolean; detail?: boolean }) {
  const total = priv + pub
  const pct = total ? priv / total * 100 : 0
  if (detail) return <div>
    <div className="mono mb-2 flex justify-between gap-3 text-[12px] uppercase">
      <span className="text-accentInk">{hidden ? '' : `${pct.toFixed(0)}% `}Confidential</span><span className="text-ink3">{hidden ? '' : `${(100 - pct).toFixed(0)}% `}Public</span>
    </div>
    <RatioTrack confidential={priv} publicValue={pub} hidden={hidden} />
  </div>
  return <div>
    <div className="mb-2 flex items-end justify-between gap-3">
      <div className="min-w-0"><div className="eyebrow text-accentInk">Confidential</div><div className="mt-2 flex flex-wrap items-baseline gap-2"><span className={`${compact ? 'text-[15px]' : 'text-[19px]'} font-semibold`}>{hidden ? MASK : fmtPrivate(priv)}</span>{!hidden && <span className="mono text-[12px] text-ink3">{pct.toFixed(1)}%</span>}</div></div>
      <div className="min-w-0 text-right"><div className="eyebrow text-ink3">Public</div><div className="mt-2 flex flex-wrap items-baseline justify-end gap-2">{!hidden && <span className="mono text-[12px] text-ink3">{total ? (100 - pct).toFixed(1) : '0.0'}%</span>}<span className={`${compact ? 'text-[15px]' : 'text-[19px]'} font-semibold`}>{fmtUsd(pub)}</span></div></div>
    </div>
    <RatioTrack confidential={priv} publicValue={pub} hidden={hidden} />
  </div>
}
