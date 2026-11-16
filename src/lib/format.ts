export const MASK = '[*******]'

const nf = (dec: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })

export const fmtPublic = (v: number, dec = 2) => nf(dec).format(v)
/** undefined ⇒ hidden */
export const fmtPrivate = (v: number | undefined, dec = 2) => (v === undefined ? MASK : `[${nf(dec).format(v)}]`)
export const fmtUsd = (v: number) => `$${nf(2).format(v)}`
export const num = (s: string) => parseFloat(String(s).replace(/,/g, '')) || 0
/** 500 → "500", 12.5 → "12.50" */
export const trimAmt = (v: number) => (Number.isInteger(v) ? String(v) : fmtPublic(v))
