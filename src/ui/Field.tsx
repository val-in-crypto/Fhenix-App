import type { HTMLAttributes, ReactNode } from 'react'

export default function Field({ children, invalid = false, disabled = false, className = '', ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode; invalid?: boolean; disabled?: boolean }) {
  return <div {...props} className={`field-wrapper ${className}`} aria-invalid={invalid || undefined} aria-disabled={disabled || undefined}>{children}</div>
}
