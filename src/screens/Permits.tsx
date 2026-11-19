import { Sep, separate } from '../ui/Sep'
import { useState } from 'react'
import { PERMIT_DOCS_URL } from '../config/links'
import { Page } from '../shell/AppShell'
import { data, useStore } from '../state/store'
import Button from '../ui/Button'
import Icon from '../ui/Icon'

const INTRO = 'Only you can decrypt your confidential data. A permit lets CoFHE and the on-chain access list verify your access — for you, or an app you trust.'

export default function Permits() {
  const { s, act, mobile } = useStore()
  const [others, setOthers] = useState(() => data.permitsList.slice(1).map(p => ({ ...p })))
  const device = data.permitsList[0]
  const rows =
    s.permit === 'none'
      ? []
      : [
          s.permit === 'active'
            ? { ...device, note: `Expires in ${s.permitDays} days`, status: 'active', action: 'Revoke', on: act.revoke }
            : { ...device, note: 'Expired Nov 14', status: 'expired', action: 'Renew', on: act.renew },
          ...others.map(p => ({
            ...p,
            on: () => {
              if (p.action === 'Renew') {
                setOthers(o => o.map(x => (x.name === p.name ? { ...x, status: 'active', note: `Expires in ${s.permitDays} days`, action: 'Revoke' } : x)))
                act.toast({ kind: 'success', title: 'Permit renewed', body: `${separate(p.name)}\u001fvalid ${s.permitDays} days` })
              } else {
                setOthers(o => o.filter(x => x.name !== p.name))
                act.toast({ kind: 'info', title: 'Permit revoked', body: `${separate(p.name)} can no longer read your data` })
              }
            },
          })),
        ]

  const cta = (
    <Button size={mobile ? 52 : 48} full arrow={mobile} onClick={act.renew}>
      {s.permit === 'expired' ? 'Renew permit' : 'Create permit'}
    </Button>
  )

  return (
    <Page narrow bottom={cta}>
      <p className="text-[14px] leading-5 text-ink2">{INTRO}</p>

      {s.permit === 'expired' && (
        <div className="mt-4 flex items-center gap-3 border border-line bg-surface p-4 text-[13px] font-medium leading-[18px]" role="status">
          <Icon name="permit-key" className="text-accentInk" />
          Your permit for this device expired. Renew it to read your confidential balances.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-4 border border-line bg-surface px-5 py-8 text-center">
          <div className="text-[15px] font-medium">No permits yet</div>
          <div className="mt-1 text-[13px] leading-[18px] text-ink3">Create one to decrypt your confidential balances on this device.</div>
          <a href={PERMIT_DOCS_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center text-[13px] text-accentInk">What is a permit? Read the docs ↗</a>
        </div>
      ) : (
        <ul className="mt-4 border border-line bg-surface px-4">
          {rows.map((p, i) => (
            <li key={p.name} className={`flex items-center gap-3 py-3 ${i ? 'border-t border-line' : ''}`}>
              <span className="mono relative flex h-10 w-10 shrink-0 items-center justify-center bg-navy text-[12px] font-medium text-accent">
                {p.abbr}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center bg-accentSoft text-accentInk">
                  <Icon name="lock" size={9} />
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium leading-5">{separate(p.name)}</span>
                <span className="flex items-center gap-1 text-[13px] leading-[18px] text-ink3">
                  {(p.status === 'expiring' || p.status === 'expired') && <Icon name="alert" size={13} />}
                  {p.note}
                </span>
              </span>
              <Button variant={p.action === 'Renew' ? 'primary' : 'secondary'} size={44} onClick={p.on} className="min-w-[88px] !text-[13px]">
                {p.action}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <label className="mt-4 flex h-[52px] items-center gap-3 border border-line bg-surface px-4 text-[14px]">
        <Icon name="clock" size={18} className="text-ink2" />
        <span className="flex-1">New permits last</span>
        <span className="relative flex items-center gap-1 font-medium">
          <select aria-label="New permits last" value={s.permitDays} onChange={e => act.set({ permitDays: Number(e.target.value) })} className="cursor-pointer appearance-none bg-transparent py-2 pr-6 text-right">
            {data.permit.durations.map(d => (
              <option key={d} value={d}>
                {d} days
              </option>
            ))}
          </select>
          <Icon name="chevron-down" className="pointer-events-none absolute right-0 text-ink3" />
        </span>
      </label>

      <p className="mt-3 flex items-start gap-1.5 text-[13px] leading-[18px] text-ink3">
        <Icon name="info" className="mt-0.5" />
        Signing a permit is free. Revoking takes effect right away.
      </p>
      <button type="button" onClick={act.tourStart} className="mt-3 py-1 text-[13px] font-medium text-accentInk hover:underline">
        Replay the tour
      </button>
    </Page>
  )
}
