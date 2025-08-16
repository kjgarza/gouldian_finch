import { promises as fs } from 'fs';
import { dirname } from 'path';
import { IDataService } from '../interfaces/contracts.js';
import { RawQuestion, ProcessedQuestion, TranslatedQuestion } from '../domain/types.js';

export class FileDataService implements IDataService {
  async loadQuestions(filePath: string): Promise<RawQuestion[]> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading questions from ${filePath}:`, error);
      throw error;
    }
  }

  async saveQuestions(filePath: string, questions: ProcessedQuestion[]): Promise<void> {
    try {
      await this.ensureDirectoryExists(filePath);
      const data = JSON.stringify(questions, null, 2);
      await fs.writeFile(filePath, data, 'utf-8');
      console.log(`Saved ${questions.length} processed questions to ${filePath}`);
    } catch (error) {
      console.error(`Error saving questions to ${filePath}:`, error);
      throw error;
    }
  }

  async saveTranslatedQuestions(filePath: string, questions: TranslatedQuestion[]): Promise<void> {
    try {
      await this.ensureDirectoryExists(filePath);
      const data = JSON.stringify(questions, null, 2);
      await fs.writeFile(filePath, data, 'utf-8');
      console.log(`Saved ${questions.length} translated questions to ${filePath}`);
    } catch (error) {
      console.error(`Error saving translated questions to ${filePath}:`, error);
      throw error;
    }
  }

  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }
}
