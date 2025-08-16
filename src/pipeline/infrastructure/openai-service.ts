import OpenAI from 'openai';
import { IAIService } from '../interfaces/contracts.js';
import { ProcessedQuestion, TranslatedQuestion } from '../domain/types.js';

export class OpenAIService implements IAIService {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async findCorrectAnswer(question: string, options: string[]): Promise<number> {
    const prompt = `Given this German citizenship test question and options, identify the correct answer index (0-based):

Question: ${question}

Options:
${options.map((option, index) => `${index}: ${option}`).join('\n')}

Return only the index number of the correct answer (0, 1, 2, or 3).`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 10,
      });

      const response = completion.choices[0]?.message?.content?.trim();
      const index = parseInt(response || '0', 10);
      return Math.max(0, Math.min(3, index)); // Clamp between 0-3
    } catch (error) {
      console.error('Error finding correct answer:', error);
      return 0; // Default fallback
    }
  }

  async generateHint(question: string, correctAnswer: string): Promise<string> {
    const prompt = `Generate a brief, helpful hint for this German citizenship test question. The hint should guide towards the correct answer without giving it away directly.

Question: ${question}
Correct Answer: ${correctAnswer}

Provide a concise hint in German:`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 100,
      });

      return completion.choices[0]?.message?.content?.trim() || 'Denken Sie an die Grundrechte.';
    } catch (error) {
      console.error('Error generating hint:', error);
      return 'Denken Sie an die Grundrechte.';
    }
  }

  async generateExplanation(question: string, correctAnswer: string): Promise<string> {
    const prompt = `Generate a clear, educational explanation for why this is the correct answer to this German citizenship test question.

Question: ${question}
Correct Answer: ${correctAnswer}

Provide a concise explanation in German:`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      });

      return completion.choices[0]?.message?.content?.trim() || 'Dies ist die korrekte Antwort basierend auf dem deutschen Recht.';
    } catch (error) {
      console.error('Error generating explanation:', error);
      return 'Dies ist die korrekte Antwort basierend auf dem deutschen Recht.';
    }
  }

  async translateQuestion(question: ProcessedQuestion): Promise<TranslatedQuestion> {
    const prompt = `Translate this German citizenship test question and all its components to English. Maintain the exact same structure and meaning.

Question: ${question.question}
Choices: ${JSON.stringify(question.choices)}
Hint: ${question.hint}
Explanation: ${question.explanation}
Topic: ${question.topic}

Return the translation in this JSON format:
{
  "question": "translated question",
  "choices": ["choice1", "choice2", "choice3", "choice4"],
  "hint": "translated hint", 
  "explanation": "translated explanation",
  "topic": "translated topic"
}`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content?.trim();
      const translated = JSON.parse(response || '{}');

      return {
        id: question.id,
        question: translated.question || question.question,
        choices: translated.choices || question.choices,
        correctIndex: question.correctIndex,
        hint: translated.hint || question.hint,
        explanation: translated.explanation || question.explanation,
        topic: translated.topic || question.topic,
      };
    } catch (error) {
      console.error('Error translating question:', error);
      // Return original if translation fails
      return { ...question };
    }
  }
}
