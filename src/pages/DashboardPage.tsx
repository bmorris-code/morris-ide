import { useUser, UserButton, useClerk } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Download, Code2, Key, Settings, ArrowRight, Laptop, Server, Zap } from 'lucide-react';
import { useState } from 'react';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const handleDownload = () => {
    if (downloadProgress !== null) return;

    setDownloadProgress(0);
    const interval = window.setInterval(() => {
      setDownloadProgress(prev => {
        if (prev !== null && prev < 100) {
          return prev + 5;
        }
        window.clearInterval(interval);

        // Trigger actual download
        const link = document.createElement('a');
        link.href = 'https://github.com/morris-ide/morris-ide/releases/latest/download/MorrisIDE-1.0.0-Setup.exe';
        link.download = 'MorrisIDE-Setup.exe';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => setDownloadProgress(null), 1000);
        return 100;
      });
    }, 100);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-gray-100 font-sans selection:bg-violet-500/30 overflow-x-hidden">
      {/* Top Navigation */}
      <nav className="border-b border-white/5 bg-gray-950/40 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Code2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Morris IDE</span>
          </div>
          <div className="flex items-center gap-4">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border-2 border-gray-800 hover:border-violet-500 transition-colors"
                }
              }}
              afterSignOutUrl="/"
            />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            Welcome back, {user?.firstName || 'Developer'}
          </h1>
          <p className="text-gray-400 text-lg">Manage your workspace, API keys, and downloads from your command center.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Action Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Desktop App Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-gray-800/50 to-gray-900 border border-gray-700/50 p-1 hover:border-violet-500/50 transition-colors duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative h-full bg-gray-900 rounded-xl p-8 flex flex-col sm:flex-row items-center gap-8">
                <div className="w-24 h-24 shrink-0 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.3)]">
                  <Laptop size={40} className="text-white" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-semibold mb-3 border border-violet-500/20">
                    <Zap size={12} /> Recommended
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Morris IDE Desktop</h2>
                  <p className="text-gray-400 mb-6 max-w-md">
                    Experience the full power of Morris IDE. Local file system access, unlimited terminal capabilities, and hardware-accelerated performance.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                    <button
                      onClick={handleDownload}
                      disabled={downloadProgress !== null}
                      className="relative px-6 py-3 rounded-lg bg-white text-gray-950 font-semibold hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg shadow-white/10 active:scale-95 disabled:scale-100 overflow-hidden"
                    >
                      {downloadProgress !== null && (
                        <div
                          className="absolute inset-y-0 left-0 bg-violet-500/20 transition-all duration-100"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      )}
                      <Download size={18} className={downloadProgress !== null ? 'animate-bounce' : ''} />
                      {downloadProgress !== null ? `Downloading... ${downloadProgress}%` : 'Download for Windows'}
                    </button>
                    <button className="px-6 py-3 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors border border-gray-700">
                      Other versions
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Web Version Card */}
            <div className="rounded-2xl bg-gray-900 border border-gray-800 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center border border-gray-700">
                  <Server size={28} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Web Editor</h3>
                  <p className="text-gray-400 text-sm">Quick edits in your browser without local access.</p>
                </div>
              </div>
              <Link
                to="/ide"
                className="px-6 py-3 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors flex items-center gap-2 shrink-0 shadow-lg shadow-violet-600/20"
              >
                Launch Web IDE <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Sidebar / Settings */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/5 p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <Key className="text-violet-400" size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">API Keys</h3>
              </div>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Connect your AI providers. Keys are stored securely and synced to your desktop IDE.
              </p>

              <div className="space-y-4">
                {/* Groq Key */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Groq API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value="gsk_************************"
                      readOnly
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
                    />
                    <button className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors">
                      Edit
                    </button>
                  </div>
                </div>

                {/* Moonshot Key */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Moonshot API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="sk-..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-violet-500"
                    />
                    <button className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              onClick={() => clerk.openUserProfile()}
              className="rounded-2xl bg-gray-900 border border-gray-800 p-6 flex items-start gap-4 hover:border-violet-500/50 hover:bg-gray-800/50 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700 group-hover:bg-violet-500/10 group-hover:border-violet-500/50 transition-colors">
                <Settings size={20} className="text-gray-400 group-hover:text-violet-400" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Account Settings</h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-400">Manage billing, notifications, and preferences.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
