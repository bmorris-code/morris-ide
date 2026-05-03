# AI Agent Harness Documentation

## Overview

The AI Agent Harness is a sophisticated system that provides specialized AI agents with detailed prompts and orchestration capabilities. It integrates seamlessly with Morris IDE's existing AI infrastructure to provide intelligent code assistance, debugging, security analysis, and more.

## Architecture

### Core Components

1. **Agent Types** (`src/types/agents.ts`)
   - Defines agent roles, capabilities, and interfaces
   - Supports task management and orchestration workflows

2. **Agent Definitions** (`src/backend/agents/agent-definitions.ts`)
   - Pre-configured specialized agents with detailed prompts
   - Each agent has specific expertise and capabilities

3. **Prompt Builder** (`src/backend/agents/prompt-builder.ts`)
   - Context-aware prompt generation
   - Supports collaborative and workflow-based prompts

4. **Agent Orchestrator** (`src/backend/agents/agent-orchestrator.ts`)
   - Manages agent execution and coordination
   - Handles single-agent, collaborative, and workflow tasks

5. **UI Components** (`src/components/agents/AgentPanel.tsx`)
   - User interface for agent management and interaction
   - Real-time task monitoring and results display

## Available Agents

### 1. Senior Developer 👨‍💻
- **Expertise**: Full-stack development, architecture, best practices
- **Capabilities**: Code generation, refactoring, analysis, planning, debugging, optimization
- **Preferred Provider**: Moonshot (Kimi K2.6)
- **Context Window**: 2M tokens

### 2. Code Architect 🏗️
- **Expertise**: System design, architecture patterns, technical planning
- **Capabilities**: Architecture planning, dependency analysis, feature planning
- **Preferred Provider**: Moonshot (Kimi K2.6)
- **Context Window**: 2M tokens

### 3. Debug Specialist 🔍
- **Expertise**: Problem-solving, root cause analysis, systematic debugging
- **Capabilities**: Bug detection, error analysis, debugging guidance
- **Preferred Provider**: Groq
- **Context Window**: 128K tokens

### 4. Security Expert 🛡️
- **Expertise**: Application security, threat modeling, secure coding
- **Capabilities**: Security audit, vulnerability detection, security hardening
- **Preferred Provider**: OpenAI
- **Context Window**: 128K tokens

### 5. Performance Optimizer ⚡
- **Expertise**: Performance analysis, optimization, scalability
- **Capabilities**: Performance optimization, memory optimization, algorithm optimization
- **Preferred Provider**: Groq
- **Context Window**: 128K tokens

### 6. Test Engineer 🧪
- **Expertise**: Test strategy, automation, quality assurance
- **Capabilities**: Test generation, coverage analysis, test optimization
- **Preferred Provider**: OpenAI
- **Context Window**: 128K tokens

## Usage

### Single Agent Tasks

```typescript
import { agentOrchestrator } from '../backend/agents';

// Execute a task with a single agent
const task = await agentOrchestrator.executeTask(
  'senior-developer',
  'Refactor this component to use React hooks',
  codeContext
);
```

### Collaborative Tasks

```typescript
// Execute a task with multiple agents
const tasks = await agentOrchestrator.executeCollaborativeTask(
  ['code-architect', 'senior-developer', 'test-engineer'],
  'Build a new authentication system',
  codeContext
);
```

### Workflow Orchestration

```typescript
// Execute a predefined workflow
const orchestrations = agentOrchestrator.createPredefinedOrchestrations();
const fullStackWorkflow = orchestrations.find(o => o.id === 'full-stack-development');

const tasks = await agentOrchestrator.executeOrchestration(
  fullStackWorkflow,
  'Create a user management feature',
  codeContext
);
```

## Predefined Workflows

### 1. Full Stack Development
1. **Code Architect**: Plan architecture and implementation approach
2. **Senior Developer**: Implement the feature
3. **Test Engineer**: Create comprehensive tests

### 2. Bug Fix Workflow
1. **Debug Specialist**: Analyze the bug and identify root causes
2. **Senior Developer**: Implement the fix
3. **Test Engineer**: Create tests to verify the fix

### 3. Security Audit
1. **Security Expert**: Perform security audit and identify vulnerabilities
2. **Senior Developer**: Implement security fixes and hardening

### 4. Performance Optimization
1. **Performance Optimizer**: Analyze performance bottlenecks
2. **Senior Developer**: Implement optimizations

## Integration with Morris IDE

### UI Integration
- Access via the sidebar "Agent Harness" button
- Command palette: "Show Agent Harness"
- Keyboard shortcut: Ctrl+Shift+A (toggle AI panel)

### Context Awareness
- Automatically includes current file context
- Respects selected text and cursor position
- Integrates with project structure and dependencies

### Real-time Updates
- Live task status monitoring
- Streaming responses for long-running tasks
- Automatic refresh of agent and task lists

## Configuration

### Orchestrator Settings
```typescript
const config = {
  maxConcurrentTasks: 5,      // Maximum parallel tasks
  defaultTimeout: 30000,      // Task timeout in milliseconds
  enableCollaboration: true, // Enable collaborative tasks
  enableLearning: true,       // Enable agent learning
  retryAttempts: 3,          // Number of retry attempts
  retryDelay: 1000          // Delay between retries (ms)
};
```

### Agent Customization
Each agent can be customized with:
- Preferred AI provider
- Temperature settings
- Context window limits
- Custom prompts and constraints
- Additional capabilities

## Best Practices

### 1. Agent Selection
- **Senior Developer**: General coding tasks and architecture
- **Code Architect**: System design and planning
- **Debug Specialist**: Complex debugging and troubleshooting
- **Security Expert**: Security reviews and vulnerability fixes
- **Performance Optimizer**: Performance issues and optimization
- **Test Engineer**: Test strategy and implementation

### 2. Task Formulation
- Be specific about requirements and constraints
- Provide relevant context and examples
- Include expected outcomes and success criteria
- Consider edge cases and error scenarios

### 3. Workflow Usage
- Use workflows for complex, multi-stage tasks
- Leverage agent specializations for better results
- Monitor task progress and intermediate results
- Adjust workflows based on project needs

### 4. Performance Optimization
- Choose appropriate context windows for task complexity
- Use streaming for long-running tasks
- Monitor token usage and response times
- Cache frequently used prompts and results

## Error Handling

### Common Issues
1. **Agent Not Found**: Verify agent ID is correct
2. **API Key Missing**: Configure API keys for preferred providers
3. **Context Too Large**: Reduce input size or use agents with larger context windows
4. **Task Timeout**: Increase timeout settings or break down large tasks

### Debugging
- Check orchestrator logs for detailed error information
- Verify agent configurations and API credentials
- Monitor task status and intermediate results
- Use the Agent Panel UI for real-time debugging

## Extending the System

### Adding New Agents
1. Define agent capabilities and prompts
2. Register the agent with the orchestrator
3. Add UI components if needed
4. Update documentation and examples

### Creating Custom Workflows
1. Define workflow steps and dependencies
2. Configure agent assignments and parallel execution
3. Test workflow with sample tasks
4. Add to predefined orchestrations if reusable

### Integration Points
- Custom AI providers and models
- Additional context sources and metadata
- Custom UI components and panels
- External tools and services

## Future Enhancements

### Planned Features
- Agent learning and adaptation
- Custom agent creation tools
- Advanced workflow designer
- Performance analytics and monitoring
- Integration with external development tools

### Community Contributions
- Share custom agent definitions
- Contribute workflow templates
- Extend prompt templates
- Improve documentation and examples

---

## Support

For questions, issues, or contributions related to the AI Agent Harness:
- Check the documentation and examples
- Review the agent definitions and prompts
- Monitor task execution and results
- Provide feedback for improvements
