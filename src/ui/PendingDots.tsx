import { useMotion } from '../lib/motion'
export default function PendingDots() { const { reduced } = useMotion(); return <span aria-hidden className="pending-dots">{[0,1,2].map(i=><span key={i} style={reduced?{animation:'none',opacity:1}:undefined}/>)}</span> }
