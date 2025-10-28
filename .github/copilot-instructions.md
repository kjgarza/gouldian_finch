# Gouldian Finch - AI Coding Instructions

## Project Overview
A mobile-first spaced repetition learning app for German citizenship exam prep. Built with **vanilla TypeScript + Vite**, using **localStorage** for persistence and **SM-2 algorithm** for spaced repetition. Includes a separate OpenAI-powered data pipeline for question processing.

## Architecture

### Two Separate Compilation Contexts
1. **Main App** (`tsconfig.json`): Single-page app with hash-based routing, no build framework
2. **Data Pipeline** (`tsconfig.pipeline.json`): Node.js scripts using OpenAI API to process question data

Run pipeline with: `npm run pipeline` (requires `OPENAI_API_KEY` env var)

### Core Application Structure
- **Entry Point**: `src/main.ts` - Initializes font pairing and renders shell with navigation
- **Router**: Hash-based routing (`#/`, `#/review`, `#/exam`, `#/browse`, `#/stats`) in `src/router.ts`
- **State**: Global singleton in `src/state.ts` - loads JSON questions and wraps localStorage
- **Views**: Each view exports a function returning `HTMLElement` (imperative DOM construction)
- **Storage**: All persistence via localStorage with keys prefixed `citizenTest_`

### Data Flow
```
questions_de.json + questions_en.json → State.ALL_DE/ALL_EN
                                       ↓
                          localStorage (progress, stats, exams)
                                       ↓
                         Views query/mutate via storage.ts
```

## Key Patterns & Conventions

### View Pattern (No Framework)
Views are pure functions returning `HTMLElement`. Example from `src/views/review.ts`:
```typescript
export function ReviewView(): HTMLElement {
  const root = document.createElement('div')
  root.innerHTML = `<div>...</div>`
  const btn = root.querySelector('#myBtn')
  btn.addEventListener('click', () => { /* handler */ })
  return root
}
```
**Never use JSX or template literals for event binding** - always imperatively attach listeners.

### State Mutation via Storage Helpers
```typescript
import { loadProgress, saveProgress, upsertCard } from './storage'
const updated = upsertCard(loadProgress(), cardId, (prev) => updateCard(prev, 'good'))
saveProgress(updated)
```
Always load → mutate → save. Never mutate in-place.

### SM-2 Spaced Repetition
`src/sm2.ts` implements simplified SM-2 with two grades:
- `'again'` (quality=2): Reset interval to 0, decrease ease factor
- `'good'` (quality=4): Increase interval (1d → 6d → exponential)

Due cards selected by `dueDate <= today`, sorted oldest first, batch size 20.

### Font Pairing System
Font selection is **hardcoded at build time** in `src/main.ts`:
```typescript
const SELECTED_FONT_PAIRING: FontPairingKey = "bitter-raleway"
```
`FontPairingManager` in `src/lib/font-pairings.ts` loads Google Fonts link and injects CSS custom properties. **No runtime selector UI** - developer picks pairing before build.

## Data Pipeline (Separate Context)

### Onion Architecture
- **Domain**: `src/pipeline/domain/types.ts` - core question types
- **Interfaces**: `src/pipeline/interfaces/contracts.ts` - abstractions (IAIService, IDataService)
- **Services**: `src/pipeline/services/pipeline.ts` - orchestrates AI processing
- **Infrastructure**: OpenAI client, file I/O

### Pipeline Flow
1. Load raw questions from `data/raw/questions.json`
2. For each question: AI finds correct answer, generates hint + explanation
3. Map to target schema + translate to English
4. Output to `data/postprocess/questions_{de,en}.json`

**Rate limiting**: 500ms delay between OpenAI calls to avoid quota issues.

Run with: `npm run pipeline` or `npm run pipeline:test` (uses test data)

## Development Workflows

### Running the App
```bash
npm run dev          # Start dev server (Vite)
npm run build        # TypeScript compile + Vite build
npm run preview      # Preview production build
```

### Processing Questions
```bash
export OPENAI_API_KEY="sk-..."
npm run pipeline            # Process all questions
npm run pipeline:test       # Process test subset
```

### Deployment
Auto-deploys to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`.

## Common Tasks

### Adding a New View
1. Create `src/views/my-view.ts` exporting `function MyView(): HTMLElement`
2. Add route to `src/router.ts`: `type Route = '#/' | '#/my-view' | ...`
3. Wire up in `src/main.ts`: `if (route === '#/my-view') shell(MyView())`
4. Add nav button in shell template with `data-nav="#/my-view"`

### Modifying Question Schema
1. Update `src/types.ts` interface `Question`
2. Update pipeline types in `src/pipeline/domain/types.ts`
3. Update schema mapper in `src/pipeline/services/schema-mapper.ts`
4. Re-run pipeline to regenerate JSON files

### Changing Spaced Repetition Logic
All SM-2 logic isolated in `src/sm2.ts`. Modify `updateCard()` function. Note:
- Returns new object (immutable)
- Grade maps to quality: `again=2`, `good=4`
- Ease factor clamped between 1.3-2.8

## Tech Stack Gotchas

- **No React/Vue/Svelte** - pure TypeScript DOM manipulation
- **No bundled state management** - localStorage + global State singleton
- **Tailwind v4** + DaisyUI for styling
- **Vite**: Uses `base: "./"` for GitHub Pages relative paths
- **i18n**: Not a library - just dual JSON files + toggle in `Locales` helper

## Testing Philosophy
No automated tests currently. Manual QA via `npm run dev`. Pipeline tested with `data/raw/questions_test.json` subset.

## When to Run What
- **Modifying UI/views**: Just `npm run dev` (hot reload)
- **Changing fonts**: Update `SELECTED_FONT_PAIRING` in `main.ts`, rebuild
- **Processing new questions**: Put in `data/raw/`, run `npm run pipeline`
- **Before deploy**: `npm run build` to verify no TypeScript errors
