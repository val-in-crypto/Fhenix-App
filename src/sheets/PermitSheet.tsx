import { useEffect, useState } from 'react'
import { copy, data, useStore } from '../state/store'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import Sheet, { SheetClose } from '../ui/Sheet'

export default function PermitSheet() {
  const { s, act, mobile } = useStore()
  const open = s.sheet?.name === 'permit'
  const [days, setDays] = useState(s.permitDays)
  useEffect(() => {
    if (open) setDays(s.permitDays)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const c = copy.permit
  const rows: [string, string, string?][] = [
    ['lock', c[2]],
    ['lock', c[3]],
    ['eye', c[4], 'visible on-chain'],
  ]
  return (
    <Sheet open={open} onClose={s.signing ? () => {} : act.closeSheet} label={c[0]}>
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center bg-accentSoft text-accentInk">
          <Icon name="permit-key" />
        </span>
        <SheetClose onClick={() => !s.signing && act.closeSheet()} />
      </div>
      <div>
        <h2 className="text-[24px] font-medium leading-[30px] tracking-[-0.01em]">{s.permit === 'expired' ? 'Renew your permit' : c[0]}</h2>
        <p className="mt-2 text-[15px] leading-[22px] text-ink2">{c[1]}</p>
      </div>
      <div className="bg-surface2 p-4">
        <div className="eyebrow text-ink3" style={{ fontSize: 11 }}>What stays confidential</div>
        <ul className="mt-3 flex flex-col gap-3">
          {rows.map(([icon, label, note]) => (
            <li key={label} className="flex items-center gap-3 text-[14px] leading-5">
              <span className={`flex h-7 w-7 items-center justify-center bg-surface ${icon === 'lock' ? 'text-accentInk' : 'text-ink3'}`}>
                <Icon name={icon} size={icon === 'lock' ? 13 : 15} />
              </span>
              <span className="flex-1">{label}</span>
              {note && <span className="mono text-[12px] text-ink3">{note}</span>}
            </li>
          ))}
        </ul>
      </div>
      <label className="flex h-[52px] items-center justify-between bg-surface2 px-4 text-[14px]">
        <span className="text-ink2">{c[5]}</span>
        <span className="relative flex items-center font-medium">
          <select aria-label={c[5]} value={days} disabled={s.signing} onChange={e => setDays(Number(e.target.value))} className="cursor-pointer appearance-none bg-transparent py-2 pr-6 text-right">
            {data.permit.durations.map(d => (
              <option key={d} value={d}>
                {d} days
              </option>
            ))}
          </select>
          <Icon name="chevron-down" className="pointer-events-none absolute right-0 text-ink3" />
        </span>
      </label>
      <div className="flex flex-col items-center">
        <Button size={mobile ? 56 : 48} full arrow busy={s.signing} disabled={s.signing} onClick={() => act.signPermit(days)}>
          {s.signing ? 'Waiting for signature…' : c[6]}
        </Button>
        <button type="button" disabled={s.signing} onClick={act.permitNotNow} className="mt-4 px-3 py-1 text-[14px] font-medium text-ink2 underline underline-offset-4 hover:text-ink">
          {c[7]}
        </button>
      </div>
    </Sheet>
  )
}
