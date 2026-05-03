const http = require('http');

console.log('🧪 Testing Underline Removal...\n');

// Test IDE page
const options = {
  hostname: 'localhost',
  port: 5173,
  path: '/ide',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ IDE Page Loading...');
    
    // Check if our CSS classes are present
    const hasNoUnderlineClass = data.includes('no-underline');
    const hasInlineStyles = data.includes('textDecoration: \'none\'');
    const hasGlobalCSS = data.includes('text-decoration: none !important');
    
    console.log('🔍 CSS Analysis:');
    console.log(`   no-underline class: ${hasNoUnderlineClass ? '✅' : '❌'}`);
    console.log(`   Inline styles: ${hasInlineStyles ? '✅' : '❌'}`);
    console.log(`   Global CSS: ${hasGlobalCSS ? '✅' : '❌'}`);
    
    if (hasNoUnderlineClass && hasInlineStyles && hasGlobalCSS) {
      console.log('\n🎉 All underline removal methods applied!');
      console.log('📝 If underlines still show, try:');
      console.log('   1. Hard refresh browser (Ctrl+F5)');
      console.log('   2. Clear browser cache');
      console.log('   3. Open dev tools (F12) and inspect elements');
    } else {
      console.log('\n⚠️  Some methods may not have applied');
    }
  });
});

req.on('error', (err) => {
  console.log('❌ Request failed:', err.message);
});

req.end();
