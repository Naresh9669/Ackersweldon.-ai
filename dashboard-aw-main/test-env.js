// Test script to verify environment variables and financial data service
require('dotenv').config({ path: '.env' });

console.log('🧪 Testing Environment Variables...\n');

// Check if environment variables are loaded
const envVars = {
  ALPHA_VANTAGE: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY,
  FINNHUB: process.env.NEXT_PUBLIC_FINNHUB_API_KEY,
  FMP: process.env.NEXT_PUBLIC_FMP_API_KEY,
  POLYGON: process.env.NEXT_PUBLIC_POLYGON_API_KEY
};

console.log('Environment Variables Status:');
Object.entries(envVars).forEach(([key, value]) => {
  const status = value ? '✅ SET' : '❌ NOT SET';
  const displayValue = value ? `${value.substring(0, 8)}...` : 'undefined';
  console.log(`  ${key}: ${status} (${displayValue})`);
});

console.log('\n🔍 Testing API Endpoints...\n');

// Test Alpha Vantage (should fail due to rate limit)
async function testAlphaVantage() {
  if (!envVars.ALPHA_VANTAGE) return;
  
  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=AAPL&apikey=${envVars.ALPHA_VANTAGE}`);
    const data = await response.json();
    
    if (data.Information) {
      console.log('❌ Alpha Vantage: Rate limited -', data.Information);
    } else if (data.Symbol) {
      console.log('✅ Alpha Vantage: Working - Company data available');
    } else {
      console.log('⚠️ Alpha Vantage: Unexpected response');
    }
  } catch (error) {
    console.log('❌ Alpha Vantage: Error -', error.message);
  }
}

// Test Finnhub
async function testFinnhub() {
  if (!envVars.FINNHUB) return;
  
  try {
    const response = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token=${envVars.FINNHUB}`);
    const data = await response.json();
    
    if (data.ticker) {
      console.log('✅ Finnhub: Working - Company profile available');
      console.log(`   Company: ${data.name}, Sector: ${data.finnhubIndustry}, Industry: ${data.industry}`);
    } else {
      console.log('⚠️ Finnhub: Unexpected response');
    }
  } catch (error) {
    console.log('❌ Finnhub: Error -', error.message);
  }
}

// Test FMP
async function testFMP() {
  if (!envVars.FMP) return;
  
  try {
    const response = await fetch(`https://financialmodelingprep.com/api/v3/profile/AAPL?apikey=${envVars.FMP}`);
    const data = await response.json();
    
    if (Array.isArray(data) && data[0] && data[0].symbol) {
      console.log('✅ FMP: Working - Company profile available');
      console.log(`   Company: ${data[0].companyName}, Sector: ${data[0].sector}, Industry: ${data[0].industry}`);
    } else {
      console.log('⚠️ FMP: Unexpected response');
    }
  } catch (error) {
    console.log('❌ FMP: Error -', error.message);
  }
}

// Run tests
async function runTests() {
  await testAlphaVantage();
  await testFinnhub();
  await testFMP();
  
  console.log('\n📊 Summary:');
  console.log('The company details should now work using the fallback APIs (Finnhub and FMP)');
  console.log('even though Alpha Vantage is rate limited.');
}

runTests().catch(console.error);
