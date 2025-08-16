#!/usr/bin/env node

import { join } from 'path';
import { PipelineContainer } from './container.js';

async function main() {
  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Error: OPENAI_API_KEY environment variable is required');
      console.log('Please set your OpenAI API key:');
      console.log('export OPENAI_API_KEY="your-api-key-here"');
      process.exit(1);
    }

    // Create pipeline instance
    const pipeline = PipelineContainer.create();
    
    // Define input path
    const inputPath = join(process.cwd(), 'data/raw/questions.json');
    
    // Run the pipeline
    await pipeline.process(inputPath);
    
  } catch (error) {
    console.error('❌ Pipeline execution failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
