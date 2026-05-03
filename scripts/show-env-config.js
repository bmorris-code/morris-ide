#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔑 Morris IDE Environment Configuration Guide\n');

// Read current .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
let currentConfig = '';

if (fs.existsSync(envLocalPath)) {
  currentConfig = fs.readFileSync(envLocalPath, 'utf8');
  console.log('Current .env.local content:\n');
  console.log('─'.repeat(50));
  console.log(currentConfig);
  console.log('─'.repeat(50));
} else {
  console.log('❌ .env.local file not found');
}

console.log('\n📋 Configuration Instructions:\n');

console.log('1. Get Clerk Keys:');
console.log('   • Go to: https://dashboard.clerk.com');
console.log('   • Create a new application or select existing');
console.log('   • Go to "API Keys" section');
console.log('   • Copy your Publishable key (starts with pk_test_)');
console.log('   • Replace VITE_CLERK_PUBLISHABLE_KEY in .env.local\n');

console.log('2. Get Groq API Key:');
console.log('   • Go to: https://console.groq.com');
console.log('   • Sign up or sign in');
console.log('   • Go to "API Keys" section');
console.log('   • Create a new API key');
console.log('   • Replace VITE_GROQ_API_KEY in .env.local\n');

console.log('3. Example configuration:');
console.log('VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_clerk_key_here');
console.log('VITE_GROQ_API_KEY=gsk_your_actual_groq_key_here\n');

console.log('4. After configuration:');
console.log('   • Restart the development server: npm run dev');
console.log('   • Test login at: http://localhost:5174/login');
console.log('   • Test signup at: http://localhost:5174/signup\n');

// Check what's currently configured
const hasClerkKey = currentConfig.includes('VITE_CLERK_PUBLISHABLE_KEY=pk_test_') && 
                    !currentConfig.includes('VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here');
const hasGroqKey = currentConfig.includes('VITE_GROQ_API_KEY=gsk_') && 
                  !currentConfig.includes('VITE_GROQ_API_KEY=your_groq_api_key_here');

console.log('🔍 Current Status:');
console.log(`   Clerk Authentication: ${hasClerkKey ? '✅ Configured' : '❌ Not configured'}`);
console.log(`   Groq AI Integration: ${hasGroqKey ? '✅ Configured' : '❌ Not configured'}`);

if (!hasClerkKey || !hasGroqKey) {
  console.log('\n⚠️  Demo mode will be used until keys are configured');
  console.log('   • Login will work with any email/password');
  console.log('   • AI features will be limited');
} else {
  console.log('\n🎉 All features ready!');
}
