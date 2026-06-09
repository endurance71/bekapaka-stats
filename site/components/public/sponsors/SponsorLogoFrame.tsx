import type { CSSProperties } from 'react'
import type { SponsorItem } from '../../../lib/data'

type SponsorLogoFrameProps = {
  sponsor: Pick<
    SponsorItem,
    | 'name'
    | 'logoUrl'
    | 'logoBgColor'
    | 'logoFit'
    | 'logoSliderFit'
    | 'logoCardFit'
    | 'logoSliderScale'
    | 'logoSliderPadding'
    | 'logoCardScale'
    | 'logoCardPadding'
  >
  variant?: 'card' | 'slider'
}

export function SponsorLogoFrame({ sponsor, variant = 'card' }: SponsorLogoFrameProps) {
  if (!sponsor.logoUrl) return null

  const isSlider = variant === 'slider'
  const fit =
    (isSlider ? sponsor.logoSliderFit ?? sponsor.logoFit : sponsor.logoCardFit ?? sponsor.logoFit) ?? 'contain'
  const frameClass = [
    variant === 'card' ? 'sponsor-card-premium__logo-container' : 'sponsor-logo-frame--slider',
    'sponsor-logo-frame--dimmed',
    fit === 'fill' ? 'sponsor-logo-frame--fill' : 'sponsor-logo-frame--contain'
  ].join(' ')

  const imgClass =
    variant === 'card' ? 'sponsor-card-premium__logo' : 'sponsor-logo-frame__img sponsor-logo-img'

  const frameStyle: CSSProperties & {
    '--logo-slider-scale'?: string
    '--logo-card-scale'?: string
  } = {}
  if (sponsor.logoBgColor) frameStyle.backgroundColor = sponsor.logoBgColor
  if (isSlider && sponsor.logoSliderPadding) frameStyle.padding = sponsor.logoSliderPadding
  if (!isSlider && sponsor.logoCardPadding) frameStyle.padding = sponsor.logoCardPadding
  if (isSlider && sponsor.logoSliderScale) {
    frameStyle['--logo-slider-scale'] = String(sponsor.logoSliderScale)
  }
  if (!isSlider && sponsor.logoCardScale) {
    frameStyle['--logo-card-scale'] = String(sponsor.logoCardScale)
  }

  return (
    <div
      className={frameClass}
      style={Object.keys(frameStyle).length > 0 ? frameStyle : undefined}
      aria-hidden={variant === 'card' ? true : undefined}
    >
      <img src={sponsor.logoUrl} alt={variant === 'slider' ? sponsor.name : ''} className={imgClass} />
    </div>
  )
}
