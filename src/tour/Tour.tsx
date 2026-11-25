import { Sep, separate } from '../ui/Sep'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useLayoutEffect, useState } from 'react'
import tokens from '../assets/tokens.json'
import PrivateNow from '../illus/PrivateNow'
import { M, useMotion } from '../lib/motion'
import { TOUR_ROUTES, copy, nav, useRoute, useStore } from '../state/store'
import Button from '../ui/Button'
import Icon from '../ui/Icon'

type Rect = { x: number; y: number; w: number; h: number }
const PAD = M.coachmark.pad
const ANCHORS = ['[data-tour="hero"]', '[data-tour="permit-banner"]', '[data-tour="shield-form"]', '']
const CARD_W = 320

/** 4 coachmarks with a spotlight cut-out. Esc = skip (confirm). Leaving mid-tour pauses it. */
export default function Tour() {
  const { s, act, mobile } = useStore()
  const route = useRoute()
  const { t } = useMotion()
  const { status, step } = s.tour
  const active = status === 'active' && !s.sheet
  const [rect, setRect] = useState<Rect | null>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [confirm, setConfirm] = useState(false)

  // leaving the step's screen pauses the tour
  useEffect(() => {
    if (status === 'active' && route !== TOUR_ROUTES[step]) act.set({ tour: { status: 'paused', step } })
  }, [status, step, route, act])

  useEffect(() => setConfirm(false), [step, status])

  useLayoutEffect(() => {
    if (!active) return
    const root = document.getElementById('app-root')
    if (!root) return
    let scrolled = false
    const measure = () => {
      const o = root.getBoundingClientRect()
      setBox(b => (b.w === o.width && b.h === o.height ? b : { w: o.width, h: o.height }))
      const el = ANCHORS[step] ? (root.querySelector(ANCHORS[step]) ?? (step === 1 ? root.querySelector(ANCHORS[0]) : null)) : null
      if (!el) return setRect(null)
      if (!scrolled) {
        scrolled = true
        el.scrollIntoView({ block: 'nearest' })
      }
      const r = el.getBoundingClientRect()
      const next = { x: r.left - o.left - PAD, y: r.top - o.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 }
      setRect(p => (p && Math.abs(p.x - next.x) < 0.5 && Math.abs(p.y - next.y) < 0.5 && Math.abs(p.w - next.w) < 0.5 && Math.abs(p.h - next.h) < 0.5 ? p : next))
    }
    measure()
    const iv = setInterval(measure, 200)
    addEventListener('resize', measure)
    document.addEventListener('scroll', measure, true)
    return () => {
      clearInterval(iv)
      removeEventListener('resize', measure)
      document.removeEventListener('scroll', measure, true)
    }
  }, [active, step, route, s.permit])

  useEffect(() => {
    if (!active) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setConfirm(true)
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [active])

  if (status === 'paused')
    return (
      <div className="absolute left-1/2 z-30 flex -translate-x-1/2 items-center border border-line bg-surface shadow-[0_8px_24px_rgb(var(--shadow-ink)_/_.12)]" style={{ bottom: mobile ? tokens.size.tabBar + 12 : 24 }}>
        <button type="button" onClick={() => act.tourGo(step)} className="flex h-11 items-center gap-2 whitespace-nowrap pl-4 pr-3 text-body font-medium">
          <span className="h-2 w-2 bg-accent" />
          Resume tour <Sep /> Step {step + 1} of 4
        </button>
        <button type="button" aria-label="End tour" onClick={() => act.tourEnd('idle')} className="flex h-11 w-10 items-center justify-center border-l border-line text-ink3 hover:text-ink">
          <Icon name="close" size={14} />
        </button>
      </div>
    )
  if (!active) return null

  const [title, body] = copy.tutorial[step]
  const centred = step === 3 || !rect
  const cardW = mobile ? box.w - 32 : CARD_W
  // dock below the anchor, else above, else beside / pinned
  let pos: React.CSSProperties = {}
  if (!centred && rect) {
    const below = box.h - (rect.y + rect.h)
    const left = Math.max(16, Math.min(rect.x, box.w - cardW - 16))
    const need = mobile ? 250 : 220
    if (!mobile && step === 2 && rect.x + rect.w + 12 + cardW < box.w) pos = { left: rect.x + rect.w + 12, top: Math.max(16, rect.y) }
    else if (below >= need + (mobile ? tokens.size.tabBar : 0)) pos = { left, top: rect.y + rect.h + 12 }
    else if (rect.y >= need) pos = { left, bottom: box.h - rect.y + 12 }
    else pos = { left, bottom: mobile ? tokens.size.tabBar + 12 : 24 }
  }

  const skip = (
    <button type="button" onClick={() => setConfirm(true)} className="px-2 py-2 text-body font-medium text-ink3 hover:text-ink">
      Skip tour
    </button>
  )
  const actions = confirm ? (
    <>
      <span className="mr-1 text-body font-medium">Skip the tour?</span>
      <Button size={44} variant="secondary" onClick={() => act.tourEnd('idle')} className="!text-body">
        Skip
      </Button>
      <Button size={44} variant="text" onClick={() => setConfirm(false)} className="!text-body">
        Keep going
      </Button>
    </>
  ) : step === 0 ? (
    <>
      <Button size={44} onClick={act.tourNext} className="!text-body">
        Next
      </Button>
      {skip}
    </>
  ) : step === 1 ? (
    s.permit === 'active' ? (
      <>
        <Button size={44} onClick={act.tourNext} className="!text-body">
          Next
        </Button>
        {skip}
      </>
    ) : (
      <>
        <Button size={44} disabled={s.signing} onClick={() => act.openSheet('permit')} className="!px-4 !text-body">
          Create permit
        </Button>
        <Button size={44} variant="secondary" busy={s.signing} disabled={s.signing} onClick={() => act.openSheet('permit')} className="!px-4 !text-body">
          Show me
        </Button>
        {skip}
      </>
    )
  ) : step === 2 ? (
    <>
      <Button size={44} disabled={s.busy} onClick={() => act.tourShield(false)} className="!px-4 !text-body">
        Shield 10 USDC
      </Button>
      <Button size={44} variant="secondary" busy={s.busy} disabled={s.busy} onClick={() => act.tourShield(false)} className="!px-4 !text-body">
        Show me
      </Button>
      {skip}
    </>
  ) : (
    <>
      <Button size={44} onClick={() => (act.tourEnd('done'), nav('dashboard'))} className="!text-body">
        Go to dashboard
      </Button>
      <button type="button" onClick={act.tourStart} className="px-2 py-2 text-body font-medium text-ink3 hover:text-ink">
        Replay tour
      </button>
    </>
  )

  const cut = rect && !centred ? rect : { x: box.w / 2, y: box.h / 2, w: 0, h: 0 }
  return (
    <div className="absolute inset-0 z-30">
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="var(--mask-white)" />
            <rect fill="var(--mask-black)" x={cut.x} y={cut.y} width={cut.w} height={cut.h} />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill='var(--scrim)' mask="url(#tour-mask)" />
        {!centred && (
          <rect fill="none" stroke="var(--color-accent)" strokeWidth="2" x={cut.x} y={cut.y} width={cut.w} height={cut.h} />
        )}
      </svg>
      <div className={centred ? 'absolute inset-0 flex items-center justify-center p-4' : ''}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            role="dialog"
            aria-label={`Tour step ${step + 1} of 4: ${title}`}
            aria-live="polite"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: t(M.coachmark.cardMs) }}
            className={`border-2 border-accent bg-surface p-5 shadow-[0_16px_48px_rgb(var(--shadow-ink)_/_.2)] ${centred ? 'relative' : 'absolute'}`}
            style={{ width: centred ? Math.min(mobile ? box.w - 32 : 400, 400) : cardW, ...pos }}
          >
            {step === 3 && (
              <div className="mb-4 flex justify-center bg-stage">
                <PrivateNow scale={0.42} />
              </div>
            )}
            {step === 2 && <div className="mb-3 inline-flex border border-warn px-2 py-1 text-caption text-warn">PRACTICE<Sep />no real funds</div>}
            <div className="eyebrow text-accentInk">Step {step + 1} of 4</div>
            <h2 className="mt-2 text-title font-medium  ">{title}</h2>
            <p className="mt-2 text-body  text-ink2">{body}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">{actions}</div>
            <div className="mt-4 flex gap-1.5" aria-hidden>
              {[0, 1, 2, 3].map(i => (
                <span key={i} className={`h-1.5 w-1.5 ${i === step ? 'bg-accent' : i < step ? 'bg-navy' : 'bg-line'}`} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
