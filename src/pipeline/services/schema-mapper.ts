import { ISchemaMapper } from '../interfaces/contracts.js';
import { RawQuestion, ProcessedQuestion } from '../domain/types.js';

export class SchemaMapperService implements ISchemaMapper {
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
      topic: topic || this.inferTopic(raw.question),
    };
  }

  private inferTopic(question: string): string {
    // Simple topic inference based on question content
    if (question.includes('Grundgesetz') || question.includes('Verfassung') || question.includes('Grundrecht')) {
      return 'Politik in der Demokratie';
    }
    if (question.includes('Bundesland') || question.includes('Berlin') || question.includes('Hamburg')) {
      return 'Bundesland';
    }
    if (question.includes('Geschichte') || question.includes('1989') || question.includes('1990')) {
      return 'Geschichte und Verantwortung';
    }
    if (question.includes('Sozial') || question.includes('Gewerkschaft') || question.includes('Versicherung')) {
      return 'Mensch und Gesellschaft';
    }
    
    return 'Politik in der Demokratie'; // Default
  }
}
