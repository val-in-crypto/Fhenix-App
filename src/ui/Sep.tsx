import { Children, Fragment, isValidElement, cloneElement, type ReactNode } from 'react'

export function Sep() {
  return <span className="sep" aria-hidden="true"> | </span>
}

/** Separates legacy persisted metadata as well as current copy parts. */
export function separate(value: ReactNode): ReactNode {
  if (typeof value === 'string') return value.split(/\s*[·\u001f]\s*/).map((part, index) => <Fragment key={index}>{index > 0 && <Sep />}{part}</Fragment>)
  if (Array.isArray(value)) return Children.map(value, separate)
  if (isValidElement<{ children?: ReactNode }>(value) && value.props.children !== undefined) {
    return cloneElement(value, {}, separate(value.props.children))
  }
  return value
}
