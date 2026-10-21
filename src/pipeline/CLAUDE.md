# CLAUDE.md

Covers `src/pipeline/`.

## Data Pipeline Architecture

### Onion Architecture Layers

1. **Domain** (`src/pipeline/domain/`): Core question types (`types.ts`) and the allowed-topic map (`topics.ts`, `ALLOWED_TOPICS`; a test keeps it equal to `Topic` in `src/types.ts`)
2. **Interfaces** (`src/pipeline/interfaces/contracts.ts`): Abstractions (IAIService, IDataService)
3. **Services** (`src/pipeline/services/`): Business logic (pipeline.ts, schema-mapper.ts, translation-guard.ts)
4. **Infrastructure** (`src/pipeline/infrastructure/`): OpenAI client, file I/O

### Pipeline Flow

1. Load raw questions from `data/raw/questions.json`
2. For each question:
   - AI finds correct answer index, unless the raw question pins `correctIndex` (substituted image questions 209, 226)
   - AI generates hint + explanation
3. Map to target schema with topic assignment: the committed label in `src/data/questions_de.json` wins, then keyword inference into a federal area. An unclassifiable question throws `TopicError` and aborts the run; there is no default topic.
4. Translate to English via AI. `enforceTranslationShape` copies the German topic and `correctIndex`; a changed choice count throws `TranslationShapeError` and aborts the run.
5. Output to `data/postprocess/questions_{de,en}.json`

**Rate limiting**: 500ms delay between OpenAI calls to avoid quota limits.
