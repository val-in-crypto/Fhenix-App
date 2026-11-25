import alpha from '../assets/apps/alpha-engine.png'
import trading from '../assets/apps/confidential-trading.png'
import privara from '../assets/apps/privara.png'
import obolos from '../assets/apps/obolos.svg'
import fluton from '../assets/apps/fluton.svg'
import cofhe from '../assets/apps/cofhe.svg'

const logos: Record<string, string> = { AlphaEngine: alpha, 'Confidential Trading': trading, Privara: privara, Obolos: obolos, Fluton: fluton, CoFHE: cofhe }
/** Figma source glyphs; image-backed monochrome sources retain their alpha masks. */
export default function AppLogo({ app, size = 40 }: { app: string; size?: number }) {
  const masked = ['AlphaEngine', 'Confidential Trading', 'Privara'].includes(app)
  return <span aria-hidden className="app-logo grid shrink-0 place-items-center border border-line bg-surface2" data-app={app} style={{width:size,height:size}}>
    {masked ? <span className="block h-[70%] w-[70%] bg-ink" style={{mask:`url(${logos[app]}) center / contain no-repeat`,WebkitMask:`url(${logos[app]}) center / contain no-repeat`}} /> : <img src={logos[app]} alt="" className="h-[70%] w-[70%]" />}
  </span>
}
