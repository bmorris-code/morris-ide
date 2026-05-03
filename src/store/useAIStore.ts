import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, AIModel, AISettings, CodeContext, AIProvider } from '../types/ai';
import { DEFAULT_AI_SETTINGS, AI_MODELS } from '../types/ai';

// Helper function to generate unique message IDs
const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface AIStore {
  // State
  messages: ChatMessage[];
  isGenerating: boolean;
  error: string | null;
  settings: AISettings;
  apiKeys: Record<AIProvider, string | null>;

  // Actions
  addMessage: (role: 'user' | 'assistant' | 'system', content: string, codeContext?: CodeContext) => ChatMessage;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (messageId: string) => void;
  clearMessages: () => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
  setApiKey: (provider: AIProvider, key: string | null) => void;
  updateSettings: (settings: Partial<AISettings>) => void;
  setModel: (model: AIModel) => void;
  setProvider: (provider: AIProvider) => void;
}

export const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      messages: [],
      isGenerating: false,
      error: null,
      settings: DEFAULT_AI_SETTINGS,
      apiKeys: {
        groq: null,
        moonshot: null,
        openai: null,
      },

      addMessage: (role, content, codeContext) => {
        const message: ChatMessage = {
          id: generateMessageId(),
          role,
          content,
          timestamp: Date.now(),
          codeContext,
          isLoading: false,
        };

        set(state => ({
          messages: [...state.messages, message],
        }));

        return message;
      },

      updateMessage: (messageId, updates) => {
        set(state => ({
          messages: state.messages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        }));
      },

      removeMessage: (messageId) => {
        set(state => ({
          messages: state.messages.filter(msg => msg.id !== messageId),
        }));
      },

      clearMessages: () => set({ messages: [], error: null }),

      setGenerating: (generating) => set({ isGenerating: generating }),

      setError: (error) => set({ error }),

      setApiKey: (provider, key) => set(state => ({
        apiKeys: { ...state.apiKeys, [provider]: key }
      })),

      updateSettings: (newSettings) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      setModel: (model) => {
        set(state => ({
          settings: { ...state.settings, model: model.id },
        }));
      },

      setProvider: (provider) => {
        set(state => {
          // Find a valid model for the new provider
          const validModels = AI_MODELS.filter(model => model.provider === provider);
          const currentModel = AI_MODELS.find(model => model.id === state.settings.model);
          
          // If current model is not valid for new provider, select the first valid model
          // Prefer recommended models, or use the first available
          let newModel = state.settings.model;
          if (!currentModel || currentModel.provider !== provider) {
            const recommendedModel = validModels.find(model => model.recommended);
            newModel = (recommendedModel || validModels[0])?.id || DEFAULT_AI_SETTINGS.model;
          }
          
          return {
            settings: { ...state.settings, provider, model: newModel },
          };
        });
      },
    }),
    {
      name: 'morris-ai-store',
      partialize: (state) => ({
        settings: state.settings,
        apiKeys: state.apiKeys,
      }),
    }
  )
);
