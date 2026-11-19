import { fmtPublic, fmtUsd } from '../lib/format'
import { data, prices, type Sym } from '../state/store'
import Icon from './Icon'
import Masked from './Masked'

const meta = Object.fromEntries(data.assets.map(a => [a.symbol, a])) as Record<string, (typeof data.assets)[number]>
export const assetMeta = (sym: string) => meta[sym]
export const decOf = (sym: string) => (sym === 'ETH' ? 4 : 2)

/** Square token tile (Figma); shielded variant carries a small navy lock badge. */
export function Coin({ sym, size = 32, shielded }: { sym: string; size?: number; shielded?: boolean }) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center font-semibold text-white" style={{ width: size, height: size, background: meta[sym]?.icon ?? 'var(--color-on-accent)', fontSize: Math.max(11, size * 0.42) }}>
      {sym === 'ETH' ? 'Ξ' : '$'}
      {shielded && (
        <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center bg-navy text-accent" style={{ width: size * 0.42, height: size * 0.42 }}>
          <Icon name="lock" size={size * 0.28} />
        </span>
      )}
    </span>
  )
}

type Props = { sym: Sym; pub: number; priv: number; hidden: boolean; mobile: boolean; onClick: () => void }

/** Unified row: PUBLIC 1,250.00 / PRIVATE [1,000.00]. Row → token detail. */
export default function TokenRow({ sym, pub, priv, hidden, mobile, onClick }: Props) {
  const a = meta[sym]
  const dec = decOf(sym)
  if (mobile)
    return (
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-3 text-left">
        <Coin sym={sym} />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium leading-5">{sym}</span>
          <span className="block text-[12px] leading-4 text-ink3">
            {sym} · {a.wrapped}
          </span>
        </span>
        <span className="mono flex min-w-0 flex-col gap-1 text-right text-[13px] leading-4">
          <span className="flex items-center justify-end gap-2"><span className="size-2 shrink-0 bg-accent" /><Masked value={priv} hidden={hidden} dec={dec} /></span>
          <span className="flex items-center justify-end gap-2"><span className="size-2 shrink-0 bg-lineStrong" />{fmtPublic(pub, dec)}</span>

        </span>
      </button>
    )
  return (
    <button type="button" onClick={onClick} className="grid w-full grid-cols-[1fr_180px_180px_24px] items-center gap-4 px-2 py-3 text-left hover:bg-surface2">
      <span className="flex items-center gap-3">
        <Coin sym={sym} />
        <span>
          <span className="block text-[15px] font-medium leading-5">{sym}</span>
          <span className="block text-[13px] leading-[18px] text-ink3">
            {a.name} · {sym} + {a.wrapped}
          </span>
        </span>
      </span>
      <span className="text-right">
        <Masked value={priv} hidden={hidden} dec={dec} className="mono block text-[14px] font-medium leading-5" />
        <span className="block text-[13px] leading-[18px] text-accentInk">{a.wrapped}</span>
      </span>
      <span className="text-right">
        <span className="mono block text-[14px] font-medium leading-5 tabular-nums">{fmtPublic(pub, dec)}</span>
        <span className="block text-[13px] leading-[18px] text-ink3">{fmtUsd(pub * prices[sym])}</span>
      </span>
      <Icon name="chevron-down" className="-rotate-90 text-ink3" />
    </button>
  )
}
