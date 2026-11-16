import asterisk from '../assets/fhenix-asterisk.svg?raw'
import { Page } from '../shell/AppShell'
import { data, useStore } from '../state/store'
import Button from '../ui/Button'
import Chip from '../ui/Chip'
import Icon from '../ui/Icon'

const Tile = ({ abbr }: { abbr: string }) => <span className="mono flex h-10 w-10 shrink-0 items-center justify-center bg-navy text-[12px] font-medium text-accent">{abbr}</span>

function BuildCard({ mobile }: { mobile: boolean }) {
  return (
    <div className={`flex flex-col bg-accentSoft ${mobile ? 'p-5' : 'p-6'}`}>
      <span className="inline-flex h-6 [&>svg]:h-full [&>svg]:w-auto" aria-hidden dangerouslySetInnerHTML={{ __html: asterisk }} />
      <h2 className="mt-4 text-[24px] font-medium leading-[30px] tracking-[-0.01em]">Build on CoFHE</h2>
      <p className="mt-2 max-w-[260px] text-[14px] leading-5 text-ink2">Ship an app with encrypted state and get listed in Fhenix App.</p>
      <div className={mobile ? 'mt-4' : 'mt-auto pt-6'}>
        <Button variant="secondary" size={44}>
          Read the docs
        </Button>
      </div>
    </div>
  )
}

export default function Apps() {
  const { act, mobile } = useStore()
  const open = (name: string, live: boolean) => act.toast({ kind: 'info', title: live ? `${name} opens in a new tab` : `We'll notify you when ${name} is live` })

  if (mobile)
    return (
      <Page>
        <p className="text-[14px] leading-5 text-ink2">Confidential apps built on CoFHE</p>
        <ul className="mt-4 border border-line bg-white px-4">
          {data.apps.map(a => (
            <li key={a.name}>
              <button type="button" onClick={() => open(a.name, a.tag === 'Live')} className="flex w-full items-center gap-3 py-3 text-left">
                <Tile abbr={a.abbr} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium leading-5">{a.name}</span>
                  <span className="block text-[13px] leading-[18px] text-ink3">{a.desc}</span>
                </span>
                <Chip tone={a.tag === 'Live' ? 'live' : 'accent'} dot={a.tag === 'Live'} className="uppercase !tracking-[0.08em]">
                  {a.tag}
                </Chip>
                <Icon name="chevron-down" className="-rotate-90 text-ink3" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <BuildCard mobile />
        </div>
        <p className="mt-4 flex gap-1.5 text-[12px] leading-4 text-ink3">
          <Icon name="arrow-up-right" /> Live apps open their own site in a new tab. Check each app's terms before you connect.
        </p>
      </Page>
    )

  return (
    <Page>
      <p className="text-[14px] leading-5 text-ink2">Confidential apps built on CoFHE</p>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {data.apps.map(a => {
          const live = a.tag === 'Live'
          return (
            <button key={a.name} type="button" onClick={() => open(a.name, live)} className="flex min-h-[200px] flex-col border border-line bg-white p-6 text-left hover:border-accent">
              <span className="flex w-full items-start justify-between">
                <Tile abbr={a.abbr} />
                <Chip tone={live ? 'live' : 'accent'} dot={live} className="uppercase !tracking-[0.08em]">
                  {a.tag}
                </Chip>
              </span>
              <span className="mt-4 text-[19px] font-medium leading-6 tracking-[-0.01em]">{a.name}</span>
              <span className="eyebrow mt-1 text-ink3">{a.desc}</span>
              <span className="eyebrow mt-auto flex items-center gap-2 pt-6 text-ink">
                {live ? 'Enter' : 'Notify me'} <Icon name="pixel-arrow" size={10} />
              </span>
            </button>
          )
        })}
        <BuildCard mobile={false} />
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-[13px] leading-[18px] text-ink3">
        <Icon name="arrow-up-right" /> Live apps open their own site in a new tab. Check each app's terms before you connect.
      </p>
    </Page>
  )
}
