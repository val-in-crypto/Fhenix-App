import { useRef } from 'react'
import { fmtPublic, fmtUsd } from '../lib/format'
import { data, isMasked, nav, prices, useStore, type Sym } from '../state/store'
import Button from '../ui/Button'
import Masked from '../ui/Masked'
import Sheet, { SheetClose } from '../ui/Sheet'
import { Coin, assetMeta, decOf } from '../ui/TokenRow'

/** Token detail: sheet with grabber on mobile, 520 modal on desktop. */
export default function TokenDetail() {
  const { s, act, mobile } = useStore()
  const open = s.sheet?.name === 'token'
  const last = useRef<Sym>('USDC')
  if (open && s.sheet?.arg) last.current = s.sheet.arg as Sym
  const sym = last.current
  const a = assetMeta(sym)
  const b = s.balances[sym]
  const dec = decOf(sym)
  const masked = isMasked(s)
  const go = (r: 'shield' | 'unshield') => {
    act.set({ sheet: null })
    nav(r)
  }
  return (
    <Sheet open={open} onClose={act.closeSheet} label={`${sym} balances`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 pb-2">
          <Coin sym={sym} size={40} />
          <div className="flex-1">
            <div className="text-[24px] font-medium leading-[30px] tracking-[-0.01em]">{sym}</div>
            <div className="text-[13px] leading-[18px] text-ink3">
              {a.name} · {data.networks[s.networkIdx].name}
            </div>
          </div>
          <SheetClose onClick={act.closeSheet} />
        </div>
        <div className="border border-line bg-surface2 p-5">
          <div className="flex justify-between">
            <span className="eyebrow text-ink3">Public</span>
            <span className="mono text-[12px] text-ink3">{sym}</span>
          </div>
          <div className="mono mt-2 text-[26px] font-medium leading-8 tabular-nums">{fmtPublic(b.pub, dec)}</div>
          <div className="mt-2 text-[13px] text-ink3">{fmtUsd(b.pub * prices[sym])}</div>
        </div>
        <div className="border border-cyanMid bg-accentSoft p-5">
          <div className="flex justify-between">
            <span className="eyebrow text-accentInk">Private</span>
            <span className="mono text-[12px] text-accentInk">{a.wrapped}</span>
          </div>
          <Masked value={b.priv} hidden={masked} dec={dec} className="mono mt-2 text-[26px] font-medium leading-8" />
          <div className="mt-2 text-[13px] text-accentInk">{masked ? (s.permit === 'active' ? 'Hidden · tap the eye on your dashboard to reveal' : 'Encrypted · create a permit to read it') : 'Decrypted with your permit'}</div>
        </div>
        <div className="mt-1 flex gap-2">
          <Button size={mobile ? 52 : 48} arrow className="flex-1 !text-[15px]" onClick={() => go('shield')}>
            Shield
          </Button>
          <Button variant="secondary" size={mobile ? 52 : 48} className="flex-1 !text-[15px]" onClick={() => go('unshield')}>
            Unshield
          </Button>
        </div>
        <p className="text-center text-[13px] leading-[18px] text-ink3">
          Shield moves public {sym} into your private balance. Unshield moves it back.
        </p>
      </div>
    </Sheet>
  )
}
