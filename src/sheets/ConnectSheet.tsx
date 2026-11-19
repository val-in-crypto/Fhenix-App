import tokens from '../assets/tokens.json'
import { copy, data, useStore } from '../state/store'
import Chip from '../ui/Chip'
import Icon from '../ui/Icon'
import Sheet, { SheetClose } from '../ui/Sheet'

export default function ConnectSheet() {
  const { s, act } = useStore()
  return (
    <Sheet open={s.sheet?.name === 'connect'} onClose={act.closeSheet} label={copy.connect[0]} width={tokens.size.dialogWidth.connect}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[24px] font-medium leading-[30px] tracking-[-0.01em]">{copy.connect[0]}</h2>
          <p className="mt-1 text-[15px] leading-[22px] text-ink2">{copy.connect[1]}</p>
        </div>
        <SheetClose onClick={act.closeSheet} />
      </div>
      <ul className="flex flex-col gap-2">
        {data.wallets.map(w => {
          const busy = s.connecting === w.id
          return (
            <li key={w.id}>
              <button type="button" disabled={!!s.connecting} onClick={() => act.connect(w.id)} className={`flex h-16 w-full items-center gap-3 border px-4 text-left ${busy ? 'border-accent bg-accentSoft' : 'border-line bg-surface hover:border-lineStrong'} ${s.connecting && !busy ? 'opacity-50' : ''}`}>
                <span className="flex h-8 w-8 items-center justify-center text-[15px] font-semibold text-onAccent" style={{ background: '#F6851B' }}>
                  {w.name[0]}
                </span>
                <span className="flex-1 text-[16px] font-medium">{busy ? 'Connecting…' : w.name}</span>
                {busy ? (
                  <Icon name="spinner" size={18} className="text-accentInk" />
                ) : (
                  <>
                    {w.detected && <Chip className="uppercase !tracking-[0.08em]">Detected</Chip>}
                    <Icon name="chevron-down" className="-rotate-90 text-ink3" />
                  </>
                )}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="text-center text-[13px] leading-[18px] text-ink3">{copy.connect[2]}</p>
    </Sheet>
  )
}
