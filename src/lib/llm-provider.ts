import Groq from 'groq-sdk';
import OpenAI from 'openai';

// LLM Provider Types
export type LLMProvider = 'groq' | 'openai';

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  preferredProvider?: LLMProvider;
}

// Lazy initialization - clients are created only when needed
let groqClient: Groq | null = null;
let openaiClient: OpenAI | null = null;

function getGroqClient(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null;
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// Check which providers are available
export function getAvailableProviders(): LLMProvider[] {
  const providers: LLMProvider[] = [];
  if (process.env.GROQ_API_KEY) providers.push('groq');
  if (process.env.OPENAI_API_KEY) providers.push('openai');
  return providers;
}

// Model configurations
const MODELS = {
  groq: {
    fast: 'llama-3.1-8b-instant',
    default: 'llama-3.3-70b-versatile',
    complex: 'llama-3.3-70b-versatile',
  },
  openai: {
    fast: 'gpt-4o-mini',
    default: 'gpt-4o',
    complex: 'gpt-4o',
  },
};

// Call Groq API
async function callGroq(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: LLMOptions = {},
  modelType: 'fast' | 'default' | 'complex' = 'default'
): Promise<LLMResponse> {
  const client = getGroqClient();
  if (!client) throw new Error('Groq client not available');

  const model = MODELS.groq[modelType];
  const completion = await client.chat.completions.create({
    messages,
    model,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 2000,
  });

  return {
    content: completion.choices[0]?.message?.content || '',
    provider: 'groq',
    model,
    usage: completion.usage ? {
      promptTokens: completion.usage.prompt_tokens,
      completionTokens: completion.usage.completion_tokens,
      totalTokens: completion.usage.total_tokens,
    } : undefined,
  };
}

// Call OpenAI API
async function callOpenAI(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: LLMOptions = {},
  modelType: 'fast' | 'default' | 'complex' = 'default'
): Promise<LLMResponse> {
  const client = getOpenAIClient();
  if (!client) throw new Error('OpenAI client not available');

  const model = MODELS.openai[modelType];
  const completion = await client.chat.completions.create({
    messages,
    model,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 2000,
  });

  return {
    content: completion.choices[0]?.message?.content || '',
    provider: 'openai',
    model,
    usage: completion.usage ? {
      promptTokens: completion.usage.prompt_tokens,
      completionTokens: completion.usage.completion_tokens,
      totalTokens: completion.usage.total_tokens,
    } : undefined,
  };
}

/**
 * Main LLM completion function with automatic fallback
 *
 * Priority:
 * 1. Use preferred provider if specified and available
 * 2. Try Groq first (faster and cheaper)
 * 3. Fall back to OpenAI if Groq fails
 * 4. Throw error if all providers fail
 */
export async function createCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: LLMOptions = {},
  modelType: 'fast' | 'default' | 'complex' = 'default'
): Promise<LLMResponse> {
  const providers = getAvailableProviders();

  if (providers.length === 0) {
    throw new Error('No LLM providers configured. Please add GROQ_API_KEY or OPENAI_API_KEY to your environment.');
  }

  // Determine provider order
  let providerOrder: LLMProvider[];
  if (options.preferredProvider && providers.includes(options.preferredProvider)) {
    // Preferred provider first, then others as fallback
    providerOrder = [
      options.preferredProvider,
      ...providers.filter(p => p !== options.preferredProvider),
    ];
  } else {
    // Default order: Groq first (faster/cheaper), then OpenAI
    providerOrder = providers.includes('groq')
      ? ['groq', ...providers.filter(p => p !== 'groq')]
      : providers;
  }

  let lastError: Error | null = null;

  for (const provider of providerOrder) {
    try {
      if (provider === 'groq') {
        return await callGroq(messages, options, modelType);
      } else if (provider === 'openai') {
        return await callOpenAI(messages, options, modelType);
      }
    } catch (error) {
      console.error(`[LLM] ${provider} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to next provider
    }
  }

  throw lastError || new Error('All LLM providers failed');
}

/**
 * Simple text completion helper
 */
export async function complete(
  prompt: string,
  options: LLMOptions = {}
): Promise<string> {
  const response = await createCompletion(
    [{ role: 'user', content: prompt }],
    options
  );
  return response.content;
}

/**
 * JSON extraction helper - extracts JSON from LLM response
 */
export function extractJSON<T>(text: string): T | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}

/**
 * Completion with JSON parsing
 */
export async function completeJSON<T>(
  prompt: string,
  options: LLMOptions = {}
): Promise<T | null> {
  const response = await complete(prompt, options);
  return extractJSON<T>(response);
}
