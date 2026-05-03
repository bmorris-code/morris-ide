export interface FileNode {
  id: string;
  path: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  lastModified?: number;
}

export interface FlattenedFileNode {
  id: string;
  path: string;
  name: string;
  type: string;
}

export interface FileTreeState {
  fileTree: FileNode | null;
  selectedPath: string | null;
  expandedPaths: Record<string, boolean>;
}

export interface FileTreeActions {
  setFileTree: (tree: FileNode | null) => void;
  selectPath: (path: string) => void;
  toggleExpanded: (path: string) => void;
  setExpandedPaths: (paths: Record<string, boolean>) => void;
}
