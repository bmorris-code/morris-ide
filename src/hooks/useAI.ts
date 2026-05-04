import { useEffect, useState } from 'react';
import { initializeProvider, isProviderInitialized } from '../backend/ai';
import { logger } from '../utils/logger';
import type { AIProvider } from '../types/ai';

// Map of env var names to providers
const ENV_PROVIDER_MAP: Record<string, AIProvider> = {
  VITE_GROQ_API_KEY: 'groq',
  VITE_MOONSHOT_API_KEY: 'moonshot',
  VITE_OPENAI_API_KEY: 'openai',
  VITE_DEEPSEEK_API_KEY: 'deepseek',
};

export function useAI() {
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
  const moonshotApiKey = import.meta.env.VITE_MOONSHOT_API_KEY;
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const deepseekApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;

  const [isInitialized, setIsInitialized] = useState(false);
  const [initializedProviders, setInitializedProviders] = useState<AIProvider[]>([]);

  useEffect(() => {
    const autoInit = async () => {
      const results: AIProvider[] = [];

      for (const [envVar, provider] of Object.entries(ENV_PROVIDER_MAP)) {
        const key = import.meta.env[envVar];
        if (!key) continue;

        try {
          const alreadyInit = await isProviderInitialized(provider);
          if (!alreadyInit) {
            const ok = await initializeProvider(provider, key);
            if (ok) {
              logger.info(`Auto-initialized ${provider} from env`, 'AI');
              results.push(provider);
            }
          } else {
            results.push(provider);
          }
        } catch (error) {
          logger.error(`Failed to auto-initialize ${provider}`, 'AI', { error });
        }
      }

      setInitializedProviders(results);
      setIsInitialized(results.length > 0);
    };

    autoInit();
  }, [groqApiKey, moonshotApiKey, openaiApiKey]);

  // Check if any API key is properly configured (not placeholder)
  const hasValidApiKey = 
    (groqApiKey && groqApiKey.startsWith('gsk_') && groqApiKey.length > 20) ||
    (moonshotApiKey && (moonshotApiKey.startsWith('sk-') || moonshotApiKey.startsWith('sk-proj-')) && moonshotApiKey.length > 20) ||
    (openaiApiKey && openaiApiKey.startsWith('sk-') && openaiApiKey.length > 20);

  return {
    isInitialized,
    hasApiKey: !!(groqApiKey || moonshotApiKey || openaiApiKey),
    hasValidApiKey,
    apiKeyConfigured: hasValidApiKey,
    initializedProviders,
  };
}
