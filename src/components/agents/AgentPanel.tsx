// components/agents/AgentPanel.tsx
import { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Users, 
  Play, 
  Square, 
  Settings, 
  MessageSquare, 
  Code, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock,
  ChevronRight,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import type { AgentRole, AgentTask, AgentSession, AgentOrchestration } from '../../types/agents';
import { agentOrchestrator, type OrchestratorConfig } from '../../backend/agents/agent-orchestrator';
import { useEditorStore } from '../../store';

interface AgentPanelProps {
  onTaskComplete?: (task: AgentTask) => void;
}

export default function AgentPanel({ onTaskComplete }: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState<'agents' | 'tasks' | 'sessions' | 'orchestrations'>('agents');
  const [agents, setAgents] = useState<AgentRole[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [orchestrations, setOrchestrations] = useState<AgentOrchestration[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<OrchestratorConfig>(agentOrchestrator['config']);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { getActiveTab, selectedText } = useEditorStore();

  // Load data on mount
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tasks]);

  const loadData = () => {
    setAgents(agentOrchestrator.getAvailableAgents());
    setTasks(Array.from(agentOrchestrator['activeTasks'].values()));
    setSessions(agentOrchestrator.getSessions());
    setOrchestrations(agentOrchestrator.createPredefinedOrchestrations());
  };

  const handleExecuteTask = async (agentIds: string[], task: string) => {
    if (!task.trim() || isExecuting) return;
    
    setIsExecuting(true);
    setTaskInput('');
    
    const activeTab = getActiveTab();
    const codeContext = activeTab ? {
      filePath: activeTab.path,
      fileName: activeTab.name,
      language: activeTab.language,
      fullCode: activeTab.content,
      selectedCode: selectedText || undefined,
    } : undefined;

    try {
      if (agentIds.length === 1) {
        // Single agent task
        const taskResult = await agentOrchestrator.executeTask(
          agentIds[0],
          task,
          codeContext
        );
        onTaskComplete?.(taskResult);
      } else {
        // Collaborative task
        const taskResults = await agentOrchestrator.executeCollaborativeTask(
          agentIds,
          task,
          codeContext
        );
        taskResults.forEach(result => onTaskComplete?.(result));
      }
      
      loadData();
    } catch (error) {
      console.error('Task execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCreateSession = () => {
    const sessionName = prompt('Enter session name:');
    if (sessionName) {
      agentOrchestrator.createSession(sessionName, selectedAgents);
      loadData();
    }
  };

  const handleExecuteOrchestration = async (orchestration: AgentOrchestration) => {
    if (!taskInput.trim() || isExecuting) return;
    
    setIsExecuting(true);
    setTaskInput('');
    
    const activeTab = getActiveTab();
    const codeContext = activeTab ? {
      filePath: activeTab.path,
      fileName: activeTab.name,
      language: activeTab.language,
      fullCode: activeTab.content,
      selectedCode: selectedText || undefined,
    } : undefined;

    try {
      const taskResults = await agentOrchestrator.executeOrchestration(
        orchestration,
        taskInput,
        codeContext
      );
      
      taskResults.forEach(result => onTaskComplete?.(result));
      loadData();
    } catch (error) {
      console.error('Orchestration execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'failed':
        return <XCircle size={16} className="text-red-400" />;
      case 'running':
        return <Clock size={16} className="text-blue-400 animate-spin" />;
      case 'cancelled':
        return <Square size={16} className="text-gray-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'running':
        return 'text-blue-400';
      case 'cancelled':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  // Agents Tab
  const renderAgents = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`p-4 rounded-lg border transition-all cursor-pointer ${
              selectedAgents.includes(agent.id)
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
            onClick={() => {
              setSelectedAgents(prev => 
                prev.includes(agent.id)
                  ? prev.filter(id => id !== agent.id)
                  : [...prev, agent.id]
              );
            }}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{agent.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-200 flex items-center gap-2">
                  {agent.name}
                  {selectedAgents.includes(agent.id) && (
                    <CheckCircle size={16} className="text-violet-400" />
                  )}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{agent.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {agent.capabilities.slice(0, 3).map((cap) => (
                    <span
                      key={cap.id}
                      className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                    >
                      {cap.name}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-400">
                      +{agent.capabilities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Tasks Tab
  const renderTasks = () => (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Bot size={48} className="mx-auto mb-4 opacity-50" />
          <p>No tasks executed yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(task.status)}
                    <span className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    {task.assignedAgent && (
                      <span className="text-xs text-gray-400">
                        via {agents.find(a => a.id === task.assignedAgent)?.name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-200 mb-2">{task.description}</p>
                  {task.output?.content && (
                    <div className="mt-3 p-3 bg-gray-900 rounded border border-gray-700">
                      <p className="text-xs text-gray-300 whitespace-pre-wrap">
                        {task.output.content.length > 200
                          ? task.output.content.substring(0, 200) + '...'
                          : task.output.content
                        }
                      </p>
                    </div>
                  )}
                  {task.output?.error && (
                    <div className="mt-3 p-3 bg-red-900/20 rounded border border-red-800/50">
                      <p className="text-xs text-red-400">{task.output.error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Sessions Tab
  const renderSessions = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-200">Active Sessions</h3>
        <button
          onClick={handleCreateSession}
          className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm transition-colors"
        >
          <Plus size={14} />
          New Session
        </button>
      </div>
      
      {sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p>No sessions created yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-200">{session.name}</h4>
                  <p className="text-sm text-gray-400">
                    {session.agents.length} agents • {session.tasks.length} tasks
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Orchestrations Tab
  const renderOrchestrations = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {orchestrations.map((orchestration) => (
          <div key={orchestration.id} className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-200">{orchestration.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{orchestration.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  orchestration.enabled
                    ? 'bg-green-900/30 text-green-400 border border-green-800/50'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {orchestration.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Workflow:</p>
              <div className="space-y-1">
                {orchestration.workflow.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">
                      {index + 1}
                    </div>
                    <span className="text-gray-300">
                      {agents.find(a => a.id === step.agentId)?.name || step.agentId}
                    </span>
                    <ChevronRight size={12} className="text-gray-500" />
                    <span className="text-gray-400">{step.task}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => handleExecuteOrchestration(orchestration)}
              disabled={!taskInput.trim() || isExecuting}
              className="w-full px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isExecuting ? (
                <>
                  <Clock size={14} className="animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Execute Workflow
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Users size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-200">Agent Harness</h2>
            <p className="text-xs text-gray-500">
              {agents.length} agents • {tasks.filter(t => t.status === 'running').length} running
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors ${
              showSettings ? 'bg-violet-500/20 text-violet-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
            title="Settings"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-800 bg-gray-900/30 space-y-4">
          <h3 className="text-sm font-medium text-gray-200">Orchestrator Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Max Concurrent Tasks</label>
              <input
                type="number"
                value={config.maxConcurrentTasks}
                onChange={(e) => setConfig(prev => ({ ...prev, maxConcurrentTasks: parseInt(e.target.value) || 1 }))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Timeout (ms)</label>
              <input
                type="number"
                value={config.defaultTimeout}
                onChange={(e) => setConfig(prev => ({ ...prev, defaultTimeout: parseInt(e.target.value) || 30000 }))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                min="5000"
                step="5000"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {[
          { id: 'agents', label: 'Agents', icon: Bot },
          { id: 'tasks', label: 'Tasks', icon: MessageSquare },
          { id: 'sessions', label: 'Sessions', icon: Users },
          { id: 'orchestrations', label: 'Workflows', icon: Zap }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'agents' && renderAgents()}
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'sessions' && renderSessions()}
        {activeTab === 'orchestrations' && renderOrchestrations()}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800">
        <div className="space-y-3">
          <textarea
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="Describe the task for the selected agents..."
            rows={2}
            disabled={isExecuting}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-violet-500 disabled:opacity-50"
          />
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExecuteTask(selectedAgents, taskInput)}
              disabled={!taskInput.trim() || selectedAgents.length === 0 || isExecuting}
              className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isExecuting ? (
                <>
                  <Clock size={14} className="animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Execute Task
                </>
              )}
            </button>
            
            {selectedAgents.length > 0 && (
              <span className="text-xs text-gray-400">
                {selectedAgents.length} agent{selectedAgents.length > 1 ? 's' : ''} selected
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
