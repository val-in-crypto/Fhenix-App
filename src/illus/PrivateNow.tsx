import { animate } from 'framer-motion'
import { useEffect, useRef } from 'react'
import burstRaw from '../assets/illustrations/private-now-burst.svg?raw'
import dropRaw from '../assets/illustrations/private-now-drop.svg?raw'
import sealRaw from '../assets/illustrations/private-now-seal.svg?raw'
import { M, easeInOut, easeOut, getMotion, useMotion } from '../lib/motion'

/* The burst export is the base. The pulse rings only exist in the seal export and the falling coin only in the
   drop export, so both groups are lifted from those files unchanged and placed at their burst-frame position. */
const rings = /<path id="Pulse ring"[^>]*\/>\s*<path id="Pulse ring 2"[^>]*\/>/.exec(sealRaw)?.[0] ?? ''
const coin = /<g id="Coin drop">[\s\S]*?<\/g>\s*<\/g>/.exec(dropRaw)?.[0] ?? ''
const COIN_REST_Y = 122 - 1.5 // drop frame sits 1.5px lower; the coin's burst position is 122 below where it is drawn
const composed = burstRaw
  .replace('<g id="Puck / Seal">', `${rings}<g id="Puck / Seal">`)
  .replace(/<\/g>\s*<\/svg>\s*$/, `<g transform="translate(0 ${COIN_REST_Y})">${coin}</g></g></svg>`)
  .replace(/width="560" height="\d+"/, 'width="100%" height="100%"')

type Pose = { top: number; mid: number; coinY: number; coinOp: number; glyphOp: number; ringS: number; ringOp: number; cT: number; cOp: number }
const DROP: Pose = { top: -40, mid: -18, coinY: -122, coinOp: 1, glyphOp: 0.25, ringS: 0.58, ringOp: 0, cT: 0.05, cOp: 0 }
const SEAL: Pose = { top: 0, mid: 0, coinY: 0, coinOp: 0, glyphOp: 1, ringS: 0.73, ringOp: 0.9, cT: 0.45, cOp: 0.7 }
const BURST: Pose = { top: 0, mid: 0, coinY: 0, coinOp: 0, glyphOp: 1, ringS: 1, ringOp: 0, cT: 1, cOp: 1 }
const mix = (a: Pose, b: Pose, t: number) => Object.fromEntries(Object.keys(a).map(k => [k, a[k as keyof Pose] + (b[k as keyof Pose] - a[k as keyof Pose]) * t])) as Pose
const ORIGIN = { x: 280, y: 185 } // confetti origin
const RING = { x: 280, y: 209 }

/** Success hero: drop → seal → burst once, then idle (sparkles twinkle, puck ring pulses). 560×456. */
export default function PrivateNow({ scale = 1 }: { scale?: number }) {
  const { reduced } = useMotion()
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    const q = (id: string) => el.querySelector<SVGGraphicsElement>(`[id="${id}"]`)
    const top = ['Plate / Encrypted', 'Puck / Seal', 'Encrypted glyph'].map(q)
    const mid = q('Plate / Shielded')
    const coinEl = q('Coin drop')
    const glyph = q('Encrypted glyph')
    const ring = q('Pulse ring')
    const ring2 = q('Pulse ring 2')
    const amb = Array.from(el.querySelectorAll<SVGElement>('[id^="amb-"]'))
    const confetti = Array.from(el.querySelectorAll<SVGGraphicsElement>('[id="Confetti"] > *')).map(p => {
      const b = p.getBBox()
      return { p, dx: ORIGIN.x - (b.x + b.width / 2), dy: ORIGIN.y - (b.y + b.height / 2) }
    })

    const apply = (v: Pose) => {
      top.forEach(g => g?.setAttribute('transform', `translate(0 ${v.top})`))
      mid?.setAttribute('transform', `translate(0 ${v.mid})`)
      coinEl?.setAttribute('transform', `translate(0 ${v.coinY})`)
      if (coinEl) coinEl.style.opacity = String(v.coinOp)
      if (glyph) glyph.style.opacity = String(v.glyphOp)
      if (ring) {
        ring.setAttribute('transform', `translate(${RING.x} ${RING.y + v.top}) scale(${v.ringS}) translate(${-RING.x} ${-RING.y})`)
        ring.style.opacity = String(v.ringOp)
      }
      confetti.forEach(({ p, dx, dy }) => {
        p.setAttribute('transform', `translate(${dx * (1 - v.cT)} ${dy * (1 - v.cT)})`)
        p.style.opacity = String(v.cOp)
      })
    }
    const idle = (on: boolean) => {
      amb.forEach((a, i) => {
        a.classList.toggle('pn-amb', on)
        a.style.animationDelay = `${i * 0.3}s`
      })
      ring2?.classList.toggle('pn-pulse2', on)
      if (ring2) ring2.style.opacity = on ? '' : '0'
    }

    idle(false)
    if (reduced) {
      apply(BURST)
      return
    }
    const speed = getMotion().speed
    const [toSeal, toBurst] = M.privateNow as { delayMs: number; durMs: number }[]
    let stop = () => {}
    let dead = false
    const run = (a: Pose, b: Pose, ms: number, ease: readonly number[]) =>
      new Promise<void>(res => {
        const c = animate(0, 1, { duration: Math.min(ms, 300) / 1000 / speed, ease: ease as [number, number, number, number], onUpdate: t => apply(mix(a, b, t)), onComplete: res })
        stop = () => c.stop()
      })
    const hold = (ms: number) => new Promise<void>(res => setTimeout(res, ms / speed))
    apply(DROP)
    ;(async () => {
      await hold(toSeal.delayMs)
      if (dead) return
      await run(DROP, SEAL, toSeal.durMs, easeInOut)
      if (dead) return
      await hold(toBurst.delayMs)
      if (dead) return
      await run(SEAL, BURST, toBurst.durMs, easeOut)
      if (!dead) idle(true)
    })()
    return () => {
      dead = true
      stop()
    }
  }, [reduced])

  return <div ref={host} className="success-illustration" role="img" aria-label="Your tokens sealed into a confidential balance" style={{ width: 560 * scale, maxWidth: '100%', aspectRatio: '560 / 456' }} dangerouslySetInnerHTML={{ __html: composed }} />
}
