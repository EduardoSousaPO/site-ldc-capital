// LLM Orchestrator - Multi-provider with fallback

import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import type { LLMProvider, LLMConfig } from './types';
import { createSupabaseAdminClient } from '@/lib/supabase';
import { createHash } from 'crypto';

export class LLMOrchestrator {
  private providers: Map<string, LLMProvider> = new Map();
  private config: LLMConfig;

  constructor() {
    // Inicializar providers
    try {
      this.providers.set('openai', new OpenAIProvider());
    } catch (error) {
      console.warn('OpenAI provider not available:', error);
    }

    try {
      this.providers.set('google', new GeminiProvider());
    } catch (error) {
      console.warn('Gemini provider not available:', error);
    }

    // Config padrão do .env
    this.config = {
      diagnosis_provider: (process.env.LLM_DIAG_PROVIDER as 'openai' | 'google') || 'openai',
      diagnosis_model: process.env.LLM_DIAG_MODEL || 'gpt-4o-mini',
      rewrite_provider: (process.env.LLM_REWRITE_PROVIDER as 'openai' | 'google') || 'openai',
      rewrite_model: process.env.LLM_REWRITE_MODEL || 'gpt-4o-mini',
    };
  }

  private getProvider(name: 'openai' | 'google'): LLMProvider | null {
    return this.providers.get(name) || null;
  }

  private async logRun(
    checkupId: string,
    provider: string,
    model: string,
    task: string,
    promptVersion: string,
    input: any,
    output: any
  ) {
    try {
      const supabase = createSupabaseAdminClient();
      const inputHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');

      await supabase.from('LLMRun').insert({
        checkup_id: checkupId,
        provider,
        model,
        task,
        prompt_version: promptVersion,
        input_hash: inputHash,
        output_json: output,
      });
    } catch (error) {
      console.error('Error logging LLM run:', error);
      // Não falhar se logging falhar
    }
  }

  async generateDiagnosis(
    checkupId: string,
    analytics: any,
    userProfile: any,
    policyProfile: any,
    prompt: string,
    promptVersion: string
  ): Promise<any> {
    const primaryProvider = this.config.diagnosis_provider;
    const fallbackProvider = primaryProvider === 'openai' ? 'google' : 'openai';

    const input = {
      analytics,
      userProfile,
      policyProfile: policyProfile.config,
    };

    // Tentar provider primário
    let provider = this.getProvider(primaryProvider);
    let model = this.config.diagnosis_model;

    if (!provider) {
      // Fallback automático
      provider = this.getProvider(fallbackProvider);
      model = fallbackProvider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash';
    }

    if (!provider) {
      throw new Error('No LLM provider available');
    }

    try {
      const schema = {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          summary: { type: 'string' },
          risks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                detail: { type: 'string' },
                severity: { type: 'string', enum: ['low', 'med', 'high'] },
              },
            },
          },
          improvements: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                detail: { type: 'string' },
                impact: { type: 'string', enum: ['low', 'med', 'high'] },
              },
            },
          },
          action_plan_7_days: {
            type: 'array',
            items: { type: 'string' },
          },
          transparency_notes: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      };

      const output = await provider.generateJSON({
        task: 'diagnosis',
        model,
        schema,
        prompt,
        input,
      });

      // Log
      await this.logRun(
        checkupId,
        primaryProvider,
        model,
        'diagnosis',
        promptVersion,
        input,
        output
      );

      return output;
    } catch (error) {
      console.error(`Error with ${primaryProvider}, trying fallback:`, error);

      // Tentar fallback
      const fallback = this.getProvider(fallbackProvider);
      if (fallback) {
        const fallbackModel = fallbackProvider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash';
        try {
          // Reusar o mesmo schema do provider principal
          const output = await fallback.generateJSON({
            task: 'diagnosis',
            model: fallbackModel,
            schema,
            prompt,
            input,
          });

          await this.logRun(
            checkupId,
            fallbackProvider,
            fallbackModel,
            'diagnosis',
            promptVersion,
            input,
            output
          );

          return output;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          throw new Error('Both LLM providers failed');
        }
      }

      throw error;
    }
  }

  async rewriteText(
    checkupId: string,
    text: string,
    tone: string,
    prompt: string,
    promptVersion: string
  ): Promise<string> {
    const provider = this.getProvider(this.config.rewrite_provider);
    const model = this.config.rewrite_model;

    if (!provider) {
      // Se não tiver provider, retornar texto original
      return text;
    }

    try {
      const result = await provider.generateJSON({
        task: 'rewrite',
        model,
        schema: { type: 'object', properties: { text: { type: 'string' } } },
        prompt,
        input: { text, tone },
      });

      const rewritten = result.text || text;

      await this.logRun(
        checkupId,
        this.config.rewrite_provider,
        model,
        'rewrite',
        promptVersion,
        { text, tone },
        { text: rewritten }
      );

      return rewritten;
    } catch (error) {
      console.error('Error rewriting text:', error);
      return text; // Retornar original se falhar
    }
  }
}

