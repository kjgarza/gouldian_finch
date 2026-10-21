import type { ProcessedQuestion, TranslatedQuestion } from '../domain/types.js';

/** The model's translation changed the choice count, so answers would no longer line up. */
export class TranslationShapeError extends Error {
  name = 'TranslationShapeError';
}

export interface RawTranslation {
  question?: string;
  choices?: string[];
  hint?: string;
  explanation?: string;
  topic?: string; // ignored: the topic is copied from German
}

/**
 * Builds the English question from the model's reply. Topic and correctIndex come
 * from the German question; choices must keep the German count and order.
 */
export function enforceTranslationShape(source: ProcessedQuestion, t: RawTranslation): TranslatedQuestion {
  if (t.choices !== undefined && (!Array.isArray(t.choices) || t.choices.length !== source.choices.length)) {
    throw new TranslationShapeError(
      `Translation of question ${source.id} has wrong choice count: expected ${source.choices.length}, got ${Array.isArray(t.choices) ? t.choices.length : 'non-array'}`
    );
  }
  return {
    ...source,
    question: t.question || source.question,
    choices: t.choices ?? source.choices,
    hint: t.hint || source.hint,
    explanation: t.explanation || source.explanation,
    topic: source.topic,
  };
}
