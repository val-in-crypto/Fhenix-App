import { useEffect, useState } from 'react'
import { portfolioAssets } from '../config/assets'
import { TOKEN_NETWORKS } from '../config/tokens'
import { fmtPublic, fmtUsd } from '../lib/format'
import { isMasked, prices, useStore, type Sym } from '../state/store'
import Field from './Field'
import Icon from './Icon'
import Masked from './Masked'
import Sheet, { SheetClose } from './Sheet'
import { Coin } from './TokenRow'

export default function TokenPicker({ open, onClose, selected, confidential, onSelect }: { open:boolean; onClose:()=>void; selected:string; confidential:boolean; onSelect:(sym:Sym)=>void }) {
  const { s } = useStore()
  const [search,setSearch] = useState('')
  useEffect(()=>{if(open)setSearch('')},[open])
  const contracts = TOKEN_NETWORKS[dataChain(s.networkIdx)]?.contracts
  const filtered = portfolioAssets.filter(a=>`${a.symbol} ${a.name} ${contracts?.[a.symbol as Sym]?.public ?? ''} ${contracts?.[a.symbol as Sym]?.confidential ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()))
  return <Sheet open={open} onClose={onClose} label="Select token" width={480} compact>
    <div className="flex items-center justify-between"><div><h2 className="text-heading">Select token</h2><p className="mt-1 text-caption text-ink3">{confidential ? 'Unshield from your confidential balance' : 'Shield from your public wallet balance'}</p></div><SheetClose onClick={onClose} /></div>
    <Field className="flex h-10 items-center gap-2 bg-surface2 px-3"><Icon name="search" size={16}/><input autoFocus aria-label="Search tokens" placeholder="Search name or paste address" value={search} onChange={e=>setSearch(e.target.value)} className="min-w-0 flex-1 text-body" /></Field>
    <div><div className="flex justify-between border-y border-line py-2 text-caption text-ink3"><span>Token</span><span>{confidential ? 'Confidential' : 'Public'} balance</span></div>
      {filtered.map(a=>{const sym=a.symbol as Sym; const balance=s.balances[sym]?.[confidential?'priv':'pub']??0;return <button key={sym} type="button" onClick={()=>{onSelect(sym);onClose()}} aria-pressed={sym===selected} className={`flex min-h-16 w-full items-center gap-3 p-2 text-left hover:bg-surface2 ${sym===selected?'bg-surface2':''}`}><Coin sym={sym}/><span className={`flex-1 ${balance===0?'opacity-60':''}`}><span className="block text-label">{confidential?'f':''}{sym}</span><span className="text-caption text-ink3">{a.name}</span></span><span className={`text-right ${balance===0?'opacity-60':''}`}><span className="block text-label">{confidential?<Masked hidden={isMasked(s)&&balance!==0} value={balance} dec={sym==='ETH'?4:2}/>:fmtPublic(balance,sym==='ETH'?4:2)}</span><span className="text-caption text-ink3">{fmtUsd(balance*prices[sym])}</span></span><span className="flex w-4 justify-center">{sym===selected&&<Icon name="check" size={16} className="text-accentInk"/>}</span></button>})}
      {!filtered.length&&<p className="py-4 text-body text-ink3">No tokens found.</p>}
    </div><p className="text-caption text-ink3">Only tokens with a confidential version can be shielded.</p>
  </Sheet>
}
import { data } from '../state/store'
const dataChain=(index:number)=>data.networks[index].chainId
