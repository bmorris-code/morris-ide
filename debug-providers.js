// Debug script to check AI providers
console.log('=== AI Providers Debug ===');

// Check if AI_PROVIDERS includes DeepSeek
const providers = [
  { id: 'groq', name: 'Groq' },
  { id: 'moonshot', name: 'Kimi (Moonshot)' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'deepseek', name: 'DeepSeek' }
];

console.log('Available providers:');
providers.forEach(p => {
  console.log(`- ${p.id}: ${p.name}`);
});

// Check environment variables
console.log('\n=== Environment Variables ===');
const envVars = [
  'VITE_GROQ_API_KEY',
  'VITE_MOONSHOT_API_KEY', 
  'VITE_OPENAI_API_KEY',
  'VITE_DEEPSEEK_API_KEY',
  'VITE_CLERK_PUBLISHABLE_KEY'
];

envVars.forEach(envVar => {
  const value = process.env[envVar] || import.meta.env?.[envVar];
  console.log(`${envVar}: ${value ? 'SET' : 'NOT SET'}`);
  if (value && value.includes('your_actual') || value?.includes('demo_key')) {
    console.log(`  ⚠️  Using template value: ${value.substring(0, 20)}...`);
  }
});

console.log('\n=== Debug Complete ===');
