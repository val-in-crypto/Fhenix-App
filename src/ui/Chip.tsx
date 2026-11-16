import type { ReactNode } from 'react'

const tones = {
  accent: 'bg-accentSoft text-accentInk',
  live: 'bg-liveSoft text-live',
  neutral: 'bg-surface2 text-ink3',
  line: 'bg-white text-ink2 border border-line',
  danger: 'bg-dangerSoft text-danger',
  navy: 'bg-navy text-white',
} as const

export default function Chip({ tone = 'accent', dot, children, className = '' }: { tone?: keyof typeof tones; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={`mono inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 text-[12px] font-medium leading-4 ${tones[tone]} ${className}`}>
      {dot && <span className="round h-1.5 w-1.5 bg-current" />}
      {children}
    </span>
  )
}
