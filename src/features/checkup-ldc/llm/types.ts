// LLM Provider Interface

export interface LLMProvider {
  generateJSON(opts: {
    task: 'diagnosis' | 'rewrite' | 'summary';
    model: string;
    schema: object;
    prompt: string;
    input: any;
  }): Promise<any>;
}

export interface LLMConfig {
  diagnosis_provider: 'openai' | 'google';
  diagnosis_model: string;
  rewrite_provider: 'openai' | 'google';
  rewrite_model: string;
}

