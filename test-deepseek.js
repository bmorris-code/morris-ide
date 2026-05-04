// Test script for DeepSeek API integration
import { initializeProvider, generateAIResponse } from './src/backend/ai/index.js';

async function testDeepSeek() {
  console.log('🧪 Testing DeepSeek API integration...\n');
  
  // Test with a demo API key (you'll need to replace this with a real key)
  const testApiKey = 'sk-testkeyfordeepseekintegration';
  
  try {
    // Initialize DeepSeek provider
    console.log('📝 Initializing DeepSeek provider...');
    const initialized = await initializeProvider('deepseek', testApiKey);
    
    if (!initialized) {
      console.log('❌ Failed to initialize DeepSeek provider');
      console.log('💡 Make sure to set a real DeepSeek API key in your .env file:');
      console.log('   VITE_DEEPSEEK_API_KEY=sk-your-real-deepseek-api-key-here');
      return;
    }
    
    console.log('✅ DeepSeek provider initialized successfully');
    
    // Test API call
    console.log('\n🔄 Testing API call...');
    const response = await generateAIResponse(
      'Write a simple "Hello, World!" function in JavaScript',
      undefined,
      {
        provider: 'deepseek',
        model: 'deepseek-coder',
        temperature: 0.3,
        maxTokens: 500
      }
    );
    
    if (response.error) {
      console.log('❌ API call failed:', response.error);
      console.log('💡 This is expected with a demo key. Use a real DeepSeek API key to test.');
    } else {
      console.log('✅ API call successful!');
      console.log('\n📄 Response:');
      console.log(response.content);
      
      if (response.usage) {
        console.log('\n📊 Token usage:', response.usage);
      }
      
      if (response.latencyMs) {
        console.log(`⏱️  Latency: ${response.latencyMs}ms`);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Running in browser environment');
  console.log('💡 To test DeepSeek:');
  console.log('1. Get an API key from https://platform.deepseek.com/api_keys');
  console.log('2. Add it to your .env.local file: VITE_DEEPSEEK_API_KEY=sk-your-key-here');
  console.log('3. Open Morris IDE and configure DeepSeek in settings');
  console.log('4. Try sending a message to test the integration');
} else {
  testDeepSeek();
}

export { testDeepSeek };
