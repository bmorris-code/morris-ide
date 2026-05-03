import { useCallback, useEffect, useRef, useState } from 'react';
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
      className={`flex items-center gap-2 px-3 py-2 border-r border-gray-800 cursor-pointer group ${isActive ? 'bg-gray-900 text-white' : 'bg-gray-950 text-gray-400 hover:bg-gray-900'
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
  const { tabs, activeTabId, setActiveTab, closeTab, updateTabContent, markTabClean, settings, setSelectedText } = useEditorStore();
  const electron = useElectron();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

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

    // Register AI Quick Fix Command
    const aiFixCommandId = editor.addCommand(0, (_, marker: Monaco.editor.IMarkerData) => {
      const model = editor.getModel();
      const codeContext = model ? model.getValueInRange(marker) : '';

      window.dispatchEvent(new CustomEvent('ai-quick-fix', {
        detail: {
          error: marker.message,
          code: codeContext,
          line: marker.startLineNumber,
          fullCode: model ? model.getValue() : ''
        }
      }));
    });

    // Register Code Action Provider for Quick Fixes
    monaco.languages.registerCodeActionProvider('*', {
      provideCodeActions: (_model, _range, context) => {
        const actions = context.markers.flatMap(marker => [
          {
            title: `✨ Fix with Morris AI`,
            diagnostics: [marker],
            kind: 'quickfix',
            isPreferred: true,
            command: {
              id: aiFixCommandId!,
              title: 'Fix with Morris AI',
              arguments: [marker]
            }
          },
          {
            title: `🧠 Explain with Morris AI`,
            diagnostics: [marker],
            kind: 'quickfix',
            command: {
              id: aiFixCommandId!,
              title: 'Explain with Morris AI',
              arguments: [{ ...marker, action: 'explain' }]
            }
          }
        ]);
        return {
          actions: actions,
          dispose: () => { }
        };
      }
    });

    // Register Hover Provider for AI Quick Actions
    monaco.languages.registerHoverProvider('*', {
      provideHover: (model, position) => {
        // Get markers at the current position
        const markers = monaco.editor.getModelMarkers({
          resource: model.uri,
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber
        });

        // Filter markers that are at or near the cursor position
        const relevantMarkers = markers.filter(marker =>
          position.column >= marker.startColumn &&
          position.column <= marker.endColumn
        );

        if (relevantMarkers.length > 0) {
          const marker = relevantMarkers[0];
          return {
            range: new monaco.Range(
              marker.startLineNumber,
              marker.startColumn,
              marker.endLineNumber,
              marker.endColumn
            ),
            contents: [
              { value: `**Error:** ${marker.message}` },
              {
                value: `🔧 **Quick Actions:**\n• ✨ Fix with Morris AI\n• 🧠 Explain with Morris AI\n\n💡 *Right-click on the error or use Ctrl+. to see options*`
              }
            ]
          };
        }
        return null;
      }
    });

    // Track selected text so AI panel can use it
    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection();
      if (selection && !selection.isEmpty()) {
        const model = editor.getModel();
        if (model) {
          setSelectedText(model.getValueInRange(selection));
        }
      } else {
        setSelectedText('');
      }
    });

    // Track live cursor position for status bar
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
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

  // Auto-save: fire handleSave after autoSaveDelay ms whenever the tab becomes dirty
  useEffect(() => {
    if (settings.autoSave !== 'afterDelay' || !activeTab?.isDirty) return;
    const timer = setTimeout(() => {
      handleSave();
    }, settings.autoSaveDelay || 1000);
    return () => clearTimeout(timer);
  }, [activeTab?.isDirty, activeTab?.content, settings.autoSave, settings.autoSaveDelay, handleSave]);

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
            theme={settings.theme || 'vs-dark'}
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
            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="truncate max-w-[300px]" title={activeTab.path}>{activeTab.path}</span>
            {activeTab.isDirty && <span className="text-violet-400">● Modified</span>}
          </div>
        </div>
      )}
    </div>
  );
}
