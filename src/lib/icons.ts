// Phosphor "regular" weight, imported as raw SVG so there is no web font or icon
// runtime. The files use fill="currentColor", so text colour drives the glyph.
import caretRight from '@phosphor-icons/core/assets/regular/caret-right.svg?raw'
import chartBar from '@phosphor-icons/core/assets/regular/chart-bar.svg?raw'
import cards from '@phosphor-icons/core/assets/regular/cards.svg?raw'
import check from '@phosphor-icons/core/assets/regular/check.svg?raw'
import house from '@phosphor-icons/core/assets/regular/house.svg?raw'
import listBullets from '@phosphor-icons/core/assets/regular/list-bullets.svg?raw'
import x from '@phosphor-icons/core/assets/regular/x.svg?raw'

const ICONS = {
  'caret-right': caretRight,
  'chart-bar': chartBar,
  cards,
  check,
  house,
  'list-bullets': listBullets,
  x,
} as const

export type IconName = keyof typeof ICONS

interface IconOptions {
  /** Square size in px. */
  size: number
  /** Accessible name. Without it the icon is decorative and hidden from assistive tech. */
  label?: string
}

/** Inline SVG for a Phosphor icon, sized and marked up for accessibility. */
export function icon(name: IconName, { size, label }: IconOptions): string {
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'
  return ICONS[name].replace('<svg ', `<svg width="${size}" height="${size}" ${a11y} `)
}
