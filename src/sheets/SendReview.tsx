import { num } from '../lib/format'
import { data, useStore } from '../state/store'
import Button from '../ui/Button'
import Masked from '../ui/Masked'
import Sheet, { SheetClose } from '../ui/Sheet'
import Stepper from '../ui/Stepper'

export default function SendReview() {
  const { s, act, mobile } = useStore()
  const open = s.sheet?.name === 'sendReview'
  const step = Math.max(1, s.sendStep)
  const rows: [string, React.ReactNode][] = [
    ['To', <span className="mono">{s.sendTo}</span>],
    ['Amount', <span className="mono text-accentInk"><Masked value={num(s.amt.send)} hidden={false} /> fUSDC</span>],
    ['Network fee', data.send.fee],
    ['Visible on-chain', data.send.visible],
  ]
  return (
    <Sheet open={open} onClose={act.closeSheet} label="Review private send" width={480}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[19px] font-medium leading-6 tracking-[-0.01em]">Review private send</h2>
        <SheetClose onClick={act.closeSheet} />
      </div>
      <dl className="flex flex-col gap-3 bg-surface2 p-4">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 text-[13px] leading-[18px]">
            <dt className="shrink-0 text-ink3">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <Stepper
        steps={[
          { label: data.send.steps[0], sub: 'On your device' },
          { label: data.send.steps[1], sub: 'In your wallet' },
          { label: data.send.steps[2], sub: '~15 sec' },
        ]}
        active={step - 1}
      />
      <div className="flex flex-col items-center">
        <Button size={mobile ? 56 : 48} full disabled busy className="!text-[15px]">
          {step === 1 ? 'Encrypting on your device…' : 'Waiting for wallet…'}
        </Button>
        <button type="button" onClick={act.sendCancel} className="mt-4 px-3 py-1 text-[14px] font-medium text-ink2 hover:text-ink">
          Cancel
        </button>
      </div>
    </Sheet>
  )
}
