import { Sep, separate } from '../ui/Sep'
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
  const go = (r: 'shield' | 'unshield' | 'send') => {
    act.set({ sheet: null })
    if (r === 'send') {
      act.sendReset()
      location.hash = sym === 'USDC' ? '#/send' : `#/send?asset=${sym}`
      return
    }
    act.selectFlowAsset(sym)
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
              {a.name}<Sep />{data.networks[s.networkIdx].name}
            </div>
          </div>
          <SheetClose onClick={act.closeSheet} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="confidential-box min-w-0 border border-cyanMid bg-accentSoft p-3 sm:p-5">
            <div className={`flex flex-wrap justify-between gap-x-2 ${mobile ? 'flex-col' : ''}`}>
              <span className="eyebrow text-accentInk">Confidential</span>
              <span className="mono text-[12px] text-accentInk">{a.wrapped}</span>
            </div>
            <Masked value={b.priv} hidden={masked} dec={dec} className="mono mt-2 !whitespace-normal [overflow-wrap:anywhere] text-[clamp(14px,4vw,26px)] font-semibold leading-8" />
            <div className="mt-2 text-[13px] text-accentInk">{separate(masked ? 'Hidden\u001freveal it on Dashboard' : 'Decrypted with your permit')}</div>
          </div>
          <div className="min-w-0 border border-line bg-surface2 p-3 sm:p-5">
            <div className={`flex flex-wrap justify-between gap-x-2 ${mobile ? 'flex-col' : ''}`}>
              <span className="eyebrow text-ink3">Public</span>
              <span className="mono text-[12px] text-ink3">{sym}</span>
            </div>
            <div className="mono mt-2 !whitespace-normal [overflow-wrap:anywhere] text-[clamp(14px,4vw,26px)] font-semibold leading-8">{fmtPublic(b.pub, dec)}</div>
            <div className="mt-2 text-[13px] text-ink3">{fmtUsd(b.pub * prices[sym])}</div>
          </div>
        </div>
        <div className="my-2">
          <div className="eyebrow flex flex-wrap justify-between gap-2 text-ink3">
            <span className="text-accentInk">{masked ? 'Confidential' : `${Math.round(b.priv / (b.pub + b.priv || 1) * 100)}% confidential`}</span>
            <span>{masked ? 'Public' : `${Math.round(b.pub / (b.pub + b.priv || 1) * 100)}% public`}</span>
          </div>
          <div className="mt-2 h-2 bg-line" aria-hidden><div className="hatch h-full bg-accent" style={{ width: masked ? 0 : `${b.priv / (b.pub + b.priv || 1) * 100}%` }} /></div>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <Button size={mobile ? 52 : 48} arrow className="!px-2 !text-[15px]" onClick={() => go('shield')}>Shield</Button>
          <Button variant="secondary" size={44} className="self-center !px-2 !text-[15px]" onClick={() => go('unshield')}>Unshield</Button>
          <Button variant="secondary" size={44} className="col-span-2 !text-[15px]" onClick={() => go('send')}>Send</Button>
        </div>
        <p className="text-center text-[13px] leading-[18px] text-ink3">
          Shield moves public {sym} into your confidential balance. Unshield moves it back.
        </p>
      </div>
    </Sheet>
  )
}
