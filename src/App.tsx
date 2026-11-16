import { motion } from 'framer-motion'
import { useEffect } from 'react'
import DemoPanel from './demo/DemoPanel'
import { useMotion } from './lib/motion'
import Apps from './screens/Apps'
import Dashboard from './screens/Dashboard'
import Permits from './screens/Permits'
import PrivateNowScreen from './screens/PrivateNowScreen'
import Send from './screens/Send'
import ShieldFlow from './screens/ShieldFlow'
import TokenDetail from './screens/TokenDetail'
import Welcome from './screens/Welcome'
import AppShell from './shell/AppShell'
import ConnectSheet from './sheets/ConnectSheet'
import PermitSheet from './sheets/PermitSheet'
import SendReview from './sheets/SendReview'
import { nav, useRoute, useStore, type Route } from './state/store'
import Tour from './tour/Tour'
import Toasts from './ui/Toasts'

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
    case 'success':
      return <PrivateNowScreen />
    default:
      return <Welcome />
  }
}

/** hash router: #/welcome #/dashboard #/shield #/unshield #/send #/apps #/permits #/success */
export default function App() {
  const { s, mobile } = useStore()
  const route = useRoute()
  const { t, reduced } = useMotion()

  useEffect(() => {
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

  const framed = s.deviceFrame && window.innerWidth >= 480
  // shield and unshield share one screen: no remount, so the swap animates in place
  const viewKey = route === 'unshield' ? 'shield' : route
  return (
    <div className={`h-full ${reduced ? 'reduce-motion' : ''} ${framed ? 'flex items-center justify-center overflow-auto bg-lineStrong' : ''}`}>
      <div id="app-root" className="relative overflow-hidden bg-bg" style={framed ? { width: 390, height: 844, flexShrink: 0, boxShadow: '0 24px 80px rgba(0,22,35,.35)' } : { height: '100dvh' }}>
        <AppShell route={route}>
          <motion.div key={viewKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: t(180) }} className={mobile ? 'flex min-h-0 flex-1 flex-col' : route === 'welcome' ? 'h-full' : ''}>
            {screen(route)}
          </motion.div>
        </AppShell>
        <Tour />
        <ConnectSheet />
        <PermitSheet />
        <TokenDetail />
        <SendReview />
        <Toasts />
        <DemoPanel />
      </div>
    </div>
  )
}
