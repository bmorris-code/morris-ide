#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing Environment Variables for Vite...\n');

const envLocalPath = path.join(process.cwd(), '.env.local');

// Read current content
let currentContent = '';
if (fs.existsSync(envLocalPath)) {
  currentContent = fs.readFileSync(envLocalPath, 'utf8');
}

// Extract the actual keys from current content
const clerkKeyMatch = currentContent.match(/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=(.+)/);
const clerkSecretMatch = currentContent.match(/CLERK_SECRET_KEY=(.+)/);
const groqKeyMatch = currentContent.match(/GROQ_API_KEY=(.+)/);

const clerkKey = clerkKeyMatch ? clerkKeyMatch[1].trim() : '';
const clerkSecret = clerkSecretMatch ? clerkSecretMatch[1].trim() : '';
const groqKey = groqKeyMatch ? groqKeyMatch[1].trim() : '';

// Create correct Vite format
const newContent = `# Morris IDE Environment Variables

# Clerk Authentication (https://clerk.com)
# Get your keys from: https://dashboard.clerk.com
VITE_CLERK_PUBLISHABLE_KEY=${clerkKey}

# Groq AI (https://console.groq.com)
VITE_GROQ_API_KEY=${groqKey}

# Optional: Supabase (for license management/database)
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your_anon_key_here
`;

// Write the fixed content
fs.writeFileSync(envLocalPath, newContent);

console.log('✅ Environment variables fixed!\n');
console.log('Changes made:');
console.log('• NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY → VITE_CLERK_PUBLISHABLE_KEY');
console.log('• GROQ_API_KEY → VITE_GROQ_API_KEY');
console.log('• Removed CLERK_SECRET_KEY (not needed in frontend)\n');

console.log('📋 New .env.local content:');
console.log('─'.repeat(50));
console.log(newContent);
console.log('─'.repeat(50));

console.log('\n🔄 Please restart the development server:');
console.log('   1. Stop the current server (Ctrl+C)');
console.log('   2. Run: npm run dev');
console.log('   3. Test login at: http://localhost:5174/login\n');

// Check if keys look valid
const hasValidClerkKey = clerkKey.startsWith('pk_test_') && clerkKey.length > 20;
const hasValidGroqKey = groqKey.startsWith('gsk_') && groqKey.length > 20;

console.log('🔍 Key Validation:');
console.log(`   Clerk Key: ${hasValidClerkKey ? '✅ Valid format' : '❌ Invalid format'}`);
console.log(`   Groq Key: ${hasValidGroqKey ? '✅ Valid format' : '❌ Invalid format'}`);

if (hasValidClerkKey && hasValidGroqKey) {
  console.log('\n🎉 Ready for full authentication and AI features!');
} else {
  console.log('\n⚠️  Some keys may be invalid - please double-check them');
}
