# CLAUDE.md

Covers `src/pipeline/`.

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
