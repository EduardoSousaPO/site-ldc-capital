// Google Gemini Provider

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMProvider } from '../types';

export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateJSON(opts: {
    task: 'diagnosis' | 'rewrite' | 'summary';
    model: string;
    schema: object;
    prompt: string;
    input: unknown;
  }): Promise<unknown> {
    try {
      const model = this.genAI.getGenerativeModel({ model: opts.model });

      const fullPrompt = `${opts.prompt}\n\nInput:\n${JSON.stringify(opts.input, null, 2)}\n\nResponda APENAS com JSON válido, sem markdown, sem texto adicional.`;

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();

      // Limpar markdown code blocks se houver
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Gemini error:', error);
      throw error;
    }
  }
}

