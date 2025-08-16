import { QuestionProcessingPipeline } from './services/pipeline.js';
import { OpenAIService } from './infrastructure/openai-service.js';
import { FileDataService } from './infrastructure/file-data-service.js';
import { SchemaMapperService } from './services/schema-mapper.js';

// Dependency injection container (simple implementation)
export class PipelineContainer {
  static create(apiKey?: string): QuestionProcessingPipeline {
    const aiService = new OpenAIService(apiKey);
    const dataService = new FileDataService();
    const schemaMapper = new SchemaMapperService();
    
    return new QuestionProcessingPipeline(aiService, dataService, schemaMapper);
  }
}
