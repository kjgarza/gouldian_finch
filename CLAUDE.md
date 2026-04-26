# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
FontPairingManager (hardcoded at build time: "bitter-raleway")
  ↓
startRouter() → hash-based routing (#/, #/review, #/exam, #/browse, #/stats)
  ↓
shell() → renders nav + view container
  ↓
Views (home.ts, review.ts, exam.ts, browse.ts, stats.ts)
  ↓
State singleton (src/state.ts) → loads questions_de.json + questions_en.json
  ↓
localStorage (citizenTest_progress, citizenTest_stats, citizenTest_exam, citizenTest_langHelper)
```

### Router Pattern

- Hash-based routing defined in `src/router.ts`
- Routes: `#/` (home), `#/review`, `#/exam`, `#/browse`, `#/stats`
- Navigation uses `navigate(to: Route)` helper
- Route changes trigger listeners in `src/main.ts` to re-render views

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
const SELECTED_FONT_PAIRING: FontPairingKey = "bitter-raleway"
```

`FontPairingManager` (in `src/lib/font-pairings.ts`) loads Google Fonts and injects CSS custom properties. No runtime selector UI - developer must choose pairing before build.

## Data Pipeline Architecture

### Onion Architecture Layers

1. **Domain** (`src/pipeline/domain/types.ts`): Core question types
2. **Interfaces** (`src/pipeline/interfaces/contracts.ts`): Abstractions (IAIService, IDataService)
3. **Services** (`src/pipeline/services/`): Business logic (pipeline.ts, schema-mapper.ts)
4. **Infrastructure** (`src/pipeline/infrastructure/`): OpenAI client, file I/O

### Pipeline Flow

1. Load raw questions from `data/raw/questions.json`
2. For each question:
   - AI finds correct answer index
   - AI generates hint + explanation
3. Map to target schema with topic assignment
4. Translate to English via AI
5. Output to `data/postprocess/questions_{de,en}.json`

**Rate limiting**: 500ms delay between OpenAI calls to avoid quota limits.

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

## Common Modification Patterns

### Adding a New View

1. Create `src/views/my-view.ts` exporting `function MyView(): HTMLElement`
2. Add route to `src/router.ts`: `type Route = '#/' | '#/my-view' | ...`
3. Wire up in `src/main.ts`:
   ```typescript
   if (route === '#/my-view') shell(MyView())
   ```
4. Add nav button in shell template with `data-nav="#/my-view"`

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
