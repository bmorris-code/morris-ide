import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, FileNode } from '../types/project';
import { generateProjectId, generateFileId } from '../types/project';

interface ProjectStore {
  // State
  currentProject: Project | null;
  recentProjects: Project[];
  fileTree: FileNode | null;
  selectedPath: string | null;
  expandedFolders: Set<string>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentProject: (project: Project | null) => void;
  setFileTree: (tree: FileNode | null) => void;
  selectPath: (path: string | null) => void;
  toggleFolder: (path: string) => void;
  expandFolder: (path: string) => void;
  collapseFolder: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  addToRecent: (project: Project) => void;
  removeFromRecent: (projectId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  createProject: (name: string, path: string) => Project;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      currentProject: null,
      recentProjects: [],
      fileTree: null,
      selectedPath: null,
      expandedFolders: new Set<string>(),
      isLoading: false,
      error: null,

      setCurrentProject: (project) => {
        set({ currentProject: project, error: null });
        if (project) {
          get().addToRecent(project);
        }
      },

      setFileTree: (tree) => set({ fileTree: tree }),

      selectPath: (path) => set({ selectedPath: path }),

      toggleFolder: (path) => {
        set(state => {
          const newExpanded = new Set(state.expandedFolders);
          if (newExpanded.has(path)) {
            newExpanded.delete(path);
          } else {
            newExpanded.add(path);
          }
          return { expandedFolders: newExpanded };
        });
      },

      expandFolder: (path) => {
        set(state => {
          const newExpanded = new Set(state.expandedFolders);
          newExpanded.add(path);
          return { expandedFolders: newExpanded };
        });
      },

      collapseFolder: (path) => {
        set(state => {
          const newExpanded = new Set(state.expandedFolders);
          newExpanded.delete(path);
          return { expandedFolders: newExpanded };
        });
      },

      expandAll: () => {
        const collectPaths = (node: FileNode | null): string[] => {
          if (!node) return [];
          if (node.type !== 'directory') return [];
          return [node.path, ...(node.children?.flatMap(collectPaths) || [])];
        };
        const allPaths = collectPaths(get().fileTree);
        set({ expandedFolders: new Set(allPaths) });
      },

      collapseAll: () => set({ expandedFolders: new Set() }),

      addToRecent: (project) => {
        set(state => {
          const filtered = state.recentProjects.filter(p => p.id !== project.id);
          const updated = { ...project, lastOpenedAt: Date.now() };
          return { recentProjects: [updated, ...filtered].slice(0, 10) };
        });
      },

      removeFromRecent: (projectId) => {
        set(state => ({
          recentProjects: state.recentProjects.filter(p => p.id !== projectId),
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      createProject: (name, path) => {
        const project: Project = {
          id: generateProjectId(),
          name,
          path,
          rootNode: null,
          createdAt: Date.now(),
          lastOpenedAt: Date.now(),
        };
        return project;
      },
    }),
    {
      name: 'morris-project-store',
      partialize: (state) => ({ recentProjects: state.recentProjects }),
    }
  )
);

// Helper to build file tree from flat file list
export const buildFileTree = (_files: string[], rootPath: string): FileNode => {
  const root: FileNode = {
    id: generateFileId(),
    name: rootPath.split(/[/\\]/).pop() || rootPath,
    path: rootPath,
    type: 'directory',
    children: [],
  };

  // Implementation would parse files and build tree structure
  return root;
};
