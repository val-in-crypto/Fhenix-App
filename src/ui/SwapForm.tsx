import type { ComponentProps } from 'react'
import AmountBox, { ReceiveBox } from './AmountBox'
import SwapButton from './SwapButton'

export default function SwapForm({ from, to, flipped, onSwap, disabled }: {
  from: ComponentProps<typeof AmountBox>; to: ComponentProps<typeof ReceiveBox>; flipped: boolean; onSwap: () => void; disabled: boolean
}) {
  return (
    <div className="relative">
      <AmountBox {...from} swapEdge="bottom" />
      <div className="relative h-3"><SwapButton flipped={flipped} onClick={onSwap} disabled={disabled} /></div>
      <ReceiveBox {...to} />
    </div>
  )
}
