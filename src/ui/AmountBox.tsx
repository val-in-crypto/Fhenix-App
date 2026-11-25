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
  layout?: 'default' | 'send'
}

/** One amount box for shield, unshield and send. */
export default function AmountBox({ label, balance, onMax, value, onChange, token, usd, confidential, swapEdge = 'none', disabled, invalid, visibility, maxLabel = 'MAX', layout = 'default' }: Props) {
  const send = layout === 'send'
  return (
    <Field invalid={invalid} disabled={disabled}
      className={`p-5 ${send ? 'flex h-[155px] flex-col gap-3' : ''} ${swapEdge === 'bottom' ? 'h-[159px] pb-6' : ''} ${confidential ? 'confidential-box border-accentSoft bg-accentSoft' : visibility ? 'border-line bg-surface' : 'border-line bg-surface'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={send ? 'text-body font-medium  text-ink2' : 'text-body  text-ink3'}>{label}</span>
        <span className="flex items-center gap-2 text-body  text-ink3">
          {balance}
          {onMax && (
            <button type="button" onClick={onMax} disabled={disabled} className={`text-body ${send ? 'px-2.5 py-1.5 font-medium' : 'px-2 py-1 font-medium'} text-caption  ${confidential ? `${send ? 'bg-accentSoft' : 'bg-surface'} text-accentInk hover:bg-accentSoft` : 'bg-surface2 text-ink2 hover:bg-line'}`}>
              {maxLabel}
            </button>
          )}
        </span>
      </div>
      <div className={`${send ? '' : 'mt-2'} flex items-center justify-between gap-3`}>
        <input
          aria-label={label}
          inputMode="decimal"
          value={value}
          readOnly={!onChange || disabled}
          onChange={e => onChange?.(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
          placeholder="0.00"
          className="w-full min-w-0 bg-transparent text-value font-medium   text-ink placeholder:text-ink3"
        />
        <span className={`flex h-11 shrink-0 items-center gap-2 border border-line bg-surface text-body ${send ? 'pl-1.5 pr-3 font-medium' : 'px-2.5 font-medium'}`}>
          <Coin sym={token.replace(/^f/, '')} size={send ? 28 : 24} shielded={token.startsWith('f')} />
          {token}
          <Icon name="chevron-down" className="text-ink3" />
        </span>
      </div>
      <div className={`${send ? '' : 'mt-2'} flex items-center justify-between gap-3`}>
        <span className={`${send ? '' : 'text-caption '} ${confidential ? 'text-accentInk' : 'text-ink3'}`}>≈ {usd}</span>
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
      <span className="text-body  text-ink3">{label}</span>
      <span className="text-body font-medium tabular-nums">
        {amount} <span className={'text-accentInk'}>{unit}</span>
      </span>
    </div>
  )
}
