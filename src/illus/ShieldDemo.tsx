import { animate, cubicBezier, useAnimationFrame, useMotionValue, type MotionValue } from 'framer-motion'
import { useEffect, useId, useRef, type CSSProperties } from 'react'
import { useMotion } from '../lib/motion'

/* ------------------------------------------------------------------------------------------------
   Welcome demo: ONE isometric scene on ONE master timeline.
   Every object (coins, vault, plates, value tag, sparkles, tabs, captions) is mounted once and its
   transform / opacity is a pure function of the loop time t (0 → 16s). Nothing is swapped, faded as a
   block or re-mounted between steps, and every track ends on the value it starts with, so t = 16 is
   the same frame as t = 0.
   ------------------------------------------------------------------------------------------------ */

const LOOP = 16
/** step starts on the timeline; step 1 starts with the coin's return trip and wraps through 0 */
const STARTS = [13, 3.2, 7.6]
const LENS = [6.2, 4.4, 5.4]
/** where a tab click scrubs to */
const SCRUB = [0, 3.2, 7.6]

const STEPS = [
  { tab: 'Connect wallet', col: 'YOUR WALLET', text: 'Your tokens sit in your wallet. Anyone on-chain can see the amount.', lines: ['Your tokens sit in your wallet. Anyone on-chain', 'can see the amount.'], value: '250.00 USDC' },
  { tab: 'Shield tokens', col: 'ENCRYPTION LAYER', text: 'Shielding seals the amount into an encrypted fToken on CoFHE.', lines: ['Shielding seals the amount into an encrypted', 'fToken on CoFHE.'], value: '250.00 → [••••]' },
  { tab: 'Use them privately', col: 'SHIELDED BALANCE', text: 'Your balance is now [*******]. Only you can decrypt it with your permit.', lines: ['Your balance is now [*******]. Only you can', 'decrypt it with your permit.'], value: '[••••] fUSDC' },
]

/* ---------- easing + keyframe tracks ---------- */
type Ease = (u: number) => number
const travel = cubicBezier(0.65, 0, 0.35, 1)
const out: Ease = u => 1 - (1 - u) ** 3
/** settle: spring with stiffness 120, damping 20 (ζ ≈ 0.91, no visible bounce), sampled over `dur` seconds */
const settle = (dur: number): Ease => {
  const w0 = Math.sqrt(120)
  const z = 20 / (2 * w0)
  const wd = w0 * Math.sqrt(1 - z * z)
  const x = (s: number) => 1 - Math.exp(-z * w0 * s) * (Math.cos(wd * s) + ((z * w0) / wd) * Math.sin(wd * s))
  const end = x(dur)
  return u => x(u * dur) / end
}
type Key = [t: number, v: number, ease?: Ease]
/** piecewise track; the ease on a key shapes the segment that ends at it */
const track = (keys: Key[]) => (t: number) => {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i]
    if (t <= t1) {
      const [t0, v0] = keys[i - 1]
      const u = (t - t0) / (t1 - t0)
      return v0 + (v1 - v0) * (e ? e(u) : u)
    }
  }
  return keys[keys.length - 1][1]
}
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const TAU = Math.PI * 2

/* ---------- the timeline (seconds) ----------
   0.0  step 1 · coins rest on the public plate, value readable
   2.9  vault lid lifts (overlaps the coin lift-off at 3.3)
   3.3  coins arc into the vault, staggered 0.2s
   5.05 vault closes on them (spring), 5.6 value scrambles char by char into [••••]
   7.7  vault arcs to the private plate, settles 9.1–9.9; glow, sparkles, value locks in
   12.55 vault opens, 13.0 coins fly back to the public plate in one move, vault returns home
   16.0 identical to 0.0                                                                    */
const lift = track([[0, 0], [2.9, 0], [3.5, 36, travel], [5.05, 36], [5.85, 0, settle(0.8)], [12.55, 0], [13, 34, travel], [14.5, 34], [15.4, 0, settle(0.9)], [LOOP, 0]])
const carry = track([[0, 0], [7.7, 0], [9.25, 1, travel], [13.3, 1], [15, 0, travel], [LOOP, 0]])
const dip = track([[0, 0], [9.1, 0], [9.3, 3, out], [9.95, 0, settle(0.65)], [LOOP, 0]])
const spread = track([[0, 1], [5.05, 1], [5.45, 0, travel], [12.6, 0], [13, 1, out], [LOOP, 1]])
/** 1 = on the public plate, 0 = with the vault */
const coinA = [0, 1, 2].map(k => {
  const s = k * 0.2
  const r = (2 - k) * 0.18
  return track([[0, 1], [3.3 + s, 1], [4.6 + s, 0, travel], [13 + r, 0], [14.9 + r, 1, travel], [LOOP, 1]])
})
const coinNavy = [0, 1, 2].map(k => {
  const r = (2 - k) * 0.18
  return track([[0, 0], [5.9, 0], [6.1, 1], [13.4 + r, 1], [14.2 + r, 0, out], [LOOP, 0]])
})
const plateOn = track([[0, 0.45], [8.7, 0.45], [9.5, 1, out], [13.2, 1], [14.3, 0.45, travel], [LOOP, 0.45]])
const glowOn = track([[0, 0], [5.5, 0], [6.1, 0.45, out], [7.6, 0.3], [9.2, 0.25], [9.9, 0.7, out], [12.5, 0.7], [13.1, 0, out], [LOOP, 0]])
const ripple = track([[0, 0], [5.4, 0], [5.9, 1, out], [6.9, 1], [7.5, 0, travel], [LOOP, 0]])
const tagEnc = track([[0, 0], [5.6, 0], [6.4, 1], [13.3, 1], [13.9, 0], [LOOP, 0]])
const tagLock = track([[0, 0], [9.45, 0], [9.7, 1, out], [13, 1], [13.4, 0], [LOOP, 0]])
const tagPulse = track([[0, 1], [9.45, 1], [9.62, 1.16, out], [10.3, 1, settle(0.68)], [LOOP, 1]])
const charEnc = [0, 1, 2, 3, 4, 5].map(i => track([[0, 0], [5.55 + 0.09 * i, 0], [5.95 + 0.09 * i, 1, travel], [13.25 + 0.06 * i, 1], [13.6 + 0.06 * i, 0, travel], [LOOP, 0]]))
const gauge = track([[0, 0.12], [5.5, 0.12], [6.3, 0.6, travel], [9.2, 0.6], [9.9, 1, travel], [13.2, 1], [14.8, 0.12, travel], [LOOP, 0.12]])

const SPARKS: { x: number; y: number; s: number; star: boolean; fill: string }[] = [
  { x: -62, y: -30, s: 0.8, star: true, fill: '#0AD9DC' },
  { x: -38, y: -62, s: 0.5, star: false, fill: '#0B1F2A' },
  { x: -8, y: -80, s: 0.9, star: true, fill: '#0AD9DC' },
  { x: 26, y: -66, s: 0.55, star: false, fill: '#9BE7E8' },
  { x: 56, y: -38, s: 0.7, star: true, fill: '#0B1F2A' },
  { x: 72, y: -4, s: 0.5, star: false, fill: '#0AD9DC' },
  { x: -74, y: 2, s: 0.5, star: false, fill: '#9BE7E8' },
  { x: 44, y: -88, s: 0.6, star: true, fill: '#0AD9DC' },
]
const sparkOut = SPARKS.map((_, j) => track([[0, 0], [9.5 + 0.06 * j, 0], [10.2 + 0.06 * j, 1, out], [13.2, 1], [14.2, 0], [LOOP, 0]]))
const sparkOn = SPARKS.map((_, j) => track([[0, 0], [9.5 + 0.06 * j, 0], [9.75 + 0.06 * j, 1, out], [12.4 + 0.04 * j, 1], [12.8 + 0.04 * j, 0, travel], [LOOP, 0]]))

const PLAIN = '250.00'
const NOISE = '739251'
const ENC = '[••••]'
const INK = '#0B1F2A'
const move: CSSProperties = { willChange: 'transform' }

type Els = Record<string, SVGElement | HTMLElement | null>
const collect = (root: Element): Els => Object.fromEntries(Array.from(root.querySelectorAll<SVGElement>('[data-k]')).map(e => [e.dataset.k!, e]))
const put = (els: Els, k: string, transform?: string, opacity?: number) => {
  const e = els[k]
  if (!e) return
  if (transform !== undefined) e.style.transform = transform
  if (opacity !== undefined) e.style.opacity = String(opacity)
}

/** all stage transforms for time t; `ts` = value-tag scale (0 hides it) */
function applyStage(els: Els, t: number, ts: number) {
  const c = carry(t)
  const L = lift(t)
  const px = 165.06 * c
  const py = 108 * c - Math.sin(Math.PI * c) * 46 + dip(t)
  const shimmer = 0.85 + 0.15 * Math.sin((TAU * t) / 1.6)
  const g = glowOn(t)
  put(els, 'puck', `translate(${px}px, ${py - L}px)`)
  put(els, 'glow', `translate(${px}px, ${py - L}px)`, g * shimmer)
  put(els, 'pplate', undefined, plateOn(t))
  put(els, 'halo', undefined, g * 0.32 * shimmer)

  const float = 2 * Math.sin((TAU * t) / 3.2) // idle float, 5 whole cycles per loop
  const sp = spread(t)
  const H = t < 8 ? 46 : 78
  for (let k = 0; k < 3; k++) {
    const a = coinA[k](t)
    const vx = 300 + px
    const vy = 172 - 7 * k * sp + py
    const x = vx + (133.2 - vx) * a
    const y = vy + (281 - 7 * k - vy) * a - Math.sin(Math.PI * a) * H + float
    put(els, `coin${k}`, `translate(${x}px, ${y}px)`)
    put(els, `navy${k}`, undefined, coinNavy[k](t))
  }

  const amp = ripple(t)
  for (let i = 0; i < 3; i++) put(els, `sheet${i}`, `translateY(${amp * 2.5 * Math.sin((TAU * t) / 0.8 - i * 1.1)}px)`)

  SPARKS.forEach((s, j) => {
    const u = sparkOut[j](t)
    const on = sparkOn[j](t)
    const tw = 0.85 + 0.15 * Math.sin((TAU * t) / 1.6 + j)
    put(els, `sp${j}`, `translate(${465 + s.x * (0.25 + 0.75 * u)}px, ${236 + s.y * (0.25 + 0.75 * u)}px) scale(${s.s * on * tw})`, Math.min(1, on * 1.5))
  })

  if (ts > 0) {
    const a = coinA[2](t)
    const vx = 300 + px
    const vTop = 134 - L + py
    const top = vTop + (256.4 + float - vTop) * a - Math.sin(Math.PI * a) * H
    put(els, 'tag', `translate(${vx + (133.2 - vx) * a}px, ${top - 12 - 10 * ts}px) scale(${ts * tagPulse(t)})`)
    put(els, 'tagEnc', undefined, tagEnc(t))
    put(els, 'tagLock', undefined, tagLock(t))
    for (let i = 0; i < 6; i++) {
      const q = charEnc[i](t)
      put(els, `cp${i}`, `translateY(${-4 * q}px)`, clamp01(1 - q * 2))
      put(els, `cn${i}`, undefined, Math.sin(Math.PI * q) * 0.7)
      put(els, `ce${i}`, `translateY(${4 * (1 - q)}px)`, clamp01(q * 2 - 1))
    }
  }
}

const Coin = ({ k }: { k: number }) => (
  <g data-k={`coin${k}`} style={move}>
    <path d="M-18.37 0A18.37 10.61 0 0 0 18.37 0V6A18.37 10.61 0 0 1 -18.37 6Z" fill="#1F5FA8" stroke={INK} strokeLinejoin="round" />
    <ellipse rx="18.37" ry="10.61" fill="#2775CA" stroke={INK} />
    <ellipse rx="10.1" ry="5.83" stroke="white" strokeWidth="1.4" />
    <g data-k={`navy${k}`}>
      <path d="M-18.37 0A18.37 10.61 0 0 0 18.37 0V6A18.37 10.61 0 0 1 -18.37 6Z" fill="black" stroke={INK} strokeLinejoin="round" />
      <ellipse rx="18.37" ry="10.61" fill={INK} stroke={INK} />
      <path transform="translate(-466.8 -281)" d="M457.2 283.78L456.1 281.13L462.31 280.45L457.85 277.92L461.46 275.83L465.84 278.41L467.02 274.82L471.61 275.46L470.1 279.09L476.4 278.22L477.49 280.87L471.28 281.55L475.75 284.08L472.13 286.17L467.75 283.59L466.57 287.18L461.99 286.54L463.49 282.91L457.2 283.78Z" fill="#0AD9DC" />
    </g>
  </g>
)

/** The scene, in the 600-wide stage coordinates of the Figma export. Driven by `time`, or frozen at `at`. */
function Stage({ time, at = 0, tag = 1 }: { time?: MotionValue<number>; at?: number; tag?: number }) {
  const root = useRef<SVGGElement>(null)
  const gid = useId().replace(/:/g, '')
  useEffect(() => {
    if (!root.current) return
    const els = collect(root.current)
    const run = (t: number) => applyStage(els, t, tag)
    run(time ? time.get() : at)
    return time?.on('change', run)
  }, [time, at, tag])

  const iso = 'matrix(0.866025 0.5 -0.866025 0.5 '
  return (
    <g ref={root} fill="none">
      <defs>
        <linearGradient id={gid} x1="248.04" y1="194" x2="248.04" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0AD9DC" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0AD9DC" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M185.17 325L170.7 316.65L254.97 268" stroke={INK} strokeLinecap="round" strokeDasharray="3 3" />
      <path d="M345.03 268L429.3 316.65L414.83 325" stroke={INK} strokeLinecap="round" strokeDasharray="3 3" />
      {/* public plate */}
      <path d="M34.4805 288L134.94 346V360L34.4805 302V288Z" fill="#E9ECEF" stroke={INK} strokeLinejoin="round" />
      <path d="M134.94 346L235.39 288V302L134.94 360V346Z" fill="#DCE1E5" stroke={INK} strokeLinejoin="round" />
      <path d="M134.94 230L235.39 288L134.94 346L34.4805 288L134.94 230Z" fill="white" stroke={INK} strokeLinejoin="round" />
      {/* private plate: turquoise, lights up when the vault lands */}
      {/* opaque backing in the stage colour: the dimmed plate must still hide the connector that runs under it */}
      <path d="M364.61 288L465.06 230L565.52 288V302L465.06 360L364.61 302Z" fill="#F5F6F7" />
      <g data-k="pplate">
        <path d="M364.61 288L465.06 346V360L364.61 302V288Z" fill="#E2F8F9" stroke={INK} strokeLinejoin="round" />
        <path d="M465.061 346L565.521 288V302L465.061 360V346Z" fill="#9BE7E8" stroke={INK} strokeLinejoin="round" />
        <path d="M465.06 230L565.52 288L465.06 346L364.61 288L465.06 230Z" fill="white" stroke={INK} strokeLinejoin="round" />
        <path data-k="halo" d="M465.06 230L565.52 288L465.06 346L364.61 288L465.06 230Z" fill="#0AD9DC" />
      </g>
      {/* encryption layer */}
      <g data-k="sheet0" style={move}>
        <path d="M300 196L390.07 248L300 300L209.93 248L300 196Z" fill="white" fillOpacity="0.6" stroke={INK} strokeLinejoin="round" />
        <rect width="52" height="2.288" transform={`${iso}230.725 243.996)`} fill={INK} />
        <rect width="31.2" height="2.288" transform={`${iso}225.771 246.855)`} fill={INK} />
      </g>
      <g data-k="sheet1" style={move}>
        <path d="M300 162L390.07 214L300 266L209.93 214L300 162Z" fill="white" fillOpacity="0.6" stroke={INK} strokeLinejoin="round" />
        <rect width="52" height="2.288" transform={`${iso}230.725 209.996)`} fill={INK} />
        <rect width="31.2" height="2.288" transform={`${iso}225.771 212.855)`} fill={INK} />
      </g>
      <g data-k="sheet2" style={move}>
        <path d="M300 128L390.07 180L300 232L209.93 180L300 128Z" fill="white" fillOpacity="0.6" stroke={INK} strokeLinejoin="round" />
      </g>
      <path d="M300 196V128M390.069 248V180M300 300V232M209.93 248V180" stroke="#8C99A3" strokeLinecap="round" strokeDasharray="2 3" />
      {/* the token */}
      {[0, 1, 2].map(k => (
        <Coin key={k} k={k} />
      ))}
      {/* the vault */}
      <g data-k="glow" style={move}>
        <path d="M248.04 164L300 194L351.96 164V100L300 70L248.04 100V164Z" fill={`url(#${gid})`} />
      </g>
      <g data-k="puck" style={move}>
        <path d="M248.04 164L300 194V210L248.04 180V164Z" fill="#13242E" stroke={INK} strokeLinejoin="round" />
        <path d="M300 194L351.96 164V180L300 210V194Z" fill="black" stroke={INK} strokeLinejoin="round" />
        <path d="M300 134L351.96 164L300 194L248.04 164L300 134Z" fill={INK} stroke={INK} strokeLinejoin="round" />
        <path d="M282.54 169.05L280.55 164.23L291.84 163L283.73 158.4L290.29 154.6L298.26 159.29L300.41 152.77L308.75 153.92L306.01 160.53L317.46 158.95L319.45 163.77L308.15 165L316.27 169.6L309.71 173.4L301.73 168.71L299.59 175.23L291.25 174.08L293.98 167.47L282.54 169.05Z" fill="#0AD9DC" />
        <circle cx="300" cy="140" r="1.6" fill="#5B6F7D" />
        <circle cx="341.57" cy="164" r="1.6" fill="#5B6F7D" />
        <circle cx="300" cy="188" r="1.6" fill="#5B6F7D" />
        <circle cx="258.43" cy="164" r="1.6" fill="#5B6F7D" />
      </g>
      {SPARKS.map((s, j) => (
        <g key={j} data-k={`sp${j}`} style={move}>
          <path d={s.star ? 'M0 -9L1.9 -2L9 0L1.9 1.9L0 9L-2 1.9L-9 0L-2 -2Z' : 'M0 -5L8.6 0L0 5L-8.6 0Z'} fill={s.fill} />
        </g>
      ))}
      {/* the value: travels with the token, scrambles into bracket notation inside the vault */}
      {tag > 0 && (
        <g data-k="tag" style={move}>
          <rect x="-26" y="-10" width="52" height="20" fill="white" stroke={INK} />
          <rect data-k="tagEnc" x="-26" y="-10" width="52" height="20" fill="#E2F8F9" stroke="#007A7E" />
          <rect data-k="tagLock" x="-27" y="-11" width="54" height="22" stroke="#0AD9DC" strokeWidth="2" />
          {[0, 1, 2, 3, 4, 5].map(i => (
            <g key={i} transform={`translate(${(i - 2.5) * 7.4} 4)`} fontFamily="Geist Mono" fontSize="11" fontWeight="600" textAnchor="middle">
              <text data-k={`cp${i}`} fill={INK}>{PLAIN[i]}</text>
              <text data-k={`cn${i}`} fill="#5B6F7D">{NOISE[i]}</text>
              <text data-k={`ce${i}`} fill="#007A7E" fontSize={ENC[i] === '•' ? 15 : 11} dy={ENC[i] === '•' ? 1.2 : 0}>{ENC[i]}</text>
            </g>
          ))}
        </g>
      )}
    </g>
  )
}

/* ---------- chrome: tabs / progress, captions, gauge (same timeline) ---------- */
function applyChrome(els: Els, t: number, tabs: (HTMLElement | null)[], stepRef: { current: number }) {
  for (let i = 0; i < 3; i++) {
    const since = (t - STARTS[i] + LOOP) % LOOP
    const enter = out(clamp01((since - 0.1) / 0.35))
    const exit = clamp01((since - LENS[i]) / 0.25)
    const vis = enter * (1 - exit)
    put(els, `on${i}`, undefined, vis)
    put(els, `off${i}`, undefined, 1 - vis)
    put(els, `col${i}`, undefined, vis)
    put(els, `line${i}`, `scaleX(${clamp01(since / LENS[i])})`, (1 - exit) * clamp01(since / 0.15))
    // captions slide up 8px with a short blur; the block itself never fades as a whole
    const cap = els[`cap${i}`]
    if (cap) {
      cap.style.opacity = String(vis)
      // once invisible it glides back below the line, so re-entry starts from where it already is
      const back = clamp01((since - LENS[i] - 0.5) / 1)
      cap.style.transform = `translateY(${8 * (1 - enter) - 8 * exit + 16 * exit * back}px)`
      cap.style.filter = vis > 0.995 ? 'none' : `blur(${(4 * (1 - vis)).toFixed(2)}px)`
    }
    if (since < LENS[i] && stepRef.current !== i) {
      stepRef.current = i
      tabs.forEach((b, j) => b?.setAttribute('aria-selected', String(j === i)))
    }
  }
  put(els, 'gauge', `scaleX(${gauge(t)})`)
}

const GREY = '#5B6F7D'

function Chrome({ mobile }: { mobile: boolean }) {
  if (mobile)
    return (
      <>
        <rect width="358" height="316" fill="#F5F6F7" />
        {[16, 127.333, 238.667].map((x, i) => (
          <g key={i}>
            <rect x={x} y="16" width="103.333" height="3" fill="#DDE4E8" />
            <rect data-k={`line${i}`} x={x} y="16" width="103.333" height="3" fill="#0AD9DC" style={{ transformOrigin: `${x}px 16px`, ...move }} />
          </g>
        ))}
        {STEPS.map((s, i) => (
          <g key={i} data-k={`cap${i}`} style={move}>
            <text x="16" y="251.3" fill="#007A7E" fontFamily="Geist Mono" fontSize="12" fontWeight="500" letterSpacing="0.02em">{`0${i + 1} / 03`}</text>
            <text x="78" y="253" fill={INK} fontFamily="Geist" fontSize="17" fontWeight="600">{s.tab}</text>
            <text fill="#34495A" fontFamily="Geist" fontSize="14">
              <tspan x="16" y="278">{s.lines[0]}</tspan>
              <tspan x="16" y="296">{s.lines[1]}</tspan>
            </text>
          </g>
        ))}
        <rect x="270.5" y="243.5" width="71" height="7" fill="white" stroke={INK} />
        <rect data-k="gauge" x="272.5" y="245.5" width="67" height="3" fill="#0AD9DC" style={{ transformOrigin: '272.5px 245.5px', ...move }} />
      </>
    )
  return (
    <>
      <rect x="0.5" y="0.5" width="599" height="499" fill="#F5F6F7" stroke="#E3E7EA" />
      <rect y="47" width="600" height="1" fill="#E3E7EA" />
      {STEPS.map((s, i) => {
        const x = 24 + 200 * i
        const label = (on: boolean) => (
          <text data-k={`${on ? 'on' : 'off'}${i}`} x={x + 76} y="28.5" textAnchor="middle">
            <tspan fill={on ? '#007A7E' : GREY} fontFamily="Geist Mono" fontSize="12" fontWeight="500" letterSpacing="0.02em">{`0${i + 1}`}</tspan>
            <tspan dx="8" fill={on ? INK : GREY} fontFamily="Geist" fontSize="13" fontWeight={on ? 600 : 500}>{s.tab}</tspan>
          </text>
        )
        return (
          <g key={i}>
            {label(false)}
            {label(true)}
            <rect data-k={`line${i}`} x={x} y="46" width="152" height="2" fill="#0AD9DC" style={{ transformOrigin: `${x}px 46px`, ...move }} />
            <g fontFamily="Geist Mono" fontSize="12" fontWeight="500" letterSpacing="0.08em" textAnchor="middle">
              <text x={135 + 165 * i} y="402.3" fill={GREY}>{s.col}</text>
              <text data-k={`col${i}`} x={135 + 165 * i} y="402.3" fill={INK}>{s.col}</text>
            </g>
            <g data-k={`cap${i}`} style={move}>
              <text x="24" y="432.3" fill="#007A7E" fontFamily="Geist Mono" fontSize="12" fontWeight="500" letterSpacing="0.02em">{`0${i + 1} / 03`}</text>
              <text x="86" y="433.3" fill={INK} fontFamily="Geist" fontSize="15" fontWeight="600">{s.tab}</text>
              <text x="24" y="457.1" fill="#34495A" fontFamily="Geist" fontSize="13">{s.text}</text>
            </g>
          </g>
        )
      })}
      <rect x="456.5" y="424.5" width="119" height="7" fill="white" stroke={INK} />
      <rect data-k="gauge" x="458.5" y="426.5" width="115" height="3" fill="#0AD9DC" style={{ transformOrigin: '458.5px 426.5px', ...move }} />
    </>
  )
}

/** prefers-reduced-motion: the three finished states side by side, nothing moves */
function StaticRow({ mobile, style, className }: { mobile: boolean; style: CSSProperties; className: string }) {
  return (
    <div className={`shield-demo flex shrink-0 flex-col justify-center border border-[#E3E7EA] bg-stage ${mobile ? 'gap-2 p-3' : 'gap-4 p-6'} ${className}`} style={style} role="group" aria-label="How it works: public, shield, private">
      <div className="grid grid-cols-3 gap-2">
        {[1.2, 6.9, 11.2].map((at, i) => (
          <figure key={i} className="m-0 min-w-0">
            <svg viewBox="20 60 560 310" className="block h-auto w-full" aria-hidden>
              <Stage at={at} tag={0} />
            </svg>
            <figcaption className="mt-2">
              <div className="mono text-[11px] font-medium text-accentInk">{`0${i + 1} / 03`}</div>
              <div className={`font-semibold text-ink ${mobile ? 'text-[12px] leading-4' : 'text-[15px] leading-5'}`}>{STEPS[i].tab}</div>
              <div className="mono mt-1 text-[11px] leading-4 text-ink2">{STEPS[i].value}</div>
              {!mobile && <p className="mt-1 text-[12px] leading-4 text-ink2">{STEPS[i].text}</p>}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

export default function ShieldDemo({ mobile, className = '' }: { mobile: boolean; className?: string }) {
  const { reduced, speed } = useMotion()
  // Fits the nearest size container (cqw / cqh): as wide as possible without exceeding its height, ratio kept, never cropped.
  const ratio = mobile ? 358 / 316 : 600 / 500
  const style: CSSProperties = { aspectRatio: String(ratio), width: `min(100cqw, calc(100cqh * ${ratio})${mobile ? '' : ', 600px'})` }

  const time = useMotionValue(0) // the master timeline, seconds into the loop
  const scrub = useRef<{ stop: () => void } | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const step = useRef(-1)

  const paused = useRef(false)

  useAnimationFrame((_, delta) => {
    if (reduced || scrub.current || paused.current) return
    time.set((time.get() + (Math.min(delta, 500) / 1000) * speed) % LOOP)
  })

  // dev only: step the timeline by hand to inspect any frame — __sd.set(seconds), __sd.play()
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const w = window as unknown as { __sd?: unknown }
    w.__sd = { set: (t: number) => ((paused.current = true), time.set(((t % LOOP) + LOOP) % LOOP)), play: () => (paused.current = false) }
    return () => void delete w.__sd
  }, [time])

  useEffect(() => {
    if (reduced || !svg.current) return
    const els = collect(svg.current)
    const run = (t: number) => applyChrome(els, t, tabs.current, step)
    step.current = -1
    run(time.get())
    return time.on('change', run)
  }, [time, reduced, mobile])

  /** scrub (not jump) to a step: 500ms along the shorter way round the loop */
  const go = (i: number) => {
    scrub.current?.stop()
    const from = time.get()
    const d = ((SCRUB[i] - from + LOOP * 1.5) % LOOP) - LOOP / 2
    const ctl = animate(from, from + d, {
      duration: 0.5,
      ease: travel,
      onUpdate: v => time.set(((v % LOOP) + LOOP) % LOOP),
      onComplete: () => (scrub.current = null),
    })
    scrub.current = { stop: () => ctl.stop() }
  }

  if (reduced) return <StaticRow mobile={mobile} style={style} className={className} />

  return (
    <div className={`shield-demo relative shrink-0 overflow-hidden ${className}`} style={style} role="group" aria-label="How shielding works: an animated loop in three steps">
      <svg ref={svg} viewBox={mobile ? '0 0 358 316' : '0 0 600 500'} className="block h-full w-full" fill="none" aria-hidden>
        <Chrome mobile={mobile} />
        <g transform={mobile ? 'translate(-1 -3.2) scale(0.6)' : undefined}>
          <Stage time={time} tag={mobile ? 1.6 : 1} />
        </g>
      </svg>
      <div role="tablist" aria-label="Demo steps" className={`absolute top-0 z-10 flex ${mobile ? 'left-[4.5%] right-[4.5%] h-[11%]' : 'left-[4%] right-[4%] h-[9.6%]'}`}>
        {STEPS.map((s, i) => (
          <button key={s.tab} ref={el => void (tabs.current[i] = el)} type="button" role="tab" aria-selected={i === 0} aria-label={`0${i + 1} ${s.tab}`} className="flex-1" onClick={() => go(i)} />
        ))}
      </div>
    </div>
  )
}
