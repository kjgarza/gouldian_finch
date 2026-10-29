import { ALL_BERLIN_DE, ALL_DE } from '../state'
import { Footer } from '../lib/footer'
import { author } from '../lib/author'
import { icon } from '../lib/icons'

const REPO_URL = 'https://github.com/kjgarza/gouldian_finch'

export function AboutView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'

  root.innerHTML = `
    <header class="flex min-h-11 items-center">
      <a href="#/" aria-label="Back to home" class="flex min-h-11 items-center gap-1 font-serif text-[22px] font-medium">
        <span class="inline-flex rotate-180">${icon('caret-right', { size: 18 })}</span>Finch
      </a>
    </header>

    <article class="mt-4 flex max-w-prose flex-col gap-4 text-[17px] leading-relaxed">
      <h1 class="font-serif text-4xl leading-[1.05]">About Finch</h1>
      <p class="text-muted">A small study tool for the German citizenship test (Einbürgerungstest).</p>

      <p>
        The test draws 33 questions from a public catalogue: 30 from the ${ALL_DE.length} federal questions
        and 3 from the questions for your Bundesland. You need 17 right to pass. None of it is hard,
        but there is a lot of it, and most of it only sticks if you see it again at the right moment.
      </p>

      <p>
        Finch does that part for you. Each question is a card scheduled with SM-2 (the spaced repetition
        algorithm behind most flashcard apps): get it right and it comes back later, get it wrong and it
        comes back soon. The three federal topic decks, the ${ALL_BERLIN_DE.length} Berlin questions and a
        term list run on that schedule, and a practice exam in the real 30 + 3 format shows where you stand.
      </p>

      <p>
        The questions stay in German, as they are in the test, with an English line underneath for
        when the vocabulary gets in the way. For the federal questions, the answers, hints and
        translations were prepared with the help of a language model, so if one disagrees with the
        official catalogue, trust the catalogue and let me know. The Berlin questions follow the
        official state catalogue, with hints written by hand.
      </p>

      <p>
        There are no accounts and no tracking, and your progress never leaves this browser. It lives in
        local storage, which also means clearing site data or switching devices starts you from zero.
      </p>

      <p>
        The code is open on <a class="underline hover:text-primary" href="${REPO_URL}" target="_blank" rel="noopener noreferrer">GitHub</a>.
        Corrections, missing questions and other Bundesländer are all welcome, as issues or by
        <a class="underline hover:text-primary" href="mailto:${author.email}">email</a>.
      </p>

      <hr class="my-4 border-base-300">

      <footer>
        <p class="font-semibold">${author.name}</p>
        <p class="font-mono text-xs text-muted">Berlin, October 2026</p>
      </footer>
    </article>
  `

  root.appendChild(Footer())

  return root
}
