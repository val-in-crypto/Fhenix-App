import { useStore } from '../state/store'
import sent from '../assets/illustrations/sent.svg?raw'
import unshield from '../assets/illustrations/unshield-complete.svg?raw'

export default function SuccessIllustration({ kind }: { kind: 'sent' | 'unshield' }) {
  const { mobile } = useStore()
  const width = mobile ? 216 : 320
  const height = mobile ? 162 : 240
  const originalHeight = kind === 'sent' ? 420 : 456
  const scale = Math.min(width / 560, height / originalHeight)
  return (
    <div role="img" aria-label={kind === 'sent' ? 'Confidential tokens delivered to the recipient' : 'Tokens returned to your public balance'} className={`success-art success-art-${kind} relative h-full w-full`}>
      <div style={{ position: 'absolute', width: 560, height: originalHeight, left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${scale})` }} dangerouslySetInnerHTML={{ __html: kind === 'sent' ? sent : unshield }} />
    </div>
  )
}
