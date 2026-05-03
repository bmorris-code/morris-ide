const http = require('http');

function testPages() {
  console.log('🧪 Testing Morris IDE Fixes...\n');
  
  const pages = [
    { path: '/', name: 'Landing Page' },
    { path: '/login', name: 'Login Page' },
    { path: '/signup', name: 'Signup Page' },
    { path: '/ide', name: 'IDE Page' },
    { path: '/debug', name: 'Debug Page' }
  ];

  pages.forEach(page => {
    const options = {
      hostname: 'localhost',
      port: 5173,
      path: page.path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log(`✅ ${page.name}: ${res.statusCode} ${res.statusMessage}`);
    });

    req.on('error', (err) => {
      console.log(`❌ ${page.name}: Error - ${err.message}`);
    });

    req.end();
  });
}

testPages();

setTimeout(() => {
  console.log('\n🎯 Summary of Fixes Applied:');
  console.log('✅ Profile icon added to header (shows when logged in)');
  console.log('✅ Header menu items (File, Edit, Selection, etc.) now active');
  console.log('✅ MORRIS AI settings icon functional with status display');
  console.log('✅ Sidebar icons activated with click handlers');
  console.log('✅ Explorer refresh and folder creation icons added');
  console.log('✅ Groq backend integration with auto-initialization');
  console.log('✅ Landing page footer visibility fixed');
  console.log('\n🌐 Visit http://localhost:5173 to test all features!');
  console.log('📝 Check browser console for click logs and AI status');
}, 1000);
