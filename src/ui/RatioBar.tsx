import { MASK, fmtPrivate, fmtUsd } from '../lib/format'

export function RatioTrack({ confidential, publicValue, hidden, claimable = 0, small = false }: { confidential: number; publicValue: number; hidden: boolean; claimable?:number; small?: boolean }) {
  const total = confidential + publicValue + claimable
  const pct = total ? confidential / total * 100 : 0
  return (
    <div className={`flex w-full gap-1 ${small ? 'h-[6px]' : 'h-[10px]'}`} role="img" aria-label={hidden ? 'Balance split hidden' : `${pct.toFixed(0)}% confidential`}>
      {hidden || !total ? <span className="h-full w-full bg-line" /> : <>
        <span className="hatch h-full bg-accent" style={{ width: `${pct}%` }} /><span className="h-full bg-line" style={{ width: `${publicValue / total * 100}%` }} />{claimable>0&&<span className="h-full bg-warn" style={{width:`${claimable/total*100}%`}}/>}
      </>}
    </div>
  )
}

export default function RatioBar({ priv, pub, hidden, compact, detail, claimable = 0 }: { priv: number; pub: number; hidden: boolean; claimable?:number; compact?: boolean; detail?: boolean }) {
  const total = priv + pub + claimable
  const pct = total ? priv / total * 100 : 0
  if (detail) return <div>
    <div className="mb-2 flex justify-between gap-3 text-caption ">
      <span className="text-accentInk">{hidden ? '' : `${pct.toFixed(0)}% `}Confidential</span><span className="text-ink3">{hidden ? '' : `${total ? (pub / total * 100).toFixed(0) : '0'}% `}Public</span>
    </div>
    {claimable>0&&<div className="mb-2 flex items-center gap-2 text-caption text-warn"><span className="size-2 bg-warn"/>Claimable {fmtUsd(claimable)}</div>}
    <RatioTrack claimable={claimable} confidential={priv} publicValue={pub} hidden={hidden} />
  </div>
  return <div>
    <div className="mb-2 flex items-end justify-between gap-3">
      <div className="min-w-0"><div className="eyebrow text-accentInk">Confidential</div><div className="mt-2 flex flex-wrap items-baseline gap-2"><span className={`text-label font-medium`}>{hidden ? MASK : fmtPrivate(priv)}</span>{!hidden && <span className="text-caption text-ink3">{pct.toFixed(1)}%</span>}</div></div>
      <div className="min-w-0 text-right"><div className="eyebrow text-ink3">Public</div><div className="mt-2 flex flex-wrap items-baseline justify-end gap-2">{!hidden && <span className="text-caption text-ink3">{total ? (pub / total * 100).toFixed(1) : '0.0'}%</span>}<span className={`text-label font-medium`}>{fmtUsd(pub)}</span></div></div>
    </div>
    {claimable>0&&<div className="mb-2 flex items-center gap-2 text-caption text-warn"><span className="size-2 bg-warn"/>Claimable {fmtUsd(claimable)}</div>}
    <RatioTrack claimable={claimable} confidential={priv} publicValue={pub} hidden={hidden} />
  </div>
}
