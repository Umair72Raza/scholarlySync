import { Anthropic } from '@anthropic-ai/sdk';
import { env } from '../config/env';

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export class AIService {
  static async getSummary(content: string) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Please provide a concise, academic summary of the following study material. Use bullet points for key takeaways:\n\n${content}`
          }
        ],
      });

      return (response.content[0] as any).text;
    } catch (error) {
      console.error('Claude Summary Error:', error);
      throw new Error('Failed to generate summary');
    }
  }

  static async askQuestion(content: string, question: string, history: { role: 'user' | 'assistant', content: string }[] = []) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        system: `You are ScholarlySync AI, a helpful study assistant. 
        You have access to the following course material:
        ---
        ${content}
        ---
        Use ONLY this material to answer the student's questions. If the answer is not in the material, politely say you don't know based on this document. 
        Keep your tone academic, encouraging, and clear.`,
        messages: [
          ...history,
          {
            role: 'user',
            content: question
          }
        ],
      });

      return (response.content[0] as any).text;
    } catch (error) {
      console.error('Claude Question Error:', error);
      throw new Error('Failed to get answer from AI');
    }
  }
}
