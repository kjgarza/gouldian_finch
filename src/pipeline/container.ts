import { QuestionProcessingPipeline } from './services/pipeline.js';
import { OpenAIService } from './infrastructure/openai-service.js';
import { FileDataService } from './infrastructure/file-data-service.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SchemaMapperService } from './services/schema-mapper.js';

// Dependency injection container (simple implementation)
/** Topic labels already committed in the app data (set by hand in #13); a re-run must keep them. */
function loadExistingTopics(): Map<number, string> {
  const path = join(process.cwd(), 'src/data/questions_de.json');
  if (!existsSync(path)) return new Map();
  const questions: Array<{ id: number; topic: string }> = JSON.parse(readFileSync(path, 'utf8'));
  return new Map(questions.map((q) => [q.id, q.topic]));
}

export class PipelineContainer {
  static create(apiKey?: string): QuestionProcessingPipeline {
    const aiService = new OpenAIService(apiKey);
    const dataService = new FileDataService();
    const schemaMapper = new SchemaMapperService({ existingTopics: loadExistingTopics() });
    
    return new QuestionProcessingPipeline(aiService, dataService, schemaMapper);
  }
}
