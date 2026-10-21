// Domain types for the question processing pipeline

export interface RawQuestion {
  id: number;
  question: string;
  options: string[];
  /** Text stand-in for an official image-choice question. */
  substituted?: boolean;
}

export interface ProcessedQuestion {
  id: number;
  question: string;
  choices: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
  topic: string;
  substituted?: boolean;
}

export interface TranslatedQuestion extends ProcessedQuestion {
  // Same structure but in English
}

export type PipelineStep<T, R> = (input: T) => Promise<R>;
