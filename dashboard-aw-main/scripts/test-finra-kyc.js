#!/usr/bin/env node

/**
 * Comprehensive FINRA KYC System Test Script
 * Tests all verification types, API endpoints, and functionality
 */

const BASE_URL = 'http://localhost:3000';

// Test cases for different verification types
const testCases = [
  {
    type: 'company',
    identifier: 'AAPL',
    description: 'Company verification with ticker symbol'
  },
  {
    type: 'broker',
    identifier: '123456',
    description: 'Broker verification with CRD number'
  },
  {
    type: 'advisor',
    identifier: 'John Smith',
    description: 'Advisor verification with name'
  },
  {
    type: 'executive',
    identifier: 'Tim Cook',
    additionalData: { company: 'Apple Inc.' },
    description: 'Executive verification with company context'
  },
  {
    type: 'institution',
    identifier: 'Goldman Sachs',
    description: 'Financial institution verification'
  }
];

// Test service status
async function testServiceStatus() {
  console.log('\n🔍 Testing FINRA KYC Service Status...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/finra-kyc`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      console.log('✅ Service is accessible');
      return true;
    } else {
      console.log(`❌ Service returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Service connection failed: ${error.message}`);
    return false;
  }
}

// Test individual verification
async function testVerification(testCase) {
  console.log(`\n🔍 Testing ${testCase.type} verification: ${testCase.description}`);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/finra-kyc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: testCase.type,
        identifier: testCase.identifier,
        additionalData: testCase.additionalData || {}
      })
    });
    
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log(`❌ Verification failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
      return false;
    }
    
    const data = await response.json();
    
    // Validate response structure
    const isValid = validateResponse(data, testCase.type);
    
    if (isValid) {
      console.log(`✅ Verification successful in ${processingTime}ms`);
      console.log(`   Request ID: ${data.requestId}`);
      console.log(`   Risk Level: ${data.riskAssessment.overallRisk}`);
      console.log(`   Risk Score: ${data.riskAssessment.riskScore}/100`);
      console.log(`   Compliance Score: ${data.complianceScore}/100`);
      return true;
    } else {
      console.log('❌ Response validation failed');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Verification error: ${error.message}`);
    return false;
  }
}

// Validate response structure
function validateResponse(data, type) {
  const requiredFields = [
    'success', 'requestId', 'timestamp', 'type', 'identifier',
    'results', 'riskAssessment', 'complianceScore', 'processingTime'
  ];
  
  const requiredRiskFields = [
    'overallRisk', 'riskScore', 'riskFactors', 'complianceStatus', 'recommendations'
  ];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!(field in data)) {
      console.log(`   Missing required field: ${field}`);
      return false;
    }
  }
  
  // Check risk assessment fields
  for (const field of requiredRiskFields) {
    if (!(field in data.riskAssessment)) {
      console.log(`   Missing risk assessment field: ${field}`);
      return false;
    }
  }
  
  // Check type-specific results
  if (!(type in data.results)) {
    console.log(`   Missing ${type} results`);
    return false;
  }
  
  return true;
}

// Performance test
async function runPerformanceTest() {
  console.log('\n🚀 Running Performance Test...');
  
  const iterations = 5;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${BASE_URL}/api/finra-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'company',
          identifier: 'AAPL'
        })
      });
      
      if (response.ok) {
        const processingTime = Date.now() - startTime;
        times.push(processingTime);
        console.log(`   Iteration ${i + 1}: ${processingTime}ms`);
      }
    } catch (error) {
      console.log(`   Iteration ${i + 1}: Failed`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`\n📊 Performance Results:`);
    console.log(`   Average: ${avgTime.toFixed(2)}ms`);
    console.log(`   Min: ${minTime}ms`);
    console.log(`   Max: ${maxTime}ms`);
    console.log(`   Total requests: ${times.length}`);
  }
}

// Run comprehensive test
async function runComprehensiveTest() {
  console.log('🧪 FINRA KYC System Comprehensive Test');
  console.log('=====================================');
  
  const startTime = Date.now();
  let passedTests = 0;
  let totalTests = 0;
  
  // Test service status
  totalTests++;
  if (await testServiceStatus()) {
    passedTests++;
  }
  
  // Test each verification type
  for (const testCase of testCases) {
    totalTests++;
    if (await testVerification(testCase)) {
      passedTests++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Run performance test
  await runPerformanceTest();
  
  const totalTime = Date.now() - startTime;
  
  console.log('\n📋 Test Summary');
  console.log('================');
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`Total Time: ${totalTime}ms`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! FINRA KYC system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the system configuration.');
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
FINRA KYC System Test Script

Usage:
  node scripts/test-finra-kyc.js [options]

Options:
  --help, -h     Show this help message
  --status       Test only service status
  --performance  Run only performance tests
  --single TYPE  Test single verification type (company, broker, advisor, executive, institution)

Examples:
  node scripts/test-finra-kyc.js --status
  node scripts/test-finra-kyc.js --performance
  node scripts/test-finra-kyc.js --single company
  node scripts/test-finra-kyc.js
`);
  process.exit(0);
}

// Run specific tests based on arguments
if (process.argv.includes('--status')) {
  testServiceStatus().then(() => process.exit(0));
} else if (process.argv.includes('--performance')) {
  runPerformanceTest().then(() => process.exit(0));
} else if (process.argv.includes('--single')) {
  const typeIndex = process.argv.indexOf('--single');
  const type = process.argv[typeIndex + 1];
  
  if (type && ['company', 'broker', 'advisor', 'executive', 'institution'].includes(type)) {
    const testCase = testCases.find(tc => tc.type === type);
    if (testCase) {
      testVerification(testCase).then(() => process.exit(0));
    } else {
      console.log(`❌ Unknown type: ${type}`);
      process.exit(1);
    }
  } else {
    console.log('❌ Please specify a valid type: company, broker, advisor, executive, or institution');
    process.exit(1);
  }
} else {
  // Run comprehensive test
  runComprehensiveTest().catch(error => {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  });
}
