#!/usr/bin/env node

import { join } from 'path';
import { PipelineContainer } from './container.js';
import { promises as fs } from 'fs';

async function createTestData() {
  // Create a small test dataset with just 3 questions
  const testQuestions = [
    {
      "id": 1,
      "question": "In Deutschland dürfen Menschen offen etwas gegen die Regierung sagen, weil ...",
      "options": [
        "hier Religionsfreiheit gilt.",
        "die Menschen Steuern zahlen.",
        "die Menschen das Wahlrecht haben.",
        "hier Meinungsfreiheit gilt."
      ]
    },
    {
      "id": 4,
      "question": "Welches Recht gehört zu den Grundrechten in Deutschland?",
      "options": [
        "Waffenbesitz",
        "Faustrecht",
        "Meinungsfreiheit",
        "Selbstjustiz"
      ]
    },
    {
      "id": 6,
      "question": "Wie heißt die deutsche Verfassung?",
      "options": [
        "Volksgesetz",
        "Bundesgesetz",
        "Deutsches Gesetz",
        "Grundgesetz"
      ]
    }
  ];

  const testDataPath = join(process.cwd(), 'data/raw/questions_test.json');
  await fs.writeFile(testDataPath, JSON.stringify(testQuestions, null, 2));
  return testDataPath;
}

async function main() {
  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Error: OPENAI_API_KEY environment variable is required');
      console.log('Please set your OpenAI API key:');
      console.log('export OPENAI_API_KEY="your-api-key-here"');
      process.exit(1);
    }

    console.log('🧪 Running pipeline test with 3 sample questions...');
    
    // Create test data
    const testDataPath = await createTestData();
    console.log(`📝 Created test data at: ${testDataPath}`);
    
    // Create pipeline instance
    const pipeline = PipelineContainer.create();
    
    // Run the pipeline on test data
    await pipeline.process(testDataPath);
    
    console.log('✅ Test completed! Check data/postprocess/ for output files.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
