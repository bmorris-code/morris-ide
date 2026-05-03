import { Rocket, Shield, Bot } from 'lucide-react';

export default function WelcomeScreen() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400 px-8">
      {/* Rocket Icon */}
      <div className="w-24 h-24 bg-violet-600/20 rounded-full flex items-center justify-center mb-8">
        <Rocket size={48} className="text-violet-400" />
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold text-white mb-2">Morris IDE</h1>
      
      {/* Subtitle */}
      <p className="text-lg text-gray-500 mb-8">AI-Native Secure Development Environment</p>
      
      {/* Instructions */}
      <p className="text-sm text-gray-600 mb-8 text-center">
        Open a folder from the Explorer panel or press <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Ctrl+O</kbd> to open files
      </p>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700 transition-colors">
          <Shield size={24} className="text-violet-400" />
          <span className="text-sm font-medium text-white">Security Scanning</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700 transition-colors">
          <Bot size={24} className="text-violet-400" />
          <span className="text-sm font-medium text-white">AI Assistant</span>
        </button>
      </div>
    </div>
  );
}
