#!/usr/bin/env node

/**
 * KYC API Testing Script
 * Tests all KYC verification services to ensure they're working properly
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 30000,
  testCases: [
    {
      name: 'Email Verification - Valid Gmail',
      type: 'email',
      value: 'test@gmail.com',
      expectedStatus: 200
    },
    {
      name: 'Email Verification - Invalid Format',
      type: 'email',
      value: 'invalid-email',
      expectedStatus: 400
    },
    {
      name: 'Company Verification - Tech Company',
      type: 'company',
      value: 'Microsoft',
      expectedStatus: 200
    },
    {
      name: 'Person Verification - Public Figure',
      type: 'person',
      value: 'Elon Musk',
      expectedStatus: 200
    }
  ]
};

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: config.timeout
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test individual KYC verification
async function testKYCVerification(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   Type: ${testCase.type}`);
  console.log(`   Value: ${testCase.value}`);
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest(`${config.baseUrl}/api/kyc`, {
      body: {
        type: testCase.type,
        value: testCase.value
      }
    });
    
    const processingTime = Date.now() - startTime;
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Processing Time: ${processingTime}ms`);
    
    if (response.status === testCase.expectedStatus) {
      console.log(`   ✅ PASS - Status matches expected (${testCase.expectedStatus})`);
      
      if (response.status === 200 && response.data) {
        // Validate response structure
        const result = response.data;
        
        if (result.success && result.riskAssessment && result.recommendations) {
          console.log(`   ✅ PASS - Response structure is valid`);
          console.log(`   Risk Level: ${result.riskAssessment.overallRisk}`);
          console.log(`   Risk Score: ${result.riskAssessment.riskScore}`);
          console.log(`   Confidence: ${result.riskAssessment.confidence}%`);
          console.log(`   Sources: ${result.sources?.join(', ') || 'N/A'}`);
        } else {
          console.log(`   ❌ FAIL - Invalid response structure`);
        }
      }
    } else {
      console.log(`   ❌ FAIL - Expected status ${testCase.expectedStatus}, got ${response.status}`);
    }
    
    return {
      testCase,
      success: response.status === testCase.expectedStatus,
      response,
      processingTime
    };
    
  } catch (error) {
    console.log(`   ❌ FAIL - Error: ${error.message}`);
    return {
      testCase,
      success: false,
      error: error.message
    };
  }
}

// Test SearXNG integration
async function testSearXNGIntegration() {
  console.log('\n🔍 Testing SearXNG Integration');
  
  try {
    const response = await makeRequest(`${config.baseUrl}/api/kyc`, {
      body: {
        type: 'company',
        value: 'Apple Inc'
      }
    });
    
    if (response.status === 200 && response.data) {
      const result = response.data;
      const hasSearXNGResults = result.sources && result.sources.includes('searxng');
      
      if (hasSearXNGResults) {
        console.log('   ✅ PASS - SearXNG integration working');
        console.log(`   Search Results: ${result.results?.company?.searchResults || 0}`);
      } else {
        console.log('   ⚠️  WARNING - SearXNG not detected in sources');
      }
    } else {
      console.log('   ❌ FAIL - Cannot test SearXNG integration');
    }
    
  } catch (error) {
    console.log(`   ❌ FAIL - SearXNG test error: ${error.message}`);
  }
}

// Test MillionVerifier integration
async function testMillionVerifierIntegration() {
  console.log('\n📧 Testing MillionVerifier Integration');
  
  try {
    const response = await makeRequest(`${config.baseUrl}/api/kyc`, {
      body: {
        type: 'email',
        value: 'test@example.com'
      }
    });
    
    if (response.status === 200 && response.data) {
      const result = response.data;
      const hasEmailResults = result.results?.email;
      
      if (hasEmailResults) {
        console.log('   ✅ PASS - MillionVerifier integration working');
        console.log(`   Email Status: ${result.results.email.status}`);
        console.log(`   Quality: ${result.results.email.quality || 'N/A'}`);
      } else {
        console.log('   ⚠️  WARNING - Email verification results not found');
      }
    } else {
      console.log('   ❌ FAIL - Cannot test MillionVerifier integration');
    }
    
  } catch (error) {
    console.log(`   ❌ FAIL - MillionVerifier test error: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting KYC API Tests');
  console.log(`📍 Base URL: ${config.baseUrl}`);
  console.log(`⏱️  Timeout: ${config.timeout}ms`);
  
  const results = [];
  
  // Test basic KYC functionality
  for (const testCase of config.testCases) {
    const result = await testKYCVerification(testCase);
    results.push(result);
  }
  
  // Test specific integrations
  await testSearXNGIntegration();
  await testMillionVerifierIntegration();
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`   - ${result.testCase.name}: ${result.error || 'Status mismatch'}`);
    });
  }
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! KYC system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testKYCVerification,
  testSearXNGIntegration,
  testMillionVerifierIntegration,
  runTests
};
