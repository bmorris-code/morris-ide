import { create } from 'zustand';
import type { TerminalLine } from '../types';

interface TerminalStore {
  // State
  lines: TerminalLine[];
  currentDirectory: string;
  isRunning: boolean;
  commandHistory: string[];
  historyIndex: number;
  inputValue: string;

  // Actions
  addLine: (type: TerminalLine['type'], content: string) => void;
  clearTerminal: () => void;
  setCurrentDirectory: (dir: string) => void;
  setRunning: (running: boolean) => void;
  addToHistory: (command: string) => void;
  navigateHistory: (direction: 'up' | 'down') => string;
  setInputValue: (value: string) => void;
}

const generateLineId = () => `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  lines: [
    {
      id: generateLineId(),
      type: 'system',
      content: '🚀 Morris Terminal Ready - Type "help" for available commands',
      timestamp: Date.now(),
    },
  ],
  currentDirectory: '~',
  isRunning: false,
  commandHistory: [],
  historyIndex: -1,
  inputValue: '',

  addLine: (type, content) => {
    const line: TerminalLine = {
      id: generateLineId(),
      type,
      content,
      timestamp: Date.now(),
    };
    set(state => ({
      lines: [...state.lines, line].slice(-500), // Keep last 500 lines
    }));
  },

  clearTerminal: () => {
    set({
      lines: [
        {
          id: generateLineId(),
          type: 'system',
          content: '🧹 Terminal cleared',
          timestamp: Date.now(),
        },
      ],
    });
  },

  setCurrentDirectory: (dir) => set({ currentDirectory: dir }),

  setRunning: (running) => set({ isRunning: running }),

  addToHistory: (command) => {
    set(state => ({
      commandHistory: [...state.commandHistory, command].slice(-100),
      historyIndex: -1,
    }));
  },

  navigateHistory: (direction) => {
    const state = get();
    const { commandHistory, historyIndex } = state;
    
    if (commandHistory.length === 0) return '';

    let newIndex: number;
    if (direction === 'up') {
      newIndex = historyIndex === -1 
        ? commandHistory.length - 1 
        : Math.max(0, historyIndex - 1);
    } else {
      newIndex = historyIndex === -1 
        ? -1 
        : Math.min(commandHistory.length - 1, historyIndex + 1);
    }

    set({ historyIndex: newIndex });
    return newIndex === -1 ? '' : commandHistory[newIndex];
  },

  setInputValue: (value) => set({ inputValue: value }),
}));
