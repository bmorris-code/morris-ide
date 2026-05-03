import React, { useRef, useEffect, useCallback } from 'react';
import { Hammer, ListChecks, Play, Trash2, Terminal, Square } from 'lucide-react';
import { useTerminalStore } from '../../store';
import { useProblemsStore } from '../../store';
import { useElectron } from '../../hooks';

const TerminalPanel: React.FC = () => {
  const {
    lines,
    inputValue,
    isRunning,
    currentDirectory,
    addLine,
    clearTerminal,
    setInputValue,
    addToHistory,
    setCurrentDirectory,
    navigateHistory,
    setRunning
  } = useTerminalStore();
  const { clearProblems, ingestTerminalLine } = useProblemsStore();

  const electron = useElectron();
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const runningProcessIdRef = useRef<string | null>(null);
  const isRunningRef = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const executeCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;

    addLine('input', `$ ${command}`);
    addToHistory(command);
    setInputValue('');
    if (/npm\s+(test|run\s+(test|build|lint))|tsc|eslint|vitest|jest/i.test(command)) {
      clearProblems();
    }

    // Handle built-in commands
    const cmd = command.trim().toLowerCase();

    if (cmd === 'clear' || cmd === 'cls') {
      clearTerminal();
      return;
    }

    if (cmd === 'help') {
      addLine('system', `
Available commands:
  clear/cls    - Clear the terminal
  help         - Show this help message
  pwd          - Print working directory

You can also run any system command (npm, git, etc.)
      `.trim());
      return;
    }

    if (cmd === 'pwd') {
      addLine('output', currentDirectory);
      return;
    }

    if (cmd.startsWith('cd ')) {
      const newPath = command.trim().substring(3).trim();
      addLine('system', `Changing directory to ${newPath}`);
      setCurrentDirectory(newPath);
      return;
    }

    // Execute via Electron
    if (!electron.isElectron) {
      addLine('error', 'Terminal commands require Electron environment');
      return;
    }

    setRunning(true);
    isRunningRef.current = true;

    try {
      const result = await electron.spawnCommand(command, [], currentDirectory);
      if (result.processId) {
        runningProcessIdRef.current = result.processId;
      }

      if (!result.success && result.error) {
        addLine('error', result.error);
        setRunning(false);
        isRunningRef.current = false;
      }
    } catch (err) {
      addLine('error', `Error: ${err}`);
      setRunning(false);
      isRunningRef.current = false;
    }
  }, [electron, currentDirectory, addLine, addToHistory, setInputValue, clearTerminal, setRunning, setCurrentDirectory]);

  useEffect(() => {
    if (!electron.isElectron) return;

    const removeOutputListener = electron.onTerminalOutput((event) => {
      if (runningProcessIdRef.current && event.processId !== runningProcessIdRef.current) return;
      if (!runningProcessIdRef.current && !isRunningRef.current) return;

      event.content.split(/\r?\n/).forEach(line => {
        if (line.trim()) {
          addLine(event.type, line);
          ingestTerminalLine(line);
        }
      });
    });

    const removeExitListener = electron.onTerminalExit((event) => {
      if (runningProcessIdRef.current && event.processId !== runningProcessIdRef.current) return;
      if (!runningProcessIdRef.current && !isRunningRef.current) return;

      if (!event.success) {
        const reason = event.signal ? `signal ${event.signal}` : `code ${event.code}`;
        addLine('error', `Process exited with ${reason}`);
      }

      runningProcessIdRef.current = null;
      isRunningRef.current = false;
      setRunning(false);
    });

    return () => {
      removeOutputListener();
      removeExitListener();
    };
  }, [electron, addLine, setRunning, ingestTerminalLine]);

  const stopRunningProcess = async () => {
    const processId = runningProcessIdRef.current;
    if (!processId) {
      setRunning(false);
      isRunningRef.current = false;
      return;
    }

    const result = await electron.killProcess(processId);
    if (!result.success && result.error) {
      addLine('error', result.error);
    }
    runningProcessIdRef.current = null;
    setRunning(false);
    isRunningRef.current = false;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(inputValue);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevCmd = navigateHistory('up');
      setInputValue(prevCmd);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextCmd = navigateHistory('down');
      setInputValue(nextCmd);
    }
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case 'input': return 'text-violet-400';
      case 'output': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'system': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Terminal size={14} className="text-violet-400" />
          <span>Terminal</span>
          {isRunning && (
            <span className="flex items-center gap-1 text-yellow-400">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              Running
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => executeCommand('npm test')}
            className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-violet-400"
            title="Run Tests"
            disabled={isRunning || !electron.isElectron}
          >
            <ListChecks size={14} />
          </button>
          <button
            onClick={() => executeCommand('npm run build')}
            className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-violet-400"
            title="Run Build"
            disabled={isRunning || !electron.isElectron}
          >
            <Hammer size={14} />
          </button>
          <button
            onClick={() => executeCommand('npm run lint')}
            className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-violet-400"
            title="Run Lint"
            disabled={isRunning || !electron.isElectron}
          >
            <Play size={14} />
          </button>
          <button
            onClick={clearTerminal}
            className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-red-400"
            title="Clear"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Output */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-3 text-sm"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.length === 0 ? (
          <div className="text-gray-500">
            Morris Terminal Ready - Type 'help' for available commands.
          </div>
        ) : (
          lines.map((line) => (
            <div key={line.id} className={`${getLineColor(line.type)} whitespace-pre-wrap`}>
              {line.content}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-800 bg-gray-900">
        <span className="text-violet-400">$</span>
        <input
          ref={inputRef}
          data-terminal-input="true"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={electron.isElectron ? "Type a command..." : "Terminal requires Electron"}
          className="flex-1 bg-transparent text-green-400 outline-none text-sm placeholder-gray-600"
          disabled={isRunning || !electron.isElectron}
        />
        {isRunning && (
          <button
            onClick={stopRunningProcess}
            className="p-1 hover:bg-gray-800 rounded text-red-400"
            title="Stop"
          >
            <Square size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TerminalPanel;
