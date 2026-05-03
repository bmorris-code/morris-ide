import { useCallback, useMemo } from 'react';

// Check if we're running in Electron
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' &&
         window.electronAPI !== undefined &&
         window.electronAPI.isElectron === true;
};

// Hook to access Electron API with fallbacks for web
export const useElectron = () => {
  const api = useMemo(() => window.electronAPI, []);

  // File operations with web fallbacks
  const readFile = useCallback(async (path: string) => {
    if (api) {
      return api.fs.readFile(path);
    }
    // Web fallback - would need a backend API
    return { success: false, error: 'Not running in Electron' };
  }, [api]);

  const writeFile = useCallback(async (path: string, content: string) => {
    if (api) {
      return api.fs.writeFile(path, content);
    }
    return { success: false, error: 'Not running in Electron' };
  }, [api]);

  const readDir = useCallback(async (path: string) => {
    if (api) {
      return api.fs.readDir(path);
    }
    return { success: false, error: 'Not running in Electron' };
  }, [api]);

  const watchPath = useCallback(async (path: string) => {
    if (api) {
      return api.fs.watch(path);
    }
    return { success: false, error: 'Not running in Electron' };
  }, [api]);

  const unwatchPath = useCallback(async (path: string) => {
    if (api) {
      return api.fs.unwatch(path);
    }
    return { success: false, error: 'Not running in Electron' };
  }, [api]);

  const onFileChanged = useCallback((callback: (event: {
    type: string;
    path: string;
    rootPath: string;
    timestamp: number;
  }) => void) => {
    return api?.fs.onChanged(callback) ?? (() => {});
  }, [api]);

  const onFileWatchError = useCallback((callback: (event: {
    rootPath: string;
    error: string;
  }) => void) => {
    return api?.fs.onWatchError(callback) ?? (() => {});
  }, [api]);

  const openFolder = useCallback(async () => {
    if (api) {
      return api.dialog.openFolder();
    }
    return { success: false, error: 'Not running in Electron' };
  }, [api]);

  const openFile = useCallback(async () => {
    if (api) {
      return api.dialog.openFile();
    }
    return { success: false, error: 'Not running in Electron' };
  }, [api]);

  const execCommand = useCallback(async (command: string, cwd?: string) => {
    if (api) {
      return api.terminal.exec(command, cwd);
    }
    return { success: false, error: 'Not running in Electron' };
  }, [api]);

  const spawnCommand = useCallback(async (command: string, args: string[] = [], cwd?: string) => {
    if (api) {
      return api.terminal.spawn(command, args, cwd);
    }
    return { success: false, error: 'Not running in Electron' };
  }, [api]);

  const killProcess = useCallback(async (processId: string) => {
    if (api) {
      return api.terminal.kill(processId);
    }
    return { success: false, error: 'Not running in Electron' };
  }, [api]);

  const onTerminalOutput = useCallback((callback: (event: {
    processId: string;
    type: 'output' | 'error';
    content: string;
  }) => void) => {
    return api?.terminal.onOutput(callback) ?? (() => {});
  }, [api]);

  const onTerminalExit = useCallback((callback: (event: {
    processId: string;
    code: number | null;
    signal: string | null;
    success: boolean;
  }) => void) => {
    return api?.terminal.onExit(callback) ?? (() => {});
  }, [api]);

  const minimize = useCallback(() => {
    api?.app.minimize();
  }, [api]);

  const maximize = useCallback(() => {
    api?.app.maximize();
  }, [api]);

  const close = useCallback(() => {
    api?.app.close();
  }, [api]);

  const openExternal = useCallback(async (url: string) => {
    if (api) {
      return api.shell.openExternal(url);
    }
    // Web fallback
    window.open(url, '_blank');
    return { success: true };
  }, [api]);

  return {
    isElectron: !!api,
    platform: api?.platform || 'web',
    // File operations
    readFile,
    writeFile,
    readDir,
    watchPath,
    unwatchPath,
    onFileChanged,
    onFileWatchError,
    // Dialog operations
    openFolder,
    openFile,
    // Terminal operations
    execCommand,
    spawnCommand,
    killProcess,
    onTerminalOutput,
    onTerminalExit,
    // Window operations
    minimize,
    maximize,
    close,
    // Shell operations
    openExternal,
    // Direct API access
    api,
  };
};

export default useElectron;
