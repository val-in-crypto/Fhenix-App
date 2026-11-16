import { motion } from 'framer-motion'
import { M, easeInOut, useMotion } from '../lib/motion'
import Icon from './Icon'

/** 40×40 white button inside a 4px ring of the surface colour; sits centred on the 12px gap between the two boxes. */
export default function SwapButton({ flipped, onClick, ring = '#FFFFFF', disabled }: { flipped: boolean; onClick: () => void; ring?: string; disabled?: boolean }) {
  const { t } = useMotion()
  return (
    <div className="relative z-10 h-3">
      <motion.button
        type="button"
        aria-label="Switch between shield and unshield"
        disabled={disabled}
        onClick={onClick}
        whileTap={{ scale: M.swapPress.scale }}
        transition={{ duration: t(M.swapPress.ms) }}
        className="absolute left-1/2 top-1/2 flex h-10 w-10 items-center justify-center border border-line bg-white text-ink hover:border-lineStrong"
        style={{ x: '-50%', y: '-50%', boxShadow: `0 0 0 4px ${ring}` }}
      >
        <motion.span className="flex" initial={false} animate={{ rotate: flipped ? 180 : 0 }} transition={{ duration: t(240), ease: easeInOut }}>
          <Icon name="arrow-down" size={18} />
        </motion.span>
      </motion.button>
    </div>
  )
}
