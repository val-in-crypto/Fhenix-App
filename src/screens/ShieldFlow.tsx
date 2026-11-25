import { useEffect, useState } from 'react'
import { fmtPrivate, fmtPublic, fmtUsd, num, trimAmt } from '../lib/format'
import { useMotion } from '../lib/motion'
import { Page } from '../shell/AppShell'
import { data, isMasked, nav, prices, useStore, type Sym } from '../state/store'
import { TOKEN_NETWORKS, TX_HASHES } from '../config/tokens'
import SwapForm from '../ui/SwapForm'
import SegmentedSwitch from '../ui/SegmentedSwitch'
import Steps from '../ui/Steps'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import Masked from '../ui/Masked'
import SuccessModal from '../ui/SuccessModal'
import SuccessIllustration from '../illus/SuccessIllustration'
import PrivateNow from '../illus/PrivateNow'
import { separate } from '../ui/Sep'

export default function ShieldFlow({ mode }: { mode: 'shield' | 'unshield' }) {
  const { s, act, mobile } = useStore()
  const { reduced } = useMotion()
  const [revealed, setRevealed] = useState(false)
  const shield = mode === 'shield'
  const practice = s.tour.status === 'active' && s.tour.step === 2
  const sym = practice ? 'USDC' : s.pendingUnshield?.asset ?? s.flowAsset
  const b = practice ? { pub: 1250, priv: 0 } : s.balances[sym]
  const wrapped = 'f' + sym
  const dec = sym === 'ETH' ? 4 : 2
  const key = shield ? 'shield' : 'unshield'
  const raw = s.amt[key]
  const amount = num(raw)
  const busy = s.busy || !shield && s.unshieldStep === 2
  const locked = s.busy || !shield && s.unshieldStep > 0
  const available = shield ? b.pub : b.priv
  const over = amount > available
  const minimum = 0.000001
  const valid = amount >= minimum && !over
  const allowed = practice ? s.shieldStep > 1 : sym === 'ETH' || (s.allowances[`${data.networks[s.networkIdx].chainId}:${sym}`] ?? 0) >= amount && amount > 0
  const masked = isMasked(s)
  const result = s.success
  const close = () => { setRevealed(false); act.set({ success: null }) }

  useEffect(() => {
    const applyQuery = () => {
      const query = new URLSearchParams(location.hash.split('?')[1])
      const token = query.get('token') ?? query.get('asset')
      if (token === 'ETH' || token === 'USDC') act.selectFlowAsset(token)
      const preset = query.get('amount')
      if (preset && /^\d+(\.\d{1,6})?$/.test(preset)) act.set(state => ({ amt: { ...state.amt, [query.get('mode') === 'unshield' ? 'unshield' : 'shield']: preset } }))
    }
    applyQuery()
    window.addEventListener('hashchange', applyQuery)
    return () => window.removeEventListener('hashchange', applyQuery)
  }, [act])

  const swap = () => {
    if (busy || !shield && s.pendingUnshield) return
    act.set(state => ({ amt: { ...state.amt, [shield ? 'unshield' : 'shield']: raw } }))
    nav(shield ? 'unshield' : 'shield')
  }
  const setAmount = (value: string) => {
    if (/^\d*(\.\d{0,6})?$/.test(value)) act.set(state => ({ amt: { ...state.amt, [key]: value }, shieldStep: 0 }))
  }
  const max = () => {
    if (!shield && s.permit !== 'active') return act.renew()
    const maximum = sym === 'ETH' && shield ? Math.max(0, available - .0001) : available
    setAmount((Math.floor(maximum * 1e6) / 1e6).toFixed(6).replace(/\.?0+$/, '') || '0')
  }

  let label = !amount ? 'Enter an amount' : amount < minimum ? 'Amount too small' : over ? `Not enough ${shield ? sym : wrapped}` : ''
  let action: () => void | Promise<void> = shield ? allowed ? act.shieldConfirm : act.shieldApprove : act.unshieldRequest
  let disabled = !valid
  if (practice && !busy && valid) { label = `Shield ${trimAmt(amount)} ${sym}`; action = () => act.tourShield(false) }
  else if (shield && valid) label = allowed ? `Shield ${trimAmt(amount)} ${sym}` : `Approve ${sym}`
  else if (!shield && valid) label = `Unshield ${fmtPublic(amount, dec)} ${wrapped}`
  if (!practice && s.permit !== 'active' && valid) { label = 'Create permit first'; action = act.renew }
  if (!shield && s.unshieldStep >= 2) {
    label = s.unshieldStep === 2 ? 'Decrypting…' : s.unshieldStep === 4 ? 'Claiming…' : `Claim ${fmtPublic(s.pendingUnshield?.amount ?? amount, dec)} ${sym}`
    action = act.claim
    disabled = s.unshieldStep !== 3
  }
  if (s.busy) label = reduced ? 'Waiting…' : shield ? s.shieldStep === 1 ? 'Approving…' : s.shieldStep === 4 ? 'Shielding…' : 'Confirm in wallet…' : s.unshieldStep === 4 ? 'Claiming…' : 'Requesting…'
  if (busy) { disabled = true; if (reduced) label = 'Waiting…' }
  const resultAmount = result ? fmtPublic(result.amount, result.asset === 'ETH' ? 4 : 2) : ''
  const explorer = result && TOKEN_NETWORKS[data.networks[result.networkIdx].chainId]?.explorer
  const hash = result?.kind === 'shield' ? TX_HASHES.shield : TX_HASHES.unshield

  return (
    <>
      <Page narrow card bottom={<>
        <Button full size={mobile ? 52 : 48} busy={busy && !reduced} disabled={disabled} arrow={!disabled} onClick={action}>{label}</Button>
        <p className="mt-3 text-center text-body  text-ink3">{separate(shield ? '≈ $0.12 fee\u001f~30 sec\u001fAmount is visible on-chain. Your balance is not.' : s.unshieldStep === 2 ? 'Claim unlocks after decryption\u001f~30 sec' : 'Step 1 of 3\u001fthen decrypt and claim')}</p>
      </>}>
        <div data-tour="shield-form">
          <SegmentedSwitch width="fill" label="Mode" value={mode} onChange={value => { if (value !== mode) swap() }} disabled={busy || Boolean(s.pendingUnshield)} options={[{ value: 'shield', label: 'Shield' }, { value: 'unshield', label: 'Unshield' }]} />
          <div className="mt-5">
            <SwapForm flipped={!shield} onSwap={swap} disabled={busy || Boolean(s.pendingUnshield)}
              from={{ label: shield ? 'You shield' : 'You unshield', balance: shield ? <>Balance {fmtPublic(b.pub, dec)}</> : <>Balance <Masked value={b.priv} hidden={masked} dec={dec} /></>,
                onMax: locked ? undefined : max, value: raw, onChange: locked ? undefined : setAmount, token: shield ? sym : wrapped, usd: fmtUsd(amount * prices[sym]), confidential: !shield, disabled: locked, invalid: over }}
              to={{ amount: shield ? fmtPrivate(masked ? undefined : amount, dec) : fmtPublic(amount, dec), unit: shield ? wrapped : sym, confidential: shield }} />
          </div>
          <Steps labels={shield ? [allowed ? 'Approved' : 'Approve', 'Shield', 'Done'] : ['Unshield', 'Decrypt', 'Claim']} active={shield ? allowed || s.shieldStep >= 2 ? 1 : 0 : s.unshieldStep < 2 ? 0 : s.unshieldStep === 2 ? 1 : 2} pending={busy} />
        </div>
      </Page>
      <SuccessModal open={Boolean(result)} onClose={close} illustration={result?.kind === 'shield' ? <PrivateNow scale={mobile ? 216 / 560 : 320 / 560} /> : <SuccessIllustration kind="unshield" />}
        eyebrow={result?.kind === 'shield' ? 'Shield complete' : 'Unshield complete'}
        title={result?.kind === 'shield' ? 'Everything is confidential now' : `Unshielded ${resultAmount} ${result?.asset ?? sym}`}
        body={result?.kind === 'shield' ? `${resultAmount} ${result.asset} is now f${result.asset}. Your balance is sealed, and only you can read it.` : `The ${result?.asset ?? sym} is back in your public wallet balance.`}
        secondaryLabel={result?.kind === 'shield' ? 'Shield more' : 'View activity'}
        onSecondary={() => { const kind = result?.kind; close(); if (kind === 'unshield') { act.set({ activityOpen: true }); location.hash = '#activity' } }}
        transaction={!mobile && result?.kind === 'shield' && explorer ? <a href={explorer + '/tx/' + hash} target="_blank" rel="noopener noreferrer">Transaction 0x9f2c…a83e ↗</a> : undefined}>
        {result?.kind === 'shield' ? <div>
          <div className="flex items-center justify-between gap-3 border border-line bg-surface2 p-4">
            <div className="min-w-0"><p className="text-body text-ink3">Confidential balance</p><Masked value={result.amount} hidden={!revealed || s.permit !== 'active'} dec={result.asset === 'ETH' ? 4 : 2} className="mt-1 text-title text-accentInk" /> <span className="text-accentInk">f{result.asset}</span></div>
            <Button size={44} variant="secondary" onClick={() => s.permit !== 'active' ? act.renew() : setRevealed(!revealed)}>{revealed ? 'Hide' : 'Reveal'}</Button>
          </div>
          <p className="mt-2 text-center text-body text-ink3">Reveal shows {revealed ? fmtPrivate(result.amount) : '[*******]'} f{result.asset} to you only, with your permit.</p>
        </div> : result && <dl className="divide-y divide-line bg-surface2 px-4 text-body">
          <div className="flex justify-between gap-3 py-3"><dt className="text-ink3">Claimed</dt><dd>{resultAmount} {result.asset}</dd></div>
          <div className="flex justify-between gap-3 py-3"><dt className="text-ink3">Confidential balance</dt><dd><Masked value={s.balances[result.asset].priv} hidden={masked} dec={dec} /> f{result.asset}</dd></div>
          <div className="flex justify-between gap-3 py-3"><dt className="text-ink3">Transaction</dt><dd>{explorer ? <a href={explorer + '/tx/' + hash} target="_blank" rel="noopener noreferrer" className="text-accentInk">0x5d10…c7e2 ↗</a> : '0x5d10…c7e2'}</dd></div>
        </dl>}
      </SuccessModal>
    </>
  )
}
