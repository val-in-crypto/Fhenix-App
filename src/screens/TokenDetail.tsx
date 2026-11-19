import { useEffect, useRef, useState } from 'react'
import { fmtPublic, fmtUsd } from '../lib/format'
import { data, isMasked, useStore } from '../state/store'
import { portfolioBalance, portfolioPrice, type PortfolioSym } from '../config/assets'
import { TOKEN_NETWORKS } from '../config/tokens'
import Button from '../ui/Button'
import Masked from '../ui/Masked'
import Sheet, { SheetClose } from '../ui/Sheet'
import { Coin, assetMeta, decOf } from '../ui/TokenRow'
import RatioBar from '../ui/RatioBar'
import Icon from '../ui/Icon'
import { Sep } from '../ui/Sep'

export default function TokenDetail() {
  const { s, act, mobile } = useStore()
  const open = s.sheet?.name === 'token'
  const last = useRef<PortfolioSym>('USDC')
  const [details, setDetails] = useState(false)
  if (open && assetMeta(s.sheet?.arg ?? '')) last.current = s.sheet!.arg as PortfolioSym
  useEffect(() => { if (open) setDetails(false) }, [open])
  const sym = last.current
  const asset = assetMeta(sym)
  const balances = portfolioBalance(s.balances, sym)
  const transferable = sym === 'ETH' || sym === 'USDC'
  const masked = isMasked(s) && transferable
  const price = portfolioPrice(sym)
  const network = data.networks[s.networkIdx]
  const config = TOKEN_NETWORKS[network.chainId]
  const contracts = transferable ? config?.contracts[sym] : undefined
  const dec = decOf(sym)
  const go = (route: 'shield' | 'send') => {
    if (sym !== 'ETH' && sym !== 'USDC') return
    act.closeSheet()
    if (route === 'shield') act.selectFlowAsset(sym)
    else act.sendReset()
    location.hash = `#/${route}?token=${sym}`
  }
  const copy = async (address: string) => {
    try { await navigator.clipboard.writeText(address); act.toast({ kind: 'info', title: 'Address copied' }) }
    catch { act.toast({ kind: 'info', title: 'Copy unavailable', body: address }) }
  }
  return <Sheet open={open} onClose={act.closeSheet} label={`${sym} balances`}>
    <div className="flex items-center gap-3">
      <Coin sym={sym} size={40} /><div className="min-w-0 flex-1"><h2 className="text-[24px] font-semibold">{sym}</h2><p className="text-[13px] text-ink3">{asset.name}<Sep />{network.name}</p></div><SheetClose onClick={act.closeSheet} />
    </div>
    <div className="flex items-center justify-between border-y border-line py-3"><span className="eyebrow text-ink3">Total</span><span className="text-[18px] font-medium">{masked ? '[*******]' : fmtUsd((balances.pub + balances.priv) * price)}</span></div>
    <div className="grid grid-cols-2 gap-3">
      {[true, false].map(confidential => <div key={String(confidential)} className={`min-w-0 border p-4 ${confidential ? 'confidential-box border-[var(--color-confidential-border)] bg-accentSoft' : 'border-line bg-surface2'}`}>
        <div className={`flex flex-wrap justify-between gap-x-2 ${mobile ? 'flex-col' : ''}`}><span className={`eyebrow ${confidential ? 'text-accentInk' : 'text-ink3'}`}>{confidential ? 'Confidential' : 'Public'}</span><span className="mono text-[12px] text-ink3">{confidential ? asset.wrapped : sym}</span></div>
        <div className="mono mt-2 break-words text-[clamp(14px,4vw,24px)] font-semibold leading-8">{confidential ? <Masked value={balances.priv} hidden={masked} dec={dec} className="!whitespace-normal [overflow-wrap:anywhere]" /> : fmtPublic(balances.pub, dec)}</div>
        <p className={`mt-2 text-[13px] ${confidential ? 'text-accentInk' : 'text-ink3'}`}>{confidential ? masked ? 'Create a permit to read it' : balances.priv === 0 ? 'No confidential balance' : 'Decrypted with your permit' : fmtUsd(balances.pub * price)}</p>
      </div>)}
    </div>
    <RatioBar priv={balances.priv * price} pub={balances.pub * price} hidden={masked} detail />
    <div className="grid grid-cols-2 gap-3"><Button icon="shield" size={48} disabled={!transferable} onClick={() => go('shield')}>Shield</Button><Button variant="secondary" size={48} disabled={!transferable} onClick={() => go('send')}>Send</Button></div>
    <div className="border-t border-line">
      <button type="button" aria-expanded={details} aria-controls="token-contracts" onClick={() => setDetails(!details)} className="flex min-h-11 w-full items-center justify-between text-[13px] font-medium text-ink3">Details<Icon name="chevron-down" size={14} className={details ? 'rotate-180' : ''} /></button>
      {details && <div id="token-contracts"><div className="eyebrow pb-2 text-ink3">Contracts<Sep />{network.name}</div>
        {contracts ? ([['Public', sym, contracts.public, 'ERC-20'], ['Confidential', asset.wrapped, contracts.confidential, 'FHERC20']] as const).map(([side, symbol, address, standard]) => <div key={side} className={`flex items-center gap-2 border-b border-line py-3 ${side === 'Confidential' ? 'text-accentInk' : ''}`}>
          <Coin sym={sym} size={28} shielded={side === 'Confidential'} /><div className="min-w-0 flex-1"><strong className="block text-[14px]">{symbol}</strong><span className="text-[12px] text-ink3">{side}{!mobile && ' token'}<Sep />{standard}</span><span className="mono block text-[12px]">{address.slice(0, 6)}…{address.slice(-4)}</span></div>
          <button type="button" aria-label={`Copy ${symbol} contract address`} onClick={() => void copy(address)} className="flex size-11 shrink-0 items-center justify-center"><Icon name="copy" size={16} /></button>
          <a href={config.explorer + '/token/' + address} target="_blank" rel="noopener noreferrer" aria-label={`View ${symbol} contract`} className="flex size-11 shrink-0 items-center justify-center"><Icon name="arrow-up-right" size={16} /></a>
        </div>) : <p className="text-[13px] text-ink3">Contract addresses are not configured for this network.</p>}
      </div>}
    </div>
  </Sheet>
}
