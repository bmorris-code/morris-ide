import { create } from 'zustand';
import { type FileTab, type EditorSettings, DEFAULT_EDITOR_SETTINGS, generateTabId, getLanguageFromPath } from '../types/editor';

interface EditorStore {
  // State
  tabs: FileTab[];
  activeTabId: string | null;
  settings: EditorSettings;
  selectedText: string;
  
  // Actions
  openFile: (path: string, content: string) => void;
  closeTab: (tabId: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  markTabClean: (tabId: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  updateSettings: (settings: Partial<EditorSettings>) => void;
  getActiveTab: () => FileTab | null;
  getTabByPath: (path: string) => FileTab | undefined;
  setSelectedText: (text: string) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  settings: DEFAULT_EDITOR_SETTINGS,
  selectedText: '',

  openFile: (path: string, content: string) => {
    const existingTab = get().tabs.find(tab => tab.path === path);
    
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    const newTab: FileTab = {
      id: generateTabId(),
      path,
      name: path.split('/').pop() || path.split('\\').pop() || path,
      content,
      language: getLanguageFromPath(path),
      isDirty: false,
      lastModified: Date.now(),
    };

    set(state => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
  },

  closeTab: (tabId: string) => {
    set(state => {
      const tabIndex = state.tabs.findIndex(t => t.id === tabId);
      const newTabs = state.tabs.filter(t => t.id !== tabId);
      
      let newActiveId = state.activeTabId;
      if (state.activeTabId === tabId) {
        if (newTabs.length === 0) {
          newActiveId = null;
        } else if (tabIndex >= newTabs.length) {
          newActiveId = newTabs[newTabs.length - 1].id;
        } else {
          newActiveId = newTabs[tabIndex].id;
        }
      }
      
      return { tabs: newTabs, activeTabId: newActiveId };
    });
  },

  closeAllTabs: () => set({ tabs: [], activeTabId: null }),

  closeOtherTabs: (tabId: string) => {
    set(state => ({
      tabs: state.tabs.filter(t => t.id === tabId),
      activeTabId: tabId,
    }));
  },

  setActiveTab: (tabId: string) => set({ activeTabId: tabId }),

  updateTabContent: (tabId: string, content: string) => {
    set(state => ({
      tabs: state.tabs.map(tab =>
        tab.id === tabId
          ? { ...tab, content, isDirty: true, lastModified: Date.now() }
          : tab
      ),
    }));
  },

  markTabClean: (tabId: string) => {
    set(state => ({
      tabs: state.tabs.map(tab =>
        tab.id === tabId ? { ...tab, isDirty: false } : tab
      ),
    }));
  },

  reorderTabs: (fromIndex: number, toIndex: number) => {
    set(state => {
      const newTabs = [...state.tabs];
      const [removed] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, removed);
      return { tabs: newTabs };
    });
  },

  updateSettings: (newSettings: Partial<EditorSettings>) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },

  getActiveTab: () => {
    const state = get();
    return state.tabs.find(t => t.id === state.activeTabId) || null;
  },

  getTabByPath: (path: string) => {
    return get().tabs.find(t => t.path === path);
  },

  setSelectedText: (text: string) => {
    set({ selectedText: text });
  },
}));
