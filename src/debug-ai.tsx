import { AI_PROVIDERS } from './types/ai';

export default function DebugAI() {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  return (
    <div className="p-4 bg-gray-900 text-white">
      <h2 className="text-lg font-bold mb-4">Debug Info</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Clerk Status</h3>
        <p>Key Present: {clerkPubKey ? 'YES' : 'NO'}</p>
        <p>Key Value: {clerkPubKey ? `${clerkPubKey.substring(0, 10)}...` : 'NOT SET'}</p>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">AI Providers</h3>
        {AI_PROVIDERS.map(provider => (
          <div key={provider.id} className="mb-1">
            <span className="text-violet-400">{provider.id}:</span> {provider.name}
          </div>
        ))}
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Environment Variables</h3>
        {Object.keys(import.meta.env)
          .filter(key => key.startsWith('VITE_') && key.includes('API'))
          .map(key => (
            <div key={key} className="mb-1">
              <span className="text-green-400">{key}:</span> {import.meta.env[key] ? 'SET' : 'NOT SET'}
            </div>
          ))}
      </div>
    </div>
  );
}
