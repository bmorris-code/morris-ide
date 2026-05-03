import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import FileExplorer from '../explorer/FileExplorer';
import MonacoEditorPanel from '../editor/MonacoEditor';
import AIChatPanel from '../ai/AIChatPanel';
import TerminalPanel from '../terminal/TerminalPanel';

export default function DashboardLayout() {
  const [showTerminal, setShowTerminal] = useState(true);
  const terminalHeight = 200;

  return (
    <div className="h-screen flex bg-black text-white">
      <Sidebar activePanel={''} setActivePanel={function (_panel: string | null): void {
        throw new Error('Function not implemented.');
      } } />

      <div className="flex flex-col flex-1">
        <Header />

        <div className="flex flex-1 overflow-hidden">
          {/* File Explorer */}
          <div className="w-72 border-r border-gray-800 bg-gray-950 flex-shrink-0">
            <FileExplorer />
          </div>

          {/* Main Content Area - Editor + Terminal */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Editor */}
            <div className="flex-1 bg-gray-900 min-h-0">
              <MonacoEditorPanel />
            </div>

            {/* Terminal Toggle Button */}
            <button
              onClick={() => setShowTerminal(!showTerminal)}
              className="h-6 bg-gray-950 border-t border-gray-800 flex items-center justify-center hover:bg-gray-900 text-gray-500 hover:text-violet-400"
            >
              {showTerminal ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              <span className="text-xs ml-1">Terminal</span>
            </button>

            {/* Terminal Panel */}
            {showTerminal && (
              <div
                className="border-t border-gray-800 flex-shrink-0"
                style={{ height: terminalHeight }}
              >
                <TerminalPanel />
              </div>
            )}
          </div>

          {/* AI Chat Panel */}
          <div className="w-96 border-l border-gray-800 bg-gray-950 flex-shrink-0">
            <AIChatPanel />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}