import { contextBridge, ipcRenderer } from 'electron';

console.log('🚀 Morris IDE Preload script loaded!');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

const electronAPI = {
  // Flag to indicate Electron is available
  isElectron: true,
  // File System Operations
  fs: {
    readFile: (path: string) => ipcRenderer.invoke('fs:read-file', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:write-file', path, content),
    readDir: (path: string) => ipcRenderer.invoke('fs:read-dir', path),
    createFile: (path: string, content?: string) => ipcRenderer.invoke('fs:create-file', path, content),
    createDir: (path: string) => ipcRenderer.invoke('fs:create-dir', path),
    deleteFile: (path: string) => ipcRenderer.invoke('fs:delete-file', path),
    renameFile: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename-file', oldPath, newPath),
    fileExists: (path: string) => ipcRenderer.invoke('fs:file-exists', path),
    getStats: (path: string) => ipcRenderer.invoke('fs:get-stats', path),
    watch: (path: string) => ipcRenderer.invoke('fs:watch', path),
    unwatch: (path: string) => ipcRenderer.invoke('fs:unwatch', path),
    onChanged: (callback: (event: {
      type: string;
      path: string;
      rootPath: string;
      timestamp: number;
    }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: {
        type: string;
        path: string;
        rootPath: string;
        timestamp: number;
      }) => callback(payload);
      ipcRenderer.on('fs:changed', listener);
      return () => ipcRenderer.removeListener('fs:changed', listener);
    },
    onWatchError: (callback: (event: {
      rootPath: string;
      error: string;
    }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: {
        rootPath: string;
        error: string;
      }) => callback(payload);
      ipcRenderer.on('fs:watch-error', listener);
      return () => ipcRenderer.removeListener('fs:watch-error', listener);
    },
  },

  // Dialog Operations
  dialog: {
    openFolder: () => ipcRenderer.invoke('dialog:open-folder'),
    openFile: () => ipcRenderer.invoke('dialog:open-file'),
    saveFile: (defaultPath?: string) => ipcRenderer.invoke('dialog:save-file', defaultPath),
  },

  // Terminal Operations
  terminal: {
    exec: (command: string, cwd?: string) => ipcRenderer.invoke('terminal:exec', command, cwd),
    spawn: (command: string, args: string[], cwd?: string) =>
      ipcRenderer.invoke('terminal:spawn', command, args, cwd),
    kill: (processId: string) => ipcRenderer.invoke('terminal:kill', processId),
    onOutput: (callback: (event: {
      processId: string;
      type: 'output' | 'error';
      content: string;
    }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: {
        processId: string;
        type: 'output' | 'error';
        content: string;
      }) => callback(payload);
      ipcRenderer.on('terminal:output', listener);
      return () => ipcRenderer.removeListener('terminal:output', listener);
    },
    onExit: (callback: (event: {
      processId: string;
      code: number | null;
      signal: string | null;
      success: boolean;
    }) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: {
        processId: string;
        code: number | null;
        signal: string | null;
        success: boolean;
      }) => callback(payload);
      ipcRenderer.on('terminal:exit', listener);
      return () => ipcRenderer.removeListener('terminal:exit', listener);
    },
  },

  // App Operations
  app: {
    getPath: (name: string) => ipcRenderer.invoke('app:get-path', name),
    minimize: () => ipcRenderer.send('app:minimize'),
    maximize: () => ipcRenderer.send('app:maximize'),
    close: () => ipcRenderer.send('app:close'),
  },

  // Shell Operations
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  },

  // Safe Storage
  safeStorage: {
    encrypt: (id: string, plainText: string) => ipcRenderer.invoke('safe-storage:encrypt', id, plainText),
    decrypt: (id: string) => ipcRenderer.invoke('safe-storage:decrypt', id),
    remove: (id: string) => ipcRenderer.invoke('safe-storage:remove', id),
    clear: () => ipcRenderer.invoke('safe-storage:clear'),
  },

  // Platform info
  platform: process.platform,
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the renderer process
export type ElectronAPI = typeof electronAPI;
