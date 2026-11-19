import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useMotion } from '../lib/motion'
import { data } from '../state/store'
import Icon from '../ui/Icon'
import Field from '../ui/Field'
import { getAddress, isAddress } from 'viem'

export type Recipient = { address: string; name?: string; ens?: boolean; firstTime: boolean }

const { send, sendContacts, sendCopy: copy } = data
export const isEvmAddress = (value: string) => isAddress(value, { strict: false })
const ens = /^(?:[\p{L}\p{N}_-]+\.)+eth$/iu
const contacts = Object.entries(sendContacts).map(([label, address]): Recipient => ({
  address,
  name: isEvmAddress(label) || label.startsWith('0x') ? undefined : label,
  ens: ens.test(label),
  firstTime: false,
}))
const mira = { address: send.to.address, name: send.to.ens, ens: true, firstTime: send.to.firstTime }

export function resolveRecipient(value: string): Recipient | undefined {
  const query = value.trim().toLowerCase()
  const validAddress = isEvmAddress(value.trim())
  const saved = [mira, ...contacts].find(contact =>
    validAddress ? contact.address.toLowerCase() === query : contact.ens && contact.name?.toLowerCase() === query,
  )
  if (saved) return { ...saved, address: getAddress(saved.address.toLowerCase()) }
  if (validAddress) return { address: getAddress(query), firstTime: true }
  if (!ens.test(query)) return undefined

  // Stable mock resolution for additional ENS names.
  let hash = 2166136261
  for (const char of query) hash = Math.imul(hash ^ char.codePointAt(0)!, 16777619)
  const body = Array.from({ length: 5 }, (_, index) => {
    hash = Math.imul(hash ^ (index + 1), 16777619)
    return (hash >>> 0).toString(16).padStart(8, '0')
  }).join('')
  return { address: getAddress('0x' + body), name: query, ens: true, firstTime: true }
}

export const recipientLabel = (recipient: Recipient) => recipient.name ?? recipient.address

export function useRecipientField() {
  const [draft, setDraft] = useState('')
  const [recipient, setRecipient] = useState<Recipient>()
  const [invalid, setInvalid] = useState(false)
  const [typing, setTyping] = useState(false)

  const validate = (value: string) => {
    setTyping(false)
    const next = resolveRecipient(value)
    setRecipient(next)
    setInvalid(Boolean(value.trim() && !next))
  }

  useEffect(() => {
    if (!typing) return
    const timer = setTimeout(() => validate(draft), 300)
    return () => clearTimeout(timer)
  }, [draft, typing])

  const enter = (value: string) => {
    setDraft(value)
    validate(value)
  }

  return {
    draft, recipient, invalid, enter,
    validate: () => validate(draft),
    change: (value: string) => {
      setDraft(value)
      setInvalid(false)
      setTyping(true)
    },
    edit: () => {
      if (recipient) setDraft(recipient.ens ? recipientLabel(recipient) : recipient.address)
      setRecipient(undefined)
      setTyping(false)
    },
    clear: () => enter(''),
  }
}

export function FullAddress({ address, mobile }: { address: string; mobile: boolean }) {
  return (
    <span tabIndex={0} className={`mono block max-w-full overflow-x-auto whitespace-nowrap font-normal leading-5 ${mobile ? 'text-[12px]' : 'text-[13px]'}`} aria-label={address}>
      <span className="text-ink">{address.slice(0, 6)}</span><span className="text-ink3">{address.slice(6, -4)}</span><span className="text-ink">{address.slice(-4)}</span>
    </span>
  )
}

export function Identicon({ address, size }: { address: string; size: number }) {
  const hue = parseInt(address.slice(2, 6), 16) % 360 || 180
  return <span aria-hidden className="round recipient-identicon shrink-0" style={{ width: size, height: size, ['--identicon-hue' as string]: hue }} />
}

const iconButton = 'flex h-10 w-10 shrink-0 items-center justify-center border border-line text-ink hover:bg-surface2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accentInk'
const smallLabel = 'mono text-[12px] font-medium leading-4 text-ink3'

export function RecipientField({ field, mobile, warnings }: { field: ReturnType<typeof useRecipientField>; mobile: boolean; warnings: string[] }) {
  const { t } = useMotion()
  const { draft, recipient, invalid } = field
  const paste = async () => {
    let value = ''
    try { value = await navigator.clipboard.readText() } catch { /* sample value for the prototype */ }
    field.enter(value.trim() || send.to.ens)
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {recipient ? <h2 className="text-[18px] font-semibold">{copy.to}</h2> : <label htmlFor="send-to" className="text-[18px] font-semibold">{copy.to}</label>}
        <span className={smallLabel}>{copy.addressLabel}</span>
      </div>
      {recipient ? (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: t(200) }} className="flex flex-col gap-3 border border-line bg-surface p-4">
          <div className="flex items-center gap-3">
            <Identicon address={recipient.address} size={40} />
            <div className="min-w-0 flex-1">
              <div className="break-words text-[16px] font-semibold">{recipient.name ?? 'EVM address'}</div>
              {recipient.ens && <div className={smallLabel}>{copy.ens}</div>}
            </div>
            <button type="button" className="min-h-11 px-2 text-[15px] font-semibold text-accentInk hover:underline" onClick={field.edit}>{copy.edit}</button>
            <button type="button" className={iconButton} aria-label={copy.clear} onClick={field.clear}><Icon name="close" size={18} /></button>
          </div>
          <FullAddress address={recipient.address} mobile={mobile} />
          <p className="flex items-center gap-2 text-[14px] font-medium text-live"><Icon name="check" size={16} />{copy.valid}</p>
          {warnings.map(warning => <p key={warning} className="flex items-start gap-2 bg-surface2 p-3 text-[14px] leading-5 text-ink3"><Icon name="info" size={16} className="mt-0.5" />{warning}</p>)}
        </motion.div>
      ) : (
        <>
          <Field invalid={invalid} className="flex h-14 items-center bg-surface">
            <input
              id="send-to"
              autoFocus={!mobile}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={invalid}
              aria-describedby={invalid ? 'send-to-error' : 'send-to-helper'}
              value={draft}
              placeholder={copy.placeholder}
              onChange={event => field.change(event.target.value)}
              onPaste={event => { event.preventDefault(); field.enter(event.clipboardData.getData('text').trim()) }}
              onBlur={event => { if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) field.validate() }}
              onKeyDown={event => { if (event.key === 'Enter') field.validate() }}
              className={`h-full min-w-0 flex-1 bg-transparent px-4 outline-none placeholder:text-ink3 ${invalid ? 'mono' : ''} ${mobile ? 'text-[15px]' : 'text-[16px]'}`}
            />
            {draft ? <button type="button" aria-label={copy.clear} onClick={field.clear} className="field-segment shrink-0 text-ink2"><Icon name="close" size={18} /></button> : <button type="button" className="field-segment shrink-0 text-[14px] font-medium" onClick={() => void paste()}><Icon name="copy" size={16} />{copy.paste}</button>}
          </Field>
          <AnimatePresence initial={false}>
            {invalid && <motion.p id="send-to-error" role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: t(150) }} className="text-[15px] leading-5 text-danger">{copy.invalid}</motion.p>}
          </AnimatePresence>
          {!invalid && <p id="send-to-helper" className="text-[14px] leading-5 text-ink3">{copy.helper}</p>}
        </>
      )}
    </section>
  )
}
