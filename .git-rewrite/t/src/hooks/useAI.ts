import { useEffect } from 'react';
import { initializeGroq, isGroqInitialized } from '../backend/ai';
import { logger } from '../utils/logger';

export function useAI() {
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

  useEffect(() => {
    if (groqApiKey && !isGroqInitialized()) {
      try {
        initializeGroq(groqApiKey);
        logger.info('Groq AI initialized successfully', 'AI');
      } catch (error) {
        logger.error('Failed to initialize Groq AI', 'AI', { error });
      }
    }
  }, [groqApiKey]);

  return {
    isInitialized: isGroqInitialized(),
    hasApiKey: !!groqApiKey,
    apiKeyConfigured: groqApiKey?.startsWith('gsk_') || false
  };
}
