import ethereum from '../assets/icons/chain-ethereum.svg?raw'
import base from '../assets/icons/chain-base.svg?raw'
import arbitrum from '../assets/icons/chain-arbitrum.svg?raw'
import generic from '../assets/icons/chain-generic.svg?raw'

const chains: Record<number, string> = { 1: ethereum, 11155111: ethereum, 8453: base, 84532: base, 42161: arbitrum, 421614: arbitrum }

export default function ChainIcon({ chainId, size = 16 }: { chainId: number; size?: number }) {
  const icon = chains[chainId] ?? generic
  const nativeSize = Number(/width="([\d.]+)"/.exec(icon)?.[1] ?? 16)
  return <span className="chain-icon inline-flex shrink-0" aria-hidden style={{ width: size, height: size }}><span style={{ transform: `scale(${size / nativeSize})`, transformOrigin: 'top left' }} dangerouslySetInnerHTML={{ __html: icon }} /></span>
}
