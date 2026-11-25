import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import data from '../assets/mock-data.json'
import { M, getMotion, setMotion } from '../lib/motion'
import { fmtPublic, num, trimAmt } from '../lib/format'

export { data }
export const copy = data.copy
export const prices: Record<Sym, number> = { ...data.prices, WBTC: 0, USDT: 1 }

/* ---------- hash router ---------- */
export type Route = 'welcome' | 'dashboard' | 'shield' | 'unshield' | 'send' | 'apps' | 'permits'
export const ROUTES: Route[] = ['welcome', 'dashboard', 'shield', 'unshield', 'send', 'apps', 'permits']
const parse = (): Route => {
  const [path, query] = location.hash.replace(/^#\/?/, '').split('?')
  if (path === 'activity' || location.pathname === '/activity') return 'dashboard'
  if (path === 'shield' && new URLSearchParams(query).get('mode') === 'unshield') return 'unshield'
  return (ROUTES as string[]).includes(path) ? (path as Route) : 'welcome'
}

export const nav = (route: Route) => {
  if (parse() !== route || !location.hash) location.hash = route === 'unshield' ? '#/shield?mode=unshield' : '#/' + route
}
const subHash = (cb: () => void) => {
  addEventListener('hashchange', cb)
  return () => removeEventListener('hashchange', cb)
}
export const useRoute = (): Route => useSyncExternalStore(subHash, parse)

/* ---------- types ---------- */
export type Permit = 'none' | 'active' | 'expired'
export type Sym = 'USDC' | 'ETH' | 'WBTC' | 'USDT'
export type Balances = Record<Sym, { pub: number; priv: number }>
export interface Activity {
  id: string
  kind: string
  label: string
  amount?: string
  priv?: { sign: string; value: number; unit: string }
  when: string
  hash?: string
  recipientAddress?: string
  status: 'pending' | 'confirmed'
}
export interface Toast {
  id: number
  kind: 'success' | 'info' | 'fail'
  title: string
  body?: string
  action?: { label: string; route?: Route }
}
export type SheetName = 'connect' | 'permit' | 'token'
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
  /** 0 form\u001f1 approve\u001f2 confirm in wallet */
  shieldStep: number
  /** 0 form\u001f1 requesting\u001f2 decrypting\u001f3 claim ready\u001f4 claiming\u001f5 claimed */
  unshieldStep: number
  /** 0 form\u001f1 encrypt\u001f2 confirm\u001f3 sent\u001f4 sending */
  sendStep: number
  success: { kind: 'shield' | 'unshield'; amount: number; asset: Sym; networkIdx: number } | null
  allowances: Record<string, number>
  busy: boolean
  amt: { shield: string; unshield: string; send: string }
  sendTo: string
  sendRecipientName?: string
  sendNetworkIdx?: number
  sendBalance: 'priv' | 'pub'
  sendAsset: Sym
  flowAsset: Sym
  lastShieldAsset: Sym
  lastShield: number
  pendingUnshield: { id: string; amount: number; asset?: Sym } | null
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
export const fullBalances = (): Balances => ({ USDC: { pub: 1250, priv: 1000 }, ETH: { pub: 0.2, priv: ETH_PRIV }, WBTC: { pub: 0, priv: 0 }, USDT: { pub: 0, priv: 0 } })
export const zeroBalances = (): Balances => ({ USDC: { pub: 0, priv: 0 }, ETH: { pub: 0, priv: 0 }, WBTC: { pub: 0, priv: 0 }, USDT: { pub: 0, priv: 0 } })

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
  success: null,
  allowances: {},
  amt: { shield: '500.00', unshield: '500.00', send: data.send.amount },
  sendTo: data.send.to.address,
  sendRecipientName: data.send.to.ens,
  sendBalance: 'priv',
  sendAsset: 'USDC',
  flowAsset: 'USDC',
  lastShieldAsset: 'USDC',
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
export const isMasked = (s: State) => s.permit !== 'active' || s.tour.status === 'active'
export const TOUR_ROUTES: Route[] = ['dashboard', 'dashboard', 'shield', 'dashboard']

/* ---------- persistence ---------- */
const KEY = 'fhx-proto'
const TRANSIENT: (keyof State)[] = ['success', 'toasts', 'sheet', 'busy', 'connecting', 'signing']
function load(): State {
  let s = fresh()
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) s = { ...s, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  s.balances = { ...zeroBalances(), ...s.balances }
  // in-flight mock transactions don't survive a reload
  if (s.shieldStep > 0) s.shieldStep = 0
  if (s.unshieldStep === 1) s.unshieldStep = 0
  if (s.unshieldStep === 2 || s.unshieldStep === 4) s.unshieldStep = 3
  if (location.pathname === '/activity' || /^#\/?activity$/.test(location.hash)) s.activityOpen = true
  if (s.pendingUnshield && !s.pendingUnshield.asset) s.pendingUnshield.asset = 'USDC'
  if (s.sendStep === 1 || s.sendStep === 2 || s.sendStep === 4) s.sendStep = 0
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
  const sending = useRef<symbol | null>(null)
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
        sending.current = null
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
        addAct({ id: uid(), kind: 'permit', label: 'Permit signed', amount: '—', when: `Just now\u001fvalid ${days} days`, status: 'confirmed' })
        toast({ kind: 'success', title: copy.toasts[1], body: `Permit signed\u001fvalid ${days} days` })
        const t = ref.current.tour
        if (t.status === 'active' && t.step === 1) A.tourNext()
      },
      permitNotNow: () => {
        set({ sheet: null })
        toast({ kind: 'info', title: 'Permit not created', body: 'Confidential balances stay hidden.' })
      },
      renew: () => set({ sheet: { name: 'permit' } }),
      revoke: () => {
        set({ permit: 'none' })
        toast({ kind: 'info', title: 'Permit revoked', body: 'Confidential balances are hidden again.' })
      },
      toggleHidden: () => {
        if (needPermit()) return
        set(s => ({ hidden: !s.hidden }))
      },
      /** used by the success screen: reveal locally after the mock decrypt delay */
      reveal: () => wait(D.reveal),

      selectFlowAsset: (sym: Sym) => {
        if (ref.current.flowAsset !== sym && !ref.current.busy && ref.current.shieldStep === 0 && !ref.current.pendingUnshield) {
          set(s => ({ flowAsset: sym, amt: { ...s.amt, shield: '', unshield: '' } }))
        }
      },

      /* shield */
      shieldStart: () => {
        if (needPermit()) return
        set({ shieldStep: 1 })
      },
      shieldApprove: async () => {
        if (ref.current.busy || needPermit()) return
        const e = epoch.current
        const sym = ref.current.flowAsset
        const amount = num(ref.current.amt.shield)
        const key = `${data.networks[ref.current.networkIdx].chainId}:${sym}`
        if (amount <= 0 || amount > ref.current.balances[sym].pub) return
        set({ busy: true, shieldStep: 1 })
        await wait(D.approve)
        if (stale(e)) return
        if (failed()) return set({ busy: false, shieldStep: 0 })
        set(state => ({ busy: false, shieldStep: 2, allowances: { ...state.allowances, [key]: amount } }))
      },
      shieldConfirm: async () => {
        if (ref.current.tour.status === 'active' && ref.current.tour.step === 2) return A.tourShield(false)
        if (ref.current.busy || needPermit()) return
        const e = epoch.current
        const amount = num(ref.current.amt.shield)
        const sym = ref.current.flowAsset
        const networkIdx = ref.current.networkIdx
        const allowance = ref.current.allowances[`${data.networks[networkIdx].chainId}:${sym}`] ?? 0
        if (sym !== 'ETH' && allowance < amount) return A.shieldApprove()
        if (amount <= 0 || amount > ref.current.balances[sym].pub) return set({ busy: false, shieldStep: 0 })
        const id = uid()
        set({ busy: true, shieldStep: 3 })
        addAct({ id, kind: 'shield', label: `Shield ${sym} → f${sym}`, priv: { sign: '+', value: amount, unit: `f${sym}` }, when: 'Just now', hash: '0x9f2c…a83e', status: 'pending' })
        await wait(D.shield / 2)
        if (stale(e)) return
        set({ shieldStep: 4 })
        await wait(D.shield / 2)
        if (stale(e)) return
        if (failed()) return set(state => ({ busy: false, shieldStep: 0, activity: state.activity.filter(item => item.id !== id) }))
        set(state => ({
          busy: false, shieldStep: 0, lastShield: amount, lastShieldAsset: sym, firstShieldDone: true,
          amt: { ...state.amt, shield: '' },
          success: { kind: 'shield', amount, asset: sym, networkIdx },
          balances: mv(state.balances, sym, -amount, amount),
          activity: upd(state.activity, id, { status: 'confirmed', when: 'Today\u001fjust now\u001f0x9f2c…a83e' }),
        }))
      },

      /* unshield */
      unshieldRequest: async () => {
        if (needPermit()) return
        const e = epoch.current
        const amt = num(ref.current.amt.unshield)
        const sym = ref.current.flowAsset
        if (amt <= 0 || amt > ref.current.balances[sym].priv) return
        set({ busy: true, unshieldStep: 1 })
        await wait(D.unshieldRequest)
        if (stale(e)) return
        if (failed() || amt > ref.current.balances[sym].priv) return set({ busy: false, unshieldStep: 0 })
        const id = uid()
        set(s => ({ busy: false, unshieldStep: 2, pendingUnshield: { id, amount: amt, asset: sym }, balances: mv(s.balances, sym, 0, -amt) }))
        addAct({ id, kind: 'unshield', label: `Unshield f${sym} → ${sym}`, amount: `+${fmtPublic(amt)} ${sym}`, when: 'Just now\u001fdecrypting', status: 'pending' })
        toast({ kind: 'info', title: 'Unshield requested', body: 'Claim it from Activity on your Dashboard' })
        await A.runDecrypt()
      },
      runDecrypt: async () => {
        const e = epoch.current
        await wait(D.decrypt)
        if (stale(e)) return
        const p = ref.current.pendingUnshield
        set(s => ({ unshieldStep: 3, activity: p ? upd(s.activity, p.id, { when: 'Just now\u001fready to claim' }) : s.activity }))
      },
      claim: async () => {
        if (ref.current.busy || ref.current.unshieldStep !== 3 || !ref.current.pendingUnshield) return
        const e = epoch.current
        const claim = ref.current.pendingUnshield
        const asset = claim.asset ?? 'USDC'
        const networkIdx = ref.current.networkIdx
        set({ busy: true, unshieldStep: 4 })
        await wait(D.claim)
        if (stale(e)) return
        if (failed()) return set({ busy: false, unshieldStep: 3 })
        const inFlow = parse() === 'unshield'
        set(state => ({
          busy: false, unshieldStep: 0, pendingUnshield: null, amt: { ...state.amt, unshield: '' },
          success: inFlow ? { kind: 'unshield', amount: claim.amount, asset, networkIdx } : null,
          balances: mv(state.balances, asset, claim.amount, 0),
          activity: upd(state.activity, claim.id, { status: 'confirmed', kind: 'unshield-claim', when: 'Today\u001fclaimed' }),
        }))
        if (!inFlow) toast({ kind: 'success', title: `Unshielded ${fmtPublic(claim.amount)} ${asset}`, body: 'Back in your public wallet balance' })
      },
      unshieldReset: () => set({ unshieldStep: 0, pendingUnshield: null }),

      /* send */
      sendOpen: async (
        recipient: { address: string; name?: string } = { address: data.send.to.address, name: data.send.to.ens },
        amount = data.send.amount,
        balance: 'priv' | 'pub' = 'priv',
        asset: Sym = 'USDC',
      ) => {
        const current = ref.current
        const value = num(amount)
        if (sending.current || !current.connected || current.sendStep !== 0 || value <= 0 || value > current.balances[asset][balance]) return
        const confidential = balance === 'priv'
        if (confidential && needPermit()) return
        const operation = Symbol()
        sending.current = operation
        const to = recipient.name ?? recipient.address
        const unit = confidential ? `f${asset}` : asset
        try {
          set({ sendStep: confidential ? 1 : 2, sendTo: recipient.address, sendRecipientName: recipient.name,
            sendNetworkIdx: current.networkIdx, sendBalance: balance, sendAsset: asset, amt: { ...current.amt, send: amount } })
          if (confidential) {
            await wait(D.send / 2)
            if (sending.current !== operation) return
            set({ sendStep: 2 })
          }
          await wait(D.send / 2)
          if (sending.current !== operation) return
          set({ sendStep: 4 })
          await wait(D.send / 2)
          if (sending.current !== operation) return
          if (failed() || value > ref.current.balances[asset][balance]) return set({ sendStep: 0 })
          const activity: Activity = {
            id: uid(), kind: 'transfer-out', label: confidential ? `Sent ${unit} confidentially` : `Sent ${unit}`,
            ...(confidential ? { priv: { sign: '−', value, unit } } : { amount: `−${fmtPublic(value, asset === 'ETH' ? 4 : 2)} ${unit}` }),
            recipientAddress: recipient.address, when: `Just now\u001fto ${to}`, hash: data.send.tx, status: 'confirmed',
          }
          set(state => ({
            sendStep: 3,
            balances: mv(state.balances, asset, confidential ? 0 : -value, confidential ? -value : 0),
            activity: [activity, ...state.activity],
          }))
          toast({ kind: 'success', title: confidential ? 'Sent confidentially' : 'Sent', body: `To ${to}`, action: { label: 'View', route: 'dashboard' } })
        } finally {
          if (sending.current === operation) sending.current = null
        }
      },
      sendReset: () => {
        sending.current = null
        set({ sendStep: 0 })
      },

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
      /** Tutorial practice never signs, changes balances, or adds activity. */
      tourShield: async (_real: boolean) => {
        if (ref.current.busy) return
        const e = epoch.current
        set({ shieldStep: 1, busy: true })
        await wait(900)
        if (stale(e)) return
        set({ shieldStep: 3 })
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
