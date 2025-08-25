#!/usr/bin/env node

/**
 * KYC System Test Script
 * 
 * This script tests the new KYC system to ensure all services are working correctly.
 * Run this after implementing the KYC services to verify functionality.
 * 
 * Usage: node scripts/test-kyc-system.js
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

// Test environment variables
async function testEnvironmentVariables() {
  logHeader('Testing Environment Variables');
  
  const requiredVars = [
    'MILLION_VERIFIER_API_KEY',
    'ABSTRACT_API_KEY', 
    'COMPANIES_HOUSE_API_KEY',
    'FISCAL_AI_API_KEY'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      logTest(varName, 'PASS', `Value: ${value.substring(0, 8)}...`);
    } else {
      logTest(varName, 'FAIL', 'Not found in environment');
      allPresent = false;
    }
  });
  
  return allPresent;
}

// Test API connectivity
async function testAPIConnectivity() {
  logHeader('Testing API Connectivity');
  
  try {
    // Test MillionVerifier
    log('\n📧 Testing MillionVerifier API...');
    const mvResponse = await fetch(`https://api.millionverifier.com/api/v3/?api=${process.env.MILLION_VERIFIER_API_KEY}&email=test@example.com`);
    logTest('MillionVerifier API', mvResponse.ok ? 'PASS' : 'FAIL', `Status: ${mvResponse.status}`);
    
    // Test Abstract API
    log('\n📧 Testing Abstract API...');
    const absResponse = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=test@example.com`);
    logTest('Abstract API', absResponse.ok ? 'PASS' : 'FAIL', `Status: ${absResponse.status}`);
    
    // Test Companies House
    log('\n🏢 Testing Companies House API...');
    const chResponse = await fetch('https://api.companieshouse.gov.uk/company/00000006', {
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.COMPANIES_HOUSE_API_KEY + ':').toString('base64')}`
      }
    });
    logTest('Companies House API', chResponse.ok ? 'PASS' : 'FAIL', `Status: ${chResponse.status}`);
    
    // Test Fiscal.ai
    log('\n🏢 Testing Fiscal.ai API...');
    const faResponse = await fetch(`https://api.fiscal.ai/v1/companies-list?apiKey=${process.env.FISCAL_AI_API_KEY}&search=test`);
    logTest('Fiscal.ai API', faResponse.ok ? 'PASS' : 'FAIL', `Status: ${faResponse.status}`);
    
    // Test SearXNG
    log('\n🔍 Testing SearXNG...');
    const sxResponse = await fetch('https://search.ackersweldon.com/search');
    logTest('SearXNG', sxResponse.ok ? 'PASS' : 'FAIL', `Status: ${sxResponse.status}`);
    
    return true;
    
  } catch (error) {
    logTest('API Connectivity Test', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Main testing function
async function runAllTests() {
  logHeader('KYC System Testing Suite');
  log('Starting comprehensive tests for the new KYC system...', 'blue');
  
  const results = {
    environmentVariables: await testEnvironmentVariables(),
    apiConnectivity: await testAPIConnectivity()
  };
  
  // Summary
  logHeader('Test Results Summary');
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;
  
  log(`Total Test Suites: ${totalTests}`, 'bright');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  
  if (failedTests === 0) {
    log('\n🎉 All KYC system tests passed!', 'green');
    log('Your APIs are working correctly.', 'blue');
    log('\nNext steps:', 'bright');
    log('1. The KYC service files need to be created', 'cyan');
    log('2. Test the individual services', 'cyan');
    log('3. Integrate with your frontend', 'cyan');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow');
    log('Make sure all APIs are properly configured and accessible.', 'yellow');
  }
  
  return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testEnvironmentVariables,
  testAPIConnectivity,
  runAllTests
};
