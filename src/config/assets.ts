import { data, prices, type Balances, type Sym } from '../state/store'

export type PortfolioSym = Sym | 'WBTC' | 'USDT'
export const portfolioAssets = [...data.assets, ...data.zeroBalanceAssets]
export const portfolioSymbols = portfolioAssets.map(asset => asset.symbol as PortfolioSym)
export const portfolioPrice = (sym: PortfolioSym) => sym === 'ETH' || sym === 'USDC' ? prices[sym] : 0
export const portfolioBalance = (balances: Balances, sym: PortfolioSym) => sym === 'ETH' || sym === 'USDC' ? balances[sym] : { pub: 0, priv: 0 }
