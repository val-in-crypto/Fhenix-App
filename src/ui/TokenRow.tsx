import { TOKEN_ROW_RATIO_BAR } from '../config/flags'
import { Sep, separate } from './Sep'
import { fmtPublic, fmtUsd } from '../lib/format'
import { portfolioAssets, portfolioPrice, type PortfolioSym } from '../config/assets'
import Icon from './Icon'
import Masked from './Masked'

const meta = Object.fromEntries(portfolioAssets.map(a => [a.symbol, a])) as Record<string, (typeof portfolioAssets)[number]>
export const assetMeta = (sym: string) => meta[sym]
export const decOf = (sym: string) => (sym === 'ETH' ? 4 : 2)

/** Square token tile (Figma); shielded variant carries a small navy lock badge. */
export function Coin({ sym, size = 32, shielded }: { sym: string; size?: number; shielded?: boolean }) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center font-medium text-[var(--brand-white)]" style={{ width: size, height: size, background: sym === 'USDC' ? 'var(--brand-usdc)' : sym === 'ETH' ? 'var(--brand-eth)' : sym === 'WBTC' ? 'var(--brand-wbtc)' : sym === 'USDT' ? 'var(--brand-usdt)' : 'var(--color-on-accent)', fontSize: 'var(--text-caption)' }}>
      {sym === 'ETH' ? 'Ξ' : sym === 'WBTC' ? '₿' : sym === 'USDT' ? '₮' : '$'}
      {shielded && (
        <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center bg-navy text-accent" style={{ width: size * 0.42, height: size * 0.42 }}>
          <Icon name="lock" size={size * 0.28} />
        </span>
      )}
    </span>
  )
}

type Props = { zero?: boolean; sym: PortfolioSym; pub: number; priv: number; hidden: boolean; mobile: boolean; onClick: () => void }

/** Unified row: PUBLIC 1,250.00 / PRIVATE [1,000.00]. Row → token detail. */
export default function TokenRow({ sym, pub, priv, hidden, mobile, onClick, zero }: Props) {
  const a = meta[sym]
  const dec = decOf(sym)
  if (mobile)
    return (
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-3 text-left">
        <Coin sym={sym} />
        <span className="min-w-0 flex-1">
          <span className="block text-body font-medium ">{sym}</span>
          <span className="block text-caption  text-ink3">
            {sym}<Sep />{a.wrapped}
          </span>
        </span>
        <span className={`text-body flex min-w-0 flex-col gap-1 text-right text-body  ${zero ? 'opacity-[.64]' : ''}`}>
          <span className="flex items-center justify-end gap-2"><span className="size-2 shrink-0 bg-accent" /><Masked value={priv} hidden={hidden && !zero} dec={dec} /></span>
          <span className="flex items-center justify-end gap-2"><span className="size-2 shrink-0 bg-lineStrong" />{fmtPublic(pub, dec)}</span>


        </span>
      </button>
    )
  const pct = Math.round(priv / (pub + priv || 1) * 100)
  return (
    <button type="button" onClick={onClick} className="token-grid min-h-16 w-full items-center py-3 text-left hover:bg-surface2">
      <span className="flex min-w-0 items-center gap-4">
        <Coin sym={sym} size={36} />
        <span className="min-w-0"><span className="block text-label">{sym}</span><span className="block text-caption text-ink3">{a.name}</span></span>
      </span>
      <span className={`text-label ${zero ? 'opacity-[.64]' : ''}`}><Masked value={priv} hidden={hidden && !zero} dec={dec} /></span>
      <span className={`text-label tabular-nums ${zero ? 'opacity-[.64]' : ''}`}>{fmtPublic(pub, dec)}</span>
      <span className="flex items-center gap-5">
        {TOKEN_ROW_RATIO_BAR && <span className="flex w-[138px] items-center gap-4">
          <span className="block h-1 w-24 shrink-0 bg-line" role="img" aria-label={hidden && !zero ? 'Confidential share hidden' : `${pct}% confidential`}><span className="token-mini-fill block h-full" style={{width: `${hidden && !zero ? 0 : pct}%`}} /></span>
          <span className="w-[26px] text-caption">{hidden && !zero ? '[•••]' : `${pct}%`}</span>
        </span>}
        <Icon name="chevron-down" size={16} className="-rotate-90 text-ink3" />
      </span>
    </button>
  )
}
