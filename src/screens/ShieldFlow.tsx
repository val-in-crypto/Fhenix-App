import type { ReactNode } from 'react'
import { fmtPublic, fmtUsd, num, trimAmt } from '../lib/format'
import { Page } from '../shell/AppShell'
import { copy, isMasked, nav, useStore } from '../state/store'
import AmountBox, { ReceiveBox } from '../ui/AmountBox'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import Masked from '../ui/Masked'
import Stepper from '../ui/Stepper'
import SwapButton from '../ui/SwapButton'

/** Result card shared by "Claimed" and "Sent privately". */
export function DoneCard({ title, body, rows, primary, secondary }: { title: string; body: ReactNode; rows: [string, ReactNode][]; primary: ReactNode; secondary: ReactNode }) {
  return (
    <div>
      <span className="flex h-12 w-12 items-center justify-center bg-accent text-ink">
        <Icon name="check" size={22} />
      </span>
      <h1 className="mt-5 text-[26px] font-medium leading-8 tracking-[-0.015em]">{title}</h1>
      <p className="mt-2 text-[14px] leading-5 text-ink2">{body}</p>
      <dl className="mt-4 flex flex-col gap-2 bg-surface2 p-4">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 text-[13px] leading-[18px]">
            <dt className="text-ink3">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex gap-2">
        {primary}
        {secondary}
      </div>
    </div>
  )
}

const Helper = ({ children, mobile }: { children: ReactNode; mobile: boolean }) => (
  <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[13px] leading-[18px] text-ink3">
    {mobile && <Icon name="info" />}
    {children}
  </p>
)

/** Shield + unshield on one screen; the toggle and the swap button switch modes. */
export default function ShieldFlow({ mode }: { mode: 'shield' | 'unshield' }) {
  const { s, act, mobile } = useStore()
  const shield = mode === 'shield'
  const b = s.balances.USDC
  const masked = isMasked(s)
  const key = shield ? 'shield' : 'unshield'
  const raw = s.amt[key]
  const amt = num(raw)
  const sStep = s.shieldStep
  const u = s.unshieldStep
  const locked = shield ? sStep > 0 : u > 0
  const inFlight = s.busy || (shield ? sStep === 2 : u === 1 || u === 2 || u === 4)
  const valid = amt > 0 && (locked || amt <= (shield ? b.pub : b.priv))
  const setAmt = (v: string) => act.set({ amt: { ...s.amt, [key]: v } })
  const max = () => {
    if (s.permit !== 'active') return act.openSheet('permit')
    setAmt(fmtPublic(shield ? b.pub : b.priv).replace(/,/g, ''))
  }
  const swap = () => !inFlight && nav(shield ? 'unshield' : 'shield')
  const size = mobile ? 52 : 48

  if (!shield && u === 5) {
    const done = s.pendingUnshield?.amount ?? amt
    return (
      <Page narrow card>
        <DoneCard
          title={`Unshielded ${fmtPublic(done)} USDC`}
          body="The USDC is back in your public wallet balance."
          rows={[
            ['Claimed', `${fmtPublic(done)} USDC`],
            ['Private balance', <span className="mono text-accentInk"><Masked value={b.priv} hidden={masked} /> fUSDC</span>],
            ['Transaction', <span className="mono inline-flex items-center gap-1">0x5d10…c7e2 <Icon name="arrow-up-right" /></span>],
          ]}
          primary={
            <Button size={48} arrow className="flex-1" onClick={() => (act.unshieldReset(), nav('dashboard'))}>
              Go to dashboard
            </Button>
          }
          secondary={
            <Button variant="secondary" size={48} className="flex-1" onClick={() => (act.unshieldReset(), act.set({ activityOpen: true }), nav('dashboard'))}>
              View activity
            </Button>
          }
        />
      </Page>
    )
  }

  let cta: ReactNode
  let helper: string
  if (shield) {
    const over = amt > b.pub && !locked
    cta =
      sStep === 0 ? (
        <Button size={size} full arrow disabled={!valid} onClick={act.shieldStart}>
          {over ? 'Not enough USDC' : `Shield ${trimAmt(amt)} USDC`}
        </Button>
      ) : sStep === 1 ? (
        <Button size={size} full arrow busy={s.busy} disabled={s.busy} onClick={act.shieldApprove}>
          {s.busy ? 'Approving…' : 'Approve USDC'}
        </Button>
      ) : (
        <Button size={size} full arrow disabled>
          Confirm in wallet…
        </Button>
      )
    helper = sStep === 0 ? (mobile ? '≈ $0.12 fee · ~30 sec' : copy.shieldNote) : sStep === 1 ? (mobile ? 'Step 1 of 2 · one-time approval' : 'Step 1 of 2 · a one-time approval lets Fhenix App shield your USDC') : 'Step 2 of 2 · confirm in wallet'
  } else {
    const over = amt > b.priv && !locked
    const f = fmtPublic(s.pendingUnshield?.amount ?? amt)
    cta =
      u <= 1 ? (
        <Button size={size} full arrow busy={u === 1} disabled={!valid || u === 1} onClick={act.unshieldRequest}>
          {u === 1 ? 'Requesting…' : over ? 'Not enough fUSDC' : `Unshield ${f} fUSDC`}
        </Button>
      ) : (
        <Button size={size} full arrow busy={u === 4} disabled={u !== 3} onClick={act.claim}>
          {u === 4 ? 'Claiming…' : `Claim ${f} USDC`}
        </Button>
      )
    helper = u <= 1 ? (mobile ? copy.unshieldNotes[0] : 'Step 1 of 3 · you claim the USDC after CoFHE decrypts it') : u === 2 ? copy.unshieldNotes[1] : mobile ? copy.unshieldNotes[2] : `Decrypted. Claim to move ${f} USDC to your wallet.`
  }

  return (
    <Page
      narrow
      card
      bottom={
        <>
          {cta}
          <Helper mobile={mobile}>{helper}</Helper>
        </>
      }
    >
      <div data-tour="shield-form">
        <div className="flex border border-navy" role="tablist" aria-label="Mode">
          {(['shield', 'unshield'] as const).map(m => (
            <button key={m} type="button" role="tab" aria-selected={m === mode} disabled={inFlight && m !== mode} onClick={() => m !== mode && swap()} className={`h-9 flex-1 text-[13px] font-medium capitalize transition-colors duration-200 ${m === mode ? 'bg-navy text-white' : 'bg-white text-ink2 hover:bg-surface2'}`}>
              {m}
            </button>
          ))}
        </div>

        {shield && sStep > 0 && (
          <div className="mt-5">
            <Stepper variant="line" steps={[{ label: 'Approve USDC' }, { label: 'Shield' }]} active={sStep - 1} />
          </div>
        )}

        <div className="mt-5">
          <AmountBox
            label={shield ? 'You shield' : 'You unshield'}
            balance={
              shield ? (
                <>Balance {fmtPublic(b.pub)}</>
              ) : (
                <>
                  Balance <Masked value={b.priv} hidden={masked} pulse={u === 2} />
                </>
              )
            }
            onMax={locked ? undefined : max}
            value={raw}
            onChange={locked ? undefined : setAmt}
            token={shield ? 'USDC' : 'fUSDC'}
            usd={fmtUsd(amt)}
            confidential={!shield}
            swapEdge="bottom"
            disabled={locked}
          />
          <SwapButton flipped={!shield} onClick={swap} ring={mobile ? '#F1F4F5' : '#FFFFFF'} disabled={inFlight} />
          <ReceiveBox amount={fmtPublic(amt)} unit={shield ? 'fUSDC' : 'USDC'} confidential={shield} />
        </div>

        {!shield && (
          <div className="mt-6">
            <Stepper
              steps={[
                { label: 'Unshield', sub: u >= 2 ? 'Request sent' : 'Request' },
                { label: 'Decrypt', sub: u === 2 ? 'CoFHE decrypting · ~30 sec' : u > 2 ? 'Decrypted' : '~30 sec' },
                { label: 'Claim', sub: u >= 3 ? 'Ready to claim' : 'To your wallet' },
              ]}
              active={u <= 1 ? 0 : u === 2 ? 1 : 2}
            />
          </div>
        )}
      </div>
    </Page>
  )
}
