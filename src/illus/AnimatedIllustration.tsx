import {useEffect,useId,useMemo,useRef} from 'react'
import {useMotion} from '../lib/motion'
import claim from '../assets/illustrations/claim-ready.svg?raw'
import shield from '../assets/illustrations/private-now.svg?raw'
import unshield from '../assets/illustrations/unshield-complete.svg?raw'
import sent from '../assets/illustrations/sent.svg?raw'
import './illustrations.css'

const art={claim,shield,unshield,sent}
const labels={claim:'Confidential tokens ready to claim into your wallet',shield:'Tokens shielded into your confidential balance',unshield:'Tokens returned to your public balance',sent:'Confidential tokens delivered to the recipient'}
export default function AnimatedIllustration({kind,autoplay=true}:{kind:keyof typeof art;autoplay?:boolean}){
  const host=useRef<HTMLDivElement>(null)
  const id=useId().replace(/:/g,'')
  const {reduced}=useMotion()
  const raw=useMemo(()=>{
    let svg=art[kind]
    const ids=Array.from(svg.matchAll(/\bid="([^"]+)"/g),m=>m[1])
    for(const name of ids){svg=svg.split(`id="${name}"`).join(`id="${id}-${name}" data-layer="${name}"`).split(`url(#${name})`).join(`url(#${id}-${name})`).split(`href="#${name}"`).join(`href="#${id}-${name}"`)}
    return svg
  },[kind,id])
  useEffect(()=>{
    const svg=host.current?.querySelector('svg')
    if(!svg)return
    let timer:ReturnType<typeof setTimeout>|undefined
    let visible=false,played=false
    const clear=()=>{if(timer!==undefined)clearTimeout(timer);timer=undefined}
    const play=()=>{
      clear()
      svg.dataset.state='static'
      if(reduced||!visible||document.hidden)return
      void svg.getBoundingClientRect()
      svg.dataset.state='play'
      played=true
      const ms=Number.parseInt(getComputedStyle(svg).getPropertyValue('--play-ms'))||1700
      timer=setTimeout(()=>{timer=undefined;if(visible&&!document.hidden)svg.dataset.state='idle';else svg.dataset.state='static'},ms)
    }
    const sync=()=>{
      if(reduced){clear();svg.dataset.state='static';return}
      if(!visible||document.hidden){svg.setAttribute('data-paused','');return}
      svg.removeAttribute('data-paused')
      if(svg.dataset.state==='static'||svg.dataset.state==='waiting'){if(autoplay&&!played)play();else svg.dataset.state='idle'}
    }
    svg.dataset.state=!reduced&&kind==='sent'?'waiting':'static'
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()},{threshold:0})
    observer.observe(svg)
    document.addEventListener('visibilitychange',sync)
    document.addEventListener('fhenix:replay-illustrations',play)
    return()=>{clear();observer.disconnect();document.removeEventListener('visibilitychange',sync);document.removeEventListener('fhenix:replay-illustrations',play)}
  },[raw,reduced,autoplay,kind])
  return <div ref={host} role="img" aria-label={labels[kind]} className="animated-illustration relative flex h-full w-full items-center justify-center overflow-visible" dangerouslySetInnerHTML={{__html:raw}}/>
}
