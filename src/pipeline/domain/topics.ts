// Single source of truth for topic labels inside the pipeline.
// Must equal `Topic` in src/types.ts; tests/pipeline-topics.test.ts enforces it
// (the app and pipeline are separate compilation contexts and can't import each other).

export const FEDERAL_TOPICS = [
  'Politik in der Demokratie',
  'Geschichte und Verantwortung',
  'Mensch und Gesellschaft',
] as const;

export const BERLIN_TOPIC = 'Bundesland Berlin' as const;

export const ALLOWED_TOPICS = [...FEDERAL_TOPICS, BERLIN_TOPIC] as const;

export type AllowedTopic = (typeof ALLOWED_TOPICS)[number];
export type Deck = 'federal' | 'berlin';

export function isAllowedTopic(value: unknown): value is AllowedTopic {
  return typeof value === 'string' && (ALLOWED_TOPICS as readonly string[]).includes(value);
}

/** Topics a deck may use: federal questions never get Berlin, and vice versa. */
export function topicsForDeck(deck: Deck): readonly AllowedTopic[] {
  return deck === 'berlin' ? [BERLIN_TOPIC] : FEDERAL_TOPICS;
}
