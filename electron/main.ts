import { app, BrowserWindow, ipcMain, dialog, shell, safeStorage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec, spawn } from 'child_process';
import type { FSWatcher } from 'chokidar';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const squirrelStartup = (() => { try { return require('electron-squirrel-startup'); } catch { return false; } })();
if (squirrelStartup) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false, // Custom title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Load the app
  if (isDev) {
    // Try multiple ports in case default is in use
    const devPort = process.env.VITE_PORT || '5173';
    mainWindow.loadURL(`http://localhost:${devPort}`);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, the dist folder is at the same level as dist-electron
    const htmlPath = path.join(__dirname, '../../dist/index.html');
    console.log('Loading HTML from:', htmlPath);
    
    // Check if file exists before loading
    if (fs.existsSync(htmlPath)) {
      console.log('HTML file exists, loading:', htmlPath);
      mainWindow.loadFile(htmlPath);
    } else {
      console.error('HTML file not found at:', htmlPath);
      // Try alternative paths
      const altPath = path.join(__dirname, '../dist/index.html');
      console.log('Trying alternative path:', altPath);
      if (fs.existsSync(altPath)) {
        console.log('HTML file exists at alternative path, loading:', altPath);
        mainWindow.loadFile(altPath);
      } else {
        console.error('HTML file not found at alternative path either:', altPath);
        console.log('Loading simple test page...');
        // Create a simple test page to verify rendering works
        mainWindow.loadURL('data:text/html,<html><body style="background:#0a0a0f;color:white;font-family:sans-serif;padding:20px;"><h1>Morris IDE - Test Page</h1><p>If you can see this, the window is working but the HTML file loading failed.</p><p>Check the console for path errors.</p></body></html>');
      }
    }
    // Open dev tools in production for debugging
    mainWindow.webContents.openDevTools();
  }

  // Handle loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded successfully');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============ IPC HANDLERS ============

// File System Operations
ipcMain.handle('fs:read-file', async (_event, filePath: string) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:write-file', async (_event, filePath: string, content: string) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:read-dir', async (_event, dirPath: string) => {
  try {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const result = items.map(item => ({
      name: item.name,
      path: path.join(dirPath, item.name),
      isDirectory: item.isDirectory(),
      isFile: item.isFile(),
    }));
    return { success: true, items: result };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:create-file', async (_event, filePath: string, content: string = '') => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:create-dir', async (_event, dirPath: string) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:delete-file', async (_event, filePath: string) => {
  try {
    const stats = await fs.promises.stat(filePath);
    if (stats.isDirectory()) {
      await fs.promises.rm(filePath, { recursive: true });
    } else {
      await fs.promises.unlink(filePath);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:rename-file', async (_event, oldPath: string, newPath: string) => {
  try {
    await fs.promises.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:file-exists', async (_event, filePath: string) => {
  try {
    await fs.promises.access(filePath);
    return { success: true, exists: true };
  } catch {
    return { success: true, exists: false };
  }
});

ipcMain.handle('fs:get-stats', async (_event, filePath: string) => {
  try {
    const stats = await fs.promises.stat(filePath);
    return {
      success: true,
      stats: {
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});


// Dialog Operations
ipcMain.handle('dialog:open-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }
  return { success: true, path: result.filePaths[0] };
});

ipcMain.handle('dialog:open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }
  return { success: true, paths: result.filePaths };
});

ipcMain.handle('dialog:save-file', async (_event, defaultPath?: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath,
  });
  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }
  return { success: true, path: result.filePath };
});

// Terminal Operations
const runningProcesses = new Map<string, ReturnType<typeof spawn>>();
const fileWatchers = new Map<string, FSWatcher>();

ipcMain.handle('terminal:exec', async (_event, command: string, cwd?: string) => {
  return new Promise((resolve) => {
    exec(command, { cwd: cwd && cwd !== '~' ? cwd : process.cwd() }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout,
        stderr,
        error: error?.message,
      });
    });
  });
});

ipcMain.handle('terminal:spawn', async (event, command: string, args: string[], cwd?: string) => {
  const id = `proc_${Date.now()}`;
  const proc = spawn(command, args, {
    cwd: cwd && cwd !== '~' ? cwd : process.cwd(),
    shell: true,
  });

  runningProcesses.set(id, proc);

  proc.stdout?.on('data', (data) => {
    event.sender.send('terminal:output', {
      processId: id,
      type: 'output',
      content: data.toString(),
    });
  });

  proc.stderr?.on('data', (data) => {
    event.sender.send('terminal:output', {
      processId: id,
      type: 'error',
      content: data.toString(),
    });
  });

  proc.on('error', (error) => {
    event.sender.send('terminal:output', {
      processId: id,
      type: 'error',
      content: error.message,
    });
  });

  proc.on('exit', (code, signal) => {
    runningProcesses.delete(id);
    event.sender.send('terminal:exit', {
      processId: id,
      code,
      signal,
      success: code === 0,
    });
  });

  return { success: true, processId: id };
});

ipcMain.handle('terminal:kill', async (_event, processId: string) => {
  const proc = runningProcesses.get(processId);
  if (proc) {
    proc.kill();
    runningProcesses.delete(processId);
    return { success: true };
  }
  return { success: false, error: 'Process not found' };
});

// App Operations
ipcMain.handle('app:get-path', async (_event, name: string) => {
  try {
    const appPath = app.getPath(name as any);
    return { success: true, path: appPath };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.on('app:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('app:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('app:close', () => {
  mainWindow?.close();
});

// Open external links
ipcMain.handle('shell:open-external', async (_event, url: string) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:watch', async (event, watchPath: string) => {
  try {
    if (fileWatchers.has(watchPath)) {
      return { success: true };
    }

    // Chokidar 5+ is pure ESM. To use it from a CJS main process, 
    // we must use a dynamic import hidden from the TSC compiler.
    const chokidar = (await eval('import("chokidar")'));
    const watcher = chokidar.watch(watchPath, {
      ignoreInitial: true,
      ignored: [
        /(^|[/\\])\../,
        /[/\\]node_modules[/\\]/,
        /[/\\]dist[/\\]/,
        /[/\\]dist-electron[/\\]/,
      ],
      persistent: true,
    });

    watcher.on('all', (type: string, changedPath: string) => {
      event.sender.send('fs:changed', {
        type,
        path: changedPath,
        rootPath: watchPath,
        timestamp: Date.now(),
      });
    });

    watcher.on('error', (error: unknown) => {
      event.sender.send('fs:watch-error', {
        rootPath: watchPath,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    fileWatchers.set(watchPath, watcher);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:unwatch', async (_event, watchPath: string) => {
  const watcher = fileWatchers.get(watchPath);
  if (!watcher) {
    return { success: true };
  }

  await watcher.close();
  fileWatchers.delete(watchPath);
  return { success: true };
});

// Safe Storage Operations (Persistent Key-Value Store)
const SECURE_STORAGE_PATH = path.join(app.getPath('userData'), 'secure_storage.json');

function readSecureStorage(): Record<string, string> {
  try {
    if (fs.existsSync(SECURE_STORAGE_PATH)) {
      return JSON.parse(fs.readFileSync(SECURE_STORAGE_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to read secure storage', e);
  }
  return {};
}

function writeSecureStorage(data: Record<string, string>) {
  try {
    fs.writeFileSync(SECURE_STORAGE_PATH, JSON.stringify(data), 'utf-8');
  } catch (e) {
    console.error('Failed to write secure storage', e);
  }
}

ipcMain.handle('safe-storage:encrypt', async (_event, id: string, plainText: string) => {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      return false;
    }
    const encrypted = safeStorage.encryptString(plainText);
    const storage = readSecureStorage();
    storage[id] = encrypted.toString('base64');
    writeSecureStorage(storage);
    return true;
  } catch (error) {
    console.error('Encryption error:', error);
    return false;
  }
});

ipcMain.handle('safe-storage:decrypt', async (_event, id: string) => {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      return null;
    }
    const storage = readSecureStorage();
    const encryptedBase64 = storage[id];
    if (!encryptedBase64) return null;

    const buffer = Buffer.from(encryptedBase64, 'base64');
    return safeStorage.decryptString(buffer);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
});

ipcMain.handle('safe-storage:remove', async (_event, id: string) => {
  try {
    const storage = readSecureStorage();
    if (storage[id]) {
      delete storage[id];
      writeSecureStorage(storage);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('safe-storage:clear', async () => {
  try {
    writeSecureStorage({});
    return true;
  } catch (e) {
    return false;
  }
});
