import alpha from '../assets/apps/alpha-engine.png'
import trading from '../assets/apps/confidential-trading.png'
import privara from '../assets/apps/privara.png'
import obolos from '../assets/apps/obolos.svg'
import fluton from '../assets/apps/fluton.svg'
import cofhe from '../assets/apps/cofhe.svg'
import cofheApps from '../assets/apps/cofhe-apps.svg'

const logos: Record<string, string> = { AlphaEngine: alpha, 'Confidential Trading': trading, Privara: privara, Obolos: obolos, Fluton: fluton, CoFHE: cofhe }
/** Figma source glyphs; image-backed monochrome sources retain their alpha masks. */
export default function AppLogo({ app, size = 40, variant = 'default' }: { app: string; size?: number; variant?: 'default'|'apps-v3' }) {
  const masked = ['AlphaEngine', 'Confidential Trading', 'Privara'].includes(app)
  const glyph = variant==='apps-v3' ? ({'Confidential Trading':30,Obolos:26,Fluton:22,CoFHE:24}[app]??28)*size/40 : size*.7
  return <span aria-hidden className="app-logo grid shrink-0 place-items-center border border-line bg-surface2" data-app={app} data-variant={variant} style={{width:size,height:size}}>
    {masked ? <span className="block bg-ink" style={{width:glyph,height:glyph,mask:`url(${logos[app]}) center / contain no-repeat`,WebkitMask:`url(${logos[app]}) center / contain no-repeat`}} /> : <img src={variant==='apps-v3'&&app==='CoFHE'?cofheApps:logos[app]} alt="" width={glyph} height={glyph} />}
  </span>
}
