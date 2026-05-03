#!/usr/bin/env node

import { chromium } from 'playwright';

async function testClerkLogin() {
  console.log('🧪 Testing Clerk Login Integration...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Login page loaded');
    
    // Check if Clerk SignIn component is present
    const clerkSignIn = await page.locator('[data-testid="clerk-sign-in"]').first();
    const clerkForm = await page.locator('form').first();
    const emailInput = await page.locator('input[type="email"]').first();
    
    console.log('🔍 Checking for Clerk components:');
    console.log(`   Clerk SignIn container: ${await clerkSignIn.count() > 0 ? '✅' : '❌'}`);
    console.log(`   Form element: ${await clerkForm.count() > 0 ? '✅' : '❌'}`);
    console.log(`   Email input: ${await emailInput.count() > 0 ? '✅' : '❌'}`);
    
    // Check if it's demo mode (custom form) or Clerk mode
    const demoForm = await page.locator('form:has-text("Sign In")').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    
    if (await demoForm.count() > 0 && await passwordInput.count() > 0) {
      console.log('\n⚠️  Demo mode detected - Clerk may not be properly configured');
      
      // Test demo login
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      
      console.log('📝 Testing demo login...');
      await demoForm.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/ide')) {
        console.log('✅ Demo login successful!');
      } else {
        console.log('❌ Demo login failed');
      }
    } else {
      console.log('\n🎉 Clerk mode detected - Authentication is properly configured!');
      
      // Look for Clerk-specific elements
      const clerkButtons = await page.locator('button[type="submit"]').first();
      console.log(`   Submit button: ${await clerkButtons.count() > 0 ? '✅' : '❌'}`);
    }
    
    // Test signup page as well
    await page.goto('http://localhost:5173/signup');
    await page.waitForLoadState('networkidle');
    
    console.log('\n✅ Signup page loaded');
    
    const signupEmail = await page.locator('input[type="email"]').first();
    console.log(`   Signup email input: ${await signupEmail.count() > 0 ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testClerkLogin().catch(console.error);
