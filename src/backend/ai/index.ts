import Groq from 'groq-sdk';
import type { AISettings, CodeContext, AIProvider } from '../../types/ai';
import { DEFAULT_AI_SETTINGS, AI_MODELS } from '../../types/ai';
import { logger } from '../../utils/logger';
import { secureStorage } from '../../utils/secureStorage';
import { usageTracker } from './usage-tracker';
import { privacyGuard } from './privacy-guard';

// ============ PROVIDER CONFIGURATION ============

interface ProviderConfig {
  name: string;
  baseUrl: string;
  defaultModel: string;
  apiKeyEnvVar: string;
  headers: (apiKey: string) => Record<string, string>;
}

const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    apiKeyEnvVar: 'GROQ_API_KEY',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
  },
  moonshot: {
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'kimi-latest',
    apiKeyEnvVar: 'MOONSHOT_API_KEY',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-coder',
    apiKeyEnvVar: 'DEEPSEEK_API_KEY',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
  },
};

// ============ CLIENT MANAGEMENT ============

interface ClientState {
  client: Groq | null;
  apiKey: string;
  provider: AIProvider;
}

const clients: Record<AIProvider, ClientState> = {
  groq: { client: null, apiKey: '', provider: 'groq' },
  moonshot: { client: null, apiKey: '', provider: 'moonshot' },
  openai: { client: null, apiKey: '', provider: 'openai' },
  deepseek: { client: null, apiKey: '', provider: 'deepseek' },
};

// Enhanced API key validation
const validateApiKey = (provider: AIProvider, apiKey: string): { valid: boolean; error?: string } => {
  if (!apiKey.trim()) {
    return { valid: false, error: 'API key cannot be empty' };
  }

  const trimmedKey = apiKey.trim();
  
  switch (provider) {
    case 'groq':
      if (!trimmedKey.startsWith('gsk_')) {
        return { valid: false, error: 'Groq API key must start with "gsk_"' };
      }
      if (trimmedKey.length < 20) {
        return { valid: false, error: 'Groq API key appears to be too short' };
      }
      break;
      
    case 'moonshot':
      if (!trimmedKey.startsWith('sk-') && !trimmedKey.startsWith('sk-proj-')) {
        return { valid: false, error: 'Moonshot API key must start with "sk-" or "sk-proj-"' };
      }
      if (trimmedKey.length < 20) {
        return { valid: false, error: 'Moonshot API key appears to be too short' };
      }
      break;
      
    case 'openai':
      if (!trimmedKey.startsWith('sk-')) {
        return { valid: false, error: 'OpenAI API key must start with "sk-"' };
      }
      if (trimmedKey.length < 20) {
        return { valid: false, error: 'OpenAI API key appears to be too short' };
      }
      break;
      
    case 'deepseek':
      if (!trimmedKey.startsWith('sk-')) {
        return { valid: false, error: 'DeepSeek API key must start with "sk-"' };
      }
      if (trimmedKey.length < 20) {
        return { valid: false, error: 'DeepSeek API key appears to be too short' };
      }
      break;
      
    default:
      return { valid: false, error: `Unknown provider: ${provider}` };
  }
  
  return { valid: true };
};

// Initialize a provider client with secure storage
export const initializeProvider = async (provider: AIProvider, apiKey: string): Promise<boolean> => {
  const validation = validateApiKey(provider, apiKey);
  if (!validation.valid) {
    logger.error(`Invalid API key for ${provider}: ${validation.error}`, 'AI');
    return false;
  }

  try {
    // Store API key securely
    const stored = await secureStorage.setApiKey(provider, apiKey.trim());
    if (!stored) {
      logger.error(`Failed to securely store API key for ${provider}`, 'AI');
      return false;
    }

    // Initialize client
    if (provider === 'groq') {
      clients.groq.client = new Groq({
        apiKey: apiKey.trim(),
        dangerouslyAllowBrowser: true, // Required for development in browser
      });
    } else {
      // For Moonshot/OpenAI, we use fetch directly
      clients[provider].client = null; // Mark as initialized via API key presence
    }
    
    clients[provider].apiKey = apiKey.trim();
    logger.info(`${PROVIDER_CONFIGS[provider].name} initialized securely`, 'AI', {
      keyPrefix: apiKey.substring(0, 8) + '...',
      keyLength: apiKey.length
    });
    return true;
  } catch (error) {
    logger.error(`Failed to initialize ${provider}`, 'AI', { error });
    return false;
  }
};

// Check if a provider is initialized
export const isProviderInitialized = async (provider: AIProvider): Promise<boolean> => {
  try {
    // Check if we have a stored API key for this provider
    const storedApiKey = await secureStorage.getApiKey(provider);
    if (!storedApiKey) {
      return false;
    }
    
    // Hydrate in-memory state
    clients[provider].apiKey = storedApiKey;
    
    // For Groq, check if client exists, if not, create it since we have the key
    if (provider === 'groq') {
      if (!clients.groq.client) {
        clients.groq.client = new Groq({
          apiKey: storedApiKey,
          dangerouslyAllowBrowser: true,
        });
      }
      return true;
    }
    
    // For other providers, API key presence in memory is sufficient
    return true;
  } catch (error) {
    logger.error(`Error checking ${provider} initialization`, 'AI', { error });
    return false;
  }
};

// Get initialized providers
export const getInitializedProviders = async (): Promise<AIProvider[]> => {
  const providers = Object.keys(clients) as AIProvider[];
  const initialized = await Promise.all(
    providers.map(async provider => ({
      provider,
      initialized: await isProviderInitialized(provider)
    }))
  );
  return initialized.filter(({ initialized }) => initialized).map(({ provider }) => provider);
};

// Legacy support
export const initializeGroq = async (apiKey: string): Promise<void> => {
  await initializeProvider('groq', apiKey);
};

export const isGroqInitialized = async (): Promise<boolean> => {
  return await isProviderInitialized('groq');
};

// ============ SYSTEM PROMPTS ============

const SYSTEM_PROMPTS: Record<AIProvider, string> = {
  groq: `You are Morris AI, an expert coding assistant powered by Groq. You help developers write, debug, and optimize code.

Guidelines:
- Be concise but thorough in explanations
- Always use proper code blocks with language tags
- Point out potential bugs and edge cases
- Suggest modern best practices
- If refactoring, explain what changed and why`,

  moonshot: `You are Kimi K2.6, an advanced AI coding assistant integrated into Morris IDE, powered by Moonshot AI.

Your Capabilities:
- 2-million-token context window: You can understand entire projects, not just individual files
- Deep code analysis: Analyze cross-file dependencies, architecture patterns, and project structure
- Real-time streaming: Provide responses as they generate
- Multilingual: Fluent in English, Chinese, and 20+ languages

Guidelines:
- Reference specific files and line numbers when making suggestions
- Consider architectural implications across the entire codebase
- Identify security vulnerabilities and performance bottlenecks
- Explain reasoning step-by-step for complex changes
- Use proper markdown code blocks with language identifiers
- When refactoring, explain what changed, why, and potential impacts
- Suggest testing strategies and edge case handling
- Be precise, professional, and helpful`,

  openai: `You are Morris AI, powered by OpenAI. You are a senior software engineer helping developers.

Guidelines:
- Write clean, well-documented code
- Explain complex concepts simply
- Consider edge cases and error handling
- Follow language-specific conventions
- Suggest testing strategies when relevant`,
  
  deepseek: `You are DeepSeek Coder, an advanced AI coding assistant integrated into Morris IDE, powered by DeepSeek AI.

Your Capabilities:
- Specialized code generation and understanding
- Strong performance on programming tasks
- Efficient problem-solving and debugging
- Support for multiple programming languages

Guidelines:
- Provide accurate, well-structured code solutions
- Explain complex algorithms and implementation details
- Identify potential bugs and suggest improvements
- Follow best practices and coding standards
- Consider performance and optimization opportunities
- Use proper markdown code blocks with language identifiers
- Be thorough yet concise in your explanations
- Focus on practical, implementable solutions`,
};

// ============ RESPONSE TYPES ============

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
  provider: AIProvider;
  model: string;
  latencyMs?: number;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  error?: string;
}

// ============ CONTEXT BUILDING ============

const buildContextMessage = (context: CodeContext): string => {
  const parts: string[] = [];

  parts.push(`📁 File: ${context.fileName}`);
  parts.push(`🔤 Language: ${context.language}`);
  parts.push(`📂 Path: ${context.filePath}`);

  if (context.cursorLine) {
    parts.push(`🎯 Cursor: Line ${context.cursorLine}`);
  }

  if (context.selectedCode) {
    parts.push('');
    parts.push('📝 **Selected Code:**');
    parts.push(`\`\`\`${context.language}`);
    parts.push(context.selectedCode);
    parts.push('```');
  } else if (context.fullCode) {
    const maxChars = 8000;
    const truncated = context.fullCode.length > maxChars;
    const code = truncated 
      ? context.fullCode.substring(0, maxChars) + '\n// ... (truncated for context)'
      : context.fullCode;
    
    parts.push('');
    parts.push('📄 **Full File Content:**');
    parts.push(`\`\`\`${context.language}`);
    parts.push(code);
    parts.push('```');
    
    if (truncated) {
      parts.push('');
      parts.push(`*Note: File truncated (${context.fullCode.length} chars total). Focus on the visible portion.*`);
    }
  }

  return parts.join('\n');
};

// ============ MODEL VALIDATION ============

const getValidModel = (provider: AIProvider, requestedModel?: string): string => {
  if (!requestedModel) {
    return PROVIDER_CONFIGS[provider].defaultModel;
  }
  
  // Check if the requested model is valid for this provider
  const isValidModel = AI_MODELS.some(model => 
    model.id === requestedModel && model.provider === provider
  );
  
  if (isValidModel) {
    return requestedModel;
  }
  
  // If invalid, log warning and use default model
  logger.warn(`Invalid model ${requestedModel} for provider ${provider}, using default`, 'AI');
  return PROVIDER_CONFIGS[provider].defaultModel;
};

// ============ UNIFIED API CALLS ============

// Non-streaming response
export const generateAIResponse = async (
  prompt: string,
  codeContext?: CodeContext,
  settings: AISettings = DEFAULT_AI_SETTINGS
): Promise<AIResponse> => {
  const provider = settings.provider || 'groq';
  const startTime = Date.now();

  if (!(await isProviderInitialized(provider))) {
    return {
      content: '',
      error: `${PROVIDER_CONFIGS[provider].name} not initialized. Please set your API key in settings.`,
      provider,
      model: settings.model,
    };
  }

  try {
    // Privacy check before processing
    let processedContext = codeContext;
    if (codeContext && codeContext.filePath) {
      const privacyResult = await privacyGuard.processCodeForAI(
        codeContext.filePath,
        codeContext.fullCode || '',
        codeContext.selectedCode
      );

      if (!privacyResult.shouldProceed) {
        return {
          content: privacyGuard.generatePrivacyWarning(privacyResult.warnings),
          error: 'Privacy check failed - review sensitive content',
          provider,
          model: settings.model,
        };
      }

      // Update context with processed code
      processedContext = {
        ...codeContext,
        fullCode: privacyResult.processedCode,
        selectedCode: privacyResult.processedSelectedCode,
      };
    }

    const messages = buildMessages(prompt, processedContext, provider);
    
    const validModel = getValidModel(provider, settings.model);
    
    let response;
    if (provider === 'groq' && clients.groq.client) {
      // Use Groq SDK
      const completion = await clients.groq.client.chat.completions.create({
        model: validModel,
        messages,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        stream: false,
      });

      response = {
        content: completion.choices[0]?.message?.content || '',
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
      };
    } else {
      // Use fetch for Moonshot/OpenAI
      const config = PROVIDER_CONFIGS[provider];
      const apiResponse = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: config.headers(clients[provider].apiKey),
        body: JSON.stringify({
          model: getValidModel(provider, settings.model),
          messages,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          stream: false,
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      response = {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
      };
    }

    // Track usage
    if (response.usage) {
      const usageResult = await usageTracker.trackUsage(
        provider,
        validModel,
        response.usage.promptTokens,
        response.usage.completionTokens
      );

      if (usageResult.exceededQuota) {
        return {
          content: '',
          error: `Daily quota exceeded for ${PROVIDER_CONFIGS[provider].name}. Please try again tomorrow or increase your quota in settings.`,
          provider,
          model: settings.model,
          latencyMs: Date.now() - startTime,
        };
      }
    }

    return {
      ...response,
      provider,
      model: settings.model,
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`${provider} API error`, 'AI', { error: errorMessage, prompt: prompt.substring(0, 100) });
    
    return {
      content: '',
      error: `${PROVIDER_CONFIGS[provider].name} Error: ${errorMessage}`,
      provider,
      model: settings.model,
      latencyMs: Date.now() - startTime,
    };
  }
};

// Streaming response (unified)
export async function* generateAIResponseStream(
  prompt: string,
  codeContext?: CodeContext,
  settings: AISettings = DEFAULT_AI_SETTINGS
): AsyncGenerator<string, void, unknown> {
  const provider = settings.provider || 'groq';

  if (!await isProviderInitialized(provider)) {
    yield `Error: ${PROVIDER_CONFIGS[provider].name} not initialized. Please set your API key in settings.`;
    return;
  }

  try {
    const messages = buildMessages(prompt, codeContext, provider);
    const config = PROVIDER_CONFIGS[provider];

    if (provider === 'groq' && clients.groq.client) {
      // Groq SDK streaming
      const validModel = getValidModel(provider, settings.model);
      const stream = await clients.groq.client.chat.completions.create({
        model: validModel,
        messages,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } else {
      // Fetch-based streaming for Moonshot/OpenAI
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: config.headers(clients[provider].apiKey),
        body: JSON.stringify({
          model: getValidModel(provider, settings.model),
          messages,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Ignore parse errors for malformed chunks
          }
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`${provider} streaming error`, 'AI', { error: errorMessage });
    yield `\n\n❌ Error: ${errorMessage}`;
  }
}

// Helper to build messages array
const buildMessages = (
  prompt: string, 
  codeContext?: CodeContext,
  provider: AIProvider = 'groq'
) => {
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { 
      role: 'system', 
      content: SYSTEM_PROMPTS[provider] || SYSTEM_PROMPTS.groq 
    },
  ];

  if (codeContext) {
    messages.push({ 
      role: 'user', 
      content: buildContextMessage(codeContext) 
    });
  }

  messages.push({ role: 'user', content: prompt });

  return messages;
};

// ============ QUICK ACTIONS ============

export const AI_QUICK_ACTIONS = {
  explain: (code: string) => `Explain this code in detail, including what it does and why:\n\n\`\`\`\n${code}\n\`\`\``,
  
  refactor: (code: string) => `Refactor this code to be cleaner, more efficient, and follow best practices:\n\n\`\`\`\n${code}\n\`\`\``,
  
  debug: (code: string) => `Find potential bugs, edge cases, or issues in this code. Be specific about problems and suggest fixes:\n\n\`\`\`\n${code}\n\`\`\``,
  
  optimize: (code: string) => `Optimize this code for better performance. Explain the optimizations:\n\n\`\`\`\n${code}\n\`\`\``,
  
  document: (code: string) => `Add comprehensive JSDoc/TSDoc documentation and inline comments to this code:\n\n\`\`\`\n${code}\n\`\`\``,
  
  test: (code: string) => `Generate comprehensive unit tests for this code using the appropriate testing framework:\n\n\`\`\`\n${code}\n\`\`\``,
  
  security: (code: string) => `Analyze this code for security vulnerabilities (SQL injection, XSS, etc.) and suggest fixes:\n\n\`\`\`\n${code}\n\`\`\``,
  
  types: (code: string) => `Add proper TypeScript types to this code. Ensure strict typing:\n\n\`\`\`\n${code}\n\`\`\``,
  
  review: (code: string) => `Perform a code review of this code. Check for: code style, best practices, potential issues, and improvements:\n\n\`\`\`\n${code}\n\`\`\``,
};

// Type for quick action keys
export type QuickActionKey = keyof typeof AI_QUICK_ACTIONS;

// ============ UTILITY FUNCTIONS ============

// Estimate tokens (rough approximation)
export const estimateTokens = (text: string): number => {
  // Rough estimate: ~4 chars per token for English/code
  return Math.ceil(text.length / 4);
};

// Check if context fits within model limits
export const checkContextFit = (
  codeContext: CodeContext,
  settings: AISettings,
  prompt: string
): { fits: boolean; estimatedTokens: number; maxTokens: number } => {
  const contextText = buildContextMessage(codeContext);
  const fullPrompt = `${contextText}\n\n${prompt}`;
  const estimatedTokens = estimateTokens(fullPrompt);
  const maxTokens = settings.maxTokens || 4096;
  
  return {
    fits: estimatedTokens < maxTokens * 0.8, // Leave 20% room for response
    estimatedTokens,
    maxTokens,
  };
};

// Retry wrapper with exponential backoff
export const withRetry = async <T,>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        logger.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms`, 'AI');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// ============ RE-EXPORT CONTEXT BUILDER ============
export {
  buildProjectContext,
  buildEnhancedCodeContext,
  countTokensApprox,
  formatTokenCount,
  type ProjectContext,
} from './context-builder';