import { logger } from '../../utils/logger';

// Agent Tool System for Kimi K2.6
// Allows Kimi to execute actions in Morris IDE

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any, context: AgentContext) => Promise<ToolResult>;
}

export interface AgentContext {
  electron: any; // useElectron hook result
  editorStore: any; // useEditorStore hook result
}

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
}

interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size?: number;
}

interface EditorTabLike {
  id: string;
  path: string;
  name: string;
  language: string;
  isDirty: boolean;
}

// File Operations Tools
export const FileTools: AgentTool[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file',
    parameters: {
      path: { type: 'string', description: 'File path to read', required: true }
    },
    async execute({ path }: { path: string }, { electron }: AgentContext): Promise<ToolResult> {
      try {
        const result = await electron.readFile(path);
        
        if (result.success) {
          return { success: true, result: { content: result.content } };
        } else {
          return { success: false, error: result.error || 'Failed to read file' };
        }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  },

  {
    name: 'write_file',
    description: 'Write content to a file',
    parameters: {
      path: { type: 'string', description: 'File path to write', required: true },
      content: { type: 'string', description: 'Content to write', required: true }
    },
    async execute({ path, content }: { path: string; content: string }, { electron, editorStore }: AgentContext): Promise<ToolResult> {
      try {
        const result = await electron.writeFile(path, content);
        
        if (result.success) {
          // Update editor if file is open
          const existingTab = editorStore.getTabByPath(path);
          if (existingTab) {
            editorStore.updateTabContent(existingTab.id, content);
            editorStore.markTabClean(existingTab.id);
          }
          
          return { success: true, result: { message: 'File written successfully' } };
        } else {
          return { success: false, error: result.error || 'Failed to write file' };
        }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  },

  {
    name: 'list_directory',
    description: 'List files and directories in a path',
    parameters: {
      path: { type: 'string', description: 'Directory path to list', required: true }
    },
    async execute({ path }: { path: string }, { electron }: AgentContext): Promise<ToolResult> {
      try {
        const result = await electron.readDir(path);
        
        if (result.success && result.items) {
          const items = result.items.map((item: DirectoryItem) => ({
            name: item.name,
            path: item.path,
            type: item.isDirectory ? 'directory' : 'file',
            size: item.size
          }));
          return { success: true, result: { items } };
        } else {
          return { success: false, error: result.error || 'Failed to list directory' };
        }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  }
];

// Editor Operations Tools
export const EditorTools: AgentTool[] = [
  {
    name: 'open_file_in_editor',
    description: 'Open a file in the editor',
    parameters: {
      path: { type: 'string', description: 'File path to open', required: true }
    },
    async execute({ path }: { path: string }, { electron, editorStore }: AgentContext): Promise<ToolResult> {
      try {
        // Read file content
        const fileResult = await electron.readFile(path);
        if (!fileResult.success || fileResult.content === undefined) {
          return { success: false, error: fileResult.error || 'Failed to read file' };
        }
        
        // Open in editor
        editorStore.openFile(path, fileResult.content);
        
        return { success: true, result: { message: `Opened ${path} in editor` } };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  },

  {
    name: 'get_active_file',
    description: 'Get the currently active file in the editor',
    parameters: {},
    async execute(_: any, { editorStore }: AgentContext): Promise<ToolResult> {
      try {
        const activeTab = editorStore.getActiveTab();
        
        if (!activeTab) {
          return { success: false, error: 'No active file' };
        }
        
        return { 
          success: true, 
          result: {
            path: activeTab.path,
            name: activeTab.name,
            content: activeTab.content,
            language: activeTab.language,
            selectedText: editorStore.selectedText
          }
        };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  },

  {
    name: 'get_open_files',
    description: 'Get all currently open files in the editor',
    parameters: {},
    async execute(_: any, { editorStore }: AgentContext): Promise<ToolResult> {
      try {
        const tabs = editorStore.tabs;
        
        const files = tabs.map((tab: EditorTabLike) => ({
          path: tab.path,
          name: tab.name,
          language: tab.language,
          isActive: tab.id === editorStore.activeTabId,
          isDirty: tab.isDirty
        }));
        
        return { success: true, result: { files } };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  }
];

// Terminal Operations Tools
export const TerminalTools: AgentTool[] = [
  {
    name: 'execute_command',
    description: 'Execute a terminal command',
    parameters: {
      command: { type: 'string', description: 'Command to execute', required: true },
      cwd: { type: 'string', description: 'Working directory (optional)' }
    },
    async execute({ command, cwd }: { command: string; cwd?: string }, { electron }: AgentContext): Promise<ToolResult> {
      try {
        const result = await electron.execCommand(command, cwd);
        
        if (result.success) {
          return { 
            success: true, 
            result: {
              stdout: result.stdout,
              stderr: result.stderr,
              exitCode: result.exitCode
            }
          };
        } else {
          return { success: false, error: result.error || 'Command execution failed' };
        }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  },

  {
    name: 'run_npm_command',
    description: 'Run an npm command (install, test, build, etc.)',
    parameters: {
      command: { type: 'string', description: 'npm command (install, test, build, etc.)', required: true },
      args: { type: 'array', description: 'Additional arguments', required: false }
    },
    async execute({ command, args = [] }: { command: string; args: string[] }, { electron }: AgentContext): Promise<ToolResult> {
      try {
        const fullCommand = `npm ${command} ${args.join(' ')}`;
        const result = await electron.execCommand(fullCommand);
        
        if (result.success) {
          return { 
            success: true, 
            result: {
              stdout: result.stdout,
              stderr: result.stderr,
              exitCode: result.exitCode
            }
          };
        } else {
          return { success: false, error: result.error || 'npm command failed' };
        }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  }
];

// Project Analysis Tools
export const AnalysisTools: AgentTool[] = [
  {
    name: 'analyze_project_structure',
    description: 'Analyze the project structure and dependencies',
    parameters: {
      path: { type: 'string', description: 'Project root path', required: false }
    },
    async execute({ path }: { path?: string }, { electron }: AgentContext): Promise<ToolResult> {
      try {
        const projectPath = path || electron.api?.project.getProjectPath?.() || '.';
        
        // Read package.json if exists
        const packageJsonResult = await electron.readFile(`${projectPath}/package.json`);
        let packageJson = null;
        
        if (packageJsonResult.success && packageJsonResult.content) {
          try {
            packageJson = JSON.parse(packageJsonResult.content);
          } catch (e) {
            logger.warn('Failed to parse package.json', 'Agent');
          }
        }
        
        // List key directories
        const dirsToCheck = ['src', 'components', 'pages', 'utils', 'hooks', 'types', 'tests'];
        const directories: Record<string, number> = {};
        
        for (const dir of dirsToCheck) {
          const dirResult = await electron.readDir(`${projectPath}/${dir}`);
          if (dirResult.success) {
            directories[dir] = dirResult.items?.filter((item: DirectoryItem) => !item.name.startsWith('.')).length || 0;
          }
        }
        
        return { 
          success: true, 
          result: {
            packageJson,
            directories,
            projectPath
          }
        };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  }
];

// All available tools
export const AllAgentTools: AgentTool[] = [
  ...FileTools,
  ...EditorTools,
  ...TerminalTools,
  ...AnalysisTools
];

// Tool registry for easy lookup
export const ToolRegistry = new Map<string, AgentTool>();
AllAgentTools.forEach(tool => {
  ToolRegistry.set(tool.name, tool);
});

// Execute tool by name
export const executeTool = async (toolName: string, params: any, context: AgentContext): Promise<ToolResult> => {
  const tool = ToolRegistry.get(toolName);
  if (!tool) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }
  
  try {
    logger.info(`Executing tool: ${toolName}`, 'Agent', { params });
    const result = await tool.execute(params, context);
    logger.info(`Tool ${toolName} completed`, 'Agent', { success: result.success });
    return result;
  } catch (error) {
    logger.error(`Tool ${toolName} failed`, 'Agent', { error });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Get available tools as JSON schema for AI
export const getToolsSchema = () => {
  return AllAgentTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
};
