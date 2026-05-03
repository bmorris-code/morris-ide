import { useCallback, useMemo } from 'react';

// Extend Window interface for watcher tracking
declare global {
  interface Window {
    __morrisWatchers?: Set<string>;
  }
}

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

  
  const onFileChanged = useCallback((callback: (event: {
    type: string;
    path: string;
    rootPath: string;
    timestamp: number;
  }) => void) => {
    const unsubscribe = api?.fs.onChanged(callback) ?? (() => {});
    return unsubscribe;
  }, [api]);

  const onFileWatchError = useCallback((callback: (event: {
    rootPath: string;
    error: string;
  }) => void) => {
    const unsubscribe = api?.fs.onWatchError(callback) ?? (() => {});
    return unsubscribe;
  }, [api]);

  // Enhanced file watching with cleanup tracking
  const watchPathWithCleanup = useCallback(async (path: string) => {
    if (api) {
      const result = await api.fs.watch(path);
      if (result.success) {
        // Track the watcher for cleanup
        if (!window.__morrisWatchers) {
          window.__morrisWatchers = new Set();
        }
        window.__morrisWatchers.add(path);
      }
      return result;
    }
    return { success: false, error: 'Not running in Electron' };
  }, [api]);

  const unwatchPathWithCleanup = useCallback(async (path: string) => {
    if (api) {
      const result = await api.fs.unwatch(path);
      if (result.success && window.__morrisWatchers) {
        window.__morrisWatchers.delete(path);
      }
      return result;
    }
    return { success: false, error: 'Not running in Electron' };
  }, [api]);

  // Cleanup all watchers
  const cleanupAllWatchers = useCallback(async () => {
    if (api && window.__morrisWatchers) {
      const cleanupPromises = Array.from(window.__morrisWatchers).map(path => 
        api.fs.unwatch(path)
      );
      await Promise.all(cleanupPromises);
      window.__morrisWatchers.clear();
    }
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
    watchPath: watchPathWithCleanup,
    unwatchPath: unwatchPathWithCleanup,
    onFileChanged,
    onFileWatchError,
    cleanupAllWatchers,
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
