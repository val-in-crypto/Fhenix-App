import { useEffect, useId, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { easeOut, useMotion } from '../lib/motion'
import { useStore } from '../state/store'
import Button from './Button'
import Icon from './Icon'

export default function SuccessModal({ open, onClose, illustration, eyebrow, title, body, children, secondaryLabel, onSecondary, transaction }: {
  open: boolean; onClose: () => void; illustration: ReactNode; eyebrow: string; title: string; body: ReactNode; children?: ReactNode;
  secondaryLabel: string; onSecondary: () => void; transaction?: ReactNode
}) {
  const { mobile } = useStore()
  const { t, reduced } = useMotion()
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const headline = useRef<HTMLHeadingElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    headline.current?.focus({ preventScroll: true })
    const key = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"]')
      if (dialogs[dialogs.length - 1] !== panel.current) return
      if (event.key === 'Escape') { event.stopPropagation(); close.current() }
      if (event.key !== 'Tab') return
      const targets = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],[tabindex="0"]') ?? [])
      if (!targets.length) return
      const current = targets.indexOf(document.activeElement as HTMLElement)
      if (current === -1 || !event.shiftKey && current === targets.length - 1 || event.shiftKey && current === 0) {
        event.preventDefault()
        targets[event.shiftKey ? targets.length - 1 : 0].focus()
      }
    }
    document.addEventListener('keydown', key, true)
    return () => {
      document.removeEventListener('keydown', key, true)
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>('main input:not([readonly])')?.focus({ preventScroll: true }))
    }
  }, [open])
  return (
    <AnimatePresence>
      {open && <div className={`absolute inset-0 z-40 flex ${mobile ? 'items-end' : 'items-center justify-center p-6 pl-[280px]'}`}>
        <motion.div className="absolute inset-0" style={{ background: 'var(--scrim)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: t(200) }} onClick={onClose} />
        <motion.div ref={panel} role="dialog" aria-modal="true" aria-labelledby={id} className={`relative flex min-h-0 flex-col border border-line bg-surface shadow-xl ${mobile ? 'w-full max-h-[calc(100%-56px)] px-6 pb-[max(32px,env(safe-area-inset-bottom))]' : 'max-h-full w-[520px] p-8'}`}
          initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 8 }} transition={{ duration: t(200), ease: easeOut }}
          drag={mobile && !reduced ? 'y' : false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: .3 }} onDragEnd={(_, info) => { if (info.offset.y > 70) onClose() }}>
          {mobile && <div className="flex shrink-0 justify-center py-2.5"><span className="h-1 w-10 bg-lineStrong" /></div>}
          <button type="button" aria-label="Close success" onClick={onClose} className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center bg-surface2 text-ink2"><Icon name="close" size={18} /></button>
          <div className="no-scrollbar flex min-h-0 flex-col items-center gap-4 overflow-y-auto pb-4 text-center">
            <div className={`shrink-0 ${mobile ? 'h-[162px] w-[216px]' : 'h-[240px] w-[320px]'}`}>{illustration}</div>
            <div className="text-caption font-medium  text-accentInk">{eyebrow}</div>
            <h2 ref={headline} id={id} tabIndex={-1} aria-live="polite" className={`outline-none ${mobile ? 'text-title ' : 'text-title '} font-medium`}>{title}</h2>
            <div className="text-body  text-ink2">{body}</div>
            {children && <div className="w-full text-left">{children}</div>}
          </div>
          <div className={`flex shrink-0 gap-2 ${mobile ? 'flex-col' : ''}`}>
            <Button size={mobile ? 52 : 48} full className={mobile ? 'shrink-0' : 'flex-1'} arrow onClick={onClose}>Done</Button>
            <Button size={mobile ? 52 : 48} full className={mobile ? 'shrink-0' : 'flex-1'} variant="secondary" onClick={onSecondary}>{secondaryLabel}</Button>
          </div>
          {transaction && <div className="mt-4 shrink-0 text-center text-caption text-ink3">{transaction}</div>}
        </motion.div>
      </div>}
    </AnimatePresence>
  )
}
