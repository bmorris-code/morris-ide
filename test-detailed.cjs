const http = require('http');

console.log('🧪 Detailed Logout Test...\n');

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
    console.log('✅ IDE Page Loaded');
    console.log(`📄 Page size: ${data.length} characters`);
    
    // Search for various logout indicators
    const logoutIndicators = [
      'LogOut',
      'logout',
      'handleLogout',
      'onClick={handleLogout}',
      'button.*logout',
      'title="Logout"'
    ];
    
    let foundIndicators = [];
    logoutIndicators.forEach(indicator => {
      if (data.includes(indicator)) {
        foundIndicators.push(indicator);
      }
    });
    
    console.log('\n🔍 Search Results:');
    foundIndicators.forEach(indicator => {
      console.log(`   ✓ Found: ${indicator}`);
    });
    
    if (foundIndicators.length > 0) {
      console.log('\n🎉 Logout functionality detected!');
    } else {
      console.log('\n❌ No logout functionality found');
      console.log('📝 Checking for profile display...');
      
      // Check for profile-related code
      const profileIndicators = [
        'profile &&',
        'profile.name',
        'profile.charAt',
        'w-6 h-6 bg-violet-600'
      ];
      
      let profileFound = false;
      profileIndicators.forEach(indicator => {
        if (data.includes(indicator)) {
          profileFound = true;
        }
      });
      
      console.log(`   Profile code: ${profileFound ? '✅' : '❌'}`);
    }
  });
});

req.on('error', (err) => {
  console.log('❌ Request failed:', err.message);
});

req.end();
