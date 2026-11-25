import { Sep, separate } from '../ui/Sep'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useMotion } from '../lib/motion'
import { ActionRow, Page } from '../shell/AppShell'
import { fmtPrivate, fmtUsd } from '../lib/format'
import { copy, data, isMasked, nav, usd, useStore } from '../state/store'
import ActivityList from '../ui/ActivityList'
import Button from '../ui/Button'
import Chip from '../ui/Chip'
import Icon from '../ui/Icon'
import Masked from '../ui/Masked'
import RatioBar from '../ui/RatioBar'
import TokenRow from '../ui/TokenRow'

import { HERO_GRADIENT } from '../config/flags'
import { portfolioBalance, portfolioSymbols } from '../config/assets'

const card = 'dashboard-card border border-line bg-surface'
const HISTORY_KEY = 'fhenix.history'
const SYMS = portfolioSymbols

export default function Dashboard() {
  const { s, act, mobile } = useStore()
  const [showZero, setShowZero] = useState(false)
  const masked = isMasked(s)
  const u = usd(s.balances)
  const total = u.pub + u.priv
  const net = data.networks[s.networkIdx]
  const empty = total === 0
  const zeros = SYMS.filter(sym => { const balance = portfolioBalance(s.balances, sym); return balance.pub === 0 && balance.priv === 0 })
  const displayed = empty || showZero ? SYMS : SYMS.filter(sym => !zeros.includes(sym))
  const pad = mobile ? 'py-4' : 'p-5'
  const { t } = useMotion()
  const tab = s.activityOpen ? 'Activity' : 'Tokens'
  useEffect(() => {
    const openActivity = () => {
      if (location.hash === '#activity' || location.hash === '#/activity') act.set({ activityOpen: true })
    }
    openActivity()
    window.addEventListener('hashchange', openActivity)
    return () => window.removeEventListener('hashchange', openActivity)
  }, [act])
  const selectTab = (label: string) => {
    if (label === 'Tokens' && /^#\/?activity$/.test(location.hash)) window.history.replaceState(null, '', '#/dashboard')
    act.set({ activityOpen: label === 'Activity' })
  }
  const permitCta = s.permit === 'expired' ? 'Renew' : 'Create permit'

  return (
    <Page>
      <div className="flex flex-col gap-6">
        {s.pendingUnshield && s.unshieldStep >= 3 && <div className="flex items-center justify-between gap-3 border border-line bg-accentSoft p-4 text-body"><span>1 unshield ready to claim</span><Button size={44} disabled={s.busy} onClick={act.claim}>{s.busy ? 'Claiming…' : 'Claim'}</Button></div>}
        {s.permit !== 'active' && !empty && (
          <div data-tour="permit-banner" className={`flex items-center gap-3 ${s.permit === 'expired' ? 'bg-dangerSoft' : 'border border-line bg-surface'} ${mobile ? 'p-3 pl-4' : 'px-5 py-3'}`} role="status">
            <Icon name="permit-key" className={s.permit === 'expired' ? 'text-danger' : 'text-accentInk'} />
            <p className="flex-1 text-body  text-ink">{s.permit === 'expired' ? copy.expired : copy.none}</p>
            <Button size={44} onClick={act.renew}>
              {permitCta}
            </Button>
          </div>
        )}

        <section data-tour="hero" data-hero-gradient={HERO_GRADIENT} className={`${card} overview-hero ${pad}`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow text-ink3">Net worth</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Masked value={total} hidden={masked && !empty} bare prefix="$" className={`font-medium  ${mobile ? 'text-value ' : 'text-value '}`} />
            {!mobile && <Button size={48} arrow className="overview-shield ml-auto w-[168px]" onClick={() => nav('shield')}>Shield</Button>}
          </div>
          {mobile ? <div className="mt-4"><Button full size={52} arrow className="overview-shield" onClick={() => nav('shield')}>Shield</Button></div> : <p className="mt-2 text-body text-ink3">{separate(empty ? `No balances yet\u001f${net.name}` : `2 assets\u001f${net.name}${net.unsupported ? '' : ' Sepolia'}`)}</p>}
          <div className={mobile ? 'mt-4' : 'mt-6'}>
            <RatioBar priv={u.priv} pub={u.pub} hidden={masked && !empty} compact={mobile} />
          </div>
        </section>


        <section className={`${card} ${pad}`}>
          <div className="flex items-center justify-between gap-3">
            <div role="tablist" aria-label="Overview details" className="flex gap-6" onKeyDown={event => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              const next = event.key === 'Home' ? 'Tokens' : event.key === 'End' ? 'Activity' : tab === 'Tokens' ? 'Activity' : 'Tokens'
              selectTab(next)
              document.getElementById(`overview-tab-${next}`)?.focus()
            }}>
              {['Tokens', 'Activity'].map(label => <button key={label} id={`overview-tab-${label}`} type="button" role="tab" aria-selected={label === tab} aria-controls="overview-panel" tabIndex={label === tab ? 0 : -1} onClick={() => selectTab(label)} className={`min-h-10 border-b-2 text-body ${label === tab ? 'border-accent text-ink' : 'border-transparent text-ink3'}`}>{label}</button>)}
            </div>
          </div>
          <div id="overview-panel" role="tabpanel" aria-labelledby={`overview-tab-${tab}`}>
          {tab === 'Activity' ? <ActivityList items={s.activity} hidden={masked} /> : net.unsupported ? (
            <p className="mt-4 flex items-start gap-2 bg-surface2 p-4 text-body  text-ink2" role="status">
              <Icon name="info" className="mt-0.5 text-ink3" />
              {copy.unsupported.replace('{network}', net.name)}
            </p>
          ) : (
            <>
              {!mobile && (
                <div className="token-grid eyebrow mt-4 text-ink3" >
                  <span>Asset</span>
                  <span>Confidential</span>
                  <span>Public</span>
                  <span />
                </div>
              )}
              {mobile && <div className="eyebrow mt-3 flex flex-wrap gap-4 text-ink3"><span className="flex items-center gap-2"><span className="size-2 bg-accent" />Confidential</span><span className="flex items-center gap-2"><span className="size-2 bg-lineStrong" />Public</span></div>}
              <div className="mt-1">
                {displayed.map(sym => (
                  <TokenRow zero={zeros.includes(sym)} key={sym} sym={sym} pub={portfolioBalance(s.balances, sym).pub} priv={portfolioBalance(s.balances, sym).priv} hidden={masked} mobile={mobile} onClick={() => act.openSheet('token', sym)} />
                ))}
              </div>
              {!empty && zeros.length > 0 && <button type="button" aria-expanded={showZero} onClick={() => setShowZero(!showZero)} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 border-t border-line text-body text-ink3">{showZero ? 'Hide tokens with 0 balance' : `Show tokens with 0 balance (${zeros.length})`}<Icon name="chevron-down" size={14} className={showZero ? 'rotate-180' : ''} /></button>}
            </>
          )}
          </div>
        </section>

      </div>
    </Page>
  )
}
