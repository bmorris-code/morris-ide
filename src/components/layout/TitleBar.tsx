import { useElectron } from '../../hooks';
import { Minus, Square, X } from 'lucide-react';
import './TitleBar.css';

export default function TitleBar() {
  const electron = useElectron();

  // Only show title bar in Electron
  if (!electron.isElectron) {
    return null;
  }

  return (
    <div className="h-8 bg-[#0a0a0f] border-b border-gray-800 flex items-center justify-between px-4 drag-region">
      {/* App Logo and Name */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-violet-600 rounded flex items-center justify-center font-bold text-[10px]">
          M
        </div>
        <span className="text-sm text-gray-300 font-medium">Morris IDE</span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center gap-0 no-drag">
        <button
          onClick={() => electron.minimize()}
          className="h-8 w-12 flex items-center justify-center text-gray-400 hover:bg-[#3c3c3c] hover:text-white transition-colors"
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => electron.maximize()}
          className="h-8 w-12 flex items-center justify-center text-gray-400 hover:bg-[#3c3c3c] hover:text-white transition-colors"
          title="Maximize"
        >
          <Square size={12} />
        </button>
        <button
          onClick={() => electron.close()}
          className="h-8 w-12 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
