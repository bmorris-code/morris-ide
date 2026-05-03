// Type declarations for Electron API exposed via preload

interface FSResult {
  success: boolean;
  error?: string;
}

interface ReadFileResult extends FSResult {
  content?: string;
}

interface ReadDirResult extends FSResult {
  items?: Array<{
    name: string;
    path: string;
    isDirectory: boolean;
    isFile: boolean;
  }>;
}

interface FileStatsResult extends FSResult {
  stats?: {
    size: number;
    isDirectory: boolean;
    isFile: boolean;
    created: string;
    modified: string;
  };
}

interface FileChangedEvent {
  type: string;
  path: string;
  rootPath: string;
  timestamp: number;
}

interface FileWatchErrorEvent {
  rootPath: string;
  error: string;
}

interface DialogResult extends FSResult {
  canceled?: boolean;
  path?: string;
  paths?: string[];
}

interface ExecResult extends FSResult {
  stdout?: string;
  stderr?: string;
}

interface SpawnResult extends FSResult {
  processId?: string;
}

interface TerminalOutputEvent {
  processId: string;
  type: 'output' | 'error';
  content: string;
}

interface TerminalExitEvent {
  processId: string;
  code: number | null;
  signal: string | null;
  success: boolean;
}

interface ElectronAPI {
  isElectron: boolean;
  fs: {
    readFile: (path: string) => Promise<ReadFileResult>;
    writeFile: (path: string, content: string) => Promise<FSResult>;
    readDir: (path: string) => Promise<ReadDirResult>;
    createFile: (path: string, content?: string) => Promise<FSResult>;
    createDir: (path: string) => Promise<FSResult>;
    deleteFile: (path: string) => Promise<FSResult>;
    renameFile: (oldPath: string, newPath: string) => Promise<FSResult>;
    fileExists: (path: string) => Promise<FSResult & { exists?: boolean }>;
    getStats: (path: string) => Promise<FileStatsResult>;
    watch: (path: string) => Promise<FSResult>;
    unwatch: (path: string) => Promise<FSResult>;
    onChanged: (callback: (event: FileChangedEvent) => void) => () => void;
    onWatchError: (callback: (event: FileWatchErrorEvent) => void) => () => void;
  };
  dialog: {
    openFolder: () => Promise<DialogResult>;
    openFile: () => Promise<DialogResult>;
    saveFile: (defaultPath?: string) => Promise<DialogResult>;
  };
  terminal: {
    exec: (command: string, cwd?: string) => Promise<ExecResult>;
    spawn: (command: string, args: string[], cwd?: string) => Promise<SpawnResult>;
    kill: (processId: string) => Promise<FSResult>;
    onOutput: (callback: (event: TerminalOutputEvent) => void) => () => void;
    onExit: (callback: (event: TerminalExitEvent) => void) => () => void;
  };
  app: {
    getPath: (name: string) => Promise<FSResult & { path?: string }>;
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  shell: {
    openExternal: (url: string) => Promise<FSResult>;
  };
  platform: NodeJS.Platform;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
