// types/agents.ts
import type { AIProvider, CodeContext } from './ai';

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: 'code' | 'analysis' | 'planning' | 'debugging' | 'optimization' | 'security' | 'testing';
  enabled: boolean;
}

export interface AgentPrompt {
  system: string;
  context?: string;
  task?: string;
  constraints?: string[];
  examples?: string[];
}

export interface AgentRole {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  capabilities: AgentCapability[];
  prompts: AgentPrompt;
  preferredProvider?: AIProvider;
  maxContextTokens?: number;
  temperature?: number;
}

export interface AgentTask {
  id: string;
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  assignedAgent?: string;
  input: {
    prompt: string;
    codeContext?: CodeContext;
    metadata?: Record<string, any>;
  };
  output?: {
    content: string;
    tokens?: number;
    latency?: number;
    error?: string;
  };
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface AgentOrchestration {
  id: string;
  name: string;
  description: string;
  agents: string[]; // Agent IDs
  workflow: AgentWorkflowStep[];
  enabled: boolean;
}

export interface AgentWorkflowStep {
  id: string;
  agentId: string;
  task: string;
  dependencies: string[]; // Step IDs that must complete first
  parallel: boolean;
  timeout?: number; // milliseconds
}

export interface AgentSession {
  id: string;
  name: string;
  agents: AgentRole[];
  orchestrations: AgentOrchestration[];
  tasks: AgentTask[];
  activeTask?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AgentConfig {
  defaultAgents: AgentRole[];
  orchestrations: AgentOrchestration[];
  globalSettings: {
    maxConcurrentTasks: number;
    defaultTimeout: number;
    enableCollaboration: boolean;
    enableLearning: boolean;
  };
}

// Agent Categories
export const AGENT_CATEGORIES = {
  CODE: 'code',
  ANALYSIS: 'analysis', 
  PLANNING: 'planning',
  DEBUGGING: 'debugging',
  OPTIMIZATION: 'optimization',
  SECURITY: 'security',
  TESTING: 'testing'
} as const;

// Agent Status
export const AGENT_STATUS = {
  IDLE: 'idle',
  BUSY: 'busy',
  ERROR: 'error',
  OFFLINE: 'offline'
} as const;

// Task Status
export const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;
