import { Sep, separate } from '../ui/Sep'
import { motion, useAnimationControls } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FullAddress, Identicon, RecipientField, isEvmAddress, resolveRecipient, useRecipientField, type Recipient } from '../components/RecipientField'
import { fmtPrivate, fmtPublic, fmtUsd } from '../lib/format'
import { easeOut, useMotion } from '../lib/motion'
import { EXPLORER_URL, Page } from '../shell/AppShell'
import { data, isMasked, nav, prices, useStore, type Sym } from '../state/store'
import AmountBox from '../ui/AmountBox'
import Button from '../ui/Button'
import ChainIcon from '../ui/ChainIcon'
import SuccessModal from '../ui/SuccessModal'
import SuccessIllustration from '../illus/SuccessIllustration'
import Icon from '../ui/Icon'
import { TOKEN_NETWORKS, TX_HASHES } from '../config/tokens'
import SegmentedSwitch from '../ui/SegmentedSwitch'
import Masked from '../ui/Masked'

const { send, sendCopy: copy } = data
const secondary = 'text-ink3'
const balanceModes = ['priv', 'pub'] as const
type BalanceMode = (typeof balanceModes)[number]
const balanceLabel = (mode: BalanceMode) => mode === 'priv' ? 'Confidential' : 'Public'
const query = () => new URLSearchParams(location.hash.split('?')[1] ?? location.search)

function BalanceSwitch({ value, onChange }: { value: BalanceMode; onChange: (mode: BalanceMode) => void }) {
  return <SegmentedSwitch label="Source balance" value={value} onChange={onChange} options={[{ value: 'priv', label: 'Confidential' }, { value: 'pub', label: 'Public' }]} />
}

function SendRows({ rows, highlightAmount, stackRecipient }: { rows: [string, ReactNode][]; highlightAmount?: boolean; stackRecipient?: boolean }) {
  return (
    <dl className="divide-y divide-line border-y border-line">
      {rows.map(([label, value]) => (
        <div key={label} className={`grid ${stackRecipient && label === copy.to ? 'grid-cols-1' : 'grid-cols-[minmax(64px,1fr)_minmax(0,3fr)]'} items-start gap-2 py-3 sm:gap-4 ${label === copy.to ? 'max-[1023px]:grid-cols-1' : ''} ${highlightAmount && label === 'Amount' ? 'confidential-box bg-accentSoft px-3' : ''}`}>
          <dt className={`pt-0.5 text-body  ${secondary}`}>{label}</dt>
          <dd className="min-w-0 break-words text-body ">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function RecipientSummary({ recipient, mobile, firstTime }: { recipient: Recipient; mobile: boolean; firstTime?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {(recipient.name || firstTime) && (
        <div className="flex flex-wrap items-center gap-2">
          {recipient.name && <span className="min-w-0 break-words font-medium">{recipient.name}</span>}
          {firstTime && <span className="bg-surface2 px-2 py-1 text-caption font-medium text-ink2">{copy.firstTime}</span>}
        </div>
      )}
      <FullAddress address={recipient.address} mobile={mobile} />
    </div>
  )
}

const displayAmount = (value: string, confidential: boolean) => {
  const decimals = Math.max(2, (value.split('.')[1] ?? '').replace(/0+$/, '').length)
  return confidential ? fmtPrivate(Number(value), decimals) : fmtPublic(Number(value), decimals)
}
const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`
const addressEnds = (address: string) => address.slice(0, 6) + address.slice(-4)

export default function Send() {
  const { s, act, mobile } = useStore()
  const { reduced, speed } = useMotion()
  const field = useRecipientField()
  const [amount, setAmount] = useState('')
  const [result, setResult] = useState<{ recipient: Recipient; amount: string; confidential: boolean; sym: Sym; networkIdx: number }>()
  const [mode, setMode] = useState<BalanceMode>(() => query().get('mode') === 'public' ? 'pub' : 'priv')
  const [review, setReview] = useState(false)
  const [permitRequested, setPermitRequested] = useState(false)
  const content = useRef<HTMLDivElement>(null)
  const animation = useAnimationControls()
  const sent = s.sendStep === 3
  const pending = s.sendStep !== 0 && !sent
  const reviewing = !sent && (review || pending)
  useEffect(() => {
    const readMode = () => setMode(query().get('mode') === 'public' ? 'pub' : 'priv')
    window.addEventListener('hashchange', readMode)
    return () => window.removeEventListener('hashchange', readMode)
  }, [])
  const storedRecipient = (): Recipient => {
    const address = isEvmAddress(s.sendTo) ? s.sendTo : resolveRecipient(s.sendTo)?.address ?? send.to.address
    return { address, name: s.sendRecipientName ?? resolveRecipient(s.sendTo)?.name, firstTime: resolveRecipient(address)?.firstTime ?? true }
  }
  const recipient = sent || pending ? storedRecipient() : field.recipient
  const value = sent || pending ? s.amt.send : amount
  const numericAmount = Number(value) || 0
  const activeMode = sent || pending ? s.sendBalance : mode
  const confidential = activeMode === 'priv'
  const sym: Sym = sent || pending ? s.sendAsset : (query().get('token') ?? query().get('asset')) === 'ETH' ? 'ETH' : 'USDC'
  const unit = confidential ? `f${sym}` : sym
  const balance = s.balances[sym][activeMode]
  const hasAmount = numericAmount > 0
  const over = numericAmount > balance
  const network = data.networks[(sent || pending ? s.sendNetworkIdx : undefined) ?? s.networkIdx]
  const screen = sent ? 'sent' : reviewing ? 'review' : 'form'
  const address = recipient?.address.toLowerCase() ?? ''
  const previous = s.activity.flatMap(item => item.recipientAddress ? [item.recipientAddress.toLowerCase()] : [])
  const known = [...Object.values(data.sendContacts), ...previous].map(value => value.toLowerCase())
  const lookalike = Boolean(address && known.some(value => value !== address && addressEnds(value) === addressEnds(address)))
  const firstTime = Boolean(recipient && !previous.includes(address))
  const warnings = [
    firstTime ? copy.firstTimeNote : '',
    address && address === s.address.toLowerCase() ? 'You are sending to your own account.' : '',
    address && data.sendContractAddresses.includes(address) ? 'This recipient is a contract. Check that it can receive this token.' : '',
    lookalike ? 'This address resembles a recent recipient, but its middle characters differ. Check the full address before continuing.' : '',
  ].filter(Boolean)
  const recipientName = recipient?.name ?? (recipient ? shortAddress(recipient.address) : '')
  const formatted = confidential && s.permit !== 'active' && (sent || pending) ? '[*******]' : displayAmount(value, confidential)
  const networkDisplay = <span className="flex items-center gap-2"><ChainIcon chainId={network.chainId} />{network.name}</span>

  useEffect(() => {
    if (s.sendStep !== 3) return
    setResult({ recipient: storedRecipient(), amount: s.amt.send, confidential: s.sendBalance === 'priv', sym: s.sendAsset, networkIdx: s.sendNetworkIdx ?? s.networkIdx })
    reset()
  }, [s.sendStep])

  useEffect(() => {
    if (reduced) {
      animation.set({ opacity: 1, y: 0 })
      return
    }
    animation.set({ opacity: 0, y: 8 })
    void animation.start({ opacity: 1, y: 0, transition: { duration: 0.2 / speed, ease: easeOut } })
  }, [animation, reduced, screen, speed])

  useEffect(() => {
    const scroller = content.current?.closest('[data-scroll]')
    if (scroller) scroller.scrollTop = 0
  }, [screen])

  const reset = () => {
    setReview(false)
    setPermitRequested(false)
    setAmount('')
    setMode('priv')
    field.clear()
    act.sendReset()
    history.replaceState(null, '', sym === 'ETH' ? '#/send?token=ETH' : '#/send')
  }
  const updateAmount = (next: string) => {
    if (/^\d*(?:\.\d{0,8})?$/.test(next)) setAmount(next)
  }
  const max = () => {
    if (confidential && s.permit !== 'active') return act.renew()
    setAmount(balance.toFixed(8).replace(/\.?0+$/, '') || '0')
  }
  const cta = (label: string, onClick: () => void, disabled = false) => (
    <Button size={mobile ? 52 : 48} full={mobile || !reviewing} arrow={!disabled} disabled={disabled} onClick={onClick} className={`${reviewing && !mobile ? 'flex-1' : 'shrink-0'} !text-body`}>
      {label}
    </Button>
  )
  const reviewActions = recipient && (
    <div className="flex flex-col gap-2">
      <div className={`flex gap-2 ${mobile ? 'flex-col' : ''}`}>
        {cta(
          s.sendStep === 1 ? copy.encrypting : s.sendStep === 2 ? copy.confirming : s.sendStep === 4 ? copy.sending : copy.confirm,
          () => {
            if (confidential && s.permit !== 'active') return act.renew()
            void act.sendOpen(recipient, value, activeMode, sym)
          },
          pending || s.signing || !hasAmount || over || lookalike,
        )}
        <Button size={48} variant="secondary" className={mobile ? 'shrink-0' : 'flex-1'} disabled={pending || s.signing} onClick={() => setReview(false)}>{copy.back}</Button>
      </div>
    </div>
  )
  const formAction = cta(
    field.invalid || lookalike ? copy.enterValid : !recipient ? copy.enterRecipient : !hasAmount ? copy.enterAmount : over ? 'Insufficient balance' : copy.review,
    () => setReview(true),
    !recipient || !hasAmount || over || lookalike,
  )
  const actions = reviewing ? reviewActions : formAction
  const note = reviewing ? copy.walletNote : !sent ? `${send.fee} network fee\u001f${confidential ? 'amount stays confidential' : 'amount visible on-chain'}` : null

  return (
    <>
    <Page desktopClassName="!pr-10 !pt-4" bottom={mobile && (
      <div className="flex flex-col gap-2">
        {actions}
        {note && <p className={`text-center text-body  ${secondary}`}>{separate(note)}</p>}
      </div>
    )}>
      <div ref={content} className={`mx-auto flex w-full max-w-[560px] flex-col gap-6 ${mobile ? '' : 'border border-line bg-surface p-8'}`}>
        <motion.div animate={animation} className="flex flex-col gap-6">
          {reviewing && recipient ? (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h1 className="text-title font-medium ">{copy.review}</h1>
                </div>
                {!mobile && <p className={`text-body  ${secondary}`}>{copy.reviewHelper}</p>}
              </div>
              <SendRows highlightAmount={confidential} rows={[
                [copy.from, <span className="flex items-center gap-2"><Identicon address={s.address} size={32} /><span><span className="block font-medium">{copy.account}</span><span className={`mono ${secondary}`}>{data.account.short}</span></span></span>],
                [copy.balance, <span className="flex items-center gap-2"><span className={`size-2 ${confidential ? 'bg-accent' : 'bg-lineStrong'}`} />{balanceLabel(activeMode)} {unit}</span>],
                [copy.to, <RecipientSummary recipient={recipient} mobile={mobile} firstTime={firstTime} />],
                ['Amount', <span className={`text-body inline-block font-medium ${confidential ? 'text-accentInk' : ''}`}>{formatted} {unit}</span>],
                [copy.network, <div className="flex flex-wrap items-center gap-1">{networkDisplay} <span className={secondary}><Sep />{copy.walletNetwork}</span></div>],
                [mobile ? copy.fee : copy.networkFee, send.fee],
              ]} />
              <p className={`flex items-start gap-2 bg-surface2 p-4 text-body  ${secondary}`}>
                <Icon name={confidential ? 'lock' : 'info'} size={18} className="mt-0.5" />{confidential ? copy.lockNote : 'Amount will be visible on-chain, along with the recipient.'}
              </p>
            </>
          ) : (
            <>
              <RecipientField field={field} mobile={mobile} warnings={warnings} />
              <section className="flex flex-col gap-2" aria-label="Amount">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-heading font-medium">Amount</h2>
                  <BalanceSwitch value={mode} onChange={setMode} />
                </div>
                <AmountBox
                  layout={mobile ? 'default' : 'send'}
                  label={copy.youSend}
                  balance={<>{copy.balance} {confidential ? <Masked value={balance} hidden={isMasked(s)} /> : fmtPublic(balance)}</>}
                  maxLabel={confidential && s.permit !== 'active' ? 'Create permit first' : undefined}
                  onMax={max}
                  value={amount}
                  onChange={updateAmount}
                  token={unit}
                  usd={fmtUsd(numericAmount * prices[sym])}
                  invalid={over && (!confidential || s.permit === 'active')}
                  confidential={confidential}
                  visibility={confidential ? undefined : 'Visible on-chain'}
                />
                          {over && (!confidential || s.permit === 'active') ? (
                  <p role="alert" className="text-body text-danger">Amount exceeds your {confidential ? 'confidential' : 'public'} balance of {confidential ? fmtPrivate(isMasked(s) ? undefined : balance) : fmtPublic(balance)} {unit}.</p>
                ) : recipient && hasAmount && <p className={`text-body  ${secondary}`}>{recipientName} receives {formatted} {unit}. {confidential ? `Only you and ${recipientName} can read the amount.` : 'The amount will be visible on-chain.'}</p>}
                {confidential && over && s.permit === 'active' && s.balances[sym].pub >= numericAmount - balance && <button type="button" className="min-h-11 text-left text-body font-medium text-accentInk" onClick={() => { act.selectFlowAsset(sym); location.hash = `#/shield?token=${sym}&amount=${(Math.ceil((numericAmount - balance) * 1e6) / 1e6).toFixed(6)}` }}>You have {fmtPublic(s.balances[sym].pub)} {sym} public. Shield it first →</button>}
              </section>
            </>
          )}
          {!mobile && actions}
        </motion.div>
      </div>
    </Page>
    <SuccessModal open={Boolean(result)} onClose={() => setResult(undefined)} illustration={<SuccessIllustration kind="sent" />} eyebrow="Send complete"
      title={result?.confidential ? 'Sent confidentially' : 'Sent'} body={result && `${result.recipient.name ?? shortAddress(result.recipient.address)} will see ${displayAmount(result.amount, result.confidential)} ${result.confidential ? 'f' : ''}${result.sym} in their ${result.confidential ? 'confidential' : 'public'} balance.`}
      secondaryLabel="Send another" onSecondary={() => setResult(undefined)}>
      {result && <div className="bg-surface2 px-3"><SendRows stackRecipient rows={[
        ['To', <RecipientSummary recipient={result.recipient} mobile={mobile} />],
        ['Amount', <span className={`text-body ${result.confidential ? 'text-accentInk' : ''}`}>{displayAmount(result.amount, result.confidential)} {result.confidential ? 'f' : ''}{result.sym}</span>],
        ['From', result.confidential ? 'Confidential balance' : 'Public balance'],
        ['Network', <span className="flex items-center gap-2"><ChainIcon chainId={data.networks[result.networkIdx].chainId} />{data.networks[result.networkIdx].name}</span>],
        ['Transaction', <a href={(TOKEN_NETWORKS[data.networks[result.networkIdx].chainId]?.explorer ?? EXPLORER_URL) + '/tx/' + TX_HASHES.send} target="_blank" rel="noopener noreferrer" className="mono inline-flex items-center gap-1 text-accentInk">{send.tx}<Icon name="arrow-up-right" size={14} /></a>],
      ]} /></div>}
    </SuccessModal>
    </>

  )
}
