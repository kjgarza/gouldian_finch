import type { ISchemaMapper } from '../interfaces/contracts.js';
import type { RawQuestion, ProcessedQuestion } from '../domain/types.js';
import type { AllowedTopic, Deck } from '../domain/topics.js';
import { BERLIN_TOPIC, FEDERAL_TOPICS, isAllowedTopic, topicsForDeck } from '../domain/topics.js';

export interface SchemaMapperOptions {
  deck?: Deck;
  /** Topic labels already committed in questions_de.json, by question id. They win over inference. */
  existingTopics?: ReadonlyMap<number, string>;
}

/** Keyword rules, tried in order. Values are always members of the fixed topic map. */
const INFERENCE_RULES: ReadonlyArray<readonly [AllowedTopic, readonly string[]]> = [
  [FEDERAL_TOPICS[0], ['Grundgesetz', 'Verfassung', 'Grundrecht']],
  [FEDERAL_TOPICS[1], ['Geschichte', '1989', '1990']],
  [FEDERAL_TOPICS[2], ['Sozial', 'Gewerkschaft', 'Versicherung']],
];

/** Thrown for topics the pipeline must never guess; the run aborts instead of continuing. */
export class TopicError extends Error {}

export class SchemaMapperService implements ISchemaMapper {
  private readonly deck: Deck;
  private readonly existingTopics: ReadonlyMap<number, string>;

  constructor(options: SchemaMapperOptions = {}) {
    this.deck = options.deck ?? 'federal';
    this.existingTopics = options.existingTopics ?? new Map();
  }

  mapToProcessedSchema(
    raw: RawQuestion,
    correctIndex: number,
    hint: string,
    explanation: string,
    topic?: string
  ): ProcessedQuestion {
    return {
      id: raw.id,
      question: raw.question,
      choices: raw.options, // Map 'options' to 'choices'
      correctIndex,
      hint,
      explanation,
      topic: this.resolveTopic(raw, topic),
      ...(raw.substituted ? { substituted: true } : {}),
    };
  }

  private resolveTopic(raw: RawQuestion, explicit?: string): AllowedTopic {
    const allowed = topicsForDeck(this.deck);
    const candidate = this.existingTopics.get(raw.id) ?? explicit; // committed labels are never overwritten
    if (candidate !== undefined) {
      if (!isAllowedTopic(candidate) || !allowed.includes(candidate)) {
        throw new TopicError(
          `Topic "${candidate}" for question ${raw.id} is not an allowed topic for the ${this.deck} deck (allowed: ${allowed.join(', ')})`
        );
      }
      return candidate;
    }
    if (this.deck === 'berlin') return BERLIN_TOPIC;
    return this.inferTopic(raw);
  }

  private inferTopic(raw: RawQuestion): AllowedTopic {
    for (const [topic, keywords] of INFERENCE_RULES) {
      if (keywords.some((k) => raw.question.includes(k))) return topic;
    }
    throw new TopicError(
      `Cannot classify question ${raw.id} into one of: ${FEDERAL_TOPICS.join(', ')}. Add it to src/data/questions_de.json with a topic, or pass one explicitly.`
    );
  }
}
