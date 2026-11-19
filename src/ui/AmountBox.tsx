import type { ReactNode } from 'react'
import Icon from './Icon'
import Field from './Field'
import { Coin } from './TokenRow'

type Props = {
  label: string
  balance?: ReactNode
  onMax?: () => void
  value: string
  onChange?: (v: string) => void
  /** token symbol on the chip, e.g. USDC or fUSDC */
  token: string
  usd: string
  /** turquoise = confidential side, always */
  confidential?: boolean
  /** which edge touches the swap button (gets 24 padding) */
  swapEdge?: 'bottom' | 'none'
  invalid?: boolean
  disabled?: boolean
  visibility?: string
  maxLabel?: string
}

/** One amount box for shield, unshield and send. */
export default function AmountBox({ label, balance, onMax, value, onChange, token, usd, confidential, swapEdge = 'none', disabled, invalid, visibility, maxLabel = 'MAX' }: Props) {
  return (
    <Field invalid={invalid} disabled={disabled}
      className={`p-5 ${swapEdge === 'bottom' ? 'h-[159px] pb-6' : ''} ${confidential ? 'confidential-box border-accentSoft bg-accentSoft' : visibility ? 'border-line bg-surface' : 'border-line bg-surface'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] leading-5 text-ink3">{label}</span>
        <span className="flex items-center gap-2 text-[13px] leading-[18px] text-ink3">
          {balance}
          {onMax && (
            <button type="button" onClick={onMax} disabled={disabled} className={`mono px-2 py-1 text-[12px] font-medium leading-4 ${confidential ? 'bg-surface text-accentInk hover:bg-accentSoft' : 'bg-surface2 text-ink2 hover:bg-line'}`}>
              {maxLabel}
            </button>
          )}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <input
          aria-label={label}
          inputMode="decimal"
          value={value}
          readOnly={!onChange || disabled}
          onChange={e => onChange?.(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
          placeholder="0.00"
          className="w-full min-w-0 bg-transparent text-[38px] font-semibold leading-[44px] tracking-[-0.03em] text-ink placeholder:text-ink3"
        />
        <span className="flex h-11 shrink-0 items-center gap-2 border border-line bg-surface px-2.5 text-[15px] font-medium">
          <Coin sym={token.replace(/^f/, '')} size={24} shielded={token.startsWith('f')} />
          {token}
          <Icon name="chevron-down" className="text-ink3" />
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className={`mono text-[12px] leading-4 ${confidential ? 'text-accentInk' : 'text-ink3'}`}>≈ {usd}</span>
        {visibility && <span className="eyebrow text-ink3">{visibility}</span>}
        {confidential && (
          <span className="eyebrow flex items-center gap-1.5 text-accentInk">
            <Icon name="lock" />
            Only you can read
          </span>
        )}
      </div>
    </Field>
  )
}

/** Box 2 "You receive" */
export function ReceiveBox({ amount, unit, confidential, label = 'You receive' }: { amount: string; unit: string; confidential?: boolean; label?: string }) {
  return (
    <div
      className={`flex items-center justify-between h-[66px] gap-2 border px-5 pb-5 pt-6 ${confidential ? 'confidential-box border-accentSoft bg-accentSoft' : 'border-line bg-surface'}`}
    >
      <span className="text-[15px] leading-5 text-ink3">{label}</span>
      <span className="text-[15px] font-medium tabular-nums">
        {amount} <span className={'text-accentInk'}>{unit}</span>
      </span>
    </div>
  )
}
