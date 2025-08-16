import { IPipeline, IAIService, IDataService, ISchemaMapper } from '../interfaces/contracts.js';
import { ProcessedQuestion } from '../domain/types.js';

export class QuestionProcessingPipeline implements IPipeline {
  constructor(
    private aiService: IAIService,
    private dataService: IDataService,
    private schemaMapper: ISchemaMapper
  ) {}

  async process(inputPath: string): Promise<void> {
    console.log('🚀 Starting question processing pipeline...');
    
    try {
      // Load raw questions
      console.log('📚 Step 1: Loading questions...');
      const rawQuestions = await this.dataService.loadQuestions(inputPath);
      console.log(`Loaded ${rawQuestions.length} questions`);

      // Process questions with rate limiting (to avoid API limits)
      console.log('🔄 Step 2-4: Processing questions (AI analysis + schema mapping)...');
      const processedQuestions: ProcessedQuestion[] = [];
      
      for (let i = 0; i < rawQuestions.length; i++) {
        const question = rawQuestions[i];
        console.log(`Processing question ${i + 1}/${rawQuestions.length} (ID: ${question.id})`);
        
        try {
          // Step 2: Find correct answer
          const correctIndex = await this.aiService.findCorrectAnswer(question.question, question.options);
          const correctAnswer = question.options[correctIndex];
          
          // Step 3: Generate hint
          const hint = await this.aiService.generateHint(question.question, correctAnswer);
          
          // Step 4: Generate explanation
          const explanation = await this.aiService.generateExplanation(question.question, correctAnswer);
          
          // Step 5: Schema mapping
          const processed = this.schemaMapper.mapToProcessedSchema(
            question,
            correctIndex,
            hint,
            explanation
          );
          
          processedQuestions.push(processed);
          
          // Rate limiting - wait between requests
          if (i < rawQuestions.length - 1) {
            await this.delay(500); // 500ms delay between requests
          }
        } catch (error) {
          console.error(`Error processing question ${question.id}:`, error);
          // Continue with next question rather than failing entire pipeline
        }
      }

      // Step 6: Save German questions
      console.log('💾 Step 5: Saving processed German questions...');
      const germanOutputPath = inputPath.replace('/raw/', '/postprocess/').replace('.json', '_de.json');
      await this.dataService.saveQuestions(germanOutputPath, processedQuestions);

      // Step 7: Translate and save English questions
      console.log('🌐 Step 6: Translating to English...');
      const translatedQuestions = [];
      
      for (let i = 0; i < processedQuestions.length; i++) {
        const question = processedQuestions[i];
        console.log(`Translating question ${i + 1}/${processedQuestions.length} (ID: ${question.id})`);
        
        try {
          const translated = await this.aiService.translateQuestion(question);
          translatedQuestions.push(translated);
          
          // Rate limiting
          if (i < processedQuestions.length - 1) {
            await this.delay(500);
          }
        } catch (error) {
          console.error(`Error translating question ${question.id}:`, error);
          // Add original if translation fails
          translatedQuestions.push({ ...question });
        }
      }

      const englishOutputPath = inputPath.replace('/raw/', '/postprocess/').replace('.json', '_en.json');
      await this.dataService.saveTranslatedQuestions(englishOutputPath, translatedQuestions);

      console.log('✅ Pipeline completed successfully!');
      console.log(`📄 German questions saved to: ${germanOutputPath}`);
      console.log(`📄 English questions saved to: ${englishOutputPath}`);
      
    } catch (error) {
      console.error('❌ Pipeline failed:', error);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
