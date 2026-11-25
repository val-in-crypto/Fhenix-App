import { fmtPublic } from '../lib/format'
import { data, useStore, type Sym } from '../state/store'
import Button from './Button'

export default function PendingClaims({ asset }: { asset?: Sym }) {
  const {s,act}=useStore()
  const p=s.pendingUnshield
  if(!p||asset&&p.asset!==asset)return null
  const ready=s.unshieldStep===3
  const wrongNetwork=p.networkIdx!==undefined&&p.networkIdx!==s.networkIdx
  return <section className="border border-line bg-surface2 p-4"><h2 className="text-heading">Pending claims</h2><div className="mt-3 flex items-center justify-between gap-3"><div><p className="text-label">{fmtPublic(p.amount,p.asset==='ETH'?4:2)} {p.asset??'USDC'}</p><p className="text-caption text-ink3">{ready?'Ready to claim':'Decrypting…'}{wrongNetwork&&` · ${data.networks[p.networkIdx!].name}`}</p></div><Button size={44} busy={s.unshieldStep===4} disabled={s.busy||!ready} onClick={()=>wrongNetwork?act.setNetwork(p.networkIdx!):void act.claim()}>{wrongNetwork?'Switch network':'Claim'}</Button></div></section>
}
