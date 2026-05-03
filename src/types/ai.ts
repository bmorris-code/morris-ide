// types/ai.ts
export type AIProvider = 'groq' | 'moonshot' | 'openai';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  description?: string;
  isNew?: boolean;
  recommended?: boolean;
}

export const AI_MODELS: AIModel[] = [
  // Groq
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq', contextWindow: 128000 },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'groq', contextWindow: 128000 },
  
  // Moonshot / Kimi
  { id: 'kimi-k2-6', name: 'Kimi K2.6', provider: 'moonshot', contextWindow: 2000000, description: '2M context window - Best for large codebases', isNew: true, recommended: true },
  { id: 'kimi-latest', name: 'Kimi Latest', provider: 'moonshot', contextWindow: 2000000, description: 'Best for large codebases' },
  { id: 'kimi-k2-5', name: 'Kimi K2.5', provider: 'moonshot', contextWindow: 256000 },
  { id: 'kimi-k2', name: 'Kimi K2', provider: 'moonshot', contextWindow: 2000000 },
  
  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128000 },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextWindow: 128000 },
];

export const AI_PROVIDERS = [
  { id: 'groq' as AIProvider, name: 'Groq' },
  { id: 'moonshot' as AIProvider, name: 'Kimi (Moonshot)' },
  { id: 'openai' as AIProvider, name: 'OpenAI' },
];

export interface AISettings {
  provider: AIProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'moonshot', // Default to Kimi for best experience
  model: 'kimi-k2-6', // Kimi K2.6 with 2M context window
  temperature: 0.3, // Lower temp for more precise code responses
  maxTokens: 8192, // Larger output for detailed explanations
};

export interface CodeContext {
  filePath: string;
  fileName: string;
  language: string;
  fullCode?: string;
  selectedCode?: string;
  cursorLine?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isLoading?: boolean;
  error?: string;
  codeContext?: CodeContext;
  provider?: AIProvider;
}