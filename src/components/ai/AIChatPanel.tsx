import { useState, useRef, useEffect, useCallback } from 'react';
import { debounce } from '../../utils/searchCache';

// ============ FIXED IMPORTS ============

import { 

  Send, Trash2, Settings, Bot, User, Loader2, 

  AlertCircle, Code, Sparkles, Copy, Check, 

  Zap, MessageSquare 

} from 'lucide-react';

import { useAIStore, useEditorStore } from '../../store';
import { useAI } from '../../hooks';

import { 

  generateAIResponseStream,

  initializeProvider,

  isProviderInitialized,

  AI_QUICK_ACTIONS,

} from '../../backend/ai';

import { AI_MODELS, AI_PROVIDERS } from '../../types/ai';

import type { ChatMessage, AIProvider } from '../../types/ai';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';



// ============ CODE BLOCK RENDERER ============

function CodeBlock({ code, language = 'typescript' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    window.dispatchEvent(new CustomEvent('apply-code', { detail: { code } }));
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div className="my-2 max-w-full rounded-lg overflow-hidden border border-gray-700 bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleApply}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-400 transition-colors"
            title="Insert at Cursor / Replace Selection"
          >
            {applied ? <Check size={12} className="text-violet-400" /> : <Zap size={12} />}
            {applied ? 'Inserted!' : 'Insert'}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '8px 12px',
          fontSize: '12px',
          lineHeight: '1.4',
          background: 'transparent',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >

        {code}

      </SyntaxHighlighter>

    </div>

  );

}



// ============ MESSAGE CONTENT PARSER ============

function MessageContent({ content }: { content: string }) {

  // Simple regex to split code blocks from text

  const parts = content.split(/(```[\s\S]*?```)/g);

  

  return (
    <div className="space-y-1 overflow-x-hidden">

      {parts.map((part, i) => {

        if (part.startsWith('```')) {

          const match = part.match(/```(\w+)?\n([\s\S]*?)```/);

          if (match) {

            const [, lang, code] = match;

            return <CodeBlock key={i} code={code.trim()} language={lang || 'typescript'} />;

          }

        }

        return <div key={i} className="whitespace-pre-wrap leading-relaxed break-words">{part}</div>;

      })}

    </div>

  );

}



// ============ MESSAGE BUBBLE ============

function MessageBubble({ message }: { message: ChatMessage }) {

  const isUser = message.role === 'user';

  const isError = !!message.error;



  return (

    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-200`}>

      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${

        isUser ? 'bg-violet-600' : 'bg-gradient-to-br from-violet-500 to-purple-600'

      }`}>

        {isUser ? <User size={14} /> : <Bot size={14} className="text-white" />}

      </div>
      <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block max-w-full text-left rounded-xl px-4 py-2.5 text-sm overflow-x-hidden ${

          isUser

            ? 'bg-violet-600 text-white'

            : isError

              ? 'bg-red-900/20 text-red-300 border border-red-800/50'

              : 'bg-gray-800/80 text-gray-200 border border-gray-700/50'

        }`}>

          {message.isLoading ? (

            <div className="flex items-center gap-3 py-1">

              <div className="flex gap-1">

                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />

                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />

                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />

              </div>

              <span className="text-gray-400">Thinking...</span>

            </div>

          ) : isError ? (

            <div className="flex items-center gap-2">

              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />

              <span>{message.error}</span>

            </div>

          ) : (

            <MessageContent content={message.content} />

          )}

        </div>

        <div className="text-[10px] text-gray-600 mt-1 px-1">

          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

        </div>

      </div>

    </div>

  );

}



// ============ PROVIDER BADGE ============

function ProviderBadge({ provider }: { provider: AIProvider }) {

  const configs = {

    groq: { color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Groq' },

    moonshot: { color: 'text-violet-400', bg: 'bg-violet-400/10', label: 'Kimi' },

    openai: { color: 'text-green-400', bg: 'bg-green-400/10', label: 'OpenAI' },

  };

  const config = configs[provider] || configs.groq;



  return (

    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.color} ${config.bg}`}>

      <Zap size={10} />

      {config.label}

    </span>

  );

}

export default function AIChatPanel() {

  const [input, setInput] = useState('');

  const [showSettings, setShowSettings] = useState(false);

  const [apiKeyInput, setApiKeyInput] = useState('');

  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('groq');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const streamingRef = useRef<string | null>(null);

  // const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Unused - commented out


  const {

    messages,

    isGenerating,

    settings,

    apiKeys,

    addMessage,

    updateMessage,

    clearMessages,

    setGenerating,

    setApiKey,

    setModel,

    setProvider

  } = useAIStore();



  const { getActiveTab, selectedText } = useEditorStore();


  // Auto-resize textarea

  useEffect(() => {

    const textarea = textareaRef.current;

    if (textarea) {

      textarea.style.height = 'auto';

      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';

    }

  }, [input]);



  // Auto scroll to bottom

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  }, [messages, isGenerating]);



  // Initialize provider when API key is set or provider changes
  useEffect(() => {
    const key = apiKeys[selectedProvider];
    if (!key) return;
    // isProviderInitialized is async — call initializeProvider safely,
    // it's idempotent so calling it again if already set is harmless.
    isProviderInitialized(selectedProvider).then((initialized) => {
      if (!initialized) {
        initializeProvider(selectedProvider, key);
      }
    });
  }, [apiKeys, selectedProvider]);



  // ============ FIXED handleSaveApiKey ============

  const handleSaveApiKey = async () => {

    if (apiKeyInput.trim()) {

      setApiKey(selectedProvider, apiKeyInput.trim());

      try {
        const success = await initializeProvider(selectedProvider, apiKeyInput.trim());
        if (success) {
          console.log(`${selectedProvider} initialized successfully`);
          setShowSettings(false);
          setApiKeyInput('');
        } else {
          console.error(`Failed to initialize ${selectedProvider}`);
          // You might want to show an error message to the user here
        }
      } catch (error) {
        console.error('Error initializing provider:', error);
        // You might want to show an error message to the user here
      }
    }
  };

  // Debounced message update to prevent race conditions
  const debouncedUpdateMessage = useCallback(
    debounce((messageId: string, updates: Partial<ChatMessage>) => {
      updateMessage(messageId, updates);
    }, 50),
    [updateMessage]
  );

  // ============ FIXED handleKeyDown ============
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ============ FIXED handleSend ============
  const handleSend = useCallback(async (customPrompt?: string) => {
    const textToSubmit = customPrompt && typeof customPrompt === 'string' ? customPrompt : input.trim();
    
    if (!textToSubmit || isGenerating) return;

    // Prevent multiple concurrent streams
    if (streamingRef.current) return;

    const activeTab = getActiveTab();

    const codeContext = activeTab ? {
      filePath: activeTab.path,
      fileName: activeTab.name,
      language: activeTab.language,
      fullCode: activeTab.content,
      selectedCode: selectedText || undefined,
    } : undefined;

    if (!customPrompt || typeof customPrompt !== 'string') {
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }

    addMessage('user', textToSubmit, codeContext);

    const assistantMsg = addMessage('assistant', '', codeContext);

    updateMessage(assistantMsg.id, { isLoading: true, provider: selectedProvider });

    setGenerating(true);

    streamingRef.current = assistantMsg.id;

    try {
      const stream = generateAIResponseStream(textToSubmit, codeContext, {

        ...settings,

        provider: selectedProvider,

      });

      let fullContent = '';

      for await (const chunk of stream) {

        // Only update if this is still the active stream
        if (streamingRef.current !== assistantMsg.id) break;

        fullContent += chunk;

        // Use debounced update to prevent excessive re-renders
        debouncedUpdateMessage(assistantMsg.id, {

          isLoading: false,

          content: fullContent,

          provider: selectedProvider,

        });

      }

    } catch (error) {

      if (streamingRef.current === assistantMsg.id) {

        updateMessage(assistantMsg.id, {

          isLoading: false,

          error: error instanceof Error ? error.message : 'Unknown error occurred',

          provider: selectedProvider,

        });

      }

    } finally {

      streamingRef.current = null;

      setGenerating(false);

    }
  }, [input, isGenerating, settings, selectedProvider, apiKeys, addMessage, updateMessage, setGenerating, getActiveTab, selectedText, debouncedUpdateMessage]);

  // Listen for AI quick fixes
  useEffect(() => {
    const handleAIFix = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { error, code, line, action } = customEvent.detail;
      
      const isExplain = action === 'explain';
      const prompt = isExplain 
        ? `Explain this error on line ${line}:\n\n${error}\n\nContext:\n\`\`\`typescript\n${code}\n\`\`\`\n\nPlease explain what this error means, why it occurs, and how to fix it.`
        : `Fix this error on line ${line}:\n\n${error}\n\nContext:\n\`\`\`typescript\n${code}\n\`\`\`\n\nPlease provide the corrected code and explain what was wrong.`;
      
      // Delay slightly to ensure panel has time to open
      setTimeout(() => {
        handleSend(prompt);
      }, 100);
    };

    window.addEventListener('ai-quick-fix', handleAIFix);
    return () => window.removeEventListener('ai-quick-fix', handleAIFix);
  }, [handleSend]);



  const getQuickActions = () => {
    const hasSelection = !!selectedText;
    const hasFile = !!getActiveTab();
    const selection = selectedText || '';
    
    const actions = [];
    
    if (hasSelection) {
      actions.push(
        { 
          icon: Code, 
          label: 'Explain', 
          prompt: AI_QUICK_ACTIONS.explain(selection) 
        },
        { 
          icon: Sparkles, 
          label: 'Refactor', 
          prompt: AI_QUICK_ACTIONS.refactor(selection) 
        },
        { 
          icon: Zap, 
          label: 'Find Bugs', 
          prompt: AI_QUICK_ACTIONS.debug(selection) 
        },
        {
          icon: AlertCircle,
          label: 'Security',
          prompt: AI_QUICK_ACTIONS.security(selection)
        }
      );
    } else if (hasFile) {
      actions.push(
        { icon: Code, label: 'Explain File', prompt: 'Explain the overall structure and purpose of this file' },
        { icon: Sparkles, label: 'Optimize', prompt: 'Suggest optimizations for the code in this file' },
        { icon: MessageSquare, label: 'Add Tests', prompt: 'Generate unit tests for the code in this file' }
      );
    } else {
      actions.push(
        { icon: Code, label: 'New Component', prompt: 'Create a new React component with TypeScript' },
        { icon: Sparkles, label: 'Debug Help', prompt: 'Help me debug an issue' }
      );
    }
    
    return actions.slice(0, 4);
  };



  const quickActions = getQuickActions();



  const { initializedProviders } = useAI();
  const currentApiKey = apiKeys[selectedProvider];
  const isKeySet = !!currentApiKey || initializedProviders.includes(selectedProvider);



  return (

    <div className="h-full flex flex-col bg-[#0a0a0f]">

      {/* Header */}

      <div className="px-3 py-2.5 border-b border-gray-800 flex items-center justify-between bg-[#0a0a0f]/95 backdrop-blur">

        <div className="flex items-center gap-2.5">

          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">

            <Bot size={15} className="text-white" />

          </div>

          <div>

            <h2 className="text-sm font-semibold text-gray-200">Morris AI</h2>

            <div className="flex items-center gap-1.5">

              <ProviderBadge provider={selectedProvider} />

              {isGenerating && (

                <span className="text-[10px] text-gray-500 animate-pulse">● streaming</span>

              )}

            </div>

          </div>

        </div>

        <div className="flex items-center gap-2">

          {getActiveTab() && (

            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-800 rounded border border-gray-700 text-[10px] text-gray-400">

              <Code size={10} />

              <span className="truncate max-w-[80px]">{getActiveTab()?.name}</span>

            </div>

          )}

          <div className="flex gap-1">

            <button

              onClick={() => setShowSettings(!showSettings)}

              className={`p-1.5 rounded-lg transition-colors ${

                showSettings ? 'bg-violet-500/20 text-violet-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'

              }`}

              title="Settings"

            >

              <Settings size={14} />

            </button>

            {messages.length > 0 && (

              <button

                onClick={() => {

                  if (confirm('Clear all messages?')) clearMessages();

                }}

                className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"

                title="Clear Chat"

              >

                <Trash2 size={14} />

              </button>

            )}

          </div>

        </div>

      </div>



      {/* Settings Panel */}

      {showSettings && (

        <div className="p-4 border-b border-gray-800 bg-gray-900/30 space-y-4 animate-in slide-in-from-top-2">

          {/* Provider Selection */}

          <div>

            <label className="text-xs font-medium text-gray-400 block mb-2">AI Provider</label>

            <div className="flex gap-2">

              {AI_PROVIDERS.map((provider) => (

                <button

                  key={provider.id}

                  onClick={() => {

                    setSelectedProvider(provider.id);

                    setProvider(provider.id);

                  }}

                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${

                    selectedProvider === provider.id

                      ? 'bg-violet-600 text-white'

                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'

                  }`}

                >

                  <div className="flex items-center justify-center gap-1.5">

                    {provider.id === 'groq' && <Zap size={12} />}

                    {provider.id === 'moonshot' && <Bot size={12} />}

                    {provider.id === 'openai' && <Sparkles size={12} />}

                    {provider.name}

                  </div>

                </button>

              ))}

            </div>

          </div>



          {/* API Key */}

          <div>

            <label className="text-xs font-medium text-gray-400 block mb-1.5">

              {selectedProvider === 'moonshot' ? 'Moonshot API Key' : 

               selectedProvider === 'groq' ? 'Groq API Key' : 'OpenAI API Key'}

            </label>

            <div className="flex gap-2">

              <input

                type="password"

                value={apiKeyInput}

                onChange={(e) => setApiKeyInput(e.target.value)}

                placeholder={currentApiKey ? '••••••••••••' : `Enter your ${selectedProvider} API key`}

                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"

              />

              <button

                onClick={handleSaveApiKey}

                disabled={!apiKeyInput.trim()}

                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"

              >

                Save

              </button>

            </div>

            {selectedProvider === 'moonshot' && (

              <p className="text-[10px] text-gray-500 mt-1">

                Get your key at <a href="https://platform.moonshot.cn" target="_blank" rel="noopener" className="text-violet-400 hover:underline">platform.moonshot.cn</a>

              </p>

            )}

            {selectedProvider === 'groq' && (

              <p className="text-[10px] text-gray-500 mt-1">

                Get your key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener" className="text-violet-400 hover:underline">console.groq.com/keys</a>

              </p>

            )}

            {selectedProvider === 'openai' && (

              <p className="text-[10px] text-gray-500 mt-1">

                Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-violet-400 hover:underline">platform.openai.com/api-keys</a>

              </p>

            )}

          </div>



          {/* Model Selection */}

          <div>

            <label className="text-xs font-medium text-gray-400 block mb-1.5">Model</label>

            <select

              value={settings.model}

              onChange={(e) => setModel(e.target.value as any)}

              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"

            >

              {AI_MODELS.filter(m => m.provider === selectedProvider).map((model) => (

                <option key={model.id} value={model.id}>{model.name}</option>

              ))}

            </select>

          </div>

        </div>

      )}



      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-5">
        {messages.length === 0 ? (

          <div className="h-full flex flex-col items-center justify-center text-gray-500">

            <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-5">

              <Bot size={32} className="text-gray-600" />

            </div>

            <h3 className="text-gray-300 font-medium mb-1">Morris AI</h3>

            <p className="text-sm text-gray-500 text-center max-w-[240px] mb-6">

              Ask me to explain, refactor, debug, or generate code. I can see your current file.

            </p>

            

            {/* Quick Actions */}

            <div className="flex flex-wrap justify-center gap-2 max-w-[320px]">

              {quickActions.map((action) => (

                <button

                  key={action.label}

                  onClick={() => {

                    setInput(action.prompt);

                    textareaRef.current?.focus();

                  }}

                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 rounded-full text-xs text-gray-300 transition-all hover:border-gray-600"

                >

                  <action.icon size={12} />

                  {action.label}

                </button>

              ))}

            </div>

          </div>

        ) : (

          <>

            {messages.map((msg) => (

              <MessageBubble key={msg.id} message={msg} />

            ))}

            {isGenerating && messages[messages.length - 1]?.role === 'user' && (

              <MessageBubble message={{

                id: 'typing',

                role: 'assistant',

                content: '',

                timestamp: Date.now(),

                isLoading: true,

              }} />

            )}

          </>

        )}

        <div ref={messagesEndRef} />

      </div>



      {/* Input Area */}

      <div className="p-3 border-t border-gray-800 bg-[#0a0a0f]">

        {!isKeySet && (

          <div className="mb-3 p-3 bg-yellow-900/15 border border-yellow-800/30 rounded-xl flex items-start gap-2.5">

            <AlertCircle size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />

            <div className="text-xs text-yellow-400/90">

              <p className="font-medium mb-0.5">API Key Required</p>

              <p className="text-yellow-500/70">

                Set your {selectedProvider === 'moonshot' ? 'Moonshot' : selectedProvider === 'openai' ? 'OpenAI' : 'Groq'} API key in settings or add it to your .env file.

              </p>

              <p className="text-yellow-500/50 mt-1">

                Get your key at {selectedProvider === 'moonshot' ? 'platform.moonshot.cn' : selectedProvider === 'openai' ? 'platform.openai.com/api-keys' : 'console.groq.com/keys'}

              </p>

            </div>

            <button

              onClick={() => setShowSettings(true)}

              className="flex-shrink-0 px-2.5 py-1 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg text-xs font-medium transition-colors"

            >

              Settings

            </button>

          </div>

        )}



        <div className="relative">

          <textarea

            ref={textareaRef}

            value={input}

            onChange={(e) => setInput(e.target.value)}

            onKeyDown={handleKeyDown}

            placeholder={isKeySet ? "Ask about your code... (Shift+Enter for new line)" : "Configure API key to start..."}

            rows={1}

            disabled={!isKeySet || isGenerating}

            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all placeholder:text-gray-600"

          />

          <button

            onClick={() => handleSend()}

            disabled={isGenerating || !input.trim() || !isKeySet}

            className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${

              input.trim() && isKeySet && !isGenerating

                ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-600/20'

                : 'bg-gray-800 text-gray-600 cursor-not-allowed'

            }`}

          >

            {isGenerating ? (

              <Loader2 size={16} className="animate-spin" />

            ) : (

              <Send size={16} />

            )}

          </button>

        </div>

        

        <div className="flex items-center justify-between mt-2 px-1">

          <div className="flex items-center gap-2">

            <span className="text-[10px] text-gray-600">

              {selectedProvider === 'moonshot' ? 'Powered by Kimi' : 'Powered by Groq'}

            </span>

          </div>

          <div className="flex items-center gap-1 text-[10px] text-gray-600">

            <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-500">Enter</kbd>

            <span>to send</span>

            <span className="mx-1">·</span>

            <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-500">Shift+Enter</kbd>

            <span>new line</span>

          </div>

        </div>

      </div>

    </div>

  );

}