import { motion } from 'framer-motion'
import { useEffect } from 'react'
import DemoPanel from './demo/DemoPanel'
import { useMotion } from './lib/motion'
import Apps from './screens/Apps'
import Dashboard from './screens/Dashboard'
import Permits from './screens/Permits'
import Send from './screens/Send'
import ShieldFlow from './screens/ShieldFlow'
import TokenDetail from './screens/TokenDetail'
import Welcome from './screens/Welcome'
import AppShell from './shell/AppShell'
import ConnectSheet from './sheets/ConnectSheet'
import PermitSheet from './sheets/PermitSheet'
import { nav, useRoute, useStore, type Route } from './state/store'
import Tour from './tour/Tour'
import Toasts from './ui/Toasts'
import ClaimReminder from './ui/ClaimReminder'

const screen = (r: Route) => {
  switch (r) {
    case 'dashboard':
      return <Dashboard />
    case 'shield':
      return <ShieldFlow mode="shield" />
    case 'unshield':
      return <ShieldFlow mode="unshield" />
    case 'send':
      return <Send />
    case 'apps':
      return <Apps />
    case 'permits':
      return <Permits />
    default:
      return <Welcome />
  }
}

/** hash router: #/welcome #/dashboard #/shield #/unshield #/send #/apps #/permits */
export default function App() {
  const { s, mobile } = useStore()
  const route = useRoute()
  const { t, reduced } = useMotion()

  useEffect(() => {
    if (location.pathname === '/activity') {
      history.replaceState(null, '', '/#activity')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    }
    if (!location.hash) nav(s.connected ? 'dashboard' : 'welcome')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // every screen except Welcome needs a (mock) wallet
  useEffect(() => {
    if (!s.connected && route !== 'welcome') nav('welcome')
  }, [s.connected, route])
  useEffect(() => {
    document.querySelectorAll('[data-scroll]').forEach(el => (el.scrollTop = 0))
  }, [route])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!mobile || s.deviceFrame || !viewport) return
    const root = document.documentElement
    let frame = 0
    const sync = () => {
      const focused = document.activeElement
      const editing = focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement
      if (editing && viewport.scale === 1 && viewport.height < window.innerHeight - 80) {
        root.style.setProperty('--app-height', `${viewport.height}px`)
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => focused.scrollIntoView({ block: 'nearest' }))
      } else {
        root.style.removeProperty('--app-height')
      }
    }
    viewport.addEventListener('resize', sync)
    window.addEventListener('focusin', sync)
    window.addEventListener('focusout', sync)
    sync()
    return () => {
      viewport.removeEventListener('resize', sync)
      window.removeEventListener('focusin', sync)
      window.removeEventListener('focusout', sync)
      cancelAnimationFrame(frame)
      root.style.removeProperty('--app-height')
    }
  }, [mobile, s.deviceFrame])

  const framed = s.deviceFrame && window.innerWidth >= 480
  // shield and unshield share one screen: no remount, so the swap animates in place
  const viewKey = route === 'unshield' ? 'shield' : route
  return (
    <div className={`h-full ${reduced ? 'reduce-motion' : ''} ${framed ? 'flex items-center justify-center overflow-auto bg-lineStrong' : ''}`}>
      <div id="app-root" className="relative overflow-hidden bg-bg" style={framed ? { width: 390, height: 844, flexShrink: 0, boxShadow: '0 24px 80px rgb(var(--shadow-ink) / .35)' } : { height: 'var(--app-height, 100dvh)' }}>
        <AppShell route={route}>
          <motion.div key={viewKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: t(180) }} className={mobile ? 'flex min-h-0 min-w-0 flex-1 flex-col' : route === 'welcome' ? 'h-full' : ''}>
            {screen(route)}
          </motion.div>
        </AppShell>
        <Tour />
        <ConnectSheet />
        <PermitSheet />
        <TokenDetail />
        <ClaimReminder /><Toasts />
        <DemoPanel />
      </div>
    </div>
  )
}
