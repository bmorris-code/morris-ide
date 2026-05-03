// Project Types for Morris IDE

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  extension?: string;
  size?: number;
  lastModified?: number;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  rootNode: FileNode | null;
  createdAt: number;
  lastOpenedAt: number;
}

export interface ProjectState {
  currentProject: Project | null;
  recentProjects: Project[];
  isLoading: boolean;
  error: string | null;
}

export interface FileOperation {
  type: 'create' | 'rename' | 'delete' | 'move' | 'copy';
  sourcePath: string;
  targetPath?: string;
  timestamp: number;
}

// File icons based on extension
export const getFileIcon = (name: string, type: 'file' | 'directory'): string => {
  if (type === 'directory') return '📁';
  
  const ext = name.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    ts: '🔷',
    tsx: '⚛️',
    js: '🟨',
    jsx: '⚛️',
    json: '📋',
    html: '🌐',
    css: '🎨',
    scss: '🎨',
    md: '📝',
    py: '🐍',
    rs: '🦀',
    go: '🐹',
    java: '☕',
    sql: '🗃️',
    yaml: '⚙️',
    yml: '⚙️',
    env: '🔐',
    lock: '🔒',
    git: '📦',
    svg: '🖼️',
    png: '🖼️',
    jpg: '🖼️',
  };
  return iconMap[ext || ''] || '📄';
};

// Generate unique project ID
export const generateProjectId = (): string => {
  return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate unique file ID
export const generateFileId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
