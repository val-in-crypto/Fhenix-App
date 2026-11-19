import { animate, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { MASK, fmtUsd, fmtPrivate } from '../lib/format'
import { easeOut, useMotion } from '../lib/motion'

export function useCountUp(value: number, ms = 450) {
  const { t } = useMotion()
  const [v, setV] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const c = animate(from.current, value, { duration: t(ms), ease: 'easeOut', onUpdate: x => setV(x) })
    from.current = value
    return () => c.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return v
}

/** Encrypted vs public split. Hidden ⇒ neutral track, no private digits, no %. */
export default function RatioBar({ priv, pub, hidden, compact }: { priv: number; pub: number; hidden: boolean; compact?: boolean }) {
  const { t } = useMotion()
  const total = priv + pub
  const pct = total > 0 ? (priv / total) * 100 : 0
  const cPriv = useCountUp(priv)
  const cPub = useCountUp(pub)
  const cPct = useCountUp(pct)
  const num = compact ? 'text-[15px] leading-5' : 'text-[19px] leading-6'
  const grow = { duration: t(280), ease: easeOut }
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow text-accentInk" style={compact ? { fontSize: 11 } : undefined}>Confidential</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`${num} font-semibold tabular-nums`}>{hidden ? MASK : fmtPrivate(cPriv)}</span>
            {!hidden && <span className="mono text-[12px] text-ink3">{cPct.toFixed(1)}%</span>}
          </div>
        </div>
        <div className="min-w-0 text-right">
          <div className="eyebrow text-ink3" style={compact ? { fontSize: 11 } : undefined}>Public</div>
          <div className="mt-2 flex items-baseline justify-end gap-2">
            {!hidden && <span className="mono text-[12px] text-ink3">{(total > 0 ? 100 - cPct : 0).toFixed(1)}%</span>}
            <span className={`${num} font-semibold tabular-nums`}>{fmtUsd(cPub)}</span>
          </div>
        </div>
      </div>
      <div className="mt-2 flex h-2 w-full gap-0.5 bg-transparent" role="img" aria-label={hidden ? 'Balance split hidden' : `${pct.toFixed(1)}% confidential`}>
        {hidden || total === 0 ? (
          <div className="h-full w-full bg-line" />
        ) : (
          <>
            <motion.div className="hatch h-full bg-accent" style={{ width: `${pct}%`, originX: 0 }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={grow} />
            <motion.div className="h-full bg-line" style={{ width: `${100 - pct}%`, originX: 0 }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={grow} />
          </>
        )}
      </div>
    </div>
  )
}
