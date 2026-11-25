import { useMotion } from '../lib/motion'

export default function Steps({ labels, active, pending }: { labels: string[]; active: number; pending: boolean }) {
  const { reduced } = useMotion()
  return (
    <ol className="mt-6 flex gap-2" aria-label="Progress">
      {labels.map((label, index) => (
        <li key={index} aria-current={active === index ? 'step' : undefined} className="min-w-0 flex-1">
          <div className={`relative h-[3px] overflow-hidden ${index < active ? 'bg-ink' : index === active ? 'bg-accent' : 'bg-line'}`}>
            {pending && active === index && !reduced && <span className="step-sweep absolute inset-y-0 w-1/3 bg-ink/30" />}
          </div>
          <div className={`mt-2 flex gap-1 text-caption ${index <= active ? 'text-ink' : 'text-ink3'}`}><span>0{index + 1}</span><span>{label}</span></div>
          {pending && active === index && reduced && <span className="text-caption text-ink3">Waiting…</span>}
        </li>
      ))}
    </ol>
  )
}
