// backend/agents/agent-orchestrator.ts
import type { 
  AgentRole, 
  AgentTask, 
  AgentOrchestration, 
  AgentSession,
  AgentWorkflowStep 
} from '../../types/agents';
import type { CodeContext } from '../../types/ai';
import { generateAIResponse, generateAIResponseStream } from '../ai';
import { PromptBuilder, type PromptBuildContext } from './prompt-builder';
import { DEFAULT_AGENTS } from './agent-definitions';
import { logger } from '../../utils/logger';

export interface OrchestratorConfig {
  maxConcurrentTasks: number;
  defaultTimeout: number;
  enableCollaboration: boolean;
  enableLearning: boolean;
  retryAttempts: number;
  retryDelay: number;
}

export class AgentOrchestrator {
  private agents: Map<string, AgentRole> = new Map();
  private sessions: Map<string, AgentSession> = new Map();
  private activeTasks: Map<string, AgentTask> = new Map();
  private config: OrchestratorConfig;
  
  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = {
      maxConcurrentTasks: 5,
      defaultTimeout: 30000, // 30 seconds
      enableCollaboration: true,
      enableLearning: true,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
    
    // Initialize default agents
    this.initializeDefaultAgents();
  }
  
  /**
   * Initialize default agents
   */
  private initializeDefaultAgents(): void {
    DEFAULT_AGENTS.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }
  
  /**
   * Register a new agent
   */
  registerAgent(agent: AgentRole): void {
    this.agents.set(agent.id, agent);
    logger.info(`Agent registered: ${agent.name} (${agent.id})`, 'AgentOrchestrator');
  }
  
  /**
   * Get all available agents
   */
  getAvailableAgents(): AgentRole[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentRole | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Create a new agent session
   */
  createSession(name: string, agentIds: string[] = []): AgentSession {
    const sessionId = this.generateId();
    const sessionAgents = agentIds.length > 0 
      ? agentIds.map(id => this.agents.get(id)).filter(Boolean) as AgentRole[]
      : this.getAvailableAgents();
    
    const session: AgentSession = {
      id: sessionId,
      name,
      agents: sessionAgents,
      orchestrations: [],
      tasks: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.sessions.set(sessionId, session);
    logger.info(`Session created: ${name} (${sessionId})`, 'AgentOrchestrator');
    
    return session;
  }
  
  /**
   * Execute a single agent task
   */
  async executeTask(
    agentId: string,
    task: string,
    codeContext?: CodeContext,
    metadata?: Record<string, any>
  ): Promise<AgentTask> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    const taskObj: AgentTask = {
      id: this.generateId(),
      type: 'single-agent',
      description: task,
      priority: 'medium',
      status: 'pending',
      assignedAgent: agentId,
      input: {
        prompt: task,
        codeContext,
        metadata
      },
      createdAt: Date.now()
    };
    
    this.activeTasks.set(taskObj.id, taskObj);
    
    try {
      taskObj.status = 'running';
      taskObj.startedAt = Date.now();
      
      const promptContext: PromptBuildContext = {
        agent,
        task,
        codeContext,
        metadata
      };
      
      const prompt = PromptBuilder.buildPrompt(promptContext);
      
      // Execute the task using the AI backend
      const response = await generateAIResponse(prompt, codeContext, {
        provider: agent.preferredProvider || 'moonshot',
        model: 'kimi-k2-6',
        temperature: agent.temperature || 0.3,
        maxTokens: agent.maxContextTokens || 8192
      });
      
      taskObj.status = 'completed';
      taskObj.completedAt = Date.now();
      taskObj.output = {
        content: response.content,
        tokens: response.usage?.totalTokens,
        latency: response.latencyMs,
        error: response.error
      };
      
      logger.info(`Task completed: ${taskObj.id}`, 'AgentOrchestrator', {
        agent: agent.name,
        duration: taskObj.completedAt - taskObj.startedAt,
        tokens: taskObj.output.tokens
      });
      
    } catch (error) {
      taskObj.status = 'failed';
      taskObj.completedAt = Date.now();
      taskObj.output = {
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      logger.error(`Task failed: ${taskObj.id}`, 'AgentOrchestrator', { error });
    }
    
    return taskObj;
  }
  
  /**
   * Execute a collaborative task with multiple agents
   */
  async executeCollaborativeTask(
    agentIds: string[],
    task: string,
    codeContext?: CodeContext,
    metadata?: Record<string, any>
  ): Promise<AgentTask[]> {
    const agents = agentIds.map(id => this.agents.get(id)).filter(Boolean) as AgentRole[];
    
    if (agents.length === 0) {
      throw new Error('No valid agents provided for collaborative task');
    }
    
    const tasks: AgentTask[] = [];
    const results: string[] = [];
    
    // Execute agents in sequence, building on previous results
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const previousResults = results.join('\n\n--- Previous Agent Results ---\n\n');
      
      const enhancedTask = i === 0 ? task : `${task}

Previous agent results:
${previousResults}

Please build upon the previous results while adding your unique expertise from your role as ${agent.name}.`;
      
      const taskMetadata = {
        ...metadata,
        collaborativeIndex: i,
        totalAgents: agents.length,
        previousResults: i > 0 ? results : undefined
      };
      
      const agentTask = await this.executeTask(agent.id, enhancedTask, codeContext, taskMetadata);
      tasks.push(agentTask);
      
      if (agentTask.output?.content && !agentTask.output.error) {
        results.push(`**${agent.name}**: ${agentTask.output.content}`);
      }
    }
    
    return tasks;
  }
  
  /**
   * Execute an orchestrated workflow
   */
  async executeOrchestration(
    orchestration: AgentOrchestration,
    task: string,
    codeContext?: CodeContext,
    metadata?: Record<string, any>
  ): Promise<AgentTask[]> {
    const tasks: AgentTask[] = [];
    const completedSteps = new Map<string, AgentTask>();
    const stepResults = new Map<string, string>();
    
    // Execute workflow steps
    for (const step of orchestration.workflow) {
      // Check dependencies
      const dependenciesMet = step.dependencies.every(depId => completedSteps.has(depId));
      
      if (!dependenciesMet) {
        throw new Error(`Dependencies not met for step: ${step.id}`);
      }
      
      // Build context from dependencies
      let context = '';
      if (step.dependencies.length > 0) {
        context = 'Previous step results:\n';
        step.dependencies.forEach(depId => {
          const result = stepResults.get(depId);
          if (result) {
            context += `- ${result}\n`;
          }
        });
      }
      
      const enhancedTask = context ? `${task}\n\n${context}` : task;
      
      const stepMetadata = {
        ...metadata,
        workflowStep: step.id,
        dependencies: step.dependencies,
        parallel: step.parallel
      };
      
      try {
        const taskObj = await this.executeTask(
          step.agentId,
          enhancedTask,
          codeContext,
          stepMetadata
        );
        
        tasks.push(taskObj);
        completedSteps.set(step.id, taskObj);
        
        if (taskObj.output?.content && !taskObj.output.error) {
          stepResults.set(step.id, taskObj.output.content);
        }
        
      } catch (error) {
        logger.error(`Workflow step failed: ${step.id}`, 'AgentOrchestrator', { error });
        throw error;
      }
    }
    
    return tasks;
  }
  
  /**
   * Execute streaming task
   */
  async executeTaskStream(
    agentId: string,
    task: string,
    codeContext?: CodeContext,
    metadata?: Record<string, any>,
    onChunk?: (chunk: string) => void
  ): Promise<AgentTask> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    const taskObj: AgentTask = {
      id: this.generateId(),
      type: 'single-agent-stream',
      description: task,
      priority: 'medium',
      status: 'running',
      assignedAgent: agentId,
      input: {
        prompt: task,
        codeContext,
        metadata
      },
      createdAt: Date.now(),
      startedAt: Date.now()
    };
    
    this.activeTasks.set(taskObj.id, taskObj);
    
    try {
      const promptContext: PromptBuildContext = {
        agent,
        task,
        codeContext,
        metadata
      };
      
      const prompt = PromptBuilder.buildPrompt(promptContext);
      
      let fullContent = '';
      
      // Execute streaming
      const stream = generateAIResponseStream(prompt, codeContext, {
        provider: agent.preferredProvider || 'moonshot',
        model: 'kimi-k2-6',
        temperature: agent.temperature || 0.3,
        maxTokens: agent.maxContextTokens || 8192
      });
      
      for await (const chunk of stream) {
        fullContent += chunk;
        onChunk?.(chunk);
      }
      
      taskObj.status = 'completed';
      taskObj.completedAt = Date.now();
      taskObj.output = {
        content: fullContent
      };
      
    } catch (error) {
      taskObj.status = 'failed';
      taskObj.completedAt = Date.now();
      taskObj.output = {
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      logger.error(`Streaming task failed: ${taskObj.id}`, 'AgentOrchestrator', { error });
    }
    
    return taskObj;
  }
  
  /**
   * Get task by ID
   */
  getTask(taskId: string): AgentTask | undefined {
    return this.activeTasks.get(taskId);
  }
  
  /**
   * Get all active tasks
   */
  getActiveTasks(): AgentTask[] {
    return Array.from(this.activeTasks.values()).filter(task => task.status === 'running');
  }
  
  /**
   * Cancel a task
   */
  cancelTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (task && task.status === 'running') {
      task.status = 'cancelled';
      task.completedAt = Date.now();
      logger.info(`Task cancelled: ${taskId}`, 'AgentOrchestrator');
      return true;
    }
    return false;
  }
  
  /**
   * Get session by ID
   */
  getSession(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Get all sessions
   */
  getSessions(): AgentSession[] {
    return Array.from(this.sessions.values());
  }
  
  /**
   * Create predefined orchestrations
   */
  createPredefinedOrchestrations(): AgentOrchestration[] {
    return [
      {
        id: 'full-stack-development',
        name: 'Full Stack Development',
        description: 'Complete feature development from planning to testing',
        agents: ['code-architect', 'senior-developer', 'test-engineer'],
        workflow: [
          {
            id: 'plan',
            agentId: 'code-architect',
            task: 'Plan the architecture and implementation approach',
            dependencies: [],
            parallel: false
          },
          {
            id: 'implement',
            agentId: 'senior-developer',
            task: 'Implement the feature based on the architectural plan',
            dependencies: ['plan'],
            parallel: false
          },
          {
            id: 'test',
            agentId: 'test-engineer',
            task: 'Create comprehensive tests for the implemented feature',
            dependencies: ['implement'],
            parallel: false
          }
        ],
        enabled: true
      },
      
      {
        id: 'bug-fix-workflow',
        name: 'Bug Fix Workflow',
        description: 'Systematic approach to identifying and fixing bugs',
        agents: ['debug-specialist', 'senior-developer', 'test-engineer'],
        workflow: [
          {
            id: 'analyze',
            agentId: 'debug-specialist',
            task: 'Analyze the bug and identify root causes',
            dependencies: [],
            parallel: false
          },
          {
            id: 'fix',
            agentId: 'senior-developer',
            task: 'Implement the bug fix based on analysis',
            dependencies: ['analyze'],
            parallel: false
          },
          {
            id: 'verify',
            agentId: 'test-engineer',
            task: 'Create tests to verify the fix and prevent regression',
            dependencies: ['fix'],
            parallel: false
          }
        ],
        enabled: true
      },
      
      {
        id: 'security-audit',
        name: 'Security Audit',
        description: 'Comprehensive security analysis and hardening',
        agents: ['security-expert', 'senior-developer'],
        workflow: [
          {
            id: 'audit',
            agentId: 'security-expert',
            task: 'Perform security audit and identify vulnerabilities',
            dependencies: [],
            parallel: false
          },
          {
            id: 'harden',
            agentId: 'senior-developer',
            task: 'Implement security fixes and hardening measures',
            dependencies: ['audit'],
            parallel: false
          }
        ],
        enabled: true
      },
      
      {
        id: 'performance-optimization',
        name: 'Performance Optimization',
        description: 'Analyze and optimize performance bottlenecks',
        agents: ['performance-optimizer', 'senior-developer'],
        workflow: [
          {
            id: 'analyze',
            agentId: 'performance-optimizer',
            task: 'Analyze performance bottlenecks and optimization opportunities',
            dependencies: [],
            parallel: false
          },
          {
            id: 'optimize',
            agentId: 'senior-developer',
            task: 'Implement performance optimizations',
            dependencies: ['analyze'],
            parallel: false
          }
        ],
        enabled: true
      }
    ];
  }
  
  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get orchestrator statistics
   */
  getStatistics(): {
    totalAgents: number;
    totalSessions: number;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
  } {
    const allTasks = Array.from(this.activeTasks.values());
    
    return {
      totalAgents: this.agents.size,
      totalSessions: this.sessions.size,
      activeTasks: allTasks.filter(t => t.status === 'running').length,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      failedTasks: allTasks.filter(t => t.status === 'failed').length
    };
  }
}

// Global orchestrator instance
export const agentOrchestrator = new AgentOrchestrator();
