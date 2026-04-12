# Exam mobile-layout and memory-game plan

## Goal
Implement two related improvements in Gouldian Finch:

1. Make exam mode use the main app area more effectively on mobile, with question content, answer choices, and bottom actions owning the primary viewport, likely by hiding the global navigation bar during the exam flow.
2. Add a new memory card mode for complex German terms, with English translations on the reverse or matched side, and reuse the same spaced-repetition behavior already used by review mode.

## Current architecture snapshot

### Routing and shell
- `src/router.ts` defines the current routes: `#/`, `#/review`, `#/exam`, `#/browse`, `#/stats`.
- `src/main.ts` renders a single shell with a sticky top navigation bar and a shared `<main>` wrapper for every route.
- The shell is route-agnostic today. It does not have route metadata like `hideNav`, `fullBleed`, or `mode`.

### Exam mode
- `src/views/exam.ts` is a self-contained exam flow.
- It samples 30 federal questions plus 3 Berlin questions and stores transient exam answers in local state.
- It renders:
  - a header,
  - a card with question and answer choices,
  - a fixed/sticky bottom CTA bar (`.cta-bar`),
  - a results screen with the option to add wrong answers into the review deck.
- The exam flow currently sits inside the same global shell as every other route, so the sticky navbar and the fixed CTA compete for vertical space on mobile.

### Review and spaced repetition
- `src/views/review.ts` owns the current session-selection logic via `pickDueBatch()`.
- `src/sm2.ts` owns the card scheduling algorithm via `updateCard()`.
- `src/storage.ts` persists progress in a single `citizenTest_progress` map keyed by numeric ids.
- The actual scheduler is only partially shared today:
  - scheduling math is reusable (`updateCard`),
  - due-card selection and session queue logic are embedded in `review.ts`,
  - storage assumes a single card namespace tied to question ids.

### Data model
- `src/types.ts` only models question cards, progress, stats, and exam attempts.
- `src/state.ts` loads German and English question datasets and offers `byId(id)` lookup.
- There is no separate concept yet for vocabulary terms, study items of multiple kinds, or namespaced progress keys.

### Home/navigation affordances
- `src/views/home.ts` exposes Review, Exam, Browse, and Stats cards.
- Top navigation in `src/main.ts` mirrors those modes.
- A new mode should be added in both places if it is meant to feel first-class.

## Proposed implementation direction

## 1) Make the shell route-aware
Create a small route configuration layer so routes can declare layout behavior.

### Suggested change
Add a route config structure in or near `src/router.ts` / `src/main.ts`, for example:
- label
- title
- `showNav`
- `mainClassName` or `layout: 'default' | 'immersive'`

### Why
This cleanly solves the exam mobile requirement without hardcoding special cases deep inside `ExamView()`. It also creates a reusable path for future immersive modes, including the new memory game if desired.

### Likely files
- `src/router.ts`
- `src/main.ts`
- `src/styles.css`

## 2) Give exam mode an immersive mobile layout
Hide the global navbar during `#/exam`, and let the exam header plus CTA bar be the only persistent framing elements during the test.

### Proposed UX behavior
- On mobile:
  - hide the global nav entirely in exam mode,
  - reduce outer padding around `<main>`,
  - let the question card occupy most of the viewport,
  - keep bottom controls sticky/fixed and thumb-friendly,
  - ensure the question area scrolls above the CTA bar without content being obscured.
- On larger screens:
  - either keep nav hidden for consistency, or restore it if the shell config supports breakpoint-aware behavior.
  - My recommendation: hide it for the entire exam route to keep the mode focused and reduce implementation complexity.

### Concrete UI work
- Move exam-specific identity/navigation into the exam header if needed, for example a compact “Exit exam” or “Back to home” action.
- Audit `.cta-bar` spacing and safe-area handling so iPhone bottom insets do not cover controls.
- Ensure long questions and four long answer choices remain readable without requiring awkward double scrolling.

### Likely files
- `src/main.ts`
- `src/views/exam.ts`
- `src/styles.css`
- possibly `src/components/button.ts` if a compact exit control is added

## 3) Extract spaced-repetition scheduling into shared study-item helpers
The memory game should reuse the same scheduling behavior as review mode, but the reusable pieces are split today.

### Extract these concerns out of `review.ts`
- due/new item selection
- batch assembly
- default progress creation
- requeue-on-again session behavior

### Recommended new module(s)
- `src/lib/study-session.ts` or `src/lib/spaced-repetition.ts`
- optional `src/lib/progress.ts` for key generation and card defaults

### Why
This avoids duplicating review logic in the new memory mode and makes the app’s “same SRS rules, different presentation modes” story explicit.

## 4) Introduce a generalized study-item identity model
Right now, progress keys are effectively question ids. That is too narrow for a second card type.

### Recommendation
Move from question-only numeric ids to namespaced study ids, for example:
- `question:123`
- `term:grundgesetz`

### Impact
- `ProgressMap` should become `Record<string, CardProgress>` semantically, and `CardProgress.id` should become `string` rather than `number`.
- Introduce helper functions to convert between raw item and progress key.

### Why this matters
Without namespacing, term cards could collide with existing question ids or force a second parallel storage system. Reusing the same algorithm is much simpler if the progress layer supports multiple item types.

### Likely files
- `src/types.ts`
- `src/storage.ts`
- `src/sm2.ts`
- `src/views/review.ts`
- `src/views/exam.ts` (wrong-answer add-to-review path)
- any helper module introduced for study sessions

## 5) Define a vocabulary-term data source derived from the question bank
The new memory mode needs a list of “complex German terms” and English translations.

### Recommended MVP approach
Create a curated term dataset rather than trying to infer “complex terms” automatically in the first implementation.

### Why
Automatic extraction from arbitrary question text is noisy and will likely produce poor cards, duplicated terms, inflected forms, and inconsistent translations. A curated file gives quality control and keeps the feature shippable.

### Suggested data shape
A new dataset like `src/data/terms_de_en.json` with entries such as:
- stable id / slug
- German term
- English translation
- optional topic
- optional linked question ids
- optional description/example

Example conceptual shape:
```json
{
  "id": "grundgesetz",
  "de": "Grundgesetz",
  "en": "Basic Law",
  "topic": "Politik in der Demokratie",
  "questionIds": [1, 42]
}
```

### Longer-term option
Later, a pipeline step could help generate candidate terms from the question bank and support manual review, but I would not couple that to the first delivery.

### Likely files
- `src/types.ts`
- `src/state.ts`
- new data file under `src/data/`
- possibly pipeline docs/scripts later, but not required for MVP

## 6) Build a dedicated memory game mode, separate from review mode
Implement a new route instead of overloading review mode.

### Route and navigation
Add a new route such as `#/memory`.

Expose it in:
- top navigation (`src/main.ts` shell)
- home page card grid (`src/views/home.ts`)

### Why a distinct mode
The user asked for it to be accessible like the other modes and for it to behave like a memory card game, which is a different interaction model from multiple-choice review.

## 7) Memory game interaction model
The user described “the complex term in German and the reverse card have a translation to English.” There are two reasonable UX interpretations.

### Recommended interpretation
A flip-card style flashcard flow, not a concentration/matching board.

Card front:
- German term

Card back:
- English translation
- optionally a linked question/topic chip

Actions:
- Reveal/flip
- Again
- Good

### Why I recommend this
- It maps directly onto the existing SRS mechanics.
- It is much simpler than a board-matching memory game while still serving memorization.
- It fits mobile better and mirrors the current review loop.

### Alternative, if you really want a board game
A classic pair-matching board can still write SRS outcomes at the end of a round, but grading is much less direct. You would need rules like:
- perfect match on first try = `good`
- repeated misses = `again`
This is possible, but it is a weaker first version and more implementation-heavy.

## 8) Implement term-memory view on top of shared SRS helpers
The new view should:
- load due term cards using the shared selector,
- present one term at a time,
- reveal translation on tap,
- grade with the same `again` / `good` actions and `updateCard()`,
- optionally requeue `again` items later in the same session, mirroring review mode.

### Likely files
- new `src/views/memory.ts`
- new shared study-session helper module
- `src/main.ts`
- `src/router.ts`
- `src/styles.css`
- possibly a small new presentational component for flip/reveal cards

## 9) Decide how stats should treat term cards
Open question: should memory-mode activity count toward the same global accuracy/streak/study totals, or only streak, or a separate stat bucket?

### Recommendation
- Reuse streak globally.
- Track term-card answers separately from question-review accuracy.

### Why
A flashcard translation mode measures a different skill from multiple-choice question review. Mixing both into one accuracy number will muddy the meaning of the Stats screen.

### Suggested follow-up
Add optional stats buckets later, for example:
- `reviewAnswered`
- `reviewAccuracy`
- `memoryAnswered`
- `memoryAccuracy`

This can be phased. For MVP, keep streak shared and leave aggregate accuracy unchanged unless Kristian wants combined metrics.

## 10) Migration and compatibility plan
Changing progress ids from numeric question ids to namespaced string ids is the main architectural risk.

### Recommended migration strategy
On load:
- detect legacy numeric progress entries,
- rewrite them to `question:<id>` keys,
- preserve all scheduling data,
- write back once.

### Why
This avoids wiping existing study history.

### Likely files
- `src/storage.ts`
- possibly a new migration helper module

## Delivery phases

## Phase 1: shared foundations
- Add route config / route metadata support.
- Introduce study-item key helpers and progress namespacing.
- Add legacy progress migration.
- Extract shared due-selection/session helpers from `review.ts`.

## Phase 2: exam mobile experience
- Make the shell hide global nav in exam mode.
- Reduce exam route padding and tune viewport usage.
- Add compact in-flow exit/navigation affordance.
- Verify bottom CTA usability and safe-area padding on mobile.

## Phase 3: vocabulary data layer
- Add curated term dataset.
- Add term types and state access helpers.
- Optionally include topic and linked-question metadata.

## Phase 4: memory mode
- Add `#/memory` route.
- Add nav item and home entry point.
- Build flashcard/reveal interaction.
- Hook term sessions into shared SRS helpers and persistence.

## Phase 5: polish and stats
- Decide whether memory mode affects aggregate stats.
- Add any dedicated term-progress counters.
- Refine copy, empty states, and completion states.

## Affected files and modules

### Very likely
- `src/router.ts`
- `src/main.ts`
- `src/styles.css`
- `src/views/exam.ts`
- `src/views/review.ts`
- `src/views/home.ts`
- `src/storage.ts`
- `src/sm2.ts`
- `src/types.ts`
- `src/state.ts`

### New files likely needed
- `src/views/memory.ts`
- `src/lib/study-session.ts` or similar
- `src/lib/study-keys.ts` or similar
- `src/data/terms_de_en.json`

### Possibly touched
- `src/views/stats.ts`
- `src/components/card.ts` or a new memory-card component

## Risks

### 1. Progress-key migration risk
If the progress map changes shape incorrectly, existing review history can be lost or become unreadable.

Mitigation:
- implement one explicit migration path,
- test with populated localStorage snapshots,
- keep migration idempotent.

### 2. Ambiguity of “memory card game”
The phrase could mean flashcards or a tile-matching board game.

Mitigation:
- confirm interaction expectation before implementation,
- my recommendation is flashcards first.

### 3. Vocabulary curation scope
“Complex terms” can expand quickly and become content-design work rather than product work.

Mitigation:
- ship with a curated starter set,
- optionally derive from the most difficult/high-frequency civics terms,
- expand iteratively.

### 4. Stats semantics
Combining flashcard and multiple-choice performance in one metric may make stats less meaningful.

Mitigation:
- separate or scope stats by mode.

### 5. Mobile layout regressions
Hiding nav and changing fixed bars can create overlap issues on small screens.

Mitigation:
- test on narrow heights and iOS safe-area conditions,
- ensure enough bottom padding in the content area.

## Open questions to resolve before coding
1. Does “memory card game” mean:
   - flashcards with reveal and grade, or
   - a classic pair-matching board game?
2. Should exam mode hide the navbar on desktop too, or only on mobile?
3. Should the memory mode live in top navigation, home, or both? I recommend both.
4. Should term cards count in the main statistics, or have their own stats section?
5. Should term cards be curated manually for now, or do you want a data-generation step added to the pipeline later?

## Recommended implementation order
1. Introduce route metadata and immersive shell support.
2. Refactor review scheduling into shared helpers.
3. Add study-item key namespacing and migration.
4. Ship the exam mobile-layout improvement.
5. Add curated term dataset and state/types.
6. Implement the memory flashcard mode.
7. Polish navigation, stats, and empty states.

## Recommendation
I would implement this as:
- immersive exam route,
- first-class `Memory` route,
- curated term flashcards,
- shared SRS engine via extracted helpers,
- namespaced progress keys with migration.

That gives the cleanest architecture and the least risk of hacking a second learning mode into question-only assumptions.