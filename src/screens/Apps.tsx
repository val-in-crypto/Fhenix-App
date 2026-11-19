import { useRef, useState, type ReactNode } from 'react'
import asterisk from '../assets/fhenix-asterisk.svg?raw'
import { DOCS_URL, EXPLORER_URL } from '../config/links'
import { APPS_DESKTOP_CAROUSEL } from '../config/flags'
import { Page } from '../shell/AppShell'
import { data, useStore } from '../state/store'
import { separate } from '../ui/Sep'
import ThemeSwitch from '../ui/ThemeSwitch'
import Chip from '../ui/Chip'
import Icon from '../ui/Icon'

const descriptions: Record<string, string> = {
  AlphaEngine: 'Confidential DeFi execution that hides trade intents and strategy details to reduce MEV.',
  Obolos: 'Protocol-level compliance for tokenized equity: accreditation, jurisdiction, transfer and cap-table rules.',
  'Confidential Trading': 'Trade confidential FHERC20 tokens. Public prices, bracketed sizes.',
  Fluton: 'Privacy middleware and SDK for existing wallets and dApps: confidential transfers and swaps.',
  Privara: 'Confidential payments built on CoFHE.',
}

function BuildCard() {
  return <div className="confidential-box flex h-[231px] flex-col gap-3 border border-[var(--color-confidential-border)] bg-accentSoft px-6 py-5">
    <span className="inline-flex h-6 [&>svg]:h-full [&>svg]:w-auto" aria-hidden dangerouslySetInnerHTML={{ __html: asterisk }} />
    <h2 className="text-[22px] font-semibold leading-7">Build on CoFHE</h2>
    <p className="line-clamp-2 text-[14px] leading-5 text-ink2">Ship an app with confidential state and get listed in Fhenix App.</p>
    <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex min-h-11 items-center font-medium text-accentInk">Read the docs <Icon name="arrow-up-right" size={14} /></a>
  </div>
}

function CardsCarousel({ children, mobile }: { children: ReactNode[]; mobile: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const [progress, setProgress] = useState(0)
  const go = (next: number) => {
    const element = ref.current
    if (!element) return
    const card = element.firstElementChild as HTMLElement | null
    const stride = (card?.offsetWidth ?? 0) + 20
    element.scrollTo({ left: next * 3 * stride, behavior: 'instant' })
    setPage(next)
  }
  return <div className="mt-4 min-w-0">
    <div ref={ref} role="region" aria-roledescription="carousel" aria-label="Apps" tabIndex={0} className={`no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-1 ${mobile ? '' : 'desktop-app-carousel'}`}
      onScroll={event => { const e = event.currentTarget; setProgress(e.scrollLeft / (e.scrollWidth - e.clientWidth || 1)); if (!mobile) setPage(e.scrollLeft > (e.scrollWidth - e.clientWidth) / 2 ? 1 : 0) }}
      onKeyDown={event => { if (!mobile && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); go(event.key === 'ArrowRight' ? 1 : 0) } }}>
      {children.map((child, index) => <div key={index} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${children.length}`} className={`snap-start shrink-0 ${mobile ? 'w-[280px]' : 'w-[calc((100%-104px)/3)]'}`}>{child}</div>)}
    </div>
    {mobile ? <div className="mt-3 h-0.5 bg-line"><span className="block h-full w-1/3 origin-left bg-accent" style={{ transform: `translateX(${progress * 200}%)` }} /></div>
      : <div className="mt-4 flex items-center gap-3">
        <div className="flex gap-2">{[0, 1].map(index => <button key={index} type="button" aria-label={`Apps page ${index + 1}`} aria-current={page === index ? 'page' : undefined} onClick={() => go(index)} className="flex size-6 items-center justify-center"><span className={`size-2 ${index === page ? 'bg-accent' : 'border border-ink3'}`} /></button>)}</div>
        <span className="mono text-[12px] text-ink3" aria-live="polite">{page === 0 ? '1–3' : '4–6'} / 6</span>
        <div className="ml-auto flex gap-2"><button type="button" aria-label="Previous apps" disabled={page === 0} onClick={() => go(0)} className="flex size-11 items-center justify-center border border-line text-ink disabled:text-ink3"><Icon name="chevron-down" className="rotate-90" size={16} /></button><button type="button" aria-label="Next apps" disabled={page === 1} onClick={() => go(1)} className="flex size-11 items-center justify-center border border-line text-ink disabled:text-ink3"><Icon name="chevron-down" className="-rotate-90" size={16} /></button></div>
      </div>}
  </div>
}

export default function Apps() {
  const { act, mobile } = useStore()
  const cards = data.apps.map(app => <button key={app.name} type="button" onClick={() => act.toast({ kind: 'info', title: app.tag === 'Live' ? app.name : 'Coming soon' })} className="flex h-[231px] w-full flex-col gap-2 border border-line bg-surface px-6 py-5 text-left hover:border-accent">
    <span className="flex w-full items-start justify-between"><span className="mono flex size-10 items-center justify-center border border-line bg-navy text-[12px] text-accent">{app.abbr}</span><Chip tone={app.tag === 'Live' ? 'live' : 'neutral'} dot={app.tag === 'Live'}>{app.tag}</Chip></span>
    <span className="text-[18px] font-semibold leading-6">{app.name}</span>
    <span className="line-clamp-2 text-[14px] leading-5 text-ink2">{descriptions[app.name]}</span>
    <span className="mono mt-auto flex items-center gap-2 text-[12px] font-medium">{app.tag === 'Live' ? 'ENTER' : 'NOTIFY ME'}<Icon name="pixel-arrow" size={10} /></span>
  </button>)
  const allCards = [...cards, <BuildCard key="build" />]
  return <Page>
    {mobile && <>
      <h2 className="eyebrow text-ink3">Ecosystem</h2>
      <ul className="mt-2 divide-y divide-line border border-line bg-surface px-4">
        {[{ label: 'fUSD', icon: 'fusd' }, { label: 'TGE', icon: 'tge' }].map(item => <li key={item.label} className="flex min-h-16 items-center gap-3 py-3"><Icon name={item.icon} /><span className="flex-1"><strong className="block font-semibold">{item.label}</strong><span className="text-[13px] text-ink3">Coming soon</span></span><Chip tone="neutral">Soon</Chip></li>)}
        <li><a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer" className="flex min-h-16 items-center gap-3 py-3"><Icon name="explorer" /><span className="min-w-0 flex-1"><strong className="block font-semibold">Fhenix Explorer</strong><span className="text-[12px] text-ink3">explorer.fhenix.io/status</span></span><Icon name="arrow-up-right" size={16} /></a></li>
      </ul>
      <h2 className="eyebrow mt-6 text-ink3">Apps</h2>
    </>}
    {mobile || APPS_DESKTOP_CAROUSEL ? <CardsCarousel mobile={mobile}>{allCards}</CardsCarousel> : <div className="grid grid-cols-3 gap-5">{allCards}</div>}
    <p className="mt-6 flex items-start gap-2 text-[13px] leading-5 text-ink3"><Icon name="arrow-up-right" size={14} />Live apps open their own site in a new tab. Check each app's terms before you connect.</p>
    {mobile && <div className="mt-6 border border-line bg-surface"><ThemeSwitch /></div>}
  </Page>
}
