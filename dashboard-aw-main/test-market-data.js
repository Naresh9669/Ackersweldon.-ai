// Test script to verify market data function
const { getMarketDataMultiSource } = require('./lib/marketData.ts');

async function testMarketData() {
  console.log('🧪 Testing market data function...');
  
  try {
    const data = await getMarketDataMultiSource();
    console.log('📊 Market data result:', data);
    console.log('🔢 Number of symbols:', data ? Object.keys(data).length : 0);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testMarketData();
