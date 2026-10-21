# CLAUDE.md

Shared instructions for coding agents. `AGENTS.md` is a symlink to this file, so Codex, Cursor and others read the same content.

## Project Overview

Gouldian Finch is a mobile-first spaced repetition learning app for the German citizenship exam (Einbürgerungstest). Built with vanilla TypeScript + Vite, using localStorage for persistence and the SM-2 algorithm for spaced repetition.

## Commands

### Development
```bash
npm run dev          # Start Vite dev server at http://localhost:5173
npm run build        # TypeScript compile + Vite build
npm run preview      # Preview production build
```

### Data Pipeline
```bash
export OPENAI_API_KEY="sk-..."
npm run pipeline            # Process all questions from data/raw/
npm run pipeline:test       # Process test subset only
```

### Deployment
```bash
npm run deploy       # Build and deploy to GitHub Pages (gh-pages -d dist)
```

### Tests and direct commands

`npm test` runs `node --import ./tests/register.mjs --test tests/*.test.ts`. The `npm run …` scripts call npm internally; where npm is broken (mise shim), run the underlying commands directly:

```bash
node scripts/ensure-rollup-native.mjs && ./node_modules/.bin/tsc && ./node_modules/.bin/vite build   # build
node --import ./tests/register.mjs --test tests/*.test.ts                                           # test
```

Auto-deployment to GitHub Pages happens via `.github/workflows/deploy.yml` on push to `main`.

## Architecture

### Two Separate TypeScript Compilation Contexts

1. **Main App** (`tsconfig.json`): Single-page app with hash-based routing
   - Entry point: `src/main.ts`
   - No build framework (vanilla TypeScript DOM manipulation)
   - Vite for bundling, Tailwind v4 + DaisyUI for styling

2. **Data Pipeline** (`tsconfig.pipeline.json`): Node.js scripts for processing questions
   - Entry point: `src/pipeline/index.ts` (main) or `src/pipeline/test.ts` (test)
   - Uses OpenAI API to find correct answers, generate hints, and translate questions
   - Onion architecture: domain → interfaces → services → infrastructure

**Important**: These are separate compilation contexts. Main app files cannot import pipeline files and vice versa.

### Core Application Flow

```
src/main.ts
  ↓
FontPairingManager (hardcoded at build time: "newsreader-instrument")
  ↓
startRouter() → hash-based routing (#/, #/review, #/berlin, #/memory, #/exam, #/browse, #/stats)
  ↓
shell() → renders view container + bottom tab bar (only routes with showNav)
  ↓
Views (home.ts, review.ts, berlin.ts, memory.ts, exam.ts, browse.ts, stats.ts)
  ↓
State singleton (src/state.ts) → loads questions_de.json + questions_en.json
  ↓
localStorage (citizenTest_progress, citizenTest_stats, citizenTest_exam, citizenTest_langHelper)
```

### Router Pattern

- Hash-based routing defined in `src/router.ts`
- Routes: `#/` (home), `#/review`, `#/berlin`, `#/memory`, `#/exam`, `#/browse`, `#/stats`
- `ROUTE_CONFIG` holds per-route `label`, `title`, `showNav` and `mainClassName`
- Navigation uses `navigate(to: Route, query?)` helper; `navigate('#/review', { topic: 'politik' })` goes to `#/review?topic=politik`
- Query rides in the hash: only the path picks the view, `routeQuery()` returns the `URLSearchParams`. Review reads `topic` via `topicFromSlug(routeQuery().get('topic'))` to run one topic's deck
- Route changes trigger listeners in `src/main.ts` to re-render views

### Shell: Bottom Tab Bar

`shell()` in `src/main.ts` renders a `.tab-bar` fixed to the bottom for routes with `showNav` and a `label` (Home, Terms, Catalogue, Stats). Icons are stroke paths in `TAB_ICONS`, keyed by route; a tab-bar route without an entry renders an empty icon. Review, Berlin and exam have `showNav: false` and use `main-immersive` plus the fixed `.cta-bar` answer bar instead.

### View Pattern (No Framework)

Views are pure functions returning `HTMLElement` with imperative DOM construction:

```typescript
export function MyView(): HTMLElement {
  const root = document.createElement('div')
  root.innerHTML = `<div>...</div>`
  const btn = root.querySelector('#myBtn')
  btn.addEventListener('click', () => { /* handler */ })
  return root
}
```

**Never use JSX or template literals for event binding** - always imperatively attach listeners after setting innerHTML.

### State Management

- Global singleton in `src/state.ts` loads questions at startup
- All persistence via `src/storage.ts` helpers wrapping localStorage
- State mutation pattern: **load → mutate → save** (never mutate in-place)

```typescript
import { loadProgress, saveProgress, upsertCard } from './storage'
const updated = upsertCard(loadProgress(), cardId, (prev) => updateCard(prev, 'good'))
saveProgress(updated)
```

### Spaced Repetition (SM-2)

- Implemented in `src/sm2.ts`
- Two grades: `'again'` (quality=2) and `'good'` (quality=4)
- `'again'`: Resets interval to 0, decreases ease factor
- `'good'`: Increases interval (1d → 6d → exponential based on ease factor)
- Ease factor clamped between 1.3-2.8
- Due cards selected by `dueDate <= today`, sorted oldest first
- Batch size: 20 cards per review session

### Font Pairing System

Font selection is **hardcoded at build time** in `src/main.ts`:

```typescript
const SELECTED_FONT_PAIRING: FontPairingKey = "newsreader-instrument"
```

`FontPairingManager` (in `src/lib/font-pairings.ts`) loads Google Fonts and injects CSS custom properties. No runtime selector UI - developer must choose pairing before build.

### Topic System

`src/lib/topics.ts` is the single source for the four topics: `topicMeta(topic)` returns `{ short, slug, className }`, `topicFromSlug()` maps a URL slug back to a `Topic`. An unknown topic label falls back to Politik.

Each `className` (`.topic-politik`, `.topic-geschichte`, `.topic-gesellschaft`, `.topic-berlin`) sets `--topic`, `--topic-ink`, `--topic-sub` and `--topic-mark` in `src/styles.css`. Components (`.topic-band`, `.question-head`, `.topic-mark`) read those variables, so add the class to a wrapper and never hardcode a topic colour. `--topic-mark` is the small-square colour and can differ from the fill (Gesellschaft, Berlin) so it stays visible on the page.

### Shared Question Card

`src/lib/question-card.ts` renders the question screen used by `review.ts` and `berlin.ts`: `questionCardHtml()` (topic-coloured header band, German question, English helper line, empty `#choices`), `renderChoices()` (callers bind `onChoose`), `paintAnswer()` (locks choices, marks correct and wrong, records nothing) and `hintHtml()`. Change card layout here, not in the views.

### Theme Tokens ("fink")

`src/styles.css` registers one DaisyUI theme, `fink` (`themes: false` drops the built-ins; light only). Beyond DaisyUI's `--color-*` roles it defines `--color-surface`, `hairline`, `ink`, `muted`, `faded`, `correct`, `wrong`, `hint`, `hint-ink`, `live`, plus `--font-serif`, `--font-sans` and `--font-mono`; use them as Tailwind utilities (`text-muted`, `bg-hint`). Token contrast was measured in `docs/contrast-audit.md` (force-added; `docs/` is gitignored); re-measure after changing a token.

## Data Structures

### Question Schema

```json
{
  "id": 1,
  "question": "Question text...",
  "choices": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "hint": "Helpful hint...",
  "topic": "Politik in der Demokratie" | "Geschichte und Verantwortung" | "Mensch und Gesellschaft" | "Bundesland Berlin"
}
```

### localStorage Keys

- `citizenTest_progress`: Spaced repetition card states (interval, ease, due date)
- `citizenTest_stats`: Learning statistics and study streaks
- `citizenTest_exam`: Exam attempt history
- `citizenTest_langHelper`: Language preference (German/English toggle)

## Where detail lives

- `src/pipeline/CLAUDE.md` - data pipeline onion architecture layers and pipeline flow

## Common Modification Patterns

### Adding a New View

1. Create `src/views/my-view.ts` exporting `function MyView(): HTMLElement`
2. Add route to `src/router.ts`: `type Route = '#/' | '#/my-view' | ...`
3. Add `'#/my-view': { title, showNav }` to `ROUTE_CONFIG` (give it a `label` and a `TAB_ICONS` entry in `src/main.ts` to get a tab)
4. Add `case '#/my-view': view = MyView()` to the switch in `render()` in `src/main.ts`

### Modifying Question Schema

1. Update `src/types.ts` interface `Question`
2. Update pipeline domain types in `src/pipeline/domain/types.ts`
3. Update schema mapper in `src/pipeline/services/schema-mapper.ts`
4. Re-run pipeline: `npm run pipeline`

### Changing Spaced Repetition Logic

All SM-2 logic is isolated in `src/sm2.ts`. Modify `updateCard()` function. Note:
- Returns new object (immutable)
- Grade maps to quality: `again=2`, `good=4`
- Ease factor clamped between 1.3-2.8

## Tech Stack Notes

- **No React/Vue/Svelte**: Pure TypeScript DOM manipulation
- **No state library**: localStorage + global State singleton
- **Styling**: Tailwind CSS v4 + DaisyUI components
- **Vite config**: Uses `base: "/gouldian_finch/"` for GitHub Pages relative paths
- **i18n**: No library - dual JSON files (`questions_de.json`, `questions_en.json`) + toggle in `src/i18n.ts`
- **Path aliases**: `@/*` maps to `./src/*` (configured in tsconfig.json + vite.config.ts)

## Exam Requirements

The German naturalization test requires:
- 33 questions total (30 federal + 3 state-specific)
- 17+ correct answers to pass (51.5%)
- Topics must match: Politik in der Demokratie, Geschichte und Verantwortung, Mensch und Gesellschaft, Bundesland Berlin

<!--
Canonical instruction file. Edit this one; AGENTS.md is a symlink to it.
Machine-local or personal notes go in CLAUDE.local.md (gitignored).
Convention: notes/scratchpad/10-Projects/specs/agent-instructions-convention.md
-->
