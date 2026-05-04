export default function DebugEnv() {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  const moonshotKey = import.meta.env.VITE_MOONSHOT_API_KEY;
  const deepseekKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Debug</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-900 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Clerk Configuration</h2>
          <p><strong>Key Present:</strong> {clerkKey ? 'YES' : 'NO'}</p>
          <p><strong>Key Format:</strong> {clerkKey?.startsWith('pk_test_') ? 'VALID' : 'INVALID'}</p>
          <p><strong>Key Length:</strong> {clerkKey?.length || 0}</p>
          <p><strong>Key Preview:</strong> {clerkKey ? `${clerkKey.substring(0, 10)}...` : 'N/A'}</p>
        </div>
        
        <div className="p-4 bg-gray-900 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Groq Configuration</h2>
          <p><strong>Key Present:</strong> {groqKey ? 'YES' : 'NO'}</p>
          <p><strong>Key Format:</strong> {groqKey?.startsWith('gsk_') ? 'VALID' : 'INVALID'}</p>
          <p><strong>Key Length:</strong> {groqKey?.length || 0}</p>
          <p><strong>Key Preview:</strong> {groqKey ? `${groqKey.substring(0, 10)}...` : 'N/A'}</p>
        </div>
        
        <div className="p-4 bg-gray-900 rounded-lg border border-violet-500/30">
          <h2 className="text-lg font-semibold mb-2 text-violet-400">Kimi (Moonshot) Configuration ⭐</h2>
          <p><strong>Key Present:</strong> {moonshotKey ? 'YES' : 'NO'}</p>
          <p><strong>Key Format:</strong> {moonshotKey?.startsWith('sk-') || moonshotKey?.startsWith('sk-proj-') ? 'VALID' : 'INVALID'}</p>
          <p><strong>Key Length:</strong> {moonshotKey?.length || 0}</p>
          <p><strong>Key Preview:</strong> {moonshotKey ? `${moonshotKey.substring(0, 10)}...` : 'N/A'}</p>
          <p className="text-xs text-violet-400/70 mt-2">Get your key at platform.moonshot.cn</p>
        </div>
        
        <div className="p-4 bg-gray-900 rounded-lg border border-cyan-500/30">
          <h2 className="text-lg font-semibold mb-2 text-cyan-400">DeepSeek Configuration 🔥</h2>
          <p><strong>Key Present:</strong> {deepseekKey ? 'YES' : 'NO'}</p>
          <p><strong>Key Format:</strong> {deepseekKey?.startsWith('sk-') ? 'VALID' : 'INVALID'}</p>
          <p><strong>Key Length:</strong> {deepseekKey?.length || 0}</p>
          <p><strong>Key Preview:</strong> {deepseekKey ? `${deepseekKey.substring(0, 10)}...` : 'N/A'}</p>
          <p className="text-xs text-cyan-400/70 mt-2">Get your key at platform.deepseek.com/api_keys</p>
        </div>
        
        <div className="p-4 bg-gray-900 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">All Environment Variables</h2>
          <div className="text-sm font-mono">
            {Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')).map(key => (
              <div key={key}>
                <strong>{key}:</strong> {import.meta.env[key] ? 'SET' : 'NOT SET'}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <a href="/login" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg">
          Go to Login
        </a>
      </div>
    </div>
  );
}
