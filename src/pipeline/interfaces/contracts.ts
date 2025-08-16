import { RawQuestion, ProcessedQuestion, TranslatedQuestion } from '../domain/types.js';

// Core interfaces following dependency inversion principle

export interface IAIService {
  findCorrectAnswer(question: string, options: string[]): Promise<number>;
  generateHint(question: string, correctAnswer: string): Promise<string>;
  generateExplanation(question: string, correctAnswer: string): Promise<string>;
  translateQuestion(question: ProcessedQuestion): Promise<TranslatedQuestion>;
}

export interface IDataService {
  loadQuestions(filePath: string): Promise<RawQuestion[]>;
  saveQuestions(filePath: string, questions: ProcessedQuestion[]): Promise<void>;
  saveTranslatedQuestions(filePath: string, questions: TranslatedQuestion[]): Promise<void>;
}

export interface ISchemaMapper {
  mapToProcessedSchema(
    raw: RawQuestion,
    correctIndex: number,
    hint: string,
    explanation: string,
    topic?: string
  ): ProcessedQuestion;
}

export interface IPipeline {
  process(inputPath: string): Promise<void>;
}
