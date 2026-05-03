// backend/agents/prompt-builder.ts
import type { AgentRole } from '../../types/agents';
import type { CodeContext } from '../../types/ai';

export interface PromptBuildContext {
  agent: AgentRole;
  task: string;
  codeContext?: CodeContext;
  metadata?: Record<string, any>;
  projectContext?: ProjectContext;
}

export interface ProjectContext {
  name: string;
  description: string;
  techStack: string[];
  architecture: string;
  teamSize: number;
  phase: 'planning' | 'development' | 'testing' | 'deployment' | 'maintenance';
  constraints: string[];
  goals: string[];
}

export class PromptBuilder {
  /**
   * Build a comprehensive prompt for an agent with context
   */
  static buildPrompt(context: PromptBuildContext): string {
    const { agent, task, codeContext, metadata, projectContext } = context;
    
    const sections: string[] = [];
    
    // System Prompt
    sections.push(`# System Instructions`);
    sections.push(agent.prompts.system);
    sections.push('');
    
    // Context Information
    if (projectContext || codeContext || metadata) {
      sections.push(`# Context Information`);
      
      if (projectContext) {
        sections.push(this.buildProjectContext(projectContext));
      }
      
      if (codeContext) {
        sections.push(this.buildCodeContext(codeContext));
      }
      
      if (metadata) {
        sections.push(this.buildMetadataContext(metadata));
      }
      
      sections.push('');
    }
    
    // Task Definition
    sections.push(`# Task`);
    sections.push(task);
    sections.push('');
    
    // Constraints and Guidelines
    if (agent.prompts.constraints && agent.prompts.constraints.length > 0) {
      sections.push(`# Constraints and Guidelines`);
      agent.prompts.constraints.forEach(constraint => {
        sections.push(`- ${constraint}`);
      });
      sections.push('');
    }
    
    // Examples
    if (agent.prompts.examples && agent.prompts.examples.length > 0) {
      sections.push(`# Examples`);
      agent.prompts.examples.forEach(example => {
        sections.push(`- ${example}`);
      });
      sections.push('');
    }
    
    // Output Format
    sections.push(`# Output Format`);
    sections.push(`Provide your response in a clear, structured format with:`);
    sections.push(`1. Analysis of the request`);
    sections.push(`2. Proposed solution or approach`);
    sections.push(`3. Implementation details (with code examples)`);
    sections.push(`4. Considerations and trade-offs`);
    sections.push(`5. Next steps or recommendations`);
    sections.push('');
    
    return sections.join('\n');
  }
  
  /**
   * Build project context section
   */
  private static buildProjectContext(context: ProjectContext): string {
    const sections: string[] = [];
    
    sections.push(`## Project Context`);
    sections.push(`- **Name**: ${context.name}`);
    sections.push(`- **Description**: ${context.description}`);
    sections.push(`- **Technology Stack**: ${context.techStack.join(', ')}`);
    sections.push(`- **Architecture**: ${context.architecture}`);
    sections.push(`- **Team Size**: ${context.teamSize} developers`);
    sections.push(`- **Phase**: ${context.phase}`);
    
    if (context.constraints.length > 0) {
      sections.push(`- **Constraints**:`);
      context.constraints.forEach(constraint => {
        sections.push(`  - ${constraint}`);
      });
    }
    
    if (context.goals.length > 0) {
      sections.push(`- **Goals**:`);
      context.goals.forEach(goal => {
        sections.push(`  - ${goal}`);
      });
    }
    
    sections.push('');
    return sections.join('\n');
  }
  
  /**
   * Build code context section
   */
  private static buildCodeContext(context: CodeContext): string {
    const sections: string[] = [];
    
    sections.push(`## Code Context`);
    sections.push(`- **File**: ${context.fileName}`);
    sections.push(`- **Path**: ${context.filePath}`);
    sections.push(`- **Language**: ${context.language}`);
    
    if (context.cursorLine) {
      sections.push(`- **Cursor Position**: Line ${context.cursorLine}`);
    }
    
    if (context.selectedCode) {
      sections.push(`- **Selected Code**:`);
      sections.push('```' + context.language);
      sections.push(context.selectedCode);
      sections.push('```');
    } else if (context.fullCode) {
      sections.push(`- **Full File Content**:`);
      sections.push('```' + context.language);
      sections.push(context.fullCode);
      sections.push('```');
    }
    
    sections.push('');
    return sections.join('\n');
  }
  
  /**
   * Build metadata context section
   */
  private static buildMetadataContext(metadata: Record<string, any>): string {
    const sections: string[] = [];
    
    sections.push(`## Additional Context`);
    
    Object.entries(metadata).forEach(([key, value]) => {
      if (typeof value === 'string') {
        sections.push(`- **${key}**: ${value}`);
      } else if (Array.isArray(value)) {
        sections.push(`- **${key}**: ${value.join(', ')}`);
      } else if (typeof value === 'object' && value !== null) {
        sections.push(`- **${key}**: ${JSON.stringify(value, null, 2)}`);
      } else {
        sections.push(`- **${key}**: ${String(value)}`);
      }
    });
    
    sections.push('');
    return sections.join('\n');
  }
  
  /**
   * Build specialized prompts for different task types
   */
  static buildTaskPrompt(
    taskType: 'code' | 'debug' | 'analysis' | 'planning' | 'optimization' | 'security' | 'testing',
    context: PromptBuildContext
  ): string {
    const taskPrompts = {
      code: `# Code Generation Task

You are tasked with writing high-quality, production-ready code. Please provide:

1. **Complete Implementation**: Full, working code that follows best practices
2. **Documentation**: Clear comments and documentation for complex logic
3. **Error Handling**: Comprehensive error handling and edge cases
4. **Testing Suggestions**: Recommended test cases and approaches
5. **Integration Notes**: How this code integrates with the existing system

Focus on maintainability, performance, and security.`,

      debug: `# Debugging Task

You are tasked with identifying and resolving issues in the code. Please provide:

1. **Problem Analysis**: Detailed analysis of the issue or error
2. **Root Cause Identification**: What is causing the problem
3. **Debugging Steps**: Step-by-step approach to identify the issue
4. **Solution**: Specific code fixes with explanations
5. **Verification**: How to verify the fix works
6. **Prevention**: How to prevent similar issues in the future

Be methodical and thorough in your analysis.`,

      analysis: `# Code Analysis Task

You are tasked with analyzing code and providing insights. Please provide:

1. **Structure Analysis**: Overall code organization and architecture
2. **Quality Assessment**: Code quality, maintainability, and best practices
3. **Dependencies**: How components interact and depend on each other
4. **Potential Issues**: Bugs, performance issues, or security concerns
5. **Improvement Suggestions**: Specific recommendations for enhancement
6. **Complexity Assessment**: Technical complexity and maintenance considerations

Provide detailed, actionable insights.`,

      planning: `# Planning Task

You are tasked with creating a comprehensive plan. Please provide:

1. **Requirements Analysis**: Clear understanding of what needs to be built
2. **Architecture Design**: High-level system architecture and components
3. **Implementation Plan**: Step-by-step development approach
4. **Risk Assessment**: Potential risks and mitigation strategies
5. **Resource Planning**: Time, effort, and skill requirements
6. **Success Criteria**: How to measure successful completion

Think strategically and consider long-term implications.`,

      optimization: `# Performance Optimization Task

You are tasked with optimizing code for better performance. Please provide:

1. **Performance Analysis**: Current performance bottlenecks and issues
2. **Optimization Strategy**: Overall approach to optimization
3. **Specific Optimizations**: Concrete code improvements with before/after
4. **Performance Impact**: Expected improvements and measurements
5. **Trade-offs**: Performance vs maintainability considerations
6. **Monitoring**: How to track performance improvements

Focus on high-impact optimizations first.`,

      security: `# Security Task

You are tasked with ensuring code security and best practices. Please provide:

1. **Security Assessment**: Current security posture and vulnerabilities
2. **Threat Analysis**: Potential attack vectors and risks
3. **Security Implementation**: Specific security measures and controls
4. **Compliance**: Relevant security standards and regulations
5. **Security Testing**: Approaches to validate security measures
6. **Monitoring**: Security monitoring and alerting strategies

Prioritize by risk level and impact.`,

      testing: `# Testing Task

You are tasked with creating comprehensive test coverage. Please provide:

1. **Test Strategy**: Overall testing approach and methodology
2. **Test Cases**: Specific test scenarios with expected outcomes
3. **Test Implementation**: Complete, runnable test code
4. **Coverage Analysis**: Areas covered and potential gaps
5. **Test Data**: Required test data and setup
6. **Automation**: How to integrate tests into CI/CD pipeline

Ensure tests are reliable, maintainable, and comprehensive.`
    };
    
    const basePrompt = this.buildPrompt(context);
    const taskSpecificPrompt = taskPrompts[taskType];
    
    return `${basePrompt}

${taskSpecificPrompt}`;
  }
  
  /**
   * Build collaborative prompt for multiple agents
   */
  static buildCollaborativePrompt(
    agents: AgentRole[],
    task: string,
    context: PromptBuildContext
  ): string {
    const sections: string[] = [];
    
    sections.push(`# Collaborative Task`);
    sections.push(`This task requires collaboration between multiple specialized agents:`);
    sections.push('');
    
    agents.forEach((agent, index) => {
      sections.push(`## ${index + 1}. ${agent.name} (${agent.id})`);
      sections.push(`**Role**: ${agent.description}`);
      sections.push(`**Capabilities**: ${agent.capabilities.map(cap => cap.name).join(', ')}`);
      sections.push(`**Focus**: ${this.getAgentFocus(agent)}`);
      sections.push('');
    });
    
    sections.push(`## Overall Task`);
    sections.push(task);
    sections.push('');
    
    sections.push(`## Collaboration Guidelines`);
    sections.push(`1. Each agent should contribute from their area of expertise`);
    sections.push(`2. Build upon previous agents' contributions`);
    sections.push(`3. Identify and resolve conflicts between different perspectives`);
    sections.push(`4. Provide a unified, comprehensive solution`);
    sections.push(`5. Consider the full system impact of recommendations`);
    sections.push('');
    
    if (context.projectContext) {
      sections.push(this.buildProjectContext(context.projectContext));
    }
    
    if (context.codeContext) {
      sections.push(this.buildCodeContext(context.codeContext));
    }
    
    return sections.join('\n');
  }
  
  /**
   * Get the primary focus area for an agent
   */
  private static getAgentFocus(agent: AgentRole): string {
    const categoryMap = {
      'code': 'Writing and improving code quality',
      'analysis': 'Understanding and analyzing systems',
      'planning': 'Designing and planning solutions',
      'debugging': 'Finding and fixing issues',
      'optimization': 'Improving performance and efficiency',
      'security': 'Ensuring security and compliance',
      'testing': 'Validating quality and functionality'
    };
    
    const primaryCategory = agent.capabilities[0]?.category || 'code';
    return categoryMap[primaryCategory] || 'General assistance';
  }
  
  /**
   * Build context-aware prompt template
   */
  static buildContextTemplate(
    agent: AgentRole,
    contextTemplate: string,
    variables: Record<string, string>
  ): string {
    let template = contextTemplate;
    
    // Replace variables in the template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      template = template.replace(regex, value);
    });
    
    // Combine with agent's system prompt
    return `${agent.prompts.system}

# Context-Aware Task
${template}`;
  }
}
