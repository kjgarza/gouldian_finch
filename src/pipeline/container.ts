import { QuestionProcessingPipeline } from './services/pipeline.js';
import { OpenAIService } from './infrastructure/openai-service.js';
import { FileDataService } from './infrastructure/file-data-service.js';
import { join } from 'path';
import { SchemaMapperService } from './services/schema-mapper.js';

// Dependency injection container (simple implementation)

export class PipelineContainer {
  static create(apiKey?: string): QuestionProcessingPipeline {
    const aiService = new OpenAIService(apiKey);
    const dataService = new FileDataService();
    // Topic labels already committed in the app data (set by hand in #13); a re-run must keep them.
    const existingTopics = dataService.loadExistingTopics(join(process.cwd(), 'src/data/questions_de.json'));
    const schemaMapper = new SchemaMapperService({ existingTopics });
    
    return new QuestionProcessingPipeline(aiService, dataService, schemaMapper);
  }
}
