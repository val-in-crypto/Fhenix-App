import { getAddress } from 'viem'
import type { Sym } from '../state/store'

type ContractPair = { public: string; confidential: string }
type TokenNetwork = { explorer: string; contracts: Partial<Record<Sym, ContractPair>> }

/** Prototype contract fixtures. Replace with verified deployments before wallet integration. */
const fixtures: Partial<Record<Sym, ContractPair>> = {
  USDC: { public: getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'), confidential: getAddress('0x4f2d000000000000000000000000000000009a1e') },
  ETH: { public: getAddress('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'), confidential: getAddress('0x7f2d000000000000000000000000000000009a1e') },
}

export const TOKEN_NETWORKS: Record<number, TokenNetwork> = {
  11155111: { explorer: 'https://sepolia.etherscan.io', contracts: fixtures },
  421614: { explorer: 'https://sepolia.arbiscan.io', contracts: fixtures },
  84532: { explorer: 'https://sepolia.basescan.org', contracts: fixtures },
}

export const TX_HASHES = {
  shield: '0x9f2c' + '0'.repeat(56) + 'a83e',
  unshield: '0x5d10' + '0'.repeat(56) + 'c7e2',
  send: '0x4b7e' + '0'.repeat(56) + '19d0',
}
