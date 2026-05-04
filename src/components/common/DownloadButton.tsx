import React, { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';

interface OSVersion {
  name: string;
  icon: string;
  url: string;
  filename: string;
  size: string;
}

const OS_VERSIONS: OSVersion[] = [
  { name: 'Windows', icon: '🪟', url: 'https://github.com/bmorris-code/morris-ide/releases/latest/download/MorrisIDE-1.0.0-Setup.exe', filename: 'MorrisIDE-Setup.exe', size: '82MB' },
  { name: 'macOS', icon: '🍎', url: 'https://github.com/bmorris-code/morris-ide/releases/latest/download/MorrisIDE-1.0.0.dmg', filename: 'MorrisIDE.dmg', size: '95MB' },
  { name: 'Linux', icon: '🐧', url: 'https://github.com/bmorris-code/morris-ide/releases/latest/download/MorrisIDE-1.0.0.AppImage', filename: 'MorrisIDE.AppImage', size: '88MB' },
];

export const DownloadButton: React.FC<{ className?: string, variant?: 'primary' | 'outline' }> = ({ className = '', variant = 'primary' }) => {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const getDetectedOS = () => {
    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes('win')) return OS_VERSIONS[0];
    if (platform.includes('mac')) return OS_VERSIONS[1];
    if (platform.includes('linux')) return OS_VERSIONS[2];
    return OS_VERSIONS[0]; // Default to Windows
  };

  const detectedOS = getDetectedOS();

  const handleDownload = (os: OSVersion) => {
    if (downloadProgress !== null) return;
    
    setShowDropdown(false);
    setDownloadProgress(0);
    const interval = window.setInterval(() => {
      setDownloadProgress(prev => {
        if (prev !== null && prev < 100) {
          return prev + 5;
        }
        window.clearInterval(interval);
        
        const link = document.createElement('a');
        link.href = os.url;
        link.download = os.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => setDownloadProgress(null), 1500);
        return 100;
      });
    }, 100);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="flex">
        <button
          onClick={() => handleDownload(detectedOS)}
          disabled={downloadProgress !== null}
          className={`
            relative overflow-hidden flex items-center gap-2 px-6 py-3 rounded-l-xl font-bold transition-all active:scale-95 disabled:scale-100
            ${variant === 'primary' 
              ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20' 
              : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'}
          `}
        >
          {downloadProgress !== null && (
            <div 
              className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-100"
              style={{ width: `${downloadProgress}%` }}
            />
          )}
          <div className="relative z-10 flex items-center gap-2">
            <Download size={18} className={downloadProgress !== null ? 'animate-bounce' : ''} />
            <span className="whitespace-nowrap">
              {downloadProgress !== null 
                ? `Downloading... ${downloadProgress}%` 
                : `Download for ${detectedOS.name}`
              }
            </span>
          </div>
        </button>
        
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={downloadProgress !== null}
          className={`
            px-3 py-3 rounded-r-xl transition-all border-l border-white/10
            ${variant === 'primary' 
              ? 'bg-violet-600 hover:bg-violet-700 text-white' 
              : 'bg-white/5 hover:bg-white/10 border-y border-r border-white/10 text-white'}
          `}
        >
          <ChevronDown size={18} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
          {OS_VERSIONS.map((os) => (
            <button
              key={os.name}
              onClick={() => handleDownload(os)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span>{os.icon}</span>
                <div>
                  <div className="text-sm font-medium text-white">{os.name}</div>
                  <div className="text-[10px] text-gray-500">{os.size}</div>
                </div>
              </div>
              <Download size={14} className="text-gray-500" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
