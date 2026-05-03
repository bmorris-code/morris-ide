#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create .env.local if it doesn't exist
const envLocalPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envLocalPath)) {
  console.log('Creating .env.local from .env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envLocalPath, envExample);
    console.log('✅ .env.local created successfully!');
  } else {
    // Create a basic .env.local
    const basicEnv = `# Morris IDE Environment Variables
# Copy this file and fill in your actual API keys

# Clerk Authentication (https://clerk.com)
# Get your keys from: https://dashboard.clerk.com
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here

# Groq AI (https://console.groq.com)
VITE_GROQ_API_KEY=your_groq_api_key_here

# Optional: Supabase (for license management/database)
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your_anon_key_here
`;
    fs.writeFileSync(envLocalPath, basicEnv);
    console.log('✅ Basic .env.local created successfully!');
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Get your Clerk keys from: https://dashboard.clerk.com');
  console.log('2. Get your Groq API key from: https://console.groq.com');
  console.log('3. Update .env.local with your actual API keys');
  console.log('4. Restart your development server');
} else {
  console.log('✅ .env.local already exists');
}

// Check if keys are configured
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const hasClerkKey = envContent.includes('VITE_CLERK_PUBLISHABLE_KEY=') && 
                      !envContent.includes('VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here');
  const hasGroqKey = envContent.includes('VITE_GROQ_API_KEY=') && 
                    !envContent.includes('VITE_GROQ_API_KEY=your_groq_api_key_here');
  
  console.log('\n🔑 Configuration status:');
  console.log(`Clerk: ${hasClerkKey ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`Groq AI: ${hasGroqKey ? '✅ Configured' : '❌ Not configured'}`);
  
  if (!hasClerkKey || !hasGroqKey) {
    console.log('\n⚠️  Some API keys are not configured. Please update .env.local');
  } else {
    console.log('\n🎉 All API keys are configured! You\'re ready to go.');
  }
}
