import ShieldDemo from '../illus/ShieldDemo'
import { copy, nav, useStore } from '../state/store'
import Button from '../ui/Button'
import Icon from '../ui/Icon'

export default function Welcome() {
  const { s, act, mobile } = useStore()
  const learn = () => (s.connected ? act.tourStart() : act.startConnect(true))
  const returning = () => (s.connected ? nav('dashboard') : act.startConnect(false))

  if (mobile)
    return (
      <div className="welcome-content flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-4 pt-2" data-scroll>
        <h1 className="mx-auto max-w-[250px] shrink-0 text-center text-value font-medium  ">{copy.hero[0]}</h1>
        <p className="mx-auto mt-3 max-w-[320px] shrink-0 text-center text-body  text-ink2">{copy.hero[1]}</p>
        <div className="mt-4 flex shrink-0 justify-center">
          <ShieldDemo mobile className="border border-line" />
        </div>
        <div className="mt-4 flex shrink-0 flex-col gap-2">
          <Button size={52} full arrow onClick={learn}>
            {copy.welcomeCtas[0]}
          </Button>
          <Button variant="secondary" size={52} full onClick={returning}>
            {copy.welcomeCtas[1]}
          </Button>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-caption  text-ink3">
            <Icon name="info" />
            {copy.connect[2]}
          </p>
        </div>
      </div>
    )

  return (
    <div className="h-full overflow-hidden px-8 pb-10 pt-1">
      <div className="grid h-full max-w-[1184px] grid-cols-[minmax(300px,1fr)_minmax(0,1.25fr)] gap-10 border border-line bg-surface px-10 py-10">
        <div className="self-center">
          <h1 className="text-value" >
            {copy.hero[0]}
          </h1>
          <p className="mt-5 max-w-[400px] text-heading  text-ink2">{copy.hero[1]}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button size={48} arrow onClick={learn}>
              {copy.welcomeCtas[0]}
            </Button>
            <Button variant="secondary" size={48} onClick={returning}>
              {copy.welcomeCtas[1]}
            </Button>
          </div>
        </div>
        <div className="flex min-h-0 items-center justify-center self-stretch" style={{ containerType: 'size' }}>
          <ShieldDemo mobile={false} />
        </div>
      </div>
    </div>
  )
}
