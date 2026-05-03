import { useState, useEffect, memo } from 'react';
import {
  ChevronDown, ChevronRight,
  Command,
  GitBranch,
  Sparkles, Settings,
  LogOut
} from 'lucide-react';
import MonacoEditorPanel from '../editor/MonacoEditor';
import AIChatPanel from '../ai/AIChatPanel';
import AgentPanel from '../agents/AgentPanel';
import TerminalPanel from '../terminal/TerminalPanel';
import FileExplorer from '../explorer/FileExplorer';
import { UserButton } from '@clerk/clerk-react';
import { useProjectStore, useEditorStore, useAuthStore, useTerminalStore, useProblemsStore } from '../../store';
import { scanProject } from '../../backend/security';
import { useElectron, useAI } from '../../hooks';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';
import type { FileNode } from '../../types/project';
import { generateFileId } from '../../types/project';
import type { SecurityScanResult } from '../../types/security';
import { searchCache, debounce } from '../../utils/searchCache';

interface SearchResult {
  path: string;
  name: string;
  line: number;
  preview: string;
}

interface MenuBarProps {
  setActivePanel: (panel: string | null) => void;
  showExplorer: boolean;
  setShowExplorer: (show: boolean) => void;
  showTerminal: boolean;
  setShowTerminal: (show: boolean) => void;
  openCommandPalette: () => void;
}

const TEXT_FILE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'json', 'md', 'css', 'scss', 'html', 'txt',
  'yml', 'yaml', 'env', 'cjs', 'mjs', 'py', 'rs', 'go', 'java', 'sql'
]);

function flattenProjectFiles(node: FileNode | null): FileNode[] {
  if (!node) return [];
  if (node.type === 'file') return [node];
  return node.children?.flatMap(flattenProjectFiles) || [];
}

function isTextFile(node: FileNode): boolean {
  const ext = node.extension?.toLowerCase() || node.name.split('.').pop()?.toLowerCase() || '';
  return TEXT_FILE_EXTENSIONS.has(ext);
}

// IDE Menu Bar
function MenuBar({
  setActivePanel,
  showExplorer,
  setShowExplorer,
  showTerminal,
  setShowTerminal,
  openCommandPalette,
}: MenuBarProps) {
  const electron = useElectron();
  const { profile, logout } = useAuthStore();
  const { setFileTree, setCurrentProject, setLoading } = useProjectStore();
  const { setCurrentDirectory } = useTerminalStore();
  const { openFile, tabs, activeTabId, closeTab, closeAllTabs, markTabClean } = useEditorStore();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const handleLogout = () => {
    logout();
    console.log('User logged out');
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const loadDirectory = async (dirPath: string): Promise<FileNode | null> => {
    const result = await electron.readDir(dirPath);
    if (!result.success || !result.items) return null;

    const children: FileNode[] = [];
    const sortedItems = result.items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const item of sortedItems) {
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;

      const node: FileNode = {
        id: generateFileId(),
        name: item.name,
        path: item.path,
        type: item.isDirectory ? 'directory' : 'file',
        extension: item.isFile ? item.name.split('.').pop() : undefined,
      };

      if (item.isDirectory) {
        const subTree = await loadDirectory(item.path);
        if (subTree) node.children = subTree.children;
      }

      children.push(node);
    }

    return {
      id: generateFileId(),
      name: dirPath.split(/[/\\]/).pop() || dirPath,
      path: dirPath,
      type: 'directory',
      children,
    };
  };

  const openFolderDialog = async () => {
    setShowExplorer(true);
    setActivePanel(null);

    if (!electron.isElectron) {
      setActiveMenu(null);
      return;
    }

    setLoading(true);
    const result = await electron.openFolder();

    if (result.success && result.path) {
      const tree = await loadDirectory(result.path);
      if (tree) {
        setFileTree(tree);
        setCurrentProject({
          id: `proj_${Date.now()}`,
          name: tree.name,
          path: result.path,
          rootNode: tree,
          createdAt: Date.now(),
          lastOpenedAt: Date.now(),
        });
        setCurrentDirectory(result.path);
      }
    }

    setLoading(false);
    setActiveMenu(null);
  };

  const openFileDialog = async () => {
    const result = await electron.openFile();
    const paths = result.paths || (result.path ? [result.path] : []);

    for (const path of paths) {
      const fileResult = await electron.readFile(path);
      if (fileResult.success && fileResult.content !== undefined) {
        openFile(path, fileResult.content);
      }
    }

    setActiveMenu(null);
  };

  const saveActiveFile = async () => {
    if (!activeTab) return;
    const result = await electron.writeFile(activeTab.path, activeTab.content);
    if (result.success) {
      markTabClean(activeTab.id);
    }
    setActiveMenu(null);
  };

  const closeActiveFile = () => {
    if (activeTabId) {
      if (activeTab?.isDirty && !window.confirm(`Discard unsaved changes to ${activeTab.name}?`)) {
        return;
      }
      closeTab(activeTabId);
    }
    setActiveMenu(null);
  };

  const closeEveryFile = () => {
    const hasDirty = tabs.some(tab => tab.isDirty);
    if (hasDirty && !window.confirm('Discard all unsaved changes?')) {
      return;
    }
    closeAllTabs();
    setActiveMenu(null);
  };

  const runMenuAction = (action: string) => {
    switch (action) {
      case 'open-folder':
        openFolderDialog();
        return;
      case 'open-file':
        openFileDialog();
        return;
      case 'save':
        saveActiveFile();
        return;
      case 'close-file':
        closeActiveFile();
        return;
      case 'close-all':
        closeEveryFile();
        return;
        break;
      case 'explorer':
        setShowExplorer(!showExplorer);
        break;
      case 'search':
        setActivePanel('search');
        break;
      case 'ai':
        setActivePanel('ai');
        break;
      case 'git':
        setActivePanel('git');
        break;
      case 'security':
        setActivePanel('security');
        break;
      case 'settings':
        setActivePanel('settings');
        break;
      case 'problems':
        setActivePanel('problems');
        break;
      case 'command-palette':
        openCommandPalette();
        break;
      case 'terminal':
        setShowTerminal(!showTerminal);
        break;
      case 'focus-terminal':
        setShowTerminal(true);
        window.setTimeout(() => {
          document.querySelector<HTMLInputElement>('[data-terminal-input="true"]')?.focus();
        }, 50);
        break;
      default:
        break;
    }

    setActiveMenu(null);
  };

  const menuItems: Record<string, Array<{ label: string; action: string; disabled?: boolean }>> = {
    File: [
      { label: 'Open Folder', action: 'open-folder' },
      { label: 'Open File', action: 'open-file', disabled: !electron.isElectron },
      { label: 'Save', action: 'save', disabled: !activeTab || !electron.isElectron },
      { label: 'Close File', action: 'close-file', disabled: !activeTab },
      { label: 'Close All Files', action: 'close-all', disabled: tabs.length === 0 },
    ],
    Edit: [
      { label: 'Command Palette', action: 'command-palette' },
      { label: 'Save Active File', action: 'save', disabled: !activeTab || !electron.isElectron },
      { label: 'Settings', action: 'settings' },
    ],
    Selection: [
      { label: 'Ask AI About Selection', action: 'ai' },
    ],
    View: [
      { label: showExplorer ? 'Hide Explorer' : 'Show Explorer', action: 'explorer' },
      { label: 'Search', action: 'search' },
      { label: 'AI Chat', action: 'ai' },
      { label: showTerminal ? 'Hide Terminal' : 'Show Terminal', action: 'terminal' },
    ],
    Go: [
      { label: 'Explorer', action: 'explorer' },
      { label: 'Search', action: 'search' },
      { label: 'Git', action: 'git' },
      { label: 'Security', action: 'security' },
      { label: 'Problems', action: 'problems' },
    ],
    Run: [
      { label: 'Focus Terminal', action: 'focus-terminal' },
      { label: 'Git Panel', action: 'git' },
    ],
    Terminal: [
      { label: showTerminal ? 'Hide Terminal' : 'Show Terminal', action: 'terminal' },
      { label: 'Focus Terminal', action: 'focus-terminal' },
    ],
    Help: [
      { label: 'Morris AI', action: 'ai' },
      { label: 'Command Palette', action: 'command-palette' },
      { label: 'Settings', action: 'settings' },
    ],
  };
  
  return (
    <div className="relative h-10 bg-[#0a0a0f] border-b border-gray-800 flex items-center px-2 text-xs text-gray-300">
      {!electron.isElectron && (
        <div className="flex items-center gap-1 mr-4">
          <div className="w-5 h-5 bg-violet-600 rounded flex items-center justify-center font-bold text-[10px]">M</div>
          {/* <span className="font-medium">morris IDE</span> */}
        </div>
      )}
      <div className="flex items-center gap-1 text-gray-400">
        {Object.keys(menuItems).map(item => (
          <div key={item} className="relative">
            <button 
              className={`px-2 py-0.5 rounded transition-colors ${
                activeMenu === item 
                  ? 'text-white bg-white/20' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setActiveMenu(activeMenu === item ? null : item)}
            >
              {item}
            </button>
            {activeMenu === item && (
              <div className="absolute left-0 top-7 z-50 min-w-44 bg-gray-950 border border-gray-800 rounded shadow-xl py-1">
                {menuItems[item].map(entry => (
                  <button
                    key={entry.action}
                    onClick={() => !entry.disabled && runMenuAction(entry.action)}
                    disabled={entry.disabled}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white disabled:text-gray-600 disabled:hover:bg-transparent"
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <input 
          type="text" 
          placeholder="Search in project..." 
          onFocus={() => setActivePanel('search')}
          className="w-48 h-5 px-2 bg-[#3c3c3c] rounded text-xs placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <button
          onClick={openCommandPalette}
          className="h-5 px-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 flex items-center gap-1"
          title="Command Palette"
        >
          <Command size={12} />
          Cmd
        </button>
        {/* Profile Icon */}
        {!electron.isElectron ? (
          <div className="ml-4 flex items-center">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-6 h-6 border border-gray-700"
                }
              }}
              afterSignOutUrl="/" 
            />
          </div>
        ) : profile && (
          <div className="flex items-center gap-2 ml-4">
            <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center text-xs font-medium">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-300">{profile.name}</span>
            <button
              onClick={handleLogout}
              className="ml-2 p-1 text-gray-400 hover:text-white hover:bg-red-600 rounded transition-colors"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// File Explorer Panel
function FileExplorerPanel() {
  return <FileExplorer />;
}


// AI Panel
function AIPanel() {
  const [showSettings, setShowSettings] = useState(false);
  const ai = useAI();

  return (
    <div className="h-full bg-[#0a0a0f] flex flex-col">
      <div className="px-3 py-2 border-b border-gray-800 flex items-center gap-2">
        <Sparkles size={16} className="text-violet-400" />
        
        <div className="flex-1" />
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-500 hover:text-white p-1 rounded"
          title="AI Settings"
        >
          <Settings size={14} />
        </button>
      </div>
      {showSettings ? (
        <div className="p-3 border-b border-gray-800">
          <div className="text-xs text-gray-400 mb-2">AI Settings</div>
          <div className="space-y-2">
            <div className="text-xs text-gray-300">
              Status: {ai.isInitialized ? '✅ Connected' : '❌ Not Connected'}
            </div>
            <div className="text-xs text-gray-300">
              API Key: {ai.hasValidApiKey ? '✅ Configured' : ai.hasApiKey ? '⚠️ Invalid Format' : '❌ Not Configured'}
            </div>
            {!ai.hasValidApiKey && (
              <div className="text-xs text-yellow-400 max-w-xs">
                {ai.hasApiKey ? 'API key format is invalid. Please check your .env file.' : 'Set an API key in .env file or use the AI panel settings.'}
              </div>
            )}
            {ai.isInitialized && (
              <div className="text-xs text-green-400">✓ AI Ready ({ai.initializedProviders.join(', ')})</div>
            )}
          </div>
        </div>
      ) : null}
      <div className="flex-1 min-h-0">
        <AIChatPanel />
      </div>
    </div>
  );
}

// Search Panel - Optimized with React.memo
const SearchPanel = memo(function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { fileTree } = useProjectStore();
  const { openFile } = useEditorStore();
  const electron = useElectron();

  // Search utilities are imported at the top of the file

  // Debounced search function
  const debouncedSearch = debounce(async (searchTerm: string) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setResults([]);
      return;
    }

    // Check cache first
    const cachedResults = searchCache.get(term);
    if (cachedResults) {
      setResults(cachedResults);
      return;
    }

    setIsSearching(true);
    const matches: SearchResult[] = [];
    const files = flattenProjectFiles(fileTree).filter(isTextFile).slice(0, 500);

    // Batch file reading for better performance
    const fileReadPromises = files.map(async (file) => {
      if (file.name.toLowerCase().includes(term)) {
        matches.push({ path: file.path, name: file.name, line: 1, preview: file.path });
      }

      const readResult = await electron.readFile(file.path);
      if (!readResult.success || !readResult.content) return [];

      const lines = readResult.content.split('\n');
      const lineMatches: SearchResult[] = [];
      
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(term) && matches.length + lineMatches.length < 100) {
          lineMatches.push({
            path: file.path,
            name: file.name,
            line: index + 1,
            preview: line.trim().slice(0, 160),
          });
        }
      });
      
      return lineMatches;
    });

    // Wait for all file reads to complete
    const allMatches = await Promise.all(fileReadPromises);
    matches.push(...allMatches.flat());

    const finalResults = matches.slice(0, 100);
    
    // Cache the results
    searchCache.set(term, finalResults);
    setResults(finalResults);
    setIsSearching(false);
  }, 300);

  // Trigger search when query changes
  useEffect(() => {
    debouncedSearch(query);
  }, [query]);

  const openResult = async (result: SearchResult) => {
    const readResult = await electron.readFile(result.path);
    if (readResult.success && readResult.content !== undefined) {
      openFile(result.path, readResult.content);
    }
  };

  return (
    <div className="h-full bg-[#0a0a0f] p-4">
      <div className="text-white text-lg font-semibold mb-4">Search</div>
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
                placeholder="Search files..." 
        className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-violet-500 focus:outline-none"
      />
      <div className="mt-2 text-xs text-gray-500">
        {isSearching ? 'Searching...' : results.length > 0 ? `Found ${results.length} results` : 'Type to search...'}
      </div>
      <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
        {results.length === 0 ? (
          <div className="text-gray-400 text-sm">
            {fileTree ? 'Search results will appear here.' : 'Open a folder to search.'}
          </div>
        ) : results.map((result, index) => (
          <button
            key={`${result.path}:${result.line}:${index}`}
            onClick={() => openResult(result)}
            className="w-full text-left p-2 bg-gray-900 hover:bg-gray-800 rounded border border-gray-800"
          >
            <div className="text-xs text-violet-400 truncate">{result.name}:{result.line}</div>
            <div className="text-xs text-gray-500 truncate">{result.path}</div>
            <div className="text-sm text-gray-300 truncate">{result.preview}</div>
          </button>
        ))}
      </div>
    </div>
  );
});

// Git Panel
function GitPanel() {
  const { currentProject } = useProjectStore();
  const electron = useElectron();
  const [output, setOutput] = useState('Run git status to inspect this project.');
  const [commitMessage, setCommitMessage] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runGit = async (command: string | string[], callback?: () => void) => {
    if (!currentProject?.path) {
      setOutput('Open a project folder before running git commands.');
      return;
    }

    setIsRunning(true);
    
    try {
      const commandStr = Array.isArray(command) ? command.join(' ') : command;
      const result = await electron.execCommand(commandStr, currentProject.path);
      setOutput([result.stdout, result.stderr, result.error].filter(Boolean).join('\n') || 'Done.');
      
      if (callback) {
        callback();
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full bg-[#0a0a0f] p-4">
      <div className="text-white text-lg font-semibold mb-4">Git</div>
      <input
        type="text"
        value={commitMessage}
        onChange={(e) => setCommitMessage(e.target.value)}
        placeholder="Commit message"
        className="mb-2 w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-violet-500 focus:outline-none"
      />
      <div className="space-y-2">
        <button
          onClick={() => runGit(['git', 'status', '--short', '--branch'])}
          disabled={isRunning}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:bg-gray-800"
        >
          Status
        </button>
        <button
          onClick={() => {
            const sanitizedMessage = commitMessage.trim()
              .replace(/[;&|`$(){}[\]]/g, '') // Remove shell metacharacters
              .replace(/"/g, '\\"') // Escape quotes
              .substring(0, 200); // Limit length
            if (sanitizedMessage) {
              runGit(['git', 'add', '-A'], () => 
                runGit(['git', 'commit', '-m', sanitizedMessage])
              );
            }
          }}
          disabled={isRunning || !commitMessage.trim()}
          className="w-full px-3 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:bg-gray-800"
        >
          Commit Changes
        </button>
        <button
          onClick={() => runGit(['git', 'pull'])}
          disabled={isRunning}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:bg-gray-800"
        >
          Pull
        </button>
        <button
          onClick={() => runGit(['git', 'push'])}
          disabled={isRunning}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:bg-gray-800"
        >
          Push
        </button>
      </div>
      <div className="mt-4 text-gray-400 text-xs whitespace-pre-wrap font-mono bg-gray-900 border border-gray-800 rounded p-3 max-h-80 overflow-auto">
        {isRunning ? 'Running...' : output}
      </div>
    </div>
  );
}

// Security Panel
function SecurityPanel() {
  const { fileTree } = useProjectStore();
  const electron = useElectron();
  const [result, setResult] = useState<SecurityScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const runScan = async () => {
    setIsScanning(true);
    const files = [];

    for (const file of flattenProjectFiles(fileTree).filter(isTextFile).slice(0, 500)) {
      const readResult = await electron.readFile(file.path);
      if (readResult.success && readResult.content !== undefined) {
        files.push({ path: file.path, content: readResult.content });
      }
    }

    setResult(scanProject(files));
    setIsScanning(false);
  };

  return (
    <div className="h-full bg-[#0a0a0f] p-4">
      <div className="text-white text-lg font-semibold mb-4">Security</div>
      <button
        onClick={runScan}
        disabled={isScanning || !fileTree}
        className="mb-4 w-full px-3 py-2 bg-violet-600 disabled:bg-gray-700 text-white rounded hover:bg-violet-700"
      >
        {isScanning ? 'Scanning...' : 'Scan Project'}
      </button>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">API Key Encryption</span>
          <span className="text-green-400">✅ Enabled</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Secure Storage</span>
          <span className="text-green-400">✅ Active</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Code Scanning</span>
          <span className="text-yellow-400">⚠️ Optional</span>
        </div>
      </div>
      {result && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-gray-900 rounded p-2"><div className="text-gray-500">Files</div><div className="text-white">{result.scannedFiles}</div></div>
            <div className="bg-gray-900 rounded p-2"><div className="text-gray-500">Issues</div><div className="text-white">{result.totalIssues}</div></div>
            <div className="bg-gray-900 rounded p-2"><div className="text-gray-500">High+</div><div className="text-red-400">{result.criticalCount + result.highCount}</div></div>
          </div>
          <div className="space-y-2 max-h-80 overflow-auto">
            {result.issues.slice(0, 50).map((issue) => (
              <div key={issue.id} className="p-2 bg-gray-900 border border-gray-800 rounded text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-200">{issue.message}</span>
                  <span className="text-violet-400">{issue.severity}</span>
                </div>
                <div className="text-gray-500 truncate">{issue.filePath}:{issue.line}:{issue.column}</div>
                <div className="text-gray-400 mt-1 truncate">{issue.code}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Problems Panel
function ProblemsPanel() {
  const { problems, clearProblems } = useProblemsStore();
  const { openFile } = useEditorStore();
  const electron = useElectron();

  const openProblem = async (filePath?: string) => {
    if (!filePath) return;
    const result = await electron.readFile(filePath);
    if (result.success && result.content !== undefined) {
      openFile(filePath, result.content);
    }
  };

  return (
    <div className="h-full bg-[#0a0a0f] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-white text-lg font-semibold">Problems</div>
        <button
          onClick={clearProblems}
          className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300"
        >
          Clear
        </button>
      </div>
      {problems.length === 0 ? (
        <div className="text-sm text-gray-500">No problems captured. Run tests, build, or lint from the terminal presets.</div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-150px)]">
          {problems.map(problem => (
            <button
              key={problem.id}
              onClick={() => openProblem(problem.filePath)}
              className="w-full text-left p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded"
            >
              <div className="flex items-start justify-between gap-2">
                <div className={problem.severity === 'error' ? 'text-red-400 text-sm' : 'text-yellow-400 text-sm'}>
                  {problem.message}
                </div>
                <span className="text-[10px] text-gray-500 uppercase">{problem.source}</span>
              </div>
              {problem.filePath && (
                <div className="text-xs text-violet-400 truncate mt-1">
                  {problem.filePath}{problem.line ? `:${problem.line}:${problem.column || 1}` : ''}
                </div>
              )}
              <div className="text-xs text-gray-500 truncate mt-1">{problem.raw}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Plugins Panel
function PluginsPanel() {
  return (
    <div className="h-full bg-[#0a0a0f] p-4">
      <div className="text-white text-lg font-semibold mb-4">Plugins</div>
      <div className="space-y-2">
        <div className="p-3 bg-gray-800 rounded">
          <div className="text-white font-medium">Prettier</div>
          <div className="text-gray-400 text-sm">Code formatter</div>
          <div className="text-green-400 text-xs mt-1">✅ Installed</div>
        </div>
        <div className="p-3 bg-gray-800 rounded">
          <div className="text-white font-medium">ESLint</div>
          <div className="text-gray-400 text-sm">Code linting</div>
          <div className="text-green-400 text-xs mt-1">✅ Installed</div>
        </div>
        <button className="w-full px-3 py-2 bg-violet-600 text-white rounded hover:bg-violet-700">
          Browse Plugins
        </button>
      </div>
    </div>
  );
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActivePanel: (panel: string | null) => void;
  setShowExplorer: (show: boolean) => void;
  setShowTerminal: (show: boolean) => void;
}

function CommandPalette({ isOpen, onClose, setActivePanel, setShowExplorer, setShowTerminal }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const { tabs, activeTabId, closeTab, closeAllTabs } = useEditorStore();
  const { setInputValue } = useTerminalStore();

  if (!isOpen) return null;

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const commands = [
    { label: 'Show Explorer', run: () => setShowExplorer(true) },
    { label: 'Show Search', run: () => setActivePanel('search') },
    { label: 'Show AI Chat', run: () => setActivePanel('ai') },
    { label: 'Show Agent Harness', run: () => setActivePanel('agents') },
    { label: 'Show Git', run: () => setActivePanel('git') },
    { label: 'Show Security', run: () => setActivePanel('security') },
    { label: 'Show Problems', run: () => setActivePanel('problems') },
    { label: 'Show Settings', run: () => setActivePanel('settings') },
    { label: 'Focus Terminal', run: () => {
      setShowTerminal(true);
      window.setTimeout(() => document.querySelector<HTMLInputElement>('[data-terminal-input="true"]')?.focus(), 50);
    } },
    { label: 'Prepare Test Command', run: () => {
      setShowTerminal(true);
      setInputValue('npm test');
    } },
    { label: 'Prepare Build Command', run: () => {
      setShowTerminal(true);
      setInputValue('npm run build');
    } },
    { label: 'Prepare Lint Command', run: () => {
      setShowTerminal(true);
      setInputValue('npm run lint');
    } },
    { label: 'Close Active File', disabled: !activeTab, run: () => activeTab && closeTab(activeTab.id) },
    { label: 'Close All Files', disabled: tabs.length === 0, run: closeAllTabs },
  ];

  const filtered = commands.filter(command => command.label.toLowerCase().includes(query.toLowerCase()));

  const runCommand = (command: typeof commands[number]) => {
    if (command.disabled) return;
    command.run();
    setQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center pt-24">
      <div className="w-[520px] bg-gray-950 border border-gray-800 rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2">
          <Command size={16} className="text-violet-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filtered[0]) runCommand(filtered[0]);
            }}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
          />
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.map(command => (
            <button
              key={command.label}
              onClick={() => runCommand(command)}
              disabled={command.disabled}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 disabled:text-gray-600 disabled:hover:bg-transparent"
            >
              {command.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Settings Panel
function SettingsPanel() {
  const electron = useElectron();
  const { settings, updateSettings } = useEditorStore();
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [diagnostics, setDiagnostics] = useState(false);

  return (
    <div className="h-full bg-[#0a0a0f] p-4 overflow-y-auto">
      <div className="text-white text-lg font-semibold mb-4">Settings</div>
      <div className="space-y-4">
        <div className="p-3 bg-gray-900 border border-gray-800 rounded">
          <div className="text-sm text-gray-200 mb-1">Runtime Mode</div>
          <div className={electron.isElectron ? 'text-green-400 text-sm' : 'text-yellow-400 text-sm'}>
            {electron.isElectron ? 'Desktop mode: full IDE features enabled' : 'Browser mode: preview only'}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Use desktop mode for local folders, terminal commands, Git, tests, and real-time file watching.
          </p>
        </div>

        {/* Editor Theme */}
        <div>
          <label className="text-gray-300 text-sm block mb-1">Editor Theme</label>
          <select
            value={settings.theme || 'vs-dark'}
            onChange={(e) => updateSettings({ theme: e.target.value as any })}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-violet-500 focus:outline-none"
          >
            <option value="vs-dark">Dark (VS Code)</option>
            <option value="vs-light">Light</option>
            <option value="hc-black">High Contrast Dark</option>
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="text-gray-300 text-sm block mb-1">Font Size: {settings.fontSize}px</label>
          <input
            type="range"
            min={10}
            max={24}
            step={1}
            value={settings.fontSize}
            onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>10px</span>
            <span>24px</span>
          </div>
        </div>

        {/* Tab Size */}
        <div>
          <label className="text-gray-300 text-sm block mb-1">Tab Size</label>
          <select
            value={settings.tabSize}
            onChange={(e) => updateSettings({ tabSize: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-violet-500 focus:outline-none"
          >
            {[2, 4, 8].map(n => <option key={n} value={n}>{n} spaces</option>)}
          </select>
        </div>

        {/* Word Wrap */}
        <div>
          <label className="text-gray-300 text-sm block mb-1">Word Wrap</label>
          <select
            value={settings.wordWrap}
            onChange={(e) => updateSettings({ wordWrap: e.target.value as any })}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-violet-500 focus:outline-none"
          >
            <option value="off">Off</option>
            <option value="on">On</option>
            <option value="wordWrapColumn">At Column</option>
            <option value="bounded">Bounded</option>
          </select>
        </div>

        {/* Minimap */}
        <div>
          <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={settings.minimap}
              onChange={(e) => updateSettings({ minimap: e.target.checked })}
              className="accent-violet-500"
            />
            Show Minimap
          </label>
        </div>

        {/* Auto Save */}
        <div>
          <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoSave === 'afterDelay'}
              onChange={(e) => updateSettings({ autoSave: e.target.checked ? 'afterDelay' : 'off' })}
              className="accent-violet-500"
            />
            Auto Save (after delay)
          </label>
        </div>

        <div className="p-3 bg-gray-900 border border-gray-800 rounded">
          <div className="text-sm text-gray-200 mb-2">Release Checklist</div>
          <ul className="space-y-1 text-xs text-gray-400">
            <li>Run terminal presets: tests, build, and lint.</li>
            <li>Publish Electron installers from the release output.</li>
            <li>Wire landing download cards to hosted release artifacts.</li>
            <li>Rotate any API keys that were committed or shared during testing.</li>
            <li>Code-split Monaco and AI panels before high-traffic web launch.</li>
          </ul>
        </div>
        <div className="p-3 bg-gray-900 border border-gray-800 rounded">
          <div className="text-sm text-gray-200 mb-2">Production Services</div>
          <label className="flex items-center justify-between gap-3 text-sm text-gray-300">
            <span>Auto-update checks</span>
            <input
              type="checkbox"
              checked={autoUpdate}
              onChange={(event) => setAutoUpdate(event.target.checked)}
              className="accent-violet-500"
            />
          </label>
          <label className="mt-2 flex items-center justify-between gap-3 text-sm text-gray-300">
            <span>Opt-in crash diagnostics</span>
            <input
              type="checkbox"
              checked={diagnostics}
              onChange={(event) => setDiagnostics(event.target.checked)}
              className="accent-violet-500"
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">
            These controls are ready for wiring to a release feed and diagnostics endpoint before public distribution.
          </p>
        </div>
      </div>
    </div>
  );
}

// Status Bar
function StatusBar() {
  const { selectedPath } = useProjectStore();
  const { currentProject } = useProjectStore();
  const problemCount = useProblemsStore(state => state.problems.length);
  const electron = useElectron();
  const [branch, setBranch] = useState('main');

  // Read real git branch whenever a project is opened
  useEffect(() => {
    if (!currentProject?.path || !electron.isElectron) return;
    electron.execCommand('git branch --show-current', currentProject.path)
      .then((result) => {
        const b = result.stdout?.trim();
        if (b) setBranch(b);
      })
      .catch(() => {});
  }, [currentProject?.path, electron]);
  
  return (
    <div className="h-6 bg-[#007acc] text-white text-xs flex items-center px-2 justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <GitBranch size={12} />
          <span>{branch}</span>
        </div>
        <span>{problemCount} {problemCount === 1 ? 'Problem' : 'Problems'}</span>
      </div>
      <div className="flex items-center gap-3 text-gray-200">
        {selectedPath && (
          <span className="truncate max-w-[200px]" title={selectedPath}>
            {selectedPath.split(/[/\\]/).pop()}
          </span>
        )}
        <div className="flex items-center gap-1 text-green-300">
          <Sparkles size={10} />
          <span>Morris AI</span>
        </div>
      </div>
    </div>
  );
}

export default function IDELayout() {
  const [showTerminal, setShowTerminal] = useState(true);
  const [showAI] = useState(true);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showExplorer, setShowExplorer] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const hasDirtyTabs = useEditorStore(state => state.tabs.some(tab => tab.isDirty));

  // Add IDE page class for proper overflow handling
  useEffect(() => {
    document.body.classList.add('ide-page');
    return () => {
      document.body.classList.remove('ide-page');
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasDirtyTabs) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasDirtyTabs]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault();
        setShowTerminal(current => !current);
      }
      // Ctrl+B: toggle explorer
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setShowExplorer(current => !current);
      }
      // Ctrl+Shift+A: toggle AI panel
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setActivePanel(prev => prev === 'ai' || prev === null ? 'closed' : null);
      }
      // Ctrl+Shift+F: Global Search
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setActivePanel('search');
      }
      // Ctrl+Shift+G: Git Panel
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'g') {
        event.preventDefault();
        setActivePanel('git');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Listen for AI quick fixes from Monaco Editor
    const handleAIFix = () => {
      setActivePanel('ai');
    };
    window.addEventListener('ai-quick-fix', handleAIFix as EventListener);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('ai-quick-fix', handleAIFix as EventListener);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-white">
      <TitleBar />
      <MenuBar
        setActivePanel={setActivePanel}
        showExplorer={showExplorer}
        setShowExplorer={setShowExplorer}
        showTerminal={showTerminal}
        setShowTerminal={setShowTerminal}
        openCommandPalette={() => setIsCommandPaletteOpen(true)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activePanel={activePanel}
          setActivePanel={(panel) => {
            if (panel === 'files') {
              setShowExplorer(!showExplorer);
              setActivePanel(null);
            } else {
              setActivePanel(panel);
            }
          }}
        />
        
        {/* File Explorer */}
        {showExplorer && (
          <div className="w-60 border-r border-[#3c3c3c] flex-shrink-0">
            <FileExplorerPanel />
          </div>
        )}

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 bg-[#0a0a0f] min-h-0">
            <MonacoEditorPanel />
          </div>
          
          {/* Terminal Toggle + Panel */}
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="h-6 bg-[#0a0a0f] border-t border-gray-800 flex items-center px-3 text-gray-400 hover:text-white text-xs gap-1"
          >
            {showTerminal ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span>Terminal</span>
          </button>
          
          {showTerminal && (
            <div className="h-48 border-t border-gray-800">
              <TerminalPanel />
            </div>
          )}
        </div>

        {/* Dynamic Panel */}
        {(showAI || activePanel) && (
          <div className="w-80 border-l border-[#3c3c3c] flex-shrink-0">
            {activePanel === 'search' && <SearchPanel />}
            {activePanel === 'agents' && <AgentPanel />}
            {activePanel === 'git' && <GitPanel />}
            {activePanel === 'security' && <SecurityPanel />}
            {activePanel === 'problems' && <ProblemsPanel />}
            {activePanel === 'plugins' && <PluginsPanel />}
            {activePanel === 'settings' && <SettingsPanel />}
            {(!activePanel || activePanel === 'ai') && <AIPanel />}
          </div>
        )}
      </div>

      <StatusBar />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        setActivePanel={setActivePanel}
        setShowExplorer={setShowExplorer}
        setShowTerminal={setShowTerminal}
      />
    </div>
  );
}
