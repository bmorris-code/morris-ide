import React, { useState, useRef } from 'react';
import { Bot, AlertCircle, CheckCircle, Play, Pause, RotateCcw } from 'lucide-react';
import { useAIStore } from '../../store';
import { useEditorStore, useTerminalStore } from '../../store';
import { useElectron } from '../../hooks';
import { 
  generateAIResponseStream
} from '../../backend/ai';
import { 
  executeTool, 
  getToolsSchema,
  type AgentContext,
  type ToolResult
} from '../../backend/ai/agent-tools';

interface AgentExecution {
  id: string;
  command: string;
  status: 'running' | 'completed' | 'error';
  result?: ToolResult;
  timestamp: number;
}

interface ParsedToolCall {
  tool: string;
  args: Record<string, unknown>;
}

export default function AgentMode() {
  const [input, setInput] = useState('');
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { settings, apiKeys } = useAIStore();
  const editorStore = useEditorStore();
  const terminalStore = useTerminalStore();
  const electron = useElectron();

  // Agent context for tool execution
  const agentContext: AgentContext = {
    electron,
    editorStore
  };

  // Parse and execute agent commands
  const executeAgentCommand = async (command: string) => {
    const executionId = `agent_${Date.now()}`;
    
    setExecutions(prev => [...prev, {
      id: executionId,
      command,
      status: 'running',
      timestamp: Date.now()
    }]);

    setIsProcessing(true);

    try {
      // Parse command with regex for tool calls
      const toolCallRegex = /(\w+)\(([^)]*)\)/g;
      const toolCalls: ParsedToolCall[] = [];
      let match;

      while ((match = toolCallRegex.exec(command)) !== null) {
        const [, toolName, argsString] = match;
        
        // Parse arguments
        let args: Record<string, unknown> = {};
        if (argsString.trim()) {
          try {
            // Try parsing as JSON first
            args = JSON.parse(`{${argsString}}`);
          } catch {
            // Fallback to simple key=value parsing
            const pairs = argsString.split(',').map(s => s.trim());
            args = {};
            pairs.forEach(pair => {
              const [key, ...valueParts] = pair.split('=');
              if (key && valueParts.length) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                args[key.trim()] = value;
              }
            });
          }
        }
        
        toolCalls.push({ tool: toolName, args });
      }

      // If no tool calls found, treat as regular AI chat with tool context
      if (toolCalls.length === 0) {
        await handleRegularChat(command, executionId);
      } else {
        await handleToolExecution(toolCalls, executionId);
      }
    } catch (error) {
      setExecutions(prev => prev.map(exec => 
        exec.id === executionId 
          ? { ...exec, status: 'error', result: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } }
          : exec
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle regular AI chat with tool awareness
  const handleRegularChat = async (command: string, executionId: string) => {
    const toolsSchema = getToolsSchema();
    const systemPrompt = `You are Kimi K2.6 Agent Mode. You have access to these tools:

${toolsSchema.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

When the user asks for something that requires a tool, format your response with tool calls like:
read_file(path="src/App.tsx")
execute_command(command="npm install", cwd=".")
open_file_in_editor(path="src/components/Header.tsx")

If you don't need tools, just respond normally.`;

    // Get current file context
    const activeTab = editorStore.getActiveTab();
    const codeContext = activeTab ? {
      filePath: activeTab.path,
      fileName: activeTab.name,
      language: activeTab.language,
      fullCode: activeTab.content,
      selectedText: editorStore.selectedText,
    } : undefined;

    try {
      const stream = generateAIResponseStream(command, codeContext, {
        ...settings,
        systemPrompt
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        
        // Check if response contains tool calls
        const toolCallRegex = /(\w+)\(([^)]*)\)/g;
        const toolCalls: ParsedToolCall[] = [];
        let match;

        while ((match = toolCallRegex.exec(fullResponse)) !== null) {
          const [, toolName, argsString] = match;
          
          try {
            let args: Record<string, unknown> = {};
            if (argsString.trim()) {
              args = JSON.parse(`{${argsString}}`);
            }
            toolCalls.push({ tool: toolName, args });
          } catch {
            // Skip invalid tool calls
          }
        }

        // If we found tool calls, execute them
        if (toolCalls.length > 0) {
          await handleToolExecution(toolCalls, executionId);
          return;
        }
      }

      // No tool calls, just regular response
      setExecutions(prev => prev.map(exec => 
        exec.id === executionId 
          ? { ...exec, status: 'completed', result: { success: true, result: { response: fullResponse } } }
          : exec
      ));
    } catch (error) {
      setExecutions(prev => prev.map(exec => 
        exec.id === executionId 
          ? { ...exec, status: 'error', result: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } }
          : exec
      ));
    }
  };

  // Handle direct tool execution
  const handleToolExecution = async (toolCalls: ParsedToolCall[], executionId: string) => {
    const results: Array<{ tool: string; args: Record<string, unknown>; result: ToolResult }> = [];
    
    for (const { tool: toolName, args } of toolCalls) {
      const result = await executeTool(toolName, args, agentContext);
      results.push({ tool: toolName, args, result });
      
      // Add to terminal for visibility
      if (result.success) {
        terminalStore.addLine('system', `✅ ${toolName}: ${JSON.stringify(result.result)}`);
      } else {
        terminalStore.addLine('error', `❌ ${toolName}: ${result.error}`);
      }
    }

    setExecutions(prev => prev.map(exec => 
      exec.id === executionId 
        ? { ...exec, status: 'completed', result: { success: true, result: { toolResults: results } } }
        : exec
    ));
  };

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    
    const command = input.trim();
    setInput('');
    executeAgentCommand(command);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearExecutions = () => {
    setExecutions([]);
  };

  const isProviderReady = () => {
    const provider = settings.provider;
    const apiKey = apiKeys[provider];
    return !!apiKey;
  };

  if (!isAgentMode) {
    return (
      <button
        onClick={() => setIsAgentMode(true)}
        disabled={!isProviderReady()}
        className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
      >
        <Bot size={14} />
        Agent Mode
      </button>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Bot size={12} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-violet-400">Kimi Agent Mode</span>
          {isProcessing && (
            <div className="flex items-center gap-1 text-yellow-400">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              Processing
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={clearExecutions}
            className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-red-400"
            title="Clear History"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={() => setIsAgentMode(false)}
            className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
            title="Exit Agent Mode"
          >
            ×
          </button>
        </div>
      </div>

      {/* Available Tools */}
      <div className="px-3 py-2 border-b border-gray-800">
        <div className="text-xs text-gray-400 mb-1">Available Tools:</div>
        <div className="flex flex-wrap gap-1">
          {['read_file', 'write_file', 'open_file_in_editor', 'execute_command', 'run_npm_command', 'analyze_project_structure'].map(tool => (
            <span key={tool} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs">
              {tool}()
            </span>
          ))}
        </div>
      </div>

      {/* Executions History */}
      <div className="flex-1 overflow-y-auto p-3">
        {executions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm mb-2">Agent Mode Ready</p>
            <p className="text-xs">Use tools like: read_file("src/App.tsx") or execute_command("npm install")</p>
          </div>
        ) : (
          <div className="space-y-3">
            {executions.map((exec) => (
              <div key={exec.id} className="p-3 bg-gray-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {exec.status === 'running' && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />}
                    {exec.status === 'completed' && <CheckCircle size={14} className="text-green-400" />}
                    {exec.status === 'error' && <AlertCircle size={14} className="text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-gray-300 break-all">
                      {exec.command}
                    </div>
                    {exec.result && (
                      <div className="mt-2 text-xs">
                        {exec.result.success ? (
                          <div className="text-green-400">
                            {exec.result.result?.response && (
                              <div className="mb-1">{exec.result.result.response}</div>
                            )}
                            {exec.result.result?.toolResults && (
                              <div className="space-y-1">
                                {exec.result.result.toolResults.map((toolResult: any, i: number) => (
                                  <div key={i} className="text-gray-400">
                                    <span className="text-violet-400">{toolResult.tool}:</span> {JSON.stringify(toolResult.result)}
                                  </div>
                                ))}
                              </div>
                            )}
                            {exec.result.result?.message && (
                              <div>{exec.result.result.message}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-red-400">{exec.result.error}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-800">
        {!isProviderReady() && (
          <div className="mb-2 p-2 bg-yellow-900/15 border border-yellow-800/30 rounded text-xs text-yellow-400">
            Set API key in settings to use Agent Mode
          </div>
        )}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isProviderReady() ? "Enter command or ask question..." : "Configure API key to start..."}
            rows={2}
            disabled={!isProviderReady() || isProcessing}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing || !isProviderReady()}
            className={`absolute right-2 bottom-2 p-1.5 rounded-lg transition-all ${
              input.trim() && !isProcessing && isProviderReady()
                ? 'bg-violet-600 text-white hover:bg-violet-500'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Try: <code className="bg-gray-800 px-1 rounded">read_file("package.json")</code> or <code className="bg-gray-800 px-1 rounded">execute_command("npm test")</code>
        </div>
      </div>
    </div>
  );
}
