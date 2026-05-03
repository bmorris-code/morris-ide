# Kimi K2.6 Integration Skill

## Overview

Integrate Moonshot AI's Kimi K2.6 model into Morris IDE. Kimi K2.6 features a 2-million-token context window enabling true project-wide code understanding.

## When to Use

Use this skill when:
- Adding new AI model providers to Morris IDE
- Implementing streaming AI responses
- Building project-wide context awareness
- Creating AI model selection UI components
- Adding context window monitoring

## Key Implementation Details

### Model Configuration

```typescript
// src/backend/ai-models.ts
export const AI_MODELS: AIModel[] = [
  {
    id: 'kimi-k2-6',
    name: 'Kimi K2.6',
    provider: 'moonshot',
    maxTokens: 2000000,        // 2M context window
    supportsStreaming: true,
    isNew: true,              // Shows NEW badge
    recommended: true,        // Default recommendation
    description: 'Moonshot AI\'s most capable model',
    endpoints: {
      chat: 'https://api.moonshot.cn/v1/chat/completions'
    }
  }
];
```

### System Prompt Optimization

```typescript
// src/backend/prompts.ts
export const KIMI_K2_6_SYSTEM_PROMPT = `You are Kimi K2.6, an advanced AI coding assistant in Morris IDE.

Your capabilities:
- 2 million token context window for deep project understanding
- Real-time streaming responses
- Cross-file code analysis and refactoring suggestions
- Security vulnerability detection across the codebase
- Multilingual support (English, Chinese, 20+ languages)

When responding:
1. Reference specific files and line numbers when relevant
2. Consider architectural implications across the project
3. Provide code examples in markdown with language specification
4. Highlight security or performance concerns
5. Suggest improvements that benefit the overall codebase`;
```

### Streaming Implementation (CRITICAL)

```typescript
// src/backend/ai-service.ts
// Use generateAIResponseStream, NOT generateAIResponse

// CORRECT - Streaming
export async function* streamAIResponse(params: AIRequestParams) {
  const client = getAIClient(params.modelId);
  const stream = await client.streamChat(params.messages);
  
  for await (const chunk of stream) {
    yield {
      content: chunk.choices[0]?.delta?.content || '',
      isComplete: chunk.choices[0]?.finish_reason === 'stop'
    };
  }
}

// WRONG - Blocking (don't do this)
export async function getAIResponse(params: AIRequestParams) {
  const response = await client.complete(params.messages); // Blocks!
  return response;
}
```

### Project Context Builder

```typescript
// src/backend/context-builder.ts
export async function buildProjectContext(
  projectPath: string,
  currentFilePath: string,
  maxTokens: number = 2000000
): Promise<ProjectContext> {
  const files = await getProjectFiles(projectPath);
  
  // Score files by relevance to current file
  const scoredFiles = await Promise.all(
    files.map(async (file) => ({
      path: file,
      content: await readFile(file),
      relevance: calculateRelevance(file, currentFilePath),
      tokenCount: estimateTokens(await readFile(file))
    }))
  );
  
  // Sort by relevance and fit within context window
  const sortedFiles = scoredFiles.sort((a, b) => b.relevance - a.relevance);
  
  let totalTokens = 0;
  const includedFiles: string[] = [];
  const contextParts: string[] = [];
  
  for (const file of sortedFiles) {
    if (totalTokens + file.tokenCount > maxTokens * 0.8) break; // Leave 20% for response
    
    totalTokens += file.tokenCount;
    includedFiles.push(file.path);
    contextParts.push(`// File: ${file.path}\n${file.content}`);
  }
  
  return {
    context: contextParts.join('\n\n'),
    includedFiles,
    totalTokens,
    remainingTokens: maxTokens - totalTokens
  };
}
```

### Context Window Indicator

```tsx
// src/components/ContextIndicator.tsx
import React from 'react';

interface ContextIndicatorProps {
  usedTokens: number;
  maxTokens: number;
}

export const ContextIndicator: React.FC<ContextIndicatorProps> = ({
  usedTokens,
  maxTokens
}) => {
  const percentage = (usedTokens / maxTokens) * 100;
  const formattedUsed = (usedTokens / 1000000).toFixed(2);
  const formattedMax = (maxTokens / 1000000).toFixed(1);
  
  const getColor = () => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-800 rounded-lg">
      <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-sm text-gray-400">
        {formattedUsed}M / {formattedMax}M tokens
      </span>
      {percentage > 90 && (
        <span className="text-xs text-red-400">Near limit</span>
      )}
    </div>
  );
};
```

### Model Selector with NEW Badge

```tsx
// src/components/ModelSelector.tsx
export const ModelSelector: React.FC = () => {
  const models = useAIModels();
  const selectedModel = useSelectedModel();
  
  // Sort with recommended first
  const sortedModels = [...models].sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    return a.name.localeCompare(b.name);
  });
  
  return (
    <select 
      value={selectedModel}
      onChange={(e) => setSelectedModel(e.target.value)}
      className="bg-gray-800 text-white px-3 py-2 rounded-lg"
    >
      {sortedModels.map(model => (
        <option key={model.id} value={model.id}>
          {model.recommended && '★ '}
          {model.name}
          {model.isNew && ' [NEW]'}
        </option>
      ))}
    </select>
  );
};
```

### Moonshot API Client

```typescript
// src/backend/moonshot-client.ts
const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1';

export class MoonshotClient {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async *streamChat(messages: ChatMessage[]): AsyncGenerator<StreamChunk> {
    const response = await fetch(`${MOONSHOT_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'kimi-k2-6',
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: true,
        temperature: 0.3,
        max_tokens: 8192
      })
    });
    
    if (!response.ok) {
      throw new Error(`Moonshot API error: ${response.status}`);
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
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const chunk = JSON.parse(data);
            yield chunk;
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}
```

## Testing Checklist

- [ ] Kimi K2.6 appears in model selector with NEW badge
- [ ] Kimi K2.6 is listed first (recommended)
- [ ] Streaming responses work (tokens appear gradually)
- [ ] Project context includes multiple files
- [ ] Context window indicator shows usage
- [ ] Chinese queries work correctly
- [ ] Cross-file references are accurate

## Environment Variables

```bash
# .env.local
MOONSHOT_API_KEY=sk-your-moonshot-api-key
MOONSHOT_BASE_URL=https://api.moonshot.cn/v1
```

## Marketing Copy

```markdown
Morris IDE is now powered by Kimi K2.6

Experience the future of coding with Moonshot AI's most capable model.
With a 2-million-token context window, Kimi K2.6 can understand your 
entire project — not just the file you're editing.

🧠 Deep Code Understanding — Analyzes architecture across files
⚡ Real-time Assistance — Streaming responses as you type
🔒 Privacy First — Your code stays between you and Kimi
🌍 Multilingual — Fluent in English, Chinese, and 20+ languages

"Kimi K2.6 in Morris IDE feels like pair programming with a senior 
engineer who has already read your entire codebase."
```

## Common Issues

**Issue:** Streaming not working (responses appear all at once)
**Fix:** Ensure you're using `generateAIResponseStream()` not `generateAIResponse()`

**Issue:** Context window not filling
**Fix:** Check `buildProjectContext()` is being called with `maxTokens: 2000000`

**Issue:** API key not recognized
**Fix:** Verify `MOONSHOT_API_KEY` is set in `.env.local` and the file is loaded

## Related Files

- `src/backend/ai-models.ts` - Model definitions
- `src/backend/prompts.ts` - System prompts
- `src/backend/ai-service.ts` - AI service implementation
- `src/backend/context-builder.ts` - Project context builder
- `src/components/ModelSelector.tsx` - Model selection UI
- `src/components/ContextIndicator.tsx` - Context usage display
