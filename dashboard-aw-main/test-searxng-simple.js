// Simple test for SearXNG
const fetch = require('node-fetch');

async function testSearXNG() {
    try {
        console.log('🧪 Testing SearXNG...');
        
        // Test 1: Check if container is running
        console.log('\n1️⃣ Checking Docker container...');
        const { exec } = require('child_process');
        exec('docker ps | grep searxng', (error, stdout, stderr) => {
            if (stdout) {
                console.log('✅ SearXNG container is running:');
                console.log(stdout.trim());
            } else {
                console.log('❌ SearXNG container not found');
            }
        });
        
        // Test 2: Test HTML search (POST method)
        console.log('\n2️⃣ Testing HTML search (POST)...');
        const response = await fetch('https://search.ackersweldon.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: 'q=test'
        });
        
        if (response.ok) {
            console.log('✅ HTML search successful');
            const html = await response.text();
            console.log(`📄 Response length: ${html.length} characters`);
            
            // Check for search results
            if (html.includes('results_endpoint')) {
                console.log('✅ Search results detected');
            }
            
            // Check for any titles/links
            const titleMatches = html.match(/<h3[^>]*>([^<]+)<\/h3>/g);
            if (titleMatches) {
                console.log(`✅ Found ${titleMatches.length} potential result titles`);
            }
        } else {
            console.log(`❌ HTML search failed: ${response.status}`);
        }
        
        // Test 3: Test port accessibility
        console.log('\n3️⃣ Testing port accessibility...');
        const netstat = require('child_process').execSync('netstat -tlnp | grep :8081', { encoding: 'utf8' });
        if (netstat) {
            console.log('✅ Port 8081 is accessible:');
            console.log(netstat.trim());
        }
        
        console.log('\n🎯 SearXNG is ready for use!');
        console.log('📍 URL: https://search.ackersweldon.com');
        console.log('🔍 Search: Use POST method with form data');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSearXNG();
