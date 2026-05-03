---
description: Integrate Kimi K2.6 (Moonshot AI) into Morris IDE with project-wide context, streaming, and optimized prompts
---

# Kimi K2.6 Integration Workflow for Morris IDE

This workflow adds Kimi K2.6 from Moonshot AI to Morris IDE, leveraging its 2-million-token context window for deep project understanding.

## Prerequisites

- Moonshot API key from [platform.moonshot.cn](https://platform.moonshot.cn)
- Existing Morris IDE codebase with AI integration

## Implementation Steps

### 1. Update AI Models Configuration

**File:** `src/backend/ai-models.ts` (or similar model config file)

Add Kimi K2.6 to the AI_MODELS array:

```typescript
{
  id: 'kimi-k2-6',
  name: 'Kimi K2.6',
  provider: 'moonshot',
  maxTokens: 2000000, // 2M context window
  supportsStreaming: true,
  isNew: true, // Flag for UI badge
  description: 'Moonshot AI\'s most capable model with 2M token context',
  recommended: true
}
```

### 2. Update System Prompts

**File:** `src/backend/prompts.ts` (or similar prompts file)

Add Kimi-optimized system prompt:

```typescript
export const KIMI_K2_6_SYSTEM_PROMPT = `You are Kimi K2.6, an AI coding assistant integrated into Morris IDE. 
You have access to the entire project context (up to 2 million tokens).

When analyzing code:
- Consider cross-file dependencies and architecture
- Reference specific files and line numbers
- Suggest refactoring that improves overall project structure
- Identify security issues across the codebase
- Provide multilingual responses when appropriate

Always format code responses with proper markdown code blocks and specify the language.`;
```

### 3. Fix Streaming Implementation

**File:** `src/backend/ai-service.ts` (or similar AI service)

// turbo
Ensure streaming uses `generateAIResponseStream` instead of `generateAIResponse`:

```typescript
// WRONG - blocks until complete
const response = await generateAIResponse(params);

// CORRECT - streams tokens in real-time
const stream = await generateAIResponseStream(params);
for await (const chunk of stream) {
  yield chunk.content;
}
```

### 4. Add UI Badge for New Model

**File:** `src/components/ModelSelector.tsx` (or similar component)

// turbo
Add isNew badge logic:

```tsx
{model.isNew && (
  <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
    NEW
  </span>
)}
```

### 5. Implement Project-Wide Context Builder

**File:** Create `src/backend/context-builder.ts`

// turbo
Build context from multiple files:

```typescript
export async function buildProjectContext(
  projectPath: string,
  currentFile: string
): Promise<string> {
  const relevantFiles = await getRelevantFiles(projectPath, currentFile);
  const contexts = await Promise.all(
    relevantFiles.map(async (file) => ({
      path: file,
      content: await readFile(file),
      tokenCount: estimateTokens(await readFile(file))
    }))
  );
  
  // Prioritize and fit within context window
  return prioritizeContext(contexts, 2000000);
}
```

### 6. Add Context Window Usage Indicator

**File:** `src/components/ContextIndicator.tsx` (create new)

```tsx
export function ContextIndicator({ used, total }: { used: number; total: number }) {
  const percentage = (used / total) * 100;
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${percentage > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-gray-400">{used.toLocaleString()} / {total.toLocaleString()} tokens</span>
    </div>
  );
}
```

### 7. Update Provider Selection

**File:** `src/components/ProviderSelector.tsx` (or similar)

// turbo
Recommend Kimi K2.6 by default:

```typescript
const RECOMMENDED_MODEL = 'kimi-k2-6';

// In UI, show Kimi first or highlighted
const sortedModels = [...models].sort((a, b) => {
  if (a.id === RECOMMENDED_MODEL) return -1;
  if (b.id === RECOMMENDED_MODEL) return 1;
  return 0;
});
```

### 8. Add Moonshot API Client

**File:** Create or update `src/backend/moonshot-client.ts`

```typescript
import { Moonshot } from '@moonshot-ai/moonshot-sdk'; // or use fetch

const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1';

export class MoonshotClient {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async *streamChat(messages: Message[]): AsyncGenerator<string> {
    const response = await fetch(`${MOONSHOT_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'kimi-k2-6',
        messages,
        stream: true,
        max_tokens: 8192
      })
    });
    
    // Handle SSE streaming
    for await (const chunk of this.parseSSEResponse(response)) {
      yield chunk.choices[0]?.delta?.content || '';
    }
  }
}
```

### 9. Add Environment Variable

**File:** `.env.example` and `.env.local`

```bash
# Moonshot AI Configuration
MOONSHOT_API_KEY=your_api_key_here
```

### 10. Update AI Service Router

**File:** `src/backend/ai-router.ts`

```typescript
export function getAIClient(modelId: string) {
  switch (modelId) {
    case 'kimi-k2-6':
      return new MoonshotClient(process.env.MOONSHOT_API_KEY!);
    case 'gpt-4':
      return new OpenAIClient(/* ... */);
    // ... other models
  }
}
```

## Testing

Run these tests after implementation:

1. **Streaming Test:** Verify tokens stream in real-time, not all at once
2. **Context Test:** Open large project, verify Kimi can see multiple files
3. **Badge Test:** Confirm "NEW" badge appears on Kimi K2.6 option
4. **Multilingual Test:** Send query in Chinese, verify response quality
5. **Context Window Test:** Load 1M+ tokens, verify indicator shows usage

## Verification Commands

```bash
# Test the implementation
npm run dev

# In the app:
# 1. Select Kimi K2.6 from model dropdown
# 2. Verify "NEW" badge appears
# 3. Send a message and confirm streaming
# 4. Open multi-file project and ask about cross-file dependencies
```

## Post-Implementation

Update marketing materials with:
- Morris IDE is now powered by Kimi K2.6
- 2-million-token context window
- Deep code understanding across entire projects
- Real-time streaming assistance
- Privacy-first with on-device context
