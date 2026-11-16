import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'
import tokens from '../assets/tokens.json'
import { M, easeOut, useMotion } from '../lib/motion'
import { useStore } from '../state/store'
import Icon from './Icon'

type Props = { open: boolean; onClose: () => void; label: string; width?: number; children: ReactNode }

const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** Mobile bottom sheet (grabber, drag to close) ⇄ desktop centred dialog. Same API for connect, permit, token detail, send review. */
export default function Sheet({ open, onClose, label, width = tokens.size.dialogWidth.default, children }: Props) {
  const { mobile } = useStore()
  const { t } = useMotion()
  const panel = useRef<HTMLDivElement>(null)
  const controls = useDragControls()
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const raf = requestAnimationFrame(() => panel.current?.focus({ preventScroll: true }))
    const onKey = (e: KeyboardEvent) => {
      const el = panel.current
      if (e.key === 'Escape') {
        e.stopPropagation()
        close.current()
      }
      if (e.key !== 'Tab' || !el) return
      const f = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!f.length) return e.preventDefault()
      const cur = document.activeElement
      if (!el.contains(cur) || cur === el) {
        e.preventDefault()
        ;(e.shiftKey ? f[f.length - 1] : f[0]).focus()
      } else if (e.shiftKey && cur === f[0]) {
        e.preventDefault()
        f[f.length - 1].focus()
      } else if (!e.shiftKey && cur === f[f.length - 1]) {
        e.preventDefault()
        f[0].focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey, true)
      prev?.focus?.()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className={`absolute inset-0 z-40 flex ${mobile ? 'items-end' : 'items-center justify-center p-6'}`}>
          <motion.div
            className="absolute inset-0"
            style={{ background: tokens.color.scrim }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: t(M.sheet.scrimMs) }}
            onClick={onClose}
          />
          {mobile ? (
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              tabIndex={-1}
              className="no-scrollbar relative max-h-[92%] w-full overflow-y-auto bg-white outline-none"
              initial={{ y: '100%' }}
              animate={{ y: 0, transition: { duration: t(M.sheet.openMs), ease: easeOut } }}
              exit={{ y: '100%', transition: { duration: t(M.sheet.closeMs), ease: 'easeIn' } }}
              drag="y"
              dragControls={controls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 1 }}
              onDragEnd={(_, info) => info.offset.y > 80 && onClose()}
            >
              <div className="flex cursor-grab touch-none justify-center pb-2.5 pt-2.5" onPointerDown={e => controls.start(e)} data-grabber>
                <span className="block h-1 w-10 bg-lineStrong" />
              </div>
              <div className="flex flex-col gap-5 px-6 pb-8">{children}</div>
            </motion.div>
          ) : (
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              tabIndex={-1}
              className="no-scrollbar relative flex max-h-full flex-col gap-6 overflow-y-auto bg-white p-8 shadow-[0_24px_64px_rgba(0,22,35,.18)] outline-none"
              style={{ width }}
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: t(M.dialog.ms) }}
            >
              {children}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  )
}

export function SheetClose({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" aria-label="Close" onClick={onClick} className="flex h-10 w-10 shrink-0 items-center justify-center bg-surface2 text-ink2 hover:bg-line">
      <Icon name="close" size={18} />
    </button>
  )
}
