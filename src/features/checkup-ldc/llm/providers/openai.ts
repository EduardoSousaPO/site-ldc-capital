// OpenAI Provider

import OpenAI from 'openai';
import type { LLMProvider } from '../types';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    this.client = new OpenAI({ apiKey });
  }

  async generateJSON(opts: {
    task: 'diagnosis' | 'rewrite' | 'summary';
    model: string;
    schema: object;
    prompt: string;
    input: any;
  }): Promise<any> {
    try {
      const response = await this.client.chat.completions.create({
        model: opts.model,
        messages: [
          {
            role: 'system',
            content: opts.prompt,
          },
          {
            role: 'user',
            content: JSON.stringify(opts.input, null, 2),
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI error:', error);
      throw error;
    }
  }
}

