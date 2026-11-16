import { fmtPublic, fmtUsd, num } from '../lib/format'
import { Page } from '../shell/AppShell'
import { data, isMasked, nav, useStore } from '../state/store'
import AmountBox from '../ui/AmountBox'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import Masked from '../ui/Masked'
import { DoneCard } from './ShieldFlow'

export default function Send() {
  const { s, act, mobile } = useStore()
  const masked = isMasked(s)
  const b = s.balances.USDC
  const amt = num(s.amt.send)
  const f = fmtPublic(amt)
  const valid = amt > 0 && amt <= b.priv && s.sendTo.trim().length > 5

  if (s.sendStep === 3)
    return (
      <Page narrow card>
        <DoneCard
          title="Sent privately"
          body={
            <>
              <span className="mono">[{f}]</span> fUSDC is on its way to {s.sendTo}. Only you and the recipient can read the amount.
            </>
          }
          rows={[
            ['To', <span className="mono">{s.sendTo}</span>],
            ['Amount', <span className="mono text-accentInk"><Masked value={amt} hidden={masked} /> fUSDC</span>],
            ['Transaction', <span className="mono inline-flex items-center gap-1">{data.send.tx} <Icon name="arrow-up-right" /></span>],
          ]}
          primary={
            <Button size={48} arrow className="flex-1" onClick={() => (act.sendReset(), nav('dashboard'))}>
              Go to dashboard
            </Button>
          }
          secondary={
            <Button variant="secondary" size={48} className="flex-1" onClick={act.sendReset}>
              Send another
            </Button>
          }
        />
      </Page>
    )

  return (
    <Page
      narrow
      card
      bottom={
        <>
          <Button size={mobile ? 52 : 48} full arrow disabled={!valid} onClick={act.sendOpen}>
            {amt > b.priv ? 'Not enough fUSDC' : `Send ${f} fUSDC`}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[13px] leading-[18px] text-ink3">
            {mobile && <Icon name="info" />}
            {mobile ? `Amount stays encrypted · ${data.send.fee} fee` : `Amount stays encrypted. Recipient and transfer are visible on-chain · ${data.send.fee} fee`}
          </p>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="border border-line bg-surface2 p-5">
          <div className="flex items-center justify-between">
            <label htmlFor="send-to" className="text-[13px] leading-[18px] text-ink2">
              To
            </label>
            <button type="button" className="text-[13px] font-medium text-accentInk hover:underline" onClick={() => act.set({ sendTo: data.send.to })}>
              Paste
            </button>
          </div>
          <input id="send-to" value={s.sendTo} onChange={e => act.set({ sendTo: e.target.value })} placeholder="0x…" spellCheck={false} className="mono mt-2 w-full bg-transparent text-[16px] font-medium leading-6 placeholder:text-ink3" />
          <div className="mt-1 text-[12px] leading-4 text-ink3">Recipient address · visible on-chain</div>
        </div>
        <AmountBox
          label="You send"
          balance={
            <>
              Balance <Masked value={b.priv} hidden={masked} />
            </>
          }
          onMax={() => (s.permit !== 'active' ? act.openSheet('permit') : act.set({ amt: { ...s.amt, send: fmtPublic(b.priv).replace(/,/g, '') } }))}
          value={s.amt.send}
          onChange={v => act.set({ amt: { ...s.amt, send: v } })}
          token="fUSDC"
          usd={fmtUsd(amt)}
          confidential
        />
      </div>
    </Page>
  )
}
