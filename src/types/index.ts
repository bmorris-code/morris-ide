// Central export for all types
export * from './editor';
export * from './project';
export * from './ai';
export * from './security';

// Terminal types
export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: number;
}

export interface TerminalState {
  lines: TerminalLine[];
  currentDirectory: string;
  isRunning: boolean;
  history: string[];
  historyIndex: number;
}

// App-wide settings
export interface AppSettings {
  theme: 'dark' | 'light';
  sidebarWidth: number;
  aiPanelWidth: number;
  showTerminal: boolean;
  terminalHeight: number;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  sidebarWidth: 288,
  aiPanelWidth: 384,
  showTerminal: true,
  terminalHeight: 200,
};

// IPC Channel names for Electron
export const IPC_CHANNELS = {
  // File operations
  READ_FILE: 'fs:read-file',
  WRITE_FILE: 'fs:write-file',
  READ_DIR: 'fs:read-dir',
  CREATE_FILE: 'fs:create-file',
  CREATE_DIR: 'fs:create-dir',
  DELETE_FILE: 'fs:delete-file',
  RENAME_FILE: 'fs:rename-file',
  FILE_EXISTS: 'fs:file-exists',
  GET_FILE_STATS: 'fs:get-stats',
  
  // Dialog operations
  OPEN_FOLDER: 'dialog:open-folder',
  OPEN_FILE: 'dialog:open-file',
  SAVE_FILE: 'dialog:save-file',
  
  // Terminal operations
  TERMINAL_EXEC: 'terminal:exec',
  TERMINAL_KILL: 'terminal:kill',
  
  // App operations
  GET_APP_PATH: 'app:get-path',
  MINIMIZE: 'app:minimize',
  MAXIMIZE: 'app:maximize',
  CLOSE: 'app:close',
} as const;

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}
