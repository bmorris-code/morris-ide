import { create } from 'zustand';

export interface Problem {
  id: string;
  source: 'terminal' | 'typescript' | 'test' | 'lint';
  severity: 'error' | 'warning' | 'info';
  filePath?: string;
  line?: number;
  column?: number;
  message: string;
  raw: string;
  timestamp: number;
}

interface ProblemsStore {
  problems: Problem[];
  addProblem: (problem: Omit<Problem, 'id' | 'timestamp'>) => void;
  clearProblems: () => void;
  ingestTerminalLine: (line: string) => void;
}

const generateProblemId = () => `problem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const parseTerminalProblem = (line: string): Omit<Problem, 'id' | 'timestamp'> | null => {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const tsMatch = trimmed.match(/^(.+\.(?:ts|tsx|js|jsx|json|css|scss|md))\((\d+),(\d+)\):\s+(error|warning)\s+([^:]+):\s+(.+)$/i);
  if (tsMatch) {
    return {
      source: 'typescript',
      severity: tsMatch[4].toLowerCase() === 'warning' ? 'warning' : 'error',
      filePath: tsMatch[1],
      line: Number(tsMatch[2]),
      column: Number(tsMatch[3]),
      message: `${tsMatch[5]}: ${tsMatch[6]}`,
      raw: line,
    };
  }

  const viteMatch = trimmed.match(/^(.+\.(?:ts|tsx|js|jsx|css|scss)):(\d+):(\d+):\s+(.+)$/i);
  if (viteMatch) {
    return {
      source: 'terminal',
      severity: /warn/i.test(viteMatch[4]) ? 'warning' : 'error',
      filePath: viteMatch[1],
      line: Number(viteMatch[2]),
      column: Number(viteMatch[3]),
      message: viteMatch[4],
      raw: line,
    };
  }

  if (/\b(error|failed|failure|exception)\b/i.test(trimmed)) {
    return {
      source: /\b(test|spec|expect)\b/i.test(trimmed) ? 'test' : 'terminal',
      severity: 'error',
      message: trimmed,
      raw: line,
    };
  }

  if (/\b(warn|warning)\b/i.test(trimmed)) {
    return {
      source: 'terminal',
      severity: 'warning',
      message: trimmed,
      raw: line,
    };
  }

  return null;
};

export const useProblemsStore = create<ProblemsStore>((set, get) => ({
  problems: [],

  addProblem: (problem) => {
    set(state => ({
      problems: [
        ...state.problems,
        {
          ...problem,
          id: generateProblemId(),
          timestamp: Date.now(),
        },
      ].slice(-300),
    }));
  },

  clearProblems: () => set({ problems: [] }),

  ingestTerminalLine: (line) => {
    const parsed = parseTerminalProblem(line);
    if (!parsed) return;

    const duplicate = get().problems.some(problem => problem.raw === parsed.raw);
    if (!duplicate) {
      get().addProblem(parsed);
    }
  },
}));
