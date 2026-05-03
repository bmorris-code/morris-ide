// hooks/useAgents.ts
import { useState, useEffect, useCallback } from 'react';
import type { AgentRole, AgentTask, AgentSession } from '../types/agents';
import { agentOrchestrator } from '../backend/agents';
import type { CodeContext } from '../types/ai';

export interface UseAgentsReturn {
  agents: AgentRole[];
  tasks: AgentTask[];
  sessions: AgentSession[];
  activeTasks: AgentTask[];
  loading: boolean;
  error: string | null;
  
  // Actions
  executeTask: (agentId: string, task: string, codeContext?: CodeContext) => Promise<AgentTask>;
  executeCollaborativeTask: (agentIds: string[], task: string, codeContext?: CodeContext) => Promise<AgentTask[]>;
  createSession: (name: string, agentIds?: string[]) => AgentSession;
  cancelTask: (taskId: string) => boolean;
  refresh: () => void;
  
  // Statistics
  statistics: {
    totalAgents: number;
    totalSessions: number;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
  };
}

export function useAgents(): UseAgentsReturn {
  const [agents, setAgents] = useState<AgentRole[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    try {
      setAgents(agentOrchestrator.getAvailableAgents());
      setTasks(Array.from(agentOrchestrator['activeTasks'].values()));
      setSessions(agentOrchestrator.getSessions());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and refresh interval
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [refresh]);

  const executeTask = useCallback(async (
    agentId: string,
    task: string,
    codeContext?: CodeContext
  ): Promise<AgentTask> => {
    try {
      const result = await agentOrchestrator.executeTask(agentId, task, codeContext);
      refresh(); // Refresh data after task completion
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Task execution failed');
      throw err;
    }
  }, [refresh]);

  const executeCollaborativeTask = useCallback(async (
    agentIds: string[],
    task: string,
    codeContext?: CodeContext
  ): Promise<AgentTask[]> => {
    try {
      const results = await agentOrchestrator.executeCollaborativeTask(agentIds, task, codeContext);
      refresh(); // Refresh data after task completion
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Collaborative task execution failed');
      throw err;
    }
  }, [refresh]);

  const createSession = useCallback((name: string, agentIds?: string[]): AgentSession => {
    try {
      const session = agentOrchestrator.createSession(name, agentIds);
      refresh(); // Refresh data after session creation
      return session;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session creation failed');
      throw err;
    }
  }, [refresh]);

  const cancelTask = useCallback((taskId: string): boolean => {
    try {
      const result = agentOrchestrator.cancelTask(taskId);
      refresh(); // Refresh data after cancellation
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Task cancellation failed');
      return false;
    }
  }, [refresh]);

  const activeTasks = tasks.filter(task => task.status === 'running');
  
  const statistics = agentOrchestrator.getStatistics();

  return {
    agents,
    tasks,
    sessions,
    activeTasks,
    loading,
    error,
    executeTask,
    executeCollaborativeTask,
    createSession,
    cancelTask,
    refresh,
    statistics
  };
}
