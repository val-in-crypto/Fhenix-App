import { useEffect, useRef, useState } from 'react'
import { MASK, fmtPublic } from '../lib/format'
import { useMotion } from '../lib/motion'

type Props = {
  value?: number
  hidden: boolean
  dec?: number
  /** revealed value has no brackets (totals that mix public + private) */
  bare?: boolean
  prefix?: string
  /** decrypting: bracket pulse */
  pulse?: boolean
  className?: string
}

const scramble = () => '[' + Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('') + ']'

/** Encrypted value: hidden "[*******]" ⇄ revealed "[1,000.00]". Scrambles 300ms, settles with a 150ms crossfade. */
export default function Masked({ value, hidden, dec = 2, bare, prefix = '', pulse, className = '' }: Props) {
  const { reduced, speed } = useMotion()
  const off = hidden || value === undefined
  const target = off ? MASK : bare ? fmtPublic(value!, dec) : `[${fmtPublic(value!, dec)}]`
  const [txt, setTxt] = useState(target)
  const [op, setOp] = useState(1)
  const prev = useRef(off)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const was = prev.current
    prev.current = off
    if (reduced || was === off) {
      setTxt(target)
      setOp(1)
      return
    }
    const timers: number[] = []
    let iv = 0
    if (!off) {
      iv = window.setInterval(() => setTxt(scramble()), 50)
      timers.push(
        window.setTimeout(() => {
          clearInterval(iv)
          setOp(0)
          timers.push(window.setTimeout(() => (setTxt(target), setOp(1)), 75 / speed))
        }, 300 / speed),
      )
    } else {
      setOp(0)
      timers.push(window.setTimeout(() => (setTxt(target), setOp(1)), 100 / speed))
    }
    return () => {
      clearInterval(iv)
      timers.forEach(clearTimeout)
      setTxt(target)
      setOp(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [off, target])

  return (
    <span className={`inline-block whitespace-nowrap tabular-nums ${pulse ? 'bracket-pulse' : ''} ${className}`} aria-label={off ? 'hidden' : undefined}>
      {prefix}
      <span style={{ opacity: op, transition: `opacity ${reduced ? 0 : 75 / speed}ms linear` }}>{txt}</span>
    </span>
  )
}
