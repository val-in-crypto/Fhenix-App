import logo from '../assets/r5-logo.svg?raw'

export default function BrandLogo() {
  return <span role="img" aria-label="Fhenix" className="r5-brand inline-flex shrink-0 items-center" dangerouslySetInnerHTML={{ __html: logo }} />
}
