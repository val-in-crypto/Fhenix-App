import {useEffect,useState} from 'react'
import {fmtPublic} from '../lib/format'
import ClaimReady from '../illus/ClaimReady'
import {installNavigationGuard,navWithoutGuard,useStore,type Route} from '../state/store'
import Button from './Button'
import Sheet,{SheetClose} from './Sheet'
import Steps from './Steps'

export default function ClaimReminder(){
  const {s,act,mobile}=useStore()
  const [target,setTarget]=useState<Route|null>(null)
  useEffect(()=>installNavigationGuard(next=>{if(s.pendingUnshield&&next!=='unshield'&&next!=='shield'){setTarget(next);return false}return true}),[s.pendingUnshield])
  const p=s.pendingUnshield
  const amount=p?`${fmtPublic(p.amount,p.asset==='ETH'?4:2)} ${p.asset??'USDC'}`:''
  const ready=s.unshieldStep>=3
  const later=()=>{const next=target;setTarget(null);if(next)navWithoutGuard(next)}
  return <Sheet open={Boolean(target&&p)} onClose={()=>setTarget(null)} label="Claim reminder" width={440} compact>
    <div className="flex items-center justify-between"><span className={`px-2 py-0.5 text-caption ${ready?'bg-accentSoft text-accentInk':'bg-surface2 text-ink3'}`}>{ready?'Ready to claim':'Unshield in progress'}</span><SheetClose onClick={()=>setTarget(null)}/></div>
    <div className={`mx-auto shrink-0 ${mobile?'h-[162px] w-[216px]':'h-[240px] w-[320px]'}`}><ClaimReady autoplay/></div>
    <div className="text-center"><h2 className="text-heading">Don’t leave yet</h2><p className="mt-1.5 text-body text-ink2">{ready?`${amount} is ready. Claim it now to finish unshielding. If you leave, it stays claimable from your dashboard.`:`Your ${amount} is decrypting, about 1 min left. Stay here to claim it the moment it’s ready.`}</p></div>
    {ready?<div className="flex justify-between gap-3 bg-surface2 p-3 text-body"><span>You receive</span><span className="text-label">{amount}</span></div>:<><Steps labels={['Unshield','Decrypt','Claim']} active={1} pending={true}/><p className="bg-surface2 p-3 text-caption text-ink2">If you leave, it stays claimable from your dashboard.</p></>}
    <div className="flex gap-2"><Button className="flex-1" size={44} variant="secondary" onClick={later}>Later</Button><Button className="flex-1" size={44} busy={s.busy} disabled={!ready||s.busy} onClick={()=>{setTarget(null);navWithoutGuard('unshield');void act.claim()}}>Claim {amount}</Button></div>
  </Sheet>
}
