import { Sep, separate } from './Sep'
import { AnimatePresence, motion } from 'framer-motion'
import tokens from '../assets/tokens.json'
import { M, useMotion } from '../lib/motion'
import { nav, useStore } from '../state/store'
import Icon from './Icon'

/** Desktop: bottom-right, 360 wide. Mobile: full width − 40, 12 above the tab bar. Max 3, auto-hide 3.2s. */
export default function Toasts() {
  const { s, act, mobile } = useStore()
  const { t } = useMotion()
  const from = mobile ? { opacity: 0, y: 16 } : { opacity: 0, x: 24 }
  return (
    <div
      className="pointer-events-none absolute z-50 flex flex-col gap-2"
      style={mobile ? { left: 20, right: 20, bottom: `calc(${tokens.size.tabBar + 12}px + env(safe-area-inset-bottom) + var(--action-bar-height, 0px))` } : { right: 32, bottom: 32, width: 360 }}
      aria-live="polite"
      role="status"
    >
      <AnimatePresence initial={false}>
        {s.toasts.map(x => {
          const fail = x.kind === 'fail'
          return (
            <motion.div
              key={x.id}
              layout
              initial={from}
              animate={{ opacity: 1, x: 0, y: 0, transition: { duration: t(M.toast.inMs) } }}
              exit={{ ...from, transition: { duration: t(M.toast.outMs) } }}
              transition={{ duration: t(M.toast.inMs) }}
              className="pointer-events-auto flex items-center gap-3 border border-line bg-surface2 py-3 pl-4 pr-3 shadow-[0_8px_24px_rgb(var(--shadow-ink)_/_.10)]"
              style={{ borderLeft: `3px solid ${fail ? 'var(--color-danger)' : x.kind === 'success' ? 'var(--color-accent)' : 'var(--color-line-strong)'}` }}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center ${fail ? 'bg-dangerSoft text-danger' : x.kind === 'success' ? 'bg-accent text-onAccent' : 'bg-surface2 text-ink2'}`}>
                <Icon name={fail ? 'alert' : x.kind === 'success' ? 'check' : 'info'} size={fail ? 16 : x.kind === 'success' ? 16 : 14} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-body font-medium ">{separate(x.title)}</div>
                {x.body && <div className="text-body  text-ink3">{separate(x.body)}</div>}
              </div>
              {x.action && (
                <button
                  type="button"
                  className="shrink-0 px-2 py-2 text-body font-medium text-accentInk hover:underline"
                  onClick={() => {
                    if (x.action?.route) nav(x.action.route)
                    act.dismissToast(x.id)
                  }}
                >
                  {x.action.label}
                </button>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
