import { useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { X, Circle, Save } from 'lucide-react';
import { useEditorStore } from '../../store';
import { useElectron } from '../../hooks';
import type { FileTab } from '../../types/editor';
import type * as Monaco from 'monaco-editor';

interface TabProps {
  tab: FileTab;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

function EditorTab({ tab, isActive, onSelect, onClose }: TabProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 border-r border-gray-800 cursor-pointer group ${
        isActive ? 'bg-gray-900 text-white' : 'bg-gray-950 text-gray-400 hover:bg-gray-900'
      }`}
      onClick={onSelect}
    >
      {tab.isDirty && <Circle size={8} className="text-violet-400 fill-violet-400" />}
      <span className="text-sm truncate max-w-[120px]">{tab.name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function MonacoEditorPanel() {
  const { tabs, activeTabId, setActiveTab, closeTab, updateTabContent, markTabClean, settings } = useEditorStore();
  const electron = useElectron();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  const activeTab = tabs.find(t => t.id === activeTabId);

  const requestCloseTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isDirty && !window.confirm(`Discard unsaved changes to ${tab.name}?`)) {
      return;
    }
    closeTab(tabId);
  }, [closeTab, tabs]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Add save command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (activeTabId && value !== undefined) {
      updateTabContent(activeTabId, value);
    }
  }, [activeTabId, updateTabContent]);

  const handleSave = useCallback(async () => {
    if (!activeTab || !electron.isElectron) return;

    const result = await electron.api?.fs.writeFile(activeTab.path, activeTab.content);
    if (result?.success) {
      markTabClean(activeTab.id);
    }
  }, [activeTab, electron, markTabClean]);

  // Welcome screen when no tabs are open
  if (tabs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-6xl mb-4">🚀</div>
        <h2 className="text-2xl font-bold text-violet-400 mb-2">Morris IDE</h2>
        <p className="text-sm mb-6">AI-Native Secure Development Environment</p>
        <div className="text-sm space-y-2 text-center">
          <p>Open a folder from the Explorer panel</p>
          <p>or press <kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl+O</kbd> to open files</p>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-gray-800 rounded-lg">
            <div className="text-violet-400 font-semibold mb-1">🔒 Security Scanning</div>
            <p>Real-time vulnerability detection</p>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <div className="text-violet-400 font-semibold mb-1">🤖 AI Assistant</div>
            <p>Powered by Groq LLMs</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab Bar */}
      <div className="flex items-center bg-gray-950 border-b border-gray-800 overflow-x-auto">
        {tabs.map((tab) => (
          <EditorTab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onSelect={() => setActiveTab(tab.id)}
            onClose={() => requestCloseTab(tab.id)}
          />
        ))}
        <div className="flex-1" />
        {activeTab?.isDirty && (
          <button
            onClick={handleSave}
            className="px-3 py-2 text-gray-400 hover:text-violet-400 flex items-center gap-1 text-sm"
            title="Save (Ctrl+S)"
          >
            <Save size={14} />
            Save
          </button>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1">
        {activeTab ? (
          <Editor
            height="100%"
            language={activeTab.language}
            theme="vs-dark"
            value={activeTab.content}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            options={{
              fontSize: settings.fontSize,
              fontFamily: settings.fontFamily,
              minimap: { enabled: settings.minimap },
              lineNumbers: settings.lineNumbers,
              wordWrap: settings.wordWrap,
              tabSize: settings.tabSize,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              padding: { top: 16 },
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a file to edit
          </div>
        )}
      </div>

      {/* Status Bar */}
      {activeTab && (
        <div className="h-6 bg-gray-950 border-t border-gray-800 flex items-center px-4 text-xs text-gray-500 justify-between">
          <div className="flex items-center gap-4">
            <span>{activeTab.language}</span>
            <span>UTF-8</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{activeTab.path}</span>
            {activeTab.isDirty && <span className="text-violet-400">● Modified</span>}
          </div>
        </div>
      )}
    </div>
  );
}
