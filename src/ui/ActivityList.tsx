import { Sep, separate } from './Sep'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useMotion } from '../lib/motion'
import type { Activity } from '../state/store'
import { useStore } from '../state/store'
import Button from './Button'
import Icon from './Icon'
import Masked from './Masked'

const FILTERS = ['All', 'Shield', 'Unshield', 'Send'] as const
type Filter = (typeof FILTERS)[number]
const match = (a: Activity, f: Filter) =>
  f === 'All' || (f === 'Shield' && a.kind === 'shield') || (f === 'Unshield' && a.kind.startsWith('unshield')) || (f === 'Send' && a.kind.startsWith('transfer'))
const iconOf = (k: string) => (k === 'shield' ? 'shield' : k === 'permit' ? 'check' : k.startsWith('transfer') ? 'send' : 'unlock')

export function FilterChips({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  return (
    <div className="flex bg-surface2 p-0.5" role="group" aria-label="Filter activity">
      {FILTERS.map(f => (
        <button key={f} type="button" aria-pressed={value === f} onClick={() => onChange(f)} className={`px-3 py-1.5 text-[12px] font-medium leading-4 ${value === f ? 'border border-line bg-surface text-ink' : 'border border-transparent text-ink3 hover:text-ink'}`}>
          {f}
        </button>
      ))}
    </div>
  )
}

type Props = { items: Activity[]; hidden: boolean }

export default function ActivityList({ items, hidden }: Props) {
  const { s, act } = useStore()
  const { t } = useMotion()
  const [filter, setFilter] = useState<Filter>('All')
  const [hideValues, setHideValues] = useState(() => {
    try { return sessionStorage.getItem('fhenix.activity.hideValues') === 'true' } catch { return false }
  })
  const toggleValues = () => {
    try { sessionStorage.setItem('fhenix.activity.hideValues', String(!hideValues)) } catch { /* session only */ }
    setHideValues(!hideValues)
  }
  const [limit, setLimit] = useState(20)
  const matched = items.filter(item => match(item, filter))
  const list = matched.slice(0, limit)

  return (
    <div className="mt-4">
      {items.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2"><FilterChips value={filter} onChange={value => { setFilter(value); setLimit(20) }} /><button type="button" className="min-h-11 text-[13px] font-medium text-accentInk" onClick={toggleValues}>{hideValues ? 'Show values' : 'Hide values'}</button></div>}
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <div className="text-[15px] font-medium">No activity yet</div>
          <div className="mt-1 text-[13px] text-ink3">Your shields, unshields and transfers will appear here.</div>
        </div>
      ) : (
        <ul className="mt-2">
          <AnimatePresence initial={false}>
            {list.map(a => (
              <motion.li
                key={a.id}
                layout="position"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: t(200) }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 py-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center ${a.kind === 'shield' || a.priv ? 'bg-accentSoft text-accentInk' : 'bg-surface2 text-ink2'}`}>
                    <Icon name={iconOf(a.kind)} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium leading-5">{a.label.replace(/privately/gi, 'confidentially')}</span>
                    <span className="block truncate text-[12px] leading-4 text-ink3">{separate(a.when)}</span>
                  </span>
                  <span className={`mono shrink-0 text-right text-[13px] font-medium leading-4 ${a.priv || a.amount?.includes('[') ? 'text-accentInk' : ''}`}>
                    {a.status === 'pending' ? (
                      <span className="bracket-pulse text-ink3">pending <Sep /> {a.amount}</span>
                    ) : a.priv ? (
                      <>
                        {a.priv.sign}
                        {hidden || hideValues ? <span>[•••]</span> : <Masked value={a.priv.value} hidden={false} dec={a.priv.unit.includes('ETH') ? 4 : 2} />} {a.priv.unit}
                      </>
                    ) : (
                      a.amount
                    )}
                  </span>
                  {a.id === s.pendingUnshield?.id && s.unshieldStep >= 3 ? <Button size={44} disabled={s.busy} onClick={act.claim}>{s.busy ? 'Claiming…' : 'Claim'}</Button> : <Icon name="arrow-up-right" className="text-ink3" />}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
          {list.length === 0 &&<li className="py-6 text-center text-[13px] text-ink3">Nothing here yet.</li>}
        </ul>
      )}

      {matched.length > limit && (
        <div className="pt-2 text-center">
          <button type="button" onClick={() => setLimit(limit + 20)} className="py-1 text-[13px] font-medium text-accentInk hover:underline">
            Show more activity
          </button>
        </div>
      )}
    </div>
  )
}
