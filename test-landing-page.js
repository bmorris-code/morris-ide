#!/usr/bin/env node

import { chromium } from 'playwright';

async function testLandingPage() {
  console.log('🧪 Testing Morris IDE Landing Page...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the landing page
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Page loaded successfully');
    
    // Test responsive design
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 812, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // Check if main elements are visible
      const heroVisible = await page.isVisible('h1');
      const navVisible = await page.isVisible('nav');
      const pricingVisible = await page.isVisible('#pricing');
      
      console.log(`📱 ${viewport.name} (${viewport.width}x${viewport.height}):`);
      console.log(`   Hero: ${heroVisible ? '✅' : '❌'}`);
      console.log(`   Navigation: ${navVisible ? '✅' : '❌'}`);
      console.log(`   Pricing: ${pricingVisible ? '✅' : '❌'}`);
    }
    
    // Test navigation links
    console.log('\n🔗 Testing Navigation Links:');
    
    const links = [
      { selector: 'a[href="/login"]', name: 'Sign In' },
      { selector: 'a[href="/ide"]', name: 'Get Started' },
      { selector: 'a[href="/signup"]', name: 'Create Account' }
    ];
    
    for (const link of links) {
      try {
        await page.click(link.selector);
        await page.waitForTimeout(1000);
        const currentUrl = page.url();
        
        if (currentUrl.includes(link.name === 'Get Started' ? 'ide' : link.name === 'Sign In' ? 'login' : 'signup')) {
          console.log(`   ${link.name}: ✅ Works`);
        } else {
          console.log(`   ${link.name}: ❌ Failed`);
        }
        
        // Go back to landing page
        await page.goto('http://localhost:5174');
        await page.waitForLoadState('networkidle');
      } catch (error) {
        console.log(`   ${link.name}: ❌ Error - ${error.message}`);
      }
    }
    
    // Test smooth scrolling to sections
    console.log('\n📜 Testing Smooth Scrolling:');
    
    const sections = [
      { selector: 'a[href="#features"]', name: 'Features' },
      { selector: 'a[href="#pricing"]', name: 'Pricing' },
      { selector: 'a[href="#download"]', name: 'Download' }
    ];
    
    for (const section of sections) {
      try {
        const element = await page.locator(section.selector);
        if (await element.isVisible()) {
          console.log(`   ${section.name} link: ✅ Visible`);
        } else {
          console.log(`   ${section.name} link: ❌ Not visible`);
        }
      } catch (error) {
        console.log(`   ${section.name} link: ❌ Error`);
      }
    }
    
    // Test interactive elements
    console.log('\n🎯 Testing Interactive Elements:');
    
    // Test buttons
    const buttons = [
      { selector: 'button:has-text("Download for Free")', name: 'Download Button' },
      { selector: 'button:has-text("Subscribe")', name: 'Newsletter Subscribe' }
    ];
    
    for (const button of buttons) {
      try {
        const element = await page.locator(button.selector);
        const isVisible = await element.isVisible();
        const isEnabled = await element.isEnabled();
        
        console.log(`   ${button.name}: ${isVisible && isEnabled ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`   ${button.name}: ❌ Error`);
      }
    }
    
    // Test form elements
    console.log('\n📝 Testing Form Elements:');
    
    try {
      const emailInput = await page.locator('input[type="email"]');
      const isInputVisible = await emailInput.isVisible();
      console.log(`   Email Input: ${isInputVisible ? '✅' : '❌'}`);
      
      if (isInputVisible) {
        await emailInput.fill('test@example.com');
        const value = await emailInput.inputValue();
        console.log(`   Email Input typing: ${value === 'test@example.com' ? '✅' : '❌'}`);
      }
    } catch (error) {
      console.log(`   Email Input: ❌ Error`);
    }
    
    // Check for console errors
    console.log('\n🐛 Checking for Console Errors:');
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`   ❌ Console Error: ${msg.text()}`);
      }
    });
    
    // Wait a bit to catch any console errors
    await page.waitForTimeout(2000);
    
    console.log('\n✨ Landing Page Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Check if localhost is running first
async function checkServer() {
  try {
    const response = await fetch('http://localhost:5174');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Development server is not running on http://localhost:5174');
    console.log('Please start it with: npm run dev');
    process.exit(1);
  }
  
  await testLandingPage();
}

main().catch(console.error);
