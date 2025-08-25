// Test script to verify all API keys are working
const API_KEYS = {
  ALPHA_VANTAGE: 'WNWGEHCMTH50GSTE',
  FINNHUB: 'd2g81tpr01qq1lhtreugd2g81tpr01qq1lhtrev0',
  POLYGON: 'hLkQxgibmGtaFCMTXUtFtZq65Q5R1iS1',
  FMP: 'JiVmi6hF1OPZEBgHiWI6oyRMsUqrt255'
};

async function testAPI(apiName, url, description) {
  try {
    console.log(`🧪 Testing ${apiName}...`);
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${apiName} is working!`);
      console.log(`   ${description}`);
      return true;
    } else {
      console.log(`❌ ${apiName} failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${apiName} error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing Financial Data APIs...\n');
  
  const tests = [
    {
      name: 'Alpha Vantage',
      url: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${API_KEYS.ALPHA_VANTAGE}`,
      description: 'Stock quote API'
    },
    {
      name: 'Finnhub',
      url: `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${API_KEYS.FINNHUB}`,
      description: 'Stock quote API'
    },
    {
      name: 'Polygon.io',
      url: `https://api.polygon.io/v2/aggs/ticker/AAPL/prev?adjusted=true&apiKey=${API_KEYS.POLYGON}`,
      description: 'Stock quote API'
    },
    {
      name: 'FMP (Financial Modeling Prep)',
      url: `https://financialmodelingprep.com/api/v3/profile/AAPL?apikey=${API_KEYS.FMP}`,
      description: 'Company profile API'
    }
  ];
  
  let workingAPIs = 0;
  
  for (const test of tests) {
    const result = await testAPI(test.name, test.url, test.description);
    if (result) workingAPIs++;
    console.log(''); // Empty line for readability
  }
  
  console.log(`🎯 Summary: ${workingAPIs}/${tests.length} APIs are working`);
  
  if (workingAPIs > 0) {
    console.log('\n🎉 Your financial data service should work now!');
    console.log('   Try searching for a stock ticker (e.g., AAPL, TSLA, MSFT) on the financial page.');
  } else {
    console.log('\n❌ No APIs are working. Please check your API keys and try again.');
  }
}

// Run the tests
runTests();
