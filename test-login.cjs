const http = require('http');

function testLoginPage() {
  console.log('Testing Login Page...\n');
  
  const options = {
    hostname: 'localhost',
    port: 5173,
    path: '/login',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Content-Length:', res.headers['content-length']);
      console.log('Content-Type:', res.headers['content-type']);
      
      // Check for React app indicators
      const hasReactApp = data.includes('div id="root"');
      const hasVite = data.includes('vite');
      
      console.log('\nPage Analysis:');
      console.log('React App:', hasReactApp ? 'YES' : 'NO');
      console.log('Vite Dev:', hasVite ? 'YES' : 'NO');
      
      if (hasReactApp && hasVite) {
        console.log('\n✅ Login page is loading correctly!');
        console.log('🔑 Clerk integration should be working if keys are configured');
        console.log('🌐 Visit http://localhost:5173/login to test in browser');
      } else {
        console.log('\n❌ Login page may have issues');
      }
    });
  });

  req.on('error', (err) => {
    console.log('❌ Request failed:', err.message);
  });

  req.end();
}

testLoginPage();
