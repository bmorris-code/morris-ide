const http = require('http');

console.log('🧪 Testing Logout Functionality...\n');

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
    
    // Check if logout button is present
    const hasLogoutButton = data.includes('LogOut');
    const hasLogoutHandler = data.includes('handleLogout');
    const hasLogoutFunction = data.includes('logout()');
    
    console.log('🔍 Logout Analysis:');
    console.log(`   Logout button: ${hasLogoutButton ? '✅' : '❌'}`);
    console.log(`   Logout handler: ${hasLogoutHandler ? '✅' : '❌'}`);
    console.log(`   Logout function: ${hasLogoutFunction ? '✅' : '❌'}`);
    
    if (hasLogoutButton && hasLogoutHandler && hasLogoutFunction) {
      console.log('\n🎉 Logout functionality added successfully!');
      console.log('📝 How to test:');
      console.log('   1. Login to see profile icon');
      console.log('   2. Click red logout button next to profile');
      console.log('   3. Profile should disappear and you should be logged out');
    } else {
      console.log('\n⚠️  Logout functionality may be missing');
    }
  });
});

req.on('error', (err) => {
  console.log('❌ Request failed:', err.message);
});

req.end();
