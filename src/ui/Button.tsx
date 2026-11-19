import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'
import { useMotion } from '../lib/motion'
import Icon from './Icon'

type Props = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children?: ReactNode
  variant?: 'primary' | 'secondary' | 'text'
  /** 52 mobile primary · 56 in sheets · 48 desktop · 44 secondary / action */
  size?: 44 | 48 | 52 | 56
  icon?: string
  /** trailing pixel arrow */
  arrow?: boolean
  full?: boolean
  busy?: boolean
}

export default function Button({ variant = 'primary', size = 48, icon, arrow, full, busy, className = '', children, disabled, style, ...rest }: Props) {
  const { t } = useMotion()
  const big = size >= 52
  const base = 'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap px-5 '
  const look =
    variant === 'primary'
      ? `font-semibold ${disabled ? 'bg-disabledFill text-disabledInk' : 'bg-accent text-onAccent hover:bg-accentHover'}`
      : variant === 'secondary'
        ? `border border-line bg-surface font-medium text-ink ${disabled ? 'opacity-60' : 'hover:border-lineStrong hover:bg-surface2'}`
        : 'px-2 font-medium text-ink3 hover:text-ink'
  const type = big && variant === 'primary' ? 'text-[19px] leading-6' : big ? 'text-[16px] leading-6' : 'text-[15px] leading-5'
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: t(120) }}
      disabled={disabled}
      className={`${base} ${look} ${type} ${full ? 'w-full' : ''} ${className}`}
      style={{ height: size, ...style }}
      {...rest}
    >
      {busy ? <Icon name="spinner" size={18} /> : icon ? <Icon name={icon} size={20} className={variant === 'secondary' ? 'text-ink2' : ''} /> : null}
      {children}
      {arrow && !busy && !disabled && <Icon name="pixel-arrow" size={big ? 12 : 10} />}
    </motion.button>
  )
}
