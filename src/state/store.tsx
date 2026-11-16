import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import data from '../assets/mock-data.json'
import { M, getMotion, setMotion } from '../lib/motion'
import { fmtPublic, num, trimAmt } from '../lib/format'

export { data }
export const copy = data.copy
export const prices: Record<Sym, number> = data.prices

/* ---------- hash router ---------- */
export type Route = 'welcome' | 'dashboard' | 'shield' | 'unshield' | 'send' | 'apps' | 'permits' | 'success'
export const ROUTES: Route[] = ['welcome', 'dashboard', 'shield', 'unshield', 'send', 'apps', 'permits', 'success']
const parse = (): Route => {
  const h = location.hash.replace(/^#\/?/, '')
  return (ROUTES as string[]).includes(h) ? (h as Route) : 'welcome'
}
export const nav = (r: Route) => {
  if (parse() !== r || !location.hash) location.hash = '#/' + r
}
const subHash = (cb: () => void) => {
  addEventListener('hashchange', cb)
  return () => removeEventListener('hashchange', cb)
}
export const useRoute = (): Route => useSyncExternalStore(subHash, parse)

/* ---------- types ---------- */
export type Permit = 'none' | 'active' | 'expired'
export type Sym = 'USDC' | 'ETH'
export type Balances = Record<Sym, { pub: number; priv: number }>
export interface Activity {
  id: string
  kind: string
  label: string
  amount?: string
  priv?: { sign: string; value: number; unit: string }
  when: string
  hash?: string
  status: 'pending' | 'confirmed'
}
export interface Toast {
  id: number
  kind: 'success' | 'info' | 'fail'
  title: string
  body?: string
  action?: { label: string; route?: Route }
}
export type SheetName = 'connect' | 'permit' | 'token' | 'sendReview'
export interface State {
  connected: boolean
  address: string
  networkIdx: number
  permit: Permit
  permitDays: number
  hidden: boolean
  balances: Balances
  activity: Activity[]
  activityOpen: boolean
  /** 0 form · 1 approve · 2 confirm in wallet */
  shieldStep: number
  /** 0 form · 1 requesting · 2 decrypting · 3 claim ready · 4 claiming · 5 claimed */
  unshieldStep: number
  /** 0 form · 1 encrypt · 2 confirm · 3 sent */
  sendStep: number
  busy: boolean
  amt: { shield: string; unshield: string; send: string }
  sendTo: string
  lastShield: number
  pendingUnshield: { id: string; amount: number } | null
  firstShieldDone: boolean
  tour: { status: 'idle' | 'active' | 'paused' | 'done'; step: number }
  tourPending: boolean
  toasts: Toast[]
  speed: number
  failNext: boolean
  reduceMotion: boolean
  deviceFrame: boolean
  sheet: { name: SheetName; arg?: string } | null
  connecting: string | null
  signing: boolean
}

const ETH_PRIV = 428.35 / prices.ETH // displays as 0.1338, keeps the $1,428.35 summary exact
export const fullBalances = (): Balances => ({ USDC: { pub: 1250, priv: 1000 }, ETH: { pub: 0.2, priv: ETH_PRIV } })
export const zeroBalances = (): Balances => ({ USDC: { pub: 0, priv: 0 }, ETH: { pub: 0, priv: 0 } })

export const fresh = (): State => ({
  connected: false,
  address: data.account.address,
  networkIdx: 0,
  permit: 'none',
  permitDays: data.permit.default,
  hidden: false,
  balances: fullBalances(),
  activity: data.activity as Activity[],
  activityOpen: false,
  shieldStep: 0,
  unshieldStep: 0,
  sendStep: 0,
  busy: false,
  amt: { shield: '500.00', unshield: '500.00', send: data.send.amount },
  sendTo: data.send.to,
  lastShield: 500,
  pendingUnshield: null,
  firstShieldDone: false,
  tour: { status: 'idle', step: 0 },
  tourPending: false,
  toasts: [],
  speed: 1,
  failNext: false,
  reduceMotion: false,
  deviceFrame: false,
  sheet: null,
  connecting: null,
  signing: false,
})
/** connected + permit active: the baseline for every "Jump to" state */
export const demoBase = (): State => ({ ...fresh(), connected: true, permit: 'active' })

export const usd = (b: Balances) => ({
  pub: b.USDC.pub * prices.USDC + b.ETH.pub * prices.ETH,
  priv: b.USDC.priv * prices.USDC + b.ETH.priv * prices.ETH,
})
export const isMasked = (s: State) => s.hidden || s.permit !== 'active'
export const TOUR_ROUTES: Route[] = ['dashboard', 'dashboard', 'shield', 'dashboard']

/* ---------- persistence ---------- */
const KEY = 'fhx-proto'
const TRANSIENT: (keyof State)[] = ['toasts', 'sheet', 'busy', 'connecting', 'signing']
function load(): State {
  let s = fresh()
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) s = { ...s, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  // in-flight mock transactions don't survive a reload
  if (s.shieldStep === 2) s.shieldStep = 1
  if (s.unshieldStep === 1) s.unshieldStep = 0
  if (s.unshieldStep === 2 || s.unshieldStep === 4) s.unshieldStep = 3
  if (s.sendStep === 1 || s.sendStep === 2) s.sendStep = 0
  setMotion({ speed: s.speed, reduce: s.reduceMotion })
  return s
}

type Patch = Partial<State> | ((s: State) => Partial<State>)
const reducer = (s: State, p: Patch): State => ({ ...s, ...(typeof p === 'function' ? p(s) : p) })

const mv = (b: Balances, sym: Sym, dPub: number, dPriv: number): Balances => ({
  ...b,
  [sym]: { pub: Math.round((b[sym].pub + dPub) * 1e8) / 1e8, priv: Math.round((b[sym].priv + dPriv) * 1e8) / 1e8 },
})
const upd = (list: Activity[], id: string, p: Partial<Activity>) => list.map(a => (a.id === id ? { ...a, ...p } : a))
let seq = 0
const uid = () => `n${Date.now()}${seq++}`

function useActions(set: (p: Patch) => void, ref: { current: State }) {
  const epoch = useRef(0)
  return useMemo(() => {
    const D = data.delaysMs
    const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms / getMotion().speed))
    const stale = (e: number) => e !== epoch.current
    const toast = (t: Omit<Toast, 'id'>) => {
      const id = Date.now() + seq++
      set(s => ({ toasts: [...s.toasts, { ...t, id }].slice(-3) }))
      setTimeout(() => A.dismissToast(id), M.toast.autoHideMs)
    }
    const failed = () => {
      if (!ref.current.failNext) return false
      set({ failNext: false })
      toast({ kind: 'fail', title: 'Transaction failed', body: 'Nothing was moved.', action: { label: 'Try again' } })
      return true
    }
    const addAct = (a: Activity) => set(s => ({ activity: [a, ...s.activity] }))
    const needPermit = () => {
      if (ref.current.permit === 'active') return false
      set({ sheet: { name: 'permit' } })
      return true
    }

    const A = {
      set,
      toast,
      dismissToast: (id: number) => set(s => ({ toasts: s.toasts.filter(x => x.id !== id) })),
      openSheet: (name: SheetName, arg?: string) => set({ sheet: { name, arg } }),
      closeSheet: () => {
        const s = ref.current
        if (s.sheet?.name === 'sendReview' && (s.sendStep === 1 || s.sendStep === 2)) return A.sendCancel()
        set({ sheet: null, connecting: null, ...(s.sheet?.name === 'connect' ? { tourPending: false } : {}) })
      },

      /* wallet */
      startConnect: (withTour: boolean) => set({ tourPending: withTour, sheet: { name: 'connect' } }),
      connect: async (walletId: string) => {
        const e = epoch.current
        set({ connecting: walletId })
        await wait(D.connect)
        if (stale(e)) return
        const s = ref.current
        const tour = s.tourPending
        set({
          connected: true,
          connecting: null,
          tourPending: false,
          sheet: !tour && s.permit === 'none' ? { name: 'permit' } : null,
          tour: tour ? { status: 'active', step: 0 } : s.tour,
        })
        toast({ kind: 'success', title: 'Wallet connected', body: data.account.short })
        nav('dashboard')
      },
      disconnect: () => {
        epoch.current++
        set(s => ({ ...fresh(), speed: s.speed, reduceMotion: s.reduceMotion, deviceFrame: s.deviceFrame, toasts: s.toasts }))
        toast({ kind: 'info', title: 'Wallet disconnected' })
        nav('welcome')
      },
      copyAddress: () => {
        navigator.clipboard?.writeText(data.account.address).catch(() => {})
        toast({ kind: 'info', title: copy.toasts[0] })
      },
      setNetwork: (i: number) => {
        set({ networkIdx: i })
        toast({ kind: 'info', title: `Switched to ${data.networks[i].name}` })
      },

      /* permit */
      signPermit: async (days: number) => {
        const e = epoch.current
        set({ signing: true })
        await wait(D.signPermit)
        if (stale(e)) return
        if (failed()) return set({ signing: false })
        set({ signing: false, permit: 'active', permitDays: days, hidden: false, sheet: null })
        addAct({ id: uid(), kind: 'permit', label: 'Permit signed', amount: '—', when: `Just now · valid ${days} days`, status: 'confirmed' })
        toast({ kind: 'success', title: copy.toasts[1], body: `Permit signed · valid ${days} days` })
        const t = ref.current.tour
        if (t.status === 'active' && t.step === 1) A.tourNext()
      },
      permitNotNow: () => {
        set({ sheet: null })
        toast({ kind: 'info', title: 'Permit not created', body: 'Private balances stay hidden.' })
      },
      renew: () => set({ sheet: { name: 'permit' } }),
      revoke: () => {
        set({ permit: 'none' })
        toast({ kind: 'info', title: 'Permit revoked', body: 'Private balances are hidden again.' })
      },
      toggleHidden: () => {
        if (needPermit()) return
        set(s => ({ hidden: !s.hidden }))
      },
      /** used by the success screen: reveal locally after the mock decrypt delay */
      reveal: () => wait(D.reveal),

      /* shield */
      shieldStart: () => {
        if (needPermit()) return
        set({ shieldStep: 1 })
      },
      shieldApprove: async () => {
        const e = epoch.current
        set({ busy: true })
        await wait(D.approve)
        if (stale(e)) return
        if (failed()) return set({ busy: false })
        set({ shieldStep: 2 })
        await A.shieldConfirm()
      },
      shieldConfirm: async () => {
        const e = epoch.current
        const amt = num(ref.current.amt.shield)
        const id = uid()
        set({ busy: true, shieldStep: 2 })
        addAct({ id, kind: 'shield', label: 'Shield USDC → fUSDC', amount: `+${fmtPublic(amt)} fUSDC`, when: 'Just now', hash: '0x9f2c…a83e', status: 'pending' })
        await wait(D.shield)
        if (stale(e)) return
        if (failed()) return set(s => ({ busy: false, shieldStep: 0, activity: s.activity.filter(a => a.id !== id) }))
        set(s => ({
          busy: false,
          shieldStep: 0,
          lastShield: amt,
          balances: mv(s.balances, 'USDC', -amt, amt),
          activity: upd(s.activity, id, { status: 'confirmed', when: 'Today · just now · 0x9f2c…a83e' }),
        }))
        const s = ref.current
        if (s.tour.status === 'active' && s.tour.step === 2) return A.tourNext()
        if (!s.firstShieldDone) {
          set({ firstShieldDone: true })
          nav('success')
        } else toast({ kind: 'success', title: `Shielded ${trimAmt(amt)} USDC`, body: `${fmtPublic(amt)} fUSDC is now private`, action: { label: 'View', route: 'dashboard' } })
      },

      /* unshield */
      unshieldRequest: async () => {
        if (needPermit()) return
        const e = epoch.current
        const amt = num(ref.current.amt.unshield)
        set({ busy: true, unshieldStep: 1 })
        await wait(D.unshieldRequest)
        if (stale(e)) return
        if (failed()) return set({ busy: false, unshieldStep: 0 })
        const id = uid()
        set(s => ({ busy: false, unshieldStep: 2, pendingUnshield: { id, amount: amt }, balances: mv(s.balances, 'USDC', 0, -amt) }))
        addAct({ id, kind: 'unshield', label: 'Unshield fUSDC → USDC', amount: `+${fmtPublic(amt)} USDC`, when: 'Just now · decrypting', status: 'pending' })
        toast({ kind: 'info', title: 'Unshield requested', body: 'Claim it from Activity on your Dashboard' })
        await A.runDecrypt()
      },
      runDecrypt: async () => {
        const e = epoch.current
        await wait(D.decrypt)
        if (stale(e)) return
        const p = ref.current.pendingUnshield
        set(s => ({ unshieldStep: 3, activity: p ? upd(s.activity, p.id, { when: 'Just now · ready to claim' }) : s.activity }))
      },
      claim: async () => {
        const e = epoch.current
        set({ busy: true, unshieldStep: 4 })
        await wait(D.claim)
        if (stale(e)) return
        if (failed()) return set({ busy: false, unshieldStep: 3 })
        const p = ref.current.pendingUnshield ?? { id: '', amount: num(ref.current.amt.unshield) }
        set(s => ({
          busy: false,
          unshieldStep: 5,
          lastShield: s.lastShield,
          balances: mv(s.balances, 'USDC', p.amount, 0),
          activity: upd(s.activity, p.id, { status: 'confirmed', kind: 'unshield-claim', when: 'Today · claimed' }),
        }))
        toast({ kind: 'success', title: `Unshielded ${fmtPublic(p.amount)} USDC`, body: 'Back in your public wallet balance', action: { label: 'View', route: 'dashboard' } })
      },
      unshieldReset: () => set({ unshieldStep: 0, pendingUnshield: null }),

      /* send */
      sendOpen: async () => {
        if (needPermit()) return
        const e = ++epoch.current
        const amt = num(ref.current.amt.send)
        set({ sheet: { name: 'sendReview' }, sendStep: 1 })
        await wait(D.send / 2)
        if (stale(e)) return
        set({ sendStep: 2 })
        await wait(D.send)
        if (stale(e)) return
        if (failed()) return set({ sendStep: 0, sheet: null })
        set(s => ({ sendStep: 3, sheet: null, balances: mv(s.balances, 'USDC', 0, -amt) }))
        addAct({ id: uid(), kind: 'transfer-out', label: 'Sent fUSDC privately', priv: { sign: '−', value: amt, unit: 'fUSDC' }, when: `Just now · to ${ref.current.sendTo}`, hash: data.send.tx, status: 'confirmed' })
        toast({ kind: 'success', title: copy.toasts[6], body: `Amount stays encrypted · to ${ref.current.sendTo}`, action: { label: 'View', route: 'dashboard' } })
      },
      sendCancel: () => {
        epoch.current++
        set({ sheet: null, sendStep: 0 })
        toast({ kind: 'info', title: copy.toasts[7], body: 'You rejected the request in your wallet' })
      },
      sendReset: () => set({ sendStep: 0 }),

      /* tour */
      tourStart: () => {
        set(s => ({ tour: { status: 'active', step: 0 }, shieldStep: 0, busy: false, sheet: null, hidden: s.hidden }))
        nav('dashboard')
      },
      tourGo: (step: number) => {
        set(s => ({ tour: { status: 'active', step }, ...(step === 2 ? { amt: { ...s.amt, shield: '10.00' }, shieldStep: 0, busy: false } : {}) }))
        nav(TOUR_ROUTES[step])
      },
      tourNext: () => A.tourGo(Math.min(3, ref.current.tour.step + 1)),
      tourEnd: (status: 'idle' | 'done' = 'done') => set(s => ({ tour: { status, step: 0 }, amt: { ...s.amt, shield: '500.00' } })),
      /** step 3: real = mock transaction that moves balances, otherwise only the stepper animates */
      tourShield: async (real: boolean) => {
        const e = epoch.current
        if (real && needPermit()) return
        set({ shieldStep: 1, busy: true })
        await wait(real ? D.approve : 900)
        if (stale(e)) return
        if (real) return A.shieldConfirm()
        set({ shieldStep: 2 })
        await wait(1100)
        if (stale(e)) return
        set({ shieldStep: 0, busy: false })
        A.tourNext()
      },

      /* demo */
      resetAll: () => {
        epoch.current++
        try {
          localStorage.removeItem(KEY)
        } catch {
          /* ignore */
        }
        set(fresh())
        nav('welcome')
      },
      jump: (patch: Partial<State>, route: Route, then?: () => void) => {
        epoch.current++
        set(s => ({ ...demoBase(), speed: s.speed, reduceMotion: s.reduceMotion, deviceFrame: s.deviceFrame, ...patch }))
        nav(route)
        if (then) setTimeout(then, 60)
      },
    }
    return A
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

type Ctx = { s: State; act: ReturnType<typeof useActions>; mobile: boolean }
const StoreCtx = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, set] = useReducer(reducer, undefined, load)
  const ref = useRef(s)
  ref.current = s
  const act = useActions(set, ref)

  const [narrow, setNarrow] = useState(() => innerWidth < 1024)
  useEffect(() => {
    const f = () => setNarrow(innerWidth < 1024)
    addEventListener('resize', f)
    return () => removeEventListener('resize', f)
  }, [])

  useEffect(() => setMotion({ speed: s.speed, reduce: s.reduceMotion }), [s.speed, s.reduceMotion])
  useEffect(() => {
    const keep: Record<string, unknown> = { ...s }
    TRANSIENT.forEach(k => delete keep[k])
    try {
      localStorage.setItem(KEY, JSON.stringify(keep))
    } catch {
      /* ignore */
    }
  }, [s])

  const value = useMemo(() => ({ s, act, mobile: s.deviceFrame || narrow }), [s, act, narrow])
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('StoreProvider missing')
  return c
}
