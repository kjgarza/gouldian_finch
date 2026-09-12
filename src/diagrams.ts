import raw from './data/diagrams.json'
import type { Diagram, DiagramAspect } from './types'

export const ALL_DIAGRAMS: Diagram[] = raw as Diagram[]

const byQuestion = new Map<number, Diagram>()
for (const d of ALL_DIAGRAMS) {
  for (const id of d.questionIds) {
    // First concept wins, so a question never shows two diagrams.
    if (!byQuestion.has(id)) byQuestion.set(id, d)
  }
}

export function diagramFor(questionId: number): Diagram | undefined {
  return byQuestion.get(questionId)
}

export function diagramCount(): number {
  return ALL_DIAGRAMS.filter(d => d.file).length
}

const ASPECT_CSS: Record<DiagramAspect, string> = {
  '1:1': '1 / 1',
  '4:5': '4 / 5',
  '3:4': '3 / 4',
  '9:16': '9 / 16',
}

const DEFAULT_ASPECT = ASPECT_CSS['4:5']

function assetUrl(file: string): string {
  return `${import.meta.env.BASE_URL}${file}`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Markup for a diagram hint. Returns '' when the question has no diagram, so
 * call sites can interpolate it unconditionally.
 *
 * The wrapper carries the declared aspect ratio, which reserves the right box
 * before the PNG loads and stops the card from jumping. Tapping the figure
 * drops the ratio cap so dense organigrams can be read full height on a phone.
 *
 * Deliberately plain <div>s, not <figure>/<figcaption>: every call site nests
 * this inside a DaisyUI `.card`, and DaisyUI's `.card figure { display: flex }`
 * rule turns a real <figure> into a shrink-to-fit flex row — the button and
 * caption end up squeezed side by side at a fraction of the card's width
 * instead of stacked full-width. Plain divs are immune to that selector.
 */
export function diagramHintHtml(questionId: number, showEnglish: boolean): string {
  const d = diagramFor(questionId)
  if (!d || !d.file) return ''
  const title = showEnglish ? d.titleEn : d.titleDe
  const sub = showEnglish ? d.titleDe : d.titleEn
  const alt = showEnglish ? d.altEn : d.altDe
  return `
    <div class="diagram-hint mt-3 w-full" data-diagram="${esc(d.key)}" data-expanded="false">
      <button type="button" class="block w-full text-left" data-diagram-toggle
              aria-label="Enlarge diagram: ${esc(title)}">
        <div class="diagram-frame w-full overflow-hidden rounded-lg border border-border bg-white"
             style="aspect-ratio: ${ASPECT_CSS[d.aspect] ?? DEFAULT_ASPECT}">
          <img src="${assetUrl(d.file)}" alt="${esc(alt)}" loading="lazy" decoding="async"
               class="w-full h-full object-contain" />
        </div>
      </button>
      <div class="mt-1 text-xs text-muted-foreground">
        <span class="font-medium">${esc(title)}</span>
        <span class="opacity-70"> · ${esc(sub)}</span>
        <span class="opacity-70"> · tap to enlarge</span>
      </div>
    </div>
  `
}

/**
 * Wire the tap-to-enlarge behaviour for every diagram inside `root`. Safe to
 * call after each re-render; listeners live on the freshly built nodes.
 */
export function bindDiagramToggles(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-diagram-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const fig = btn.closest('.diagram-hint') as HTMLElement | null
      if (!fig) return
      const frame = fig.querySelector('.diagram-frame') as HTMLElement | null
      if (!frame) return
      const expanded = fig.dataset.expanded === 'true'
      fig.dataset.expanded = expanded ? 'false' : 'true'
      if (expanded) {
        frame.style.aspectRatio = fig.dataset.aspect || DEFAULT_ASPECT
        frame.style.maxHeight = ''
      } else {
        fig.dataset.aspect = frame.style.aspectRatio
        frame.style.aspectRatio = 'auto'
        frame.style.maxHeight = '75vh'
      }
    })
  })
}
