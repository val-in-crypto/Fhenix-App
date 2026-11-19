import { motion } from 'framer-motion'
import { M, easeInOut, useMotion } from '../lib/motion'
import Icon from './Icon'

type Step = { label: string; sub?: string }
type Props = {
  steps: Step[]
  /** index of the step in progress; steps before it are done; = steps.length ⇒ all done */
  active: number
  /** 'line' = numbered tiles joined by a line (shield) · 'bars' = 3px bars with 01/02/03 labels (unshield, send) */
  variant?: 'line' | 'bars'
}

export default function Stepper({ steps, active, variant = 'bars' }: Props) {
  const { t } = useMotion()
  const fill = { duration: t(280), ease: easeInOut }

  if (variant === 'line')
    return (
      <ol className="flex items-center gap-3" aria-label="Progress">
        {steps.map((st, i) => {
          const done = i < active
          const on = i === active
          return (
            <li key={st.label} className={`flex items-center gap-3 ${i < steps.length - 1 ? 'flex-1' : ''}`} aria-current={on ? 'step' : undefined}>
              <span
                className={`mono flex h-5 w-5 shrink-0 items-center justify-center text-[11px] font-medium ${done ? 'bg-accent text-onAccent' : on ? 'bg-navy text-onNavy' : 'border border-lineStrong bg-surface text-ink3'}`}

              >
                {done ? <Icon name="check" size={14} /> : i + 1}
              </span>
              <span className={`whitespace-nowrap text-[13px] leading-[18px] ${done || on ? 'font-medium text-ink' : 'text-ink3'}`}>
                {st.label}
              </span>
              {i < steps.length - 1 && (
                <span className="relative h-px flex-1 bg-line">
                  <motion.span className="absolute inset-0 origin-left bg-accent" style={{ height: 2, top: -0.5 }} initial={false} animate={{ scaleX: done ? 1 : 0 }} transition={fill} />
                </span>
              )}
            </li>
          )
        })}
      </ol>
    )

  return (
    <ol className="flex gap-1" aria-label="Progress">
      {steps.map((st, i) => {
        const done = i < active
        const on = i === active
        return (
          <li key={st.label} className="min-w-0 flex-1" aria-current={on ? 'step' : undefined}>
            <div className="relative h-[3px] bg-line">
              <motion.div className="absolute inset-0 origin-left bg-accent" initial={false} animate={{ scaleX: on || done ? 1 : 0 }} transition={fill} />
              <motion.div className="absolute inset-0 bg-navy" initial={false} animate={{ opacity: done ? 1 : 0 }} transition={{ duration: t(200) }} />
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[13px] leading-[18px]">
              <span className="mono text-[12px] text-accentInk">{String(i + 1).padStart(2, '0')}</span>
              <span className={`truncate ${done || on ? 'font-medium text-ink' : 'text-ink3'}`}>{st.label}</span>
              {done && <Icon name="check" size={14} className="text-accentInk" />}
            </div>
            {st.sub && <div className="mt-1 truncate text-[12px] leading-4 text-ink3">{st.sub}</div>}
          </li>
        )
      })}
    </ol>
  )
}
