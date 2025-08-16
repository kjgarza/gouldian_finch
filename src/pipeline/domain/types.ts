// Domain types for the question processing pipeline

export interface RawQuestion {
  id: number;
  question: string;
  options: string[];
}

export interface ProcessedQuestion {
  id: number;
  question: string;
  choices: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
  topic: string;
}

export interface TranslatedQuestion extends ProcessedQuestion {
  // Same structure but in English
}

export type PipelineStep<T, R> = (input: T) => Promise<R>;
