import { useId, useRef } from 'react'
import { useStore } from '../state/store'

type Option<T extends string> = { value: T; label: string }
export default function SegmentedSwitch<T extends string>({ options, value, onChange, width = 'hug', label, disabled = false }: {
  options: Option<T>[]; value: T; onChange: (value: T) => void; width?: 'hug' | 'fill'; label: string; disabled?: boolean
}) {
  const { mobile } = useStore()
  const id = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const move = (index: number) => {
    const next = (index + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }
  return (
    <div role="radiogroup" aria-label={label} className={`segmented-switch flex gap-1 border border-line bg-surface2 p-[3px] ${width === 'fill' ? 'w-full' : 'w-fit'}`} style={{ height: width === 'hug' ? 39 : mobile ? 42 : 34 }}>
      {options.map((option, index) => (
        <button ref={element => { refs.current[index] = element }} key={option.value} id={id + index} type="button" role="radio" aria-checked={option.value === value} disabled={disabled} tabIndex={option.value === value ? 0 : -1}
          onClick={() => onChange(option.value)}
          onKeyDown={event => {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            move(event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1))
          }}
          className={`flex min-w-0 items-center justify-center gap-2 border px-3 ${width === 'fill' ? `flex-1 ${mobile ? 'text-[15px]' : 'text-[14px]'}` : 'text-[13px]'} ${option.value === value ? 'border-accent bg-accentSoft font-semibold text-ink' : 'border-transparent font-medium text-ink3'}`}>
          <span aria-hidden className="size-2 shrink-0" style={{ background: option.value === value ? 'var(--color-accent)' : 'var(--color-swatch-off)' }} />{option.label}
        </button>
      ))}
    </div>
  )
}
