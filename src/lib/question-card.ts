import type { Question } from '../types'
import { topicMeta } from './topics'

export interface QuestionCardOptions {
  q: Question
  /** English counterpart; `byId` falls back to the German record. */
  en: Question
  /** English helper: adds the translation under the German, never replaces it. */
  showEnglish: boolean
  /** 1-based position in the session, and the session length. */
  position: number
  total: number
}

const CHECK_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="correct"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`

/**
 * Header band in the question's topic colour, the German question (English
 * under it when the helper is on), an empty #choices list and the hint area.
 * Choices are filled by renderChoices so callers can bind their own handler.
 */
export function questionCardHtml({ q, en, showEnglish, position, total }: QuestionCardOptions): string {
  const meta = topicMeta(q.topic)
  const progress = total > 0 ? Math.min(100, (position / total) * 100) : 0

  return `
    <section class="question-head ${meta.className}">
      <div class="flex min-h-11 items-center gap-3">
        <button type="button" data-close class="-ml-2.5 flex size-11 items-center justify-center" aria-label="End session">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
        <span class="question-progress" aria-hidden="true"><span style="width: ${progress}%"></span></span>
        <span class="font-mono text-xs">${position}/${total}</span>
      </div>
      <div class="mt-3.5 flex items-center justify-between gap-3">
        <span class="question-head-sub font-mono text-xs">${meta.short} · Nr. ${q.id}</span>
        <button type="button" role="switch" data-lang-switch class="lang-switch" aria-checked="${showEnglish}">
          English helper
          <span class="lang-switch-track" aria-hidden="true"></span>
        </button>
      </div>
      <h1 lang="de" class="mt-2.5 font-serif text-[28px] leading-[1.18]">${q.question}</h1>
      ${showEnglish ? `<p lang="en" class="question-head-sub mt-1.5 font-serif text-base italic leading-snug">${en.question}</p>` : ''}
    </section>

    <div id="choices" class="flex flex-col"></div>

    <div class="mt-4">
      <button type="button" id="hintBtn" class="btn btn-ghost btn-sm -ml-3 font-normal text-muted">Show hint</button>
      <div id="hintBox" class="hint-box hidden"></div>
    </div>
  `
}

/** One row per choice: German first, the English helper line under it. */
export function renderChoices(
  container: HTMLElement,
  { q, en, showEnglish }: Pick<QuestionCardOptions, 'q' | 'en' | 'showEnglish'>,
  onChoose: (idx: number) => void,
) {
  q.choices.forEach((choice, idx) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'answer'
    btn.innerHTML = `
      <span class="flex min-w-0 flex-1 flex-col">
        <span lang="de" class="answer-de text-[17px]">${choice}</span>
        ${showEnglish ? `<span lang="en" class="text-[13px]">${en.choices[idx] ?? ''}</span>` : ''}
      </span>
      <span class="answer-mark shrink-0"></span>
    `
    btn.addEventListener('click', () => onChoose(idx))
    container.appendChild(btn)
  })
}

/** Locks the choices and marks the correct one and a wrong pick. Records nothing. */
export function paintAnswer(container: ParentNode, q: Question, chosen: number) {
  const btns = Array.from(container.querySelectorAll<HTMLButtonElement>('#choices .answer'))
  btns.forEach((btn, i) => {
    btn.disabled = true
    const mark = btn.querySelector('.answer-mark')!
    if (i === q.correctIndex) {
      btn.classList.add('is-correct')
      mark.innerHTML = CHECK_ICON
    } else if (i === chosen) {
      btn.classList.add('is-wrong')
      mark.innerHTML = '<span class="font-mono text-xs font-normal">your answer</span>'
    } else {
      btn.classList.add('is-faded')
    }
  })
}

/** Hint stays behind a button, as before; the English line joins it when the helper is on. */
export function hintHtml(q: Question, en: Question, showEnglish: boolean): string {
  return `
    <p lang="de">${q.hint}</p>
    ${showEnglish ? `<p lang="en" class="mt-1.5 text-sm italic text-hint-ink">${en.hint}</p>` : ''}
  `
}
