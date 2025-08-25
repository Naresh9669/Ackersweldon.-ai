#!/usr/bin/env node

/**
 * Abstract API Troubleshooting Script
 * 
 * This script helps diagnose and fix the Abstract API 401 error.
 * It tests various scenarios to identify the root cause.
 * 
 * Usage: node scripts/troubleshoot-abstract-api.js
 */

require('dotenv').config({ path: '/home/ubuntu/.env' });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logTest(name, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : 'red';
  const statusText = status === 'PASS' ? '✅ PASS' : '❌ FAIL';
  log(`${name}: ${statusText}`, statusColor);
  if (details) {
    log(`  ${details}`, 'cyan');
  }
}

// Test environment variable
function testEnvironmentVariable() {
  logHeader('Testing Environment Variable');
  
  const apiKey = process.env.ABSTRACT_API_KEY;
  
  if (!apiKey) {
    logTest('API Key Presence', 'FAIL', 'ABSTRACT_API_KEY not found in environment');
    return false;
  }
  
  logTest('API Key Presence', 'PASS', 'API key found');
  
  // Check key length
  if (apiKey.length < 10) {
    logTest('API Key Length', 'FAIL', `Key too short: ${apiKey.length} characters`);
    return false;
  }
  
  logTest('API Key Length', 'PASS', `Key length: ${apiKey.length} characters`);
  
  // Check for hidden characters
  const cleanKey = apiKey.trim();
  if (cleanKey !== apiKey) {
    logTest('API Key Format', 'FAIL', 'Key contains leading/trailing whitespace');
    return false;
  }
  
  logTest('API Key Format', 'PASS', 'No leading/trailing whitespace detected');
  
  // Check for special characters
  if (/[^\w-]/.test(apiKey)) {
    logTest('API Key Characters', 'FAIL', 'Key contains invalid characters');
    return false;
  }
  
  logTest('API Key Characters', 'PASS', 'Key contains only valid characters');
  
  return true;
}

// Test API endpoint accessibility
async function testAPIEndpoint() {
  logHeader('Testing API Endpoint Accessibility');
  
  try {
    // Test basic endpoint without API key
    const response = await fetch('https://emailvalidation.abstractapi.com/v1/');
    
    if (response.ok) {
      logTest('Endpoint Accessibility', 'PASS', 'Endpoint is accessible');
    } else {
      logTest('Endpoint Accessibility', 'FAIL', `Status: ${response.status}`);
    }
    
    return response.ok;
  } catch (error) {
    logTest('Endpoint Accessibility', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Test API key validation
async function testAPIKeyValidation() {
  logHeader('Testing API Key Validation');
  
  const apiKey = process.env.ABSTRACT_API_KEY;
  if (!apiKey) {
    logTest('API Key Test', 'FAIL', 'No API key available');
    return false;
  }
  
  try {
    // Test with valid email
    const testEmail = 'test@example.com';
    const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${testEmail}`;
    
    log(`🔍 Testing with email: ${testEmail}`, 'blue');
    log(`�� Using API key: ${apiKey.substring(0, 8)}...`, 'blue');
    
    const response = await fetch(url);
    const responseText = await response.text();
    
    log(`📡 Response Status: ${response.status}`, 'cyan');
    log(`📄 Response Headers:`, 'cyan');
    response.headers.forEach((value, key) => {
      log(`  ${key}: ${value}`, 'cyan');
    });
    
    if (response.status === 401) {
      logTest('API Key Validation', 'FAIL', '401 Unauthorized - Invalid API key');
      
      // Try to parse response for more details
      try {
        const responseData = JSON.parse(responseText);
        if (responseData.error) {
          log(`  🚨 Error Details: ${JSON.stringify(responseData.error, null, 2)}`, 'red');
        }
      } catch (e) {
        log(`  📄 Raw Response: ${responseText.substring(0, 200)}...`, 'yellow');
      }
      
      return false;
    } else if (response.status === 200) {
      logTest('API Key Validation', 'PASS', 'API key is valid');
      
      try {
        const responseData = JSON.parse(responseText);
        log(`  📊 Response Data: ${JSON.stringify(responseData, null, 2)}`, 'green');
      } catch (e) {
        log(`  📄 Raw Response: ${responseText.substring(0, 200)}...`, 'green');
      }
      
      return true;
    } else {
      logTest('API Key Validation', 'FAIL', `Unexpected status: ${response.status}`);
      log(`  📄 Response: ${responseText.substring(0, 200)}...`, 'yellow');
      return false;
    }
    
  } catch (error) {
    logTest('API Key Validation', 'FAIL', `Request failed: ${error.message}`);
    return false;
  }
}

// Main troubleshooting function
async function runTroubleshooting() {
  logHeader('Abstract API Troubleshooting Suite');
  log('Starting comprehensive troubleshooting for Abstract API 401 error...', 'blue');
  
  const results = {
    environmentVariable: testEnvironmentVariable(),
    apiEndpoint: await testAPIEndpoint(),
    apiKeyValidation: await testAPIKeyValidation()
  };
  
  // Summary
  logHeader('Troubleshooting Summary');
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;
  
  log(`Total Tests: ${totalTests}`, 'bright');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  
  if (failedTests === 0) {
    log('\n🎉 All tests passed! Abstract API should be working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the troubleshooting report above.', 'yellow');
    
    if (!results.apiKeyValidation) {
      log('\n🔧 Next Steps for Abstract API:', 'bright');
      log('1. Verify your API key in the Abstract API dashboard', 'cyan');
      log('2. Check your account status and credit balance', 'cyan');
      log('3. Contact Abstract API support if issues persist', 'cyan');
      log('4. Use MillionVerifier as your primary email service (it\'s working!)', 'cyan');
    }
  }
  
  return results;
}

// Run troubleshooting if this script is executed directly
if (require.main === module) {
  runTroubleshooting().catch(console.error);
}

module.exports = {
  testEnvironmentVariable,
  testAPIEndpoint,
  testAPIKeyValidation,
  runTroubleshooting
};
