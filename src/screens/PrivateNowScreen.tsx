import { useState } from 'react'
import PrivateNow from '../illus/PrivateNow'
import { fmtPublic } from '../lib/format'
import { Page } from '../shell/AppShell'
import { copy, nav, useStore } from '../state/store'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import Masked from '../ui/Masked'
import { decOf } from '../ui/TokenRow'

/** #/success — "Everything is private now". Light page, no card, centred column 560 / 350. */
export default function PrivateNowScreen() {
  const { s, act, mobile } = useStore()
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState(false)
  const sym = s.lastShieldAsset
  const dec = decOf(sym)
  const amount = fmtPublic(s.lastShield, dec)
  const sub = copy.privateNow[2].replace('500.00', s.permit === 'active' ? `[${amount}]` : '[*******]').replace(/USDC/g, sym)
  const hint = copy.privateNow[3].replace('500.00', shown && s.permit === 'active' ? `[${amount}]` : '[*******]').replace(/USDC/g, sym)
  const reveal = async () => {
    if (shown) return setShown(false)
    if (s.permit !== 'active') return act.openSheet('permit')
    setBusy(true)
    await act.reveal()
    setBusy(false)
    setShown(true)
  }
  return (
    <Page>
      <div className="mx-auto flex flex-col items-center text-center" style={{ maxWidth: mobile ? 350 : 560 }}>
        <PrivateNow scale={mobile ? 0.6 : 1} />
        {!mobile && <div className="eyebrow text-accentInk">{copy.privateNow[0]}</div>}
        <h1 className={`font-medium ${mobile ? 'mt-1 text-[28px] leading-[34px] tracking-[-0.02em]' : 'mt-3 text-[40px] leading-[48px] tracking-[-0.025em]'}`}>{copy.privateNow[1]}</h1>
        <p className="mt-3 max-w-[420px] text-[15px] leading-[22px] text-ink2">{sub}</p>

        <div className="mt-6 flex w-full items-center justify-between gap-3 border border-line bg-surface p-4 text-left" style={{ maxWidth: 416 }}>
          <div className="min-w-0">
            <div className="text-[13px] leading-[18px] text-ink3">Confidential balance</div>
            <div className="mono mt-1 text-[22px] font-medium leading-7 text-accentInk">
              <Masked value={s.lastShield} hidden={!shown || s.permit !== 'active'} dec={dec} pulse={busy} /> <span className="text-[15px]">f{sym}</span>
            </div>
          </div>
          <Button variant="secondary" size={44} icon={shown ? 'eye-off' : 'eye'} onClick={reveal} disabled={busy} aria-pressed={shown}>
            {shown ? 'Hide' : 'Reveal'}
          </Button>
        </div>
        <p className="mt-2 text-[13px] leading-[18px] text-ink3">{hint}</p>

        <div className={`mt-6 flex w-full gap-2 ${mobile ? 'flex-col' : 'justify-center'}`}>
          <Button size={mobile ? 52 : 48} arrow onClick={() => nav('dashboard')} style={mobile ? undefined : { width: 204 }} className={mobile ? '!text-[15px]' : ''}>
            {copy.privateNow[4]}
          </Button>
          <Button variant="secondary" size={mobile ? 52 : 48} onClick={() => nav('shield')} style={mobile ? undefined : { width: 204 }} className="!text-[15px]">
            {copy.privateNow[5]}
          </Button>
        </div>
        {!mobile && (
          <a href="#" onClick={e => e.preventDefault()} className="mono mt-5 inline-flex items-center gap-1.5 text-[12px] text-ink3 hover:text-ink">
            Transaction 0x9f2c…a83e <Icon name="arrow-up-right" />
          </a>
        )}
      </div>
    </Page>
  )
}
