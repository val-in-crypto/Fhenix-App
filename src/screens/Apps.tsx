import { useRef, useState, type ReactNode } from 'react'
import enterLive from '../assets/apps/enter-live.svg'
import enterSoon from '../assets/apps/enter-soon.svg'
import enterDocs from '../assets/apps/enter-docs.svg'
import { useTheme } from '../lib/theme'
import { DOCS_URL } from '../config/links'
import { APPS_DESKTOP_CAROUSEL } from '../config/flags'
import { Page } from '../shell/AppShell'
import { data, useStore } from '../state/store'
import { separate } from '../ui/Sep'
import Icon from '../ui/Icon'
import AppLogo from '../ui/AppLogo'
import SegmentedSwitch from '../ui/SegmentedSwitch'

const descriptions: Record<string, string> = {
  AlphaEngine: 'Confidential DeFi execution that hides trade intents and strategy details to reduce MEV.',
  Obolos: 'Protocol-level compliance for tokenized equity: accreditation, jurisdiction, transfer and cap-table rules.',
  'Confidential Trading': 'Trade confidential FHERC20 tokens. Public prices, bracketed sizes.',
  Fluton: 'Privacy middleware and SDK for existing wallets and dApps: confidential transfers and swaps.',
  Privara: 'Stablecoin payments for merchant checkout, with confidential escrow and programmable settlement.',
}

const categories: Record<string,string> = { AlphaEngine:'Trading\u001fExecution', Obolos:'Compliance', 'Confidential Trading':'Trading', Fluton:'Infra\u001fSDK', Privara:'Payments' }
const ActionGlyph = ({kind}:{kind:'live'|'soon'|'docs'}) => <span aria-hidden className={`inline-flex size-4 shrink-0 items-center ${kind==='soon'?'text-ink3':''}`}><span className="block bg-current" style={{width:10,height:15,mask:`url(${kind==='live'?enterLive:kind==='soon'?enterSoon:enterDocs}) center / contain no-repeat`,WebkitMask:`url(${kind==='live'?enterLive:kind==='soon'?enterSoon:enterDocs}) center / contain no-repeat`}}/></span>

function BuildCard() {
  return <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className="apps-build flex flex-col gap-4 border border-dashed border-line p-5 hover:border-accent">
    <span className="flex items-center gap-3"><AppLogo app="CoFHE" variant="apps-v3"/><span><span className="block text-heading">Build on CoFHE</span><span className="mt-0.5 block text-caption text-ink3">For builders</span></span></span>
    <span className="min-h-[60px] text-body text-ink2">Ship an app with confidential state and get listed in Fhenix App.</span>
    <span className="mt-auto flex w-full items-center justify-between gap-2 border-t border-line pt-4 text-label text-accentInk">Read the docs<ActionGlyph kind="docs"/></span>
  </a>
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
        <span className="text-caption text-ink3" aria-live="polite">{page === 0 ? '1–3' : '4–6'} / 6</span>
        <div className="ml-auto flex gap-2"><button type="button" aria-label="Previous apps" disabled={page === 0} onClick={() => go(0)} className="flex size-11 items-center justify-center border border-line text-ink disabled:text-ink3"><Icon name="chevron-down" className="rotate-90" size={16} /></button><button type="button" aria-label="Next apps" disabled={page === 1} onClick={() => go(1)} className="flex size-11 items-center justify-center border border-line text-ink disabled:text-ink3"><Icon name="chevron-down" className="-rotate-90" size={16} /></button></div>
      </div>}
  </div>
}

export default function Apps() {
  const { act, mobile } = useStore()
  const dark = useTheme()==='dark'
  const [filter,setFilter] = useState('all')
  const effectiveFilter=dark?filter:'all'
  const cards = data.apps.filter(app=>effectiveFilter==='all'||app.tag.toLowerCase()===effectiveFilter).map(app => <button key={app.name} type="button" onClick={() => act.toast({ kind: 'info', title: app.tag === 'Live' ? app.name : 'Coming soon' })} className="apps-card flex w-full flex-col gap-4 border border-line bg-surface p-5 text-left hover:border-accent">
    <span className="flex w-full items-center gap-3"><AppLogo app={app.name} variant="apps-v3"/><span className="min-w-0 flex-1"><span className="block text-heading">{app.name}</span><span className="mt-0.5 block text-caption text-ink3">{separate(categories[app.name])}</span></span><span className={`flex shrink-0 items-center gap-1.5 px-2 py-0.5 text-caption ${app.tag==='Live'?'bg-accentSoft text-accentInk':'bg-surface2 text-ink3'}`}><span aria-hidden className={`size-1.5 ${app.tag==='Live'?'bg-live':'bg-ink3'}`}/>{app.tag}</span></span>
    <span className="min-h-[60px] text-body text-ink2">{descriptions[app.name]}</span>
    <span className={`mt-auto flex w-full items-center justify-between gap-2 border-t border-line pt-4 text-label ${app.tag==='Live'?'apps-live-action':'text-ink2'}`}>{app.tag === 'Live' ? 'Open app' : 'Notify me'}<ActionGlyph kind={app.tag==='Live'?'live':'soon'}/></span>
  </button>)
  const allCards = [...cards, <BuildCard key="build" />]
  return <Page>
    {dark&&<div className="mb-6 flex flex-wrap items-end justify-between gap-4">{!mobile&&<div><h1 className="text-title">Apps</h1><p className="mt-1 text-body text-ink2">Confidential apps built on Fhenix CoFHE.</p></div>}<SegmentedSwitch label="App status" value={filter} onChange={setFilter} options={[{value:'all',label:'All 5'},{value:'live',label:'Live 2'},{value:'soon',label:'Soon 3'}]}/></div>}
    {!mobile && APPS_DESKTOP_CAROUSEL ? <CardsCarousel mobile={false}>{allCards}</CardsCarousel> : <div className={`grid items-stretch gap-4 ${mobile?'grid-cols-1':'grid-cols-2 min-[1400px]:grid-cols-3'}`}>{allCards}</div>}
    {dark&&<p className="mt-6 flex items-start gap-2 text-caption text-ink3"><Icon name="arrow-up-right" size={14}/>Live apps open their own site in a new tab. Check each app's terms before you connect.</p>}
  </Page>
}
