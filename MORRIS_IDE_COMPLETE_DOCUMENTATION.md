# Morris IDE × Kimi K2.6 — Complete Technical Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Backend Modules](#3-backend-modules)
4. [Frontend Components](#4-frontend-components)
5. [State Management](#5-state-management)
6. [Styling & Theme](#6-styling--theme)
7. [AI Integration](#7-ai-integration)
8. [File System](#8-file-system)
9. [Git Integration](#9-git-integration)
10. [Search & Indexing](#10-search--indexing)
11. [Terminal](#11-terminal)
12. [LSP Support](#12-lsp-support)
13. [Debugger](#13-debugger)
14. [Keyboard Shortcuts](#14-keyboard-shortcuts)
15. [API Reference](#15-api-reference)
16. [Configuration](#16-configuration)
17. [Deployment Guide](#17-deployment-guide)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Project Overview

**Morris IDE × Kimi K2.6** is an AI-powered integrated development environment built with React, TypeScript, and Vite. It integrates Moonshot AI's Kimi K2.6 model for intelligent code assistance while providing a full-featured coding environment comparable to VS Code.

### Key Features
- **AI-Powered Coding**: Natural language chat, code explanation, refactoring, bug detection
- **Monaco Editor**: Syntax highlighting for 50+ languages, IntelliSense, minimap
- **File Explorer**: Tree view with git status indicators, context menus
- **Real-Time Project Updates**: Electron file watcher refreshes the Explorer when files change
- **Git Integration**: Visual diff, stage/commit, branch management
- **Integrated Terminal**: Electron IPC-backed terminal with real-time streamed output
- **Search & Replace**: Project-wide search with regex support
- **LSP Framework**: Language Server Protocol support for multiple languages
- **Debugger**: Breakpoint management, step debugging
- **Multi-language UI**: Support for internationalization

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Editor | Monaco Editor (@monaco-editor/react) |
| Terminal | React terminal panel + Electron child_process IPC |
| State Management | Zustand (with persistence) |
| Styling | CSS Custom Properties (dark theme) |
| Utility Styling | Tailwind CSS default project theme |
| AI Backend | Moonshot API (Kimi K2.6) |
| Package Manager | npm |
| Desktop Framework | Electron (optional) |

---

## 2. Architecture

### 2.1 Directory Structure
```
morris-ide/
├── src/
│   ├── backend/              # AI and backend services
│   │   ├── ai/               # AI integration layer
│   │   │   ├── index.ts      # Main AI service with streaming
│   │   │   ├── agent-tools.ts # Agent/Tool system for Kimi
│   │   │   └── context-builder.ts # Project-wide context builder
│   │   └── index.ts          # Backend orchestrator
│   ├── components/           # React UI components
│   │   ├── ai/               # AI-related components
│   │   │   ├── AIChatPanel.tsx # Main AI chat interface
│   │   │   ├── ContextWindowIndicator.tsx # Token usage indicator
│   │   │   └── AgentMode.tsx # Agent/Tool execution mode
│   │   ├── editor/           # Monaco editor components
│   │   │   └── MonacoEditor.tsx # Editor wrapper with tabs
│   │   ├── explorer/         # File explorer
│   │   │   └── FileExplorer.tsx # File tree component
│   │   ├── layout/           # Layout components
│   │   │   ├── IDELayout.tsx # Main IDE layout
│   │   │   ├── DashboardLayout.tsx # Dashboard layout
│   │   │   └── Footer.tsx # Footer component
│   │   ├── terminal/         # Terminal components
│   │   │   └── TerminalPanel.tsx # Streaming Electron terminal
│   │   ├── welcome/         # Welcome screen
│   │   │   └── WelcomeScreen.tsx # Initial welcome screen
│   │   └── App.tsx           # Main application component
│   ├── hooks/                # Custom React hooks
│   │   ├── useAI.ts          # AI initialization hook
│   │   └── useElectron.ts    # Electron API hook
│   ├── store/                # Zustand state stores
│   │   ├── useAIStore.ts     # AI chat state management
│   │   ├── useEditorStore.ts # Editor state management
│   │   ├── useProjectStore.ts # Project state management
│   │   ├── useTerminalStore.ts # Terminal state management
│   │   ├── useAuthStore.ts   # Authentication state
│   │   └── index.ts          # Store exports
│   ├── types/                # TypeScript type definitions
│   │   ├── ai.ts             # AI-related types
│   │   ├── editor.ts         # Editor types
│   │   ├── project.ts        # Project types
│   │   └── index.ts          # Type exports
│   ├── utils/                # Utility functions
│   │   ├── logger.ts         # Logging utility
│   │   └── index.ts          # Utility exports
│   ├── debug-env.tsx         # Environment debug component
│   ├── main.tsx              # Application entry point
│   └── vite-env.d.ts         # Vite client types
├── .windsurf/                # Workflow and skill files
│   ├── workflows/            # Automation workflows
│   │   └── kimi-k2-6-integration.md
│   └── skills/               # AI skill definitions
│       └── kimi-k2-6-integration.md
├── public/
│   └── favicon.svg           # App icon
├── index.html                # HTML entry point
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript configuration
├── tsconfig.node.json        # Node-specific TS config
├── vite.config.ts            # Vite configuration
├── .eslintrc.cjs             # ESLint rules
├── .gitignore                # Git ignore patterns
├── .env.example              # Environment variables template
└── README.md                 # Project readme
```

### 2.2 Data Flow
```
User Action → React Component → Zustand Store → Backend Module → External API
     ↑                                                              ↓
     └────────────────── UI Update ←────────────────────────────────┘
```

### 2.3 Component Hierarchy
```
App.tsx (root)
├── IDELayout (main IDE layout)
│   ├── Sidebar (collapsible panels)
│   │   ├── FileExplorer (file tree)
│   │   └── AIChatPanel (AI chat interface)
│   ├── EditorArea
│   │   ├── MonacoEditor (with tabs)
│   │   │   ├── EditorTab (individual file tabs)
│   │   │   └── Editor (Monaco instance)
│   │   └── WelcomeScreen [no file open]
│   └── BottomPanel
│       └── TerminalPanel (streaming Electron terminal)
├── DashboardLayout (alternative layout)
│   ├── Footer
│   └── WelcomeScreen
└── DebugEnv (environment debug panel)
```

---

## 3. Backend Modules

### 3.1 AI Integration (`src/backend/ai/index.ts`)

**Purpose**: Interface with Kimi K2.6 API for intelligent code assistance with streaming support.

#### Key Functions
| Function | Signature | Description |
|--------|-----------|-------------|
| `generateAIResponse` | `(prompt: string, codeContext?: CodeContext, settings?: AISettings) => Promise<AIResponse>` | Non-streaming AI response |
| `generateAIResponseStream` | `(prompt: string, codeContext?: CodeContext, settings?: AISettings) => AsyncGenerator<string>` | Streaming AI response |
| `initializeProvider` | `(provider: AIProvider, apiKey: string) => boolean` | Initialize AI provider |
| `isProviderInitialized` | `(provider: AIProvider) => boolean` | Check if provider is ready |
| `getInitializedProviders` | `() => AIProvider[]` | List initialized providers |
| `initializeGroq` | `(apiKey: string) => void` | Legacy Groq initializer |
| `isGroqInitialized` | `() => boolean` | Legacy Groq readiness check |
| `AI_QUICK_ACTIONS` | `Record<QuickActionKey, (code: string) => string>` | Prompt builders for quick actions |
| `estimateTokens` | `(text: string) => number` | Approximate token count |
| `checkContextFit` | `(codeContext, settings, prompt) => { fits, estimatedTokens, maxTokens }` | Validate context against model budget |
| `withRetry` | `<T>(fn, maxRetries?, baseDelay?) => Promise<T>` | Retry wrapper with exponential backoff |

#### Supported Providers
```typescript
type AIProvider = 'groq' | 'moonshot' | 'openai';
```

#### Streaming Support
The AI integration supports streaming responses for real-time token delivery:
```typescript
const stream = generateAIResponseStream('Explain this code', codeContext, {
  provider: 'moonshot',
  model: 'kimi-k2-6',
  temperature: 0.3,
  maxTokens: 8192
});

for await (const chunk of stream) {
  console.log('Token:', chunk);
}
```

#### Context Building
- **Project Context**: `buildProjectContext()` - Uses 2M context for entire project analysis
- **Enhanced Context**: `buildEnhancedCodeContext()` - Combines project + current file context
- **Token Estimation**: `estimateTokens()` - Rough token count for context management
- **Token Formatting**: `formatTokenCount()` - Human-readable token count display
- **Approximate Count**: `countTokensApprox()` - Context-builder token estimator

---

### 3.2 Agent Tools (`src/backend/ai/agent-tools.ts`)

**Purpose**: Tool system for Kimi K2.6 Agent Mode allowing AI to execute actions in Morris IDE.

#### Tool Categories

**File Operations Tools**:
- `read_file(path)` - Read file contents
- `write_file(path, content)` - Write content to file  
- `list_directory(path)` - List files and directories

**Editor Operations Tools**:
- `open_file_in_editor(path)` - Open file in editor
- `get_active_file()` - Get currently active file
- `get_open_files()` - Get all open files

**Terminal Operations Tools**:
- `execute_command(command, cwd?)` - Execute terminal command
- `run_npm_command(command, args?)` - Run npm commands

**Project Analysis Tools**:
- `analyze_project_structure(path?)` - Analyze project structure

#### Tool Execution
```typescript
import { executeTool } from '../../backend/ai/agent-tools';

const result = await executeTool('read_file', { path: 'src/App.tsx' }, agentContext);
```

#### Agent Context
```typescript
interface AgentContext {
  electron: any; // useElectron hook result
  editorStore: any; // useEditorStore hook result
}
```

---

### 3.3 Context Builder (`src/backend/ai/context-builder.ts`)

**Purpose**: Build project-wide context for Kimi's 2M token context window.

#### Key Functions
| Function | Description |
|--------|-------------|
| `buildProjectContext(projectPath, maxTokens)` | Build context from entire project |
| `buildEnhancedCodeContext(codeContext, projectPath, maxTokens)` | Combine file + project context |
| `estimateTokens(text)` | Estimate token count |
| `calculateRelevance(query, content, language)` | Calculate file relevance score |

#### File Relevance Scoring
- Keyword matching based on programming language
- File type prioritization (src/, components/, utils/)
- Recent file access patterns
- Token limit enforcement

---

## 4. Frontend Components

### 4.1 AI Chat Panel (`src/components/ai/AIChatPanel.tsx`)

**Purpose**: Main AI chat interface with streaming responses and tool integration.

**Features**:
- Streaming message display with typing indicator
- Code block rendering with syntax highlighting
- Model selection with Kimi K2.6 recommendation
- Context window usage indicator for Moonshot
- Agent Mode toggle button
- Quick action suggestions (Explain, Refactor, Generate Tests, Find Bugs)
- API key configuration
- Message timestamps and auto-scroll

**Key Components**:
- `MessageBubble` - Chat message display
- `ProviderBadge` - AI provider indicator
- `CodeBlock` - Syntax-highlighted code with copy functionality

---

### 4.2 Agent Mode (`src/components/ai/AgentMode.tsx`)

**Purpose**: Tool execution interface for Kimi K2.6 Agent Mode.

**Features**:
- Tool execution with real-time feedback
- Command parsing (direct tool calls and natural language)
- Execution history with success/failure indicators
- Available tools display
- Integration with terminal for command visibility

**Available Tools**:
- File operations: `read_file()`, `write_file()`, `list_directory()`
- Editor operations: `open_file_in_editor()`, `get_active_file()`, `get_open_files()`
- Terminal operations: `execute_command()`, `run_npm_command()`
- Analysis: `analyze_project_structure()`

---

### 4.3 Context Window Indicator (`src/components/ai/ContextWindowIndicator.tsx`)

**Purpose**: Visual indicator for token usage in Kimi's 2M context window.

**Props Interface**:
```typescript
interface ContextWindowIndicatorProps {
  usedTokens: number;
  maxTokens: number;
}
```

**Features**:
- Color-coded usage bar (green → yellow → red)
- Token count display (e.g., "0/2M")
- Percentage-based width calculation
- Responsive design

---

### 4.4 Monaco Editor (`src/components/editor/MonacoEditor.tsx`)

**Purpose**: Monaco editor wrapper with tab management.

**Features**:
- Multi-tab file editing
- Language detection from file extension
- Syntax highlighting and IntelliSense
- Auto-save functionality (Ctrl+S)
- Tab reordering and closing
- Welcome screen when no files open
- Modified file indicators

**Key Components**:
- `EditorTab` - Individual file tab with close button
- Welcome screen with feature overview

---

### 4.5 File Explorer (`src/components/explorer/FileExplorer.tsx`)

**Purpose**: File tree navigation and project management.

**Features**:
- Recursive file tree rendering
- File opening in editor
- Directory expansion/collapse
- Refresh functionality
- Open folder dialog
- File filtering (excludes .files and node_modules)
- Integration with Electron file system APIs
- Real-time project folder watching with debounced tree refresh
- Create file, create folder, rename selected item, and delete selected item
- Opens created files directly in the editor

### 4.5.1 Search Panel (`src/components/layout/IDELayout.tsx`)

**Purpose**: Project-wide search over the opened folder.

**Features**:
- Searches filenames and text contents for common source/config file types
- Opens matching files directly into the editor
- Limits scans to deployment-safe bounds for UI responsiveness
- Requires Electron filesystem access for local project content

### 4.5.2 Git Panel (`src/components/layout/IDELayout.tsx`)

**Purpose**: Basic Git workflow for the opened project folder.

**Features**:
- `git status --short --branch`
- Commit all changes with a user-provided message
- Pull and push actions
- Command output rendered in the panel

### 4.5.3 Security Panel (`src/components/layout/IDELayout.tsx`)

**Purpose**: Security scan over the opened project.

**Features**:
- Scans common text/source files with the built-in security pattern engine
- Reports total files, issue counts, and high/critical totals
- Displays issue location, severity, matched code, and message
- Uses `src/backend/security/index.ts`

### 4.5.4 Problems Panel (`src/components/layout/IDELayout.tsx`)

**Purpose**: Captures build, test, lint, and terminal errors into a navigable issue list.

**Features**:
- Parses TypeScript-style `file(line,column): error` output
- Parses common Vite/source-location output
- Captures generic error/warning terminal lines
- Opens linked files in the editor when a problem has a path
- Problem count is displayed in the status bar

### 4.5.5 Command Palette (`src/components/layout/IDELayout.tsx`)

**Purpose**: Central keyboard-driven access to core IDE actions.

**Shortcut**: `Ctrl+Shift+P`

**Features**:
- Show Explorer, Search, AI Chat, Git, Security, Problems, and Settings
- Focus terminal
- Prepare test/build/lint commands
- Close active file or all files

---

### 4.6 Terminal Panel (`src/components/terminal/TerminalPanel.tsx`)

**Purpose**: Default Morris terminal UI backed by Electron IPC and real-time process output events.

**Features**:
- Default dark Tailwind styling used by the existing Morris IDE layout
- Command history navigation
- Built-in commands (clear, help, pwd, cd)
- External command execution via Electron `spawn`
- Real-time stdout/stderr display through `terminal:output` events
- Process completion tracking through `terminal:exit` events
- Stop button that calls Electron `terminal.kill`
- One-click presets for tests, build, and lint
- Streams output into the Problems panel parser
- Auto-scroll to bottom
- Command execution feedback

**Built-in Commands**:
| Command | Behavior |
|---------|----------|
| `clear` / `cls` | Clears visible terminal lines |
| `help` | Prints available terminal commands |
| `pwd` | Prints the store's current directory |
| `cd <path>` | Updates the terminal working directory state |

---

### 4.7 Welcome Screen (`src/components/welcome/WelcomeScreen.tsx`)

**Purpose**: Initial landing screen for new users.

**Features**:
- Feature overview with icons
- Quick start instructions
- Security scanning and AI assistant highlights
- Keyboard shortcuts reference
- Clean, modern design

---

### 4.8 Layout Components

**IDELayout** (`src/components/layout/IDELayout.tsx`):
- Main IDE layout with sidebar and editor area
- Responsive design
- Panel organization

**DashboardLayout** (`src/components/layout/DashboardLayout.tsx`):
- Alternative layout for dashboard view
- Footer integration

**Footer** (`src/components/layout/Footer.tsx`):
- Application footer with links and information

---

### 4.9 Debug Environment (`src/debug-env.tsx`)

**Purpose**: Development environment debugging panel.

**Features**:
- Environment variable display
- API key validation and preview
- VITE_ variable listing
- Key format validation for different providers
- Development helper tool

---

## 5. State Management

### 5.1 AI Store (`src/store/useAIStore.ts`)

**Purpose**: Manages AI chat state, messages, and settings.

**State Shape**:
```typescript
interface AIState {
  // Messages
  messages: ChatMessage[];
  isGenerating: boolean;
  
  // Settings
  settings: AISettings;
  apiKeys: Record<AIProvider, string>;
  
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
```

**Key Features**:
- Message persistence with streaming support
- Multiple AI provider support (Groq, Moonshot, OpenAI)
- API key management per provider
- Real-time generation status

---

### 5.2 Editor Store (`src/store/useEditorStore.ts`)

**Purpose**: Manages file tabs, editor state, and settings.

**State Shape**:
```typescript
interface EditorState {
  // Files and Tabs
  tabs: FileTab[];
  activeTabId: string | null;
  selectedText: string;
  
  // Settings
  settings: EditorSettings;
  
  // Actions
  openFile: (path: string, content: string) => void;
  closeTab: (tabId: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  markTabClean: (tabId: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  updateSettings: (settings: Partial<EditorSettings>) => void;
  getActiveTab: () => FileTab | null;
  getTabByPath: (path: string) => FileTab | undefined;
  setSelectedText: (text: string) => void;
}
```

**Key Features**:
- Multi-tab file management
- Dirty state tracking
- Language detection
- Editor settings persistence

---

### 5.3 Project Store (`src/store/useProjectStore.ts`)

**Purpose**: Manages project state, file tree, and recent projects.

**State Shape**:
```typescript
interface ProjectState {
  currentProject: Project | null;
  recentProjects: Project[];
  fileTree: FileNode | null;
  selectedPath: string | null;
  expandedFolders: Set<string>;
  isLoading: boolean;
  error: string | null;
}
```

**Key Features**:
- Project file tree management
- Recent projects tracking
- Folder expansion state
- Loading and error states

---

### 5.4 Terminal Store (`src/store/useTerminalStore.ts`)

**Purpose**: Manages terminal sessions and command history.

**State Shape**:
```typescript
interface TerminalState {
  lines: TerminalLine[];
  currentDirectory: string;
  isRunning: boolean;
  commandHistory: string[];
  historyIndex: number;
  inputValue: string;

  addLine: (type: TerminalLine['type'], content: string) => void;
  clearTerminal: () => void;
  setCurrentDirectory: (dir: string) => void;
  setRunning: (running: boolean) => void;
  addToHistory: (command: string) => void;
  navigateHistory: (direction: 'up' | 'down') => string;
  setInputValue: (value: string) => void;
}
```

**Key Features**:
- Terminal output management
- Command history navigation
- Directory tracking
- Execution state

---

### 5.5 Auth Store (`src/store/useAuthStore.ts`)

**Purpose**: Manages user authentication state.

**Key Features**:
- User session management
- Clerk integration
- Authentication state tracking

---

## 6. Styling & Theme

### 6.1 CSS Custom Properties (`src/frontend/styles/global.css`)

**Color Palette**:
```css
:root {
  /* Backgrounds */
  --bg-primary: #1e1e1e;      /* Main background */
  --bg-secondary: #252526;    /* Sidebar, panels */
  --bg-tertiary: #2d2d30;     /* Inputs, buttons */
  --bg-hover: #2a2d2e;        /* Hover states */
  --bg-active: #37373d;       /* Active states */
  --bg-input: #3c3c3c;        /* Input fields */

  /* Foregrounds */
  --fg-primary: #d4d4d4;      /* Primary text */
  --fg-secondary: #858585;    /* Secondary text */
  --fg-muted: #6e6e6e;        /* Muted text */
  --fg-accent: #007acc;       /* Accent (blue) */
  --fg-success: #89d185;      /* Success (green) */
  --fg-warning: #cca700;      /* Warning (yellow) */
  --fg-error: #f48771;        /* Error (red) */
  --fg-info: #75beff;         /* Info (light blue) */

  /* Borders */
  --border-color: #3e3e42;
  --border-light: #454545;

  /* Typography */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Layout */
  --sidebar-width: 250px;
  --activity-bar-width: 48px;
  --status-bar-height: 22px;
  --title-bar-height: 30px;
  --menu-bar-height: 30px;
  --tab-bar-height: 35px;
}
```

### 6.2 Layout System

**Grid Layout**:
```
+--------------------------------------------------+
| Title Bar (30px)                                  |
+--------------------------------------------------+
| Menu Bar (30px)                                   |
+--------+------------------------------------------+
|        |                                          |
| Activity | Sidebar (250px, resizable) | Editor   |
| Bar    |                            | Area       |
| (48px) |                            | (flexible) |
|        |                            |            |
|        |                            | +----------+
|        |                            | | Bottom   |
|        |                            | | Panel    |
|        |                            | | (200px)  |
+--------+----------------------------+------------+
| Status Bar (22px)                                 |
+--------------------------------------------------+
```

### 6.3 Responsive Behavior
- **Mobile (< 768px)**: Sidebar becomes overlay with shadow
- **Tablet**: Sidebar collapsible, shortcuts stack vertically
- **Desktop**: Full layout with resizable panels

---

## 7. AI Integration

### 7.1 Kimi K2.6 Configuration

**API Endpoint**: `https://api.moonshot.cn/v1` 

**Environment Variables**:
```bash
VITE_MOONSHOT_API_KEY=sk-your-moonshot-api-key
VITE_GROQ_API_KEY=gsk_your-groq-api-key
VITE_OPENAI_API_KEY=sk-your-openai-api-key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-key
```

**Supported Models**:
| Model | Context Window | Provider | Best For |
|-------|---------------|----------|----------|
| kimi-k2-6 | 2M tokens | moonshot | Latest model with 2M context |
| kimi-latest | 2M tokens | moonshot | Auto-updates to newest |
| kimi-k2-5 | 256K tokens | moonshot | Fast, capable |
| kimi-k2 | 2M tokens | moonshot | Large codebases |
| llama-3.3-70b-versatile | 128K tokens | groq | Fast inference |
| llama-3.1-8b-instant | 128K tokens | groq | Quick responses |
| gpt-4o | 128K tokens | openai | Advanced reasoning |
| gpt-4o-mini | 128K tokens | openai | Cost-effective |

### 7.2 AI Provider Configuration

**Provider Configs**:
```typescript
const PROVIDER_CONFIGS = {
  moonshot: {
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'kimi-latest',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
  },
};
```

### 7.3 Streaming Implementation

**Streaming Response Generator**:
```typescript
export async function* generateAIResponseStream(
  prompt: string,
  codeContext?: CodeContext,
  settings: AISettings = DEFAULT_AI_SETTINGS
): AsyncGenerator<string, void, unknown> {
  const provider = settings.provider || 'groq';
  
  if (provider === 'groq' && clients.groq.client) {
    // Groq SDK streaming
    const stream = await clients.groq.client.chat.completions.create({
      model: settings.model || config.defaultModel,
      messages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  } else {
    // Fetch-based streaming for Moonshot/OpenAI
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: config.headers(clients[provider].apiKey),
      body: JSON.stringify({
        model: settings.model || config.defaultModel,
        messages,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        stream: true,
      }),
    });

    const reader = response.body?.getReader();
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
          if (content) yield content;
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
}
```

### 7.4 Context Building for Kimi K2.6

**Project-Wide Context**:
```typescript
export const buildProjectContext = async (
  projectPath: string,
  maxTokens: number = 2000000
): Promise<string> => {
  // Get all files in project
  const files = await getAllFiles(projectPath);
  
  // Calculate relevance scores
  const fileScores = await Promise.all(
    files.map(async (file) => ({
      path: file.path,
      relevance: await calculateRelevance('', file.content, file.language),
      content: file.content
    }))
  );

  // Sort by relevance and add until token limit
  fileScores.sort((a, b) => b.relevance - a.relevance);
  
  let context = '';
  let totalTokens = 0;
  
  for (const file of fileScores) {
    const tokens = estimateTokens(file.content);
    if (totalTokens + tokens > maxTokens * 0.8) break;
    
    context += `\n\n// File: ${file.path}\n${file.content}`;
    totalTokens += tokens;
  }
  
  return context;
};
```

### 7.5 Agent Mode Tool Execution

**Tool Execution Flow**:
```typescript
export const executeTool = async (
  toolName: string, 
  params: any, 
  context: AgentContext
): Promise<ToolResult> => {
  const tool = ToolRegistry.get(toolName);
  if (!tool) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }
  
  try {
    const result = await tool.execute(params, context);
    return result;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
```

### 7.6 Error Handling and Validation

**API Key Validation**:
```typescript
// Moonshot API key validation
if (provider === 'moonshot') {
  if (!apiKey.startsWith('sk-') && !apiKey.startsWith('sk-proj-')) {
    logger.error(`Invalid Moonshot API key format. Should start with 'sk-' or 'sk-proj-'`);
    return false;
  }
}
```

**401 Error Handling**:
```typescript
if (response.status === 401) {
  if (provider === 'moonshot') {
    throw new Error(`Moonshot API authentication failed. Please check your API key format and permissions.`);
  }
}
```

---

## 8. File System

### 8.1 File Operations

**Opening a File**:
```typescript
// 1. User clicks file in tree
// 2. FileSystemManager.readFile(path)
// 3. SearchEngine.indexFile(path, content, language)
// 4. LSPClient.openDocument({ uri, languageId, version, text })
// 5. IDEStore.openFile(path, name, language, content)
```

**Saving a File**:
```typescript
// 1. User presses Ctrl+S
// 2. IDEStore.saveFile(fileId)
// 3. FileSystemManager.writeFile(path, content)
// 4. SearchEngine.indexFile(path, newContent, language)
// 5. LSPClient.changeDocument(uri, changes)
```

### 8.2 File Watching

```typescript
const fs = new FileSystemManager('/project');
fs.watchFile('/project/src/app.ts', (newContent) => {
  console.log('File changed externally:', newContent);
});
```

---

## 9. Git Integration

### 9.1 Workflow

**Stage and Commit**:
```typescript
const git = new GitManager('/project');
await git.initialize();

// Stage files
await git.stageFile('src/app.ts');
await git.stageFile('src/utils.ts');

// Commit
await git.commit('Fix bug in auth middleware', ['src/app.ts', 'src/utils.ts']);

// Push
await git.push('origin', 'main');
```

**View Status**:
```typescript
const status = await git.getStatus();
console.log(`Branch: ${status.branch}`);
console.log(`Modified: ${status.modified.length} files`);
console.log(`Staged: ${status.staged.length} files`);
```

### 9.2 Diff Viewing

```typescript
const diff = await git.getDiff('src/app.ts');
for (const fileDiff of diff) {
  console.log(`File: ${fileDiff.filePath}`);
  for (const hunk of fileDiff.hunks) {
    console.log(`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`);
    for (const line of hunk.lines) {
      const prefix = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';
      console.log(`${prefix} ${line.content}`);
    }
  }
}
```

---

## 10. Search & Indexing

### 10.1 Project Indexing

```typescript
const search = new SearchEngine();

// Index entire project
const filePaths = ['src/app.ts', 'src/utils.ts', 'src/components/Button.tsx'];
await search.indexProject(filePaths, async (path) => {
  return await fs.readFile(path);
});

// Check stats
const stats = search.getStats();
console.log(`Indexed ${stats.totalFiles} files with ${stats.totalSymbols} symbols`);
```

### 10.2 Searching

```typescript
// Text search
const results = search.search('useEffect', {
  caseSensitive: false,
  wholeWord: true,
  filePattern: '*.tsx'
});

// Symbol search
const symbols = search.searchSymbols('Button');

// Find references
const refs = search.findReferences('calculateTotal');

// Go to definition
const def = search.goToDefinition('UserInterface');
if (def) {
  console.log(`Defined at ${def.filePath}:${def.line}:${def.column}`);
}
```

---

## 11. Terminal

### 11.1 Runtime Model

The current terminal is a single visible panel that uses the existing Morris IDE dark styling and delegates command execution to Electron. Commands are spawned in the main process, while stdout, stderr, and exit status are streamed back to the renderer in real time.

### 11.2 Renderer Hook API

```typescript
const electron = useElectron();

const result = await electron.spawnCommand('npm run build', [], currentDirectory);

const removeOutputListener = electron.onTerminalOutput((event) => {
  if (event.processId === result.processId) {
    console.log(event.type, event.content);
  }
});

const removeExitListener = electron.onTerminalExit((event) => {
  if (event.processId === result.processId) {
    console.log('done', event.code, event.success);
  }
});

await electron.killProcess(result.processId!);

removeOutputListener();
removeExitListener();
```

### 11.3 Electron Terminal IPC

```typescript
window.electronAPI.terminal.exec(command, cwd);
window.electronAPI.terminal.spawn(command, args, cwd);
window.electronAPI.terminal.kill(processId);
window.electronAPI.terminal.onOutput(callback);
window.electronAPI.terminal.onExit(callback);
```

**IPC Channels**:
| Channel | Direction | Payload |
|---------|-----------|---------|
| `terminal:exec` | renderer -> main | `(command, cwd?)` |
| `terminal:spawn` | renderer -> main | `(command, args, cwd?)` |
| `terminal:kill` | renderer -> main | `(processId)` |
| `terminal:output` | main -> renderer | `{ processId, type, content }` |
| `terminal:exit` | main -> renderer | `{ processId, code, signal, success }` |

### 11.4 Store Integration

The terminal store keeps the last 500 rendered lines, current working directory, running state, command history, history cursor, and input value. `TerminalPanel` subscribes to real-time IPC events and writes streamed chunks into `addLine()`.

---

## 12. LSP Support

### 12.1 Registering Language Servers

```typescript
const lsp = new LSPManager();

lsp.registerClient('typescript', {
  languageId: 'typescript',
  command: 'typescript-language-server',
  args: ['--stdio']
});

lsp.registerClient('python', {
  languageId: 'python',
  command: 'pylsp'
});

await lsp.initializeClient('typescript', '/project');
```

### 12.2 Using LSP Features

```typescript
const client = lsp.getClient('typescript');

// Open document
await client.openDocument({
  uri: 'file:///project/src/app.ts',
  languageId: 'typescript',
  version: 1,
  text: 'const x = 1;'
});

// Get completions
const completions = await client.getCompletion(
  'file:///project/src/app.ts',
  { line: 0, character: 10 }
);

// Get hover info
const hover = await client.getHover(
  'file:///project/src/app.ts',
  { line: 0, character: 5 }
);
```

---

## 13. Debugger

### 13.1 Starting a Debug Session

```typescript
const debugger = new Debugger();

const session = await debugger.createSession({
  type: 'node',
  request: 'launch',
  name: 'Debug Server',
  program: '/project/server.js',
  args: ['--port', '3000'],
  env: { NODE_ENV: 'development' }
});

await debugger.startSession(session.id);
```

### 13.2 Managing Breakpoints

```typescript
// Add breakpoint
const bp = await debugger.addBreakpoint(
  { name: 'app.ts', path: '/project/src/app.ts' },
  42,
  { condition: 'x > 10' }
);

// Remove breakpoint
await debugger.removeBreakpoint(bp.id);
```

### 13.3 Stepping

```typescript
await debugger.pause(session.id);
await debugger.stepOver(session.id, threadId);
await debugger.stepInto(session.id, threadId);
await debugger.stepOut(session.id, threadId);
await debugger.continue(session.id, threadId);
```

---

## 14. Keyboard Shortcuts

### 14.1 Default Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Open File |
| `Ctrl+P` | Quick Open |
| `Ctrl+S` | Save File |
| `Ctrl+Shift+S` | Save All |
| `Ctrl+Shift+F` | Search in Files |
| `Ctrl+G` | Go to Line |
| `Ctrl+`` | Toggle Terminal |
| `Ctrl+Shift+A` | Toggle AI Chat |
| `Ctrl+Shift+P` | Open Command Palette |
| `Ctrl+Space` | Trigger Suggestions |
| `F5` | Start Debugging |
| `F9` | Toggle Breakpoint |
| `F10` | Step Over |
| `F11` | Step Into |
| `Shift+F11` | Step Out |
| `Ctrl+/` | Toggle Comment |
| `Ctrl+D` | Duplicate Line |
| `Ctrl+Shift+K` | Delete Line |
| `Alt+Up/Down` | Move Line Up/Down |
| `Ctrl+B` | Toggle Sidebar |
| `Ctrl+J` | Toggle Bottom Panel |
| `Ctrl+W` | Close Tab |
| `Ctrl+Shift+T` | Reopen Closed Tab |
| `Ctrl+Tab` | Next Tab |
| `Ctrl+Shift+Tab` | Previous Tab |

### 14.2 Customizing Shortcuts

Shortcuts can be customized via the settings store:
```typescript
useEditorStore.getState().updateSettings({
  // Custom keybindings
});
```

---

## 15. API Reference

### 15.1 Electron API

The preload bridge exposes the real desktop API through `window.electronAPI`. All file, dialog, terminal, app, and shell functions return structured `{ success, error? }` results where applicable.

**File System Functions**:
```typescript
window.electronAPI.fs.readFile(path);
window.electronAPI.fs.writeFile(path, content);
window.electronAPI.fs.readDir(path);
window.electronAPI.fs.createFile(path, content?);
window.electronAPI.fs.createDir(path);
window.electronAPI.fs.deleteFile(path);
window.electronAPI.fs.renameFile(oldPath, newPath);
window.electronAPI.fs.fileExists(path);
window.electronAPI.fs.getStats(path);
window.electronAPI.fs.watch(path);
window.electronAPI.fs.unwatch(path);
window.electronAPI.fs.onChanged(({ type, path, rootPath, timestamp }) => {});
window.electronAPI.fs.onWatchError(({ rootPath, error }) => {});
```

**Real-Time File Watch Events**:
| Channel | Direction | Payload |
|---------|-----------|---------|
| `fs:watch` | renderer -> main | `(path)` |
| `fs:unwatch` | renderer -> main | `(path)` |
| `fs:changed` | main -> renderer | `{ type, path, rootPath, timestamp }` |
| `fs:watch-error` | main -> renderer | `{ rootPath, error }` |

The Explorer starts a watcher when a project folder is opened, ignores hidden files, `node_modules`, `dist`, and `dist-electron`, then refreshes the file tree after a short debounce.

**Dialog Functions**:
```typescript
window.electronAPI.dialog.openFolder();
window.electronAPI.dialog.openFile();
window.electronAPI.dialog.saveFile(defaultPath?);
```

**Terminal Functions and Real-Time Events**:
```typescript
window.electronAPI.terminal.exec(command, cwd?);
window.electronAPI.terminal.spawn(command, args, cwd?);
window.electronAPI.terminal.kill(processId);
window.electronAPI.terminal.onOutput(({ processId, type, content }) => {});
window.electronAPI.terminal.onExit(({ processId, code, signal, success }) => {});
```

**App and Shell Functions**:
```typescript
window.electronAPI.app.getPath(name);
window.electronAPI.app.minimize();
window.electronAPI.app.maximize();
window.electronAPI.app.close();
window.electronAPI.shell.openExternal(url);
```

### 15.2 AI Streaming API

AI streaming uses async generators in the renderer rather than an event emitter:
```typescript
const stream = generateAIResponseStream(prompt, codeContext, settings);

for await (const chunk of stream) {
  updateMessage(messageId, { content: currentContent + chunk });
}
```

### 15.3 Frontend Store API

**Editor Store Selectors**:
```typescript
const tabs = useEditorStore(state => state.tabs);
const activeTab = useEditorStore(state => state.getActiveTab());
const selectedText = useEditorStore(state => state.selectedText);
```

**AI Chat Store Selectors**:
```typescript
const messages = useAIStore(state => state.messages);
const isGenerating = useAIStore(state => state.isGenerating);
const settings = useAIStore(state => state.settings);
```

---

## 16. Configuration

### 16.1 Environment Variables

Create a `.env` file in the project root:

```bash
# Kimi API Configuration
KIMI_API_KEY=your_moonshot_api_key
KIMI_API_ENDPOINT=https://api.moonshot.cn/v1

# Optional: Other AI Providers
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key

# Optional: LSP Server Paths
TYPESCRIPT_LSP_PATH=/usr/local/bin/typescript-language-server
PYTHON_LSP_PATH=/usr/local/bin/pylsp
RUST_LSP_PATH=/usr/local/bin/rust-analyzer

# Optional: Development
VITE_DEV_SERVER_PORT=3000
VITE_OPEN_BROWSER=true
```

### 16.2 Editor Settings

Settings are persisted to localStorage and can be customized:

```typescript
useEditorStore.getState().updateSettings({
  theme: 'vs-dark',
  fontSize: 16,
  fontFamily: 'Fira Code, monospace',
  wordWrap: 'on',
  minimap: true,
  lineNumbers: 'on',
  tabSize: 4,
  insertSpaces: true,
  formatOnSave: true,
  autoSave: 'afterDelay'
});
```

### 16.3 AI Settings

```typescript
useAIStore.getState().updateSettings({
  provider: 'moonshot',
  model: 'kimi-k2-6',
  temperature: 0.3,
  maxTokens: 8192
});
```

---

## 17. Deployment Guide

### 17.1 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser at http://localhost:3000
```

### 17.2 Production Build

```bash
# Type check and build
npm run build

# Preview production build
npm run preview
```

**Current Verification Status**:
- `npm run build` passes.
- `npm run electron:compile` passes.
- Vite reports a large bundle warning because Monaco, AI chat rendering, and app shell code are currently bundled together. This is not a build failure, but code-splitting should be considered before a high-traffic web launch.
- Electron is the primary runtime for production IDE usage. Browser mode remains suitable for landing, auth, download, docs, and product preview.
- Production desktop readiness now includes file actions, command palette, terminal presets, Problems panel, unsaved-change guards, Git commands, project search, security scanning, and real-time file watching.

### 17.3 Deployment Options

**Vercel**:
```bash
npm i -g vercel
vercel --prod
```

**Netlify**:
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

**GitHub Pages**:
```bash
npm run build
# Copy dist contents to gh-pages branch
```

**Self-hosted**:
```bash
npm run build
# Serve dist/ folder with nginx, Apache, or any static server
```

### 17.4 Electron Desktop App

To package as a desktop application:

```bash
npm install electron electron-builder

# Existing package scripts:
npm run dev:electron
npm run build:electron
npm run electron:build
npm run electron:build:win
npm run electron:build:mac
npm run electron:build:linux
```

---

## 18. Troubleshooting

### 18.1 Common Issues

**Issue**: Monaco Editor doesn't load
- **Solution**: Ensure `@monaco-editor/react` and `monaco-editor` are installed
- **Check**: Vite config has Monaco in `optimizeDeps.include` 

**Issue**: Terminal shows blank screen
- **Solution**: Run the desktop app with Electron so `window.electronAPI` is available
- **Check**: `electron/preload.ts` exposes `terminal.onOutput` and `terminal.onExit`
- **Check**: `TerminalPanel` is receiving streamed `terminal:output` events

**Issue**: AI responses not streaming
- **Solution**: Check API key is set correctly
- **Check**: `generateAIResponseStream()` is used instead of `generateAIResponse()`
- **Check**: Frontend updates the assistant message inside the async iterator loop

**Issue**: Git operations fail
- **Solution**: Ensure directory is a git repository (`git init`)
- **Check**: Git is installed and in PATH

**Issue**: LSP server not connecting
- **Solution**: Install language server globally (`npm i -g typescript-language-server`)
- **Check**: Server path is correct in configuration

**Issue**: TypeScript errors on build
- **Solution**: Run `npm run typecheck` to see all errors
- **Check**: `tsconfig.json` includes all source files

### 18.2 Debug Mode

Enable debug logging:
```typescript
// In browser console
localStorage.setItem('morris-ide-debug', 'true');
```

### 18.3 Getting Help

- **GitHub Issues**: Report bugs and request features
- **Discord**: Join the Morris IDE community
- **Documentation**: This document and inline JSDoc comments

---

## Appendix A: File Size Reference

| File | Size | Purpose |
|------|------|---------|
| `src/backend/ai/index.ts` | ~10 KB | AI integration |
| `electron/main.ts` | ~8 KB | Electron main process and IPC handlers |
| `electron/preload.ts` | ~3 KB | Safe renderer API bridge |
| `src/components/terminal/TerminalPanel.tsx` | ~7 KB | Streaming terminal UI |
| `src/hooks/useElectron.ts` | ~4 KB | Renderer hook for Electron APIs |
| `src/store/useTerminalStore.ts` | ~2 KB | Terminal state management |
| `src/App.tsx` | ~3 KB | Main app component |

## Appendix B: Dependency Tree

```
morris-ide
|-- react@19.2.5
|-- react-dom@19.2.5
|-- zustand@5.0.12
|-- @monaco-editor/react@4.7.0
|   `-- monaco-editor@0.55.1
|-- electron@33.2.0
|-- lucide-react@0.400.0
`-- devDependencies
    |-- vite@5.4.18
    |-- @vitejs/plugin-react@4.4.1
    |-- typescript@6.0.3
    |-- @types/react@19.2.14
    `-- eslint@10.2.1
```

## Appendix C: Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully supported |
| Firefox | 88+ | ✅ Fully supported |
| Safari | 14+ | ✅ Supported |
| Edge | 90+ | ✅ Fully supported |
| Opera | 76+ | ✅ Supported |

---

**Document Version**: 1.0.0
**Last Updated**: 2026-04-29
**Author**: Morris IDE Team × Kimi K2.6
**License**: MIT
