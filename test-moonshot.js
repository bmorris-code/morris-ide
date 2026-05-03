// Test script to verify Moonshot API key
// Run with: node test-moonshot.js

const API_KEY = 'sk-your-actual-key-here'; // Replace with your key

async function testMoonshotAPI() {
  console.log('Testing Moonshot API...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  console.log('Key format valid:', API_KEY.startsWith('sk-'));
  
  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'kimi-k2-6',
        messages: [
          { role: 'user', content: 'Hello, test message' }
        ],
        max_tokens: 10,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response:', errorData);
      
      if (response.status === 401) {
        console.error('❌ Authentication failed - Check API key');
      }
    } else {
      const data = await response.json();
      console.log('✅ Success! Response:', data);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testMoonshotAPI();
