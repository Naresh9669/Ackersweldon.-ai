// Comprehensive Financial Data Service with Multi-API Fallback Strategy
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Environment variables for direct API access
const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const POLYGON_API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY;
const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY;

export interface CompanyData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  dividend: number;
  sector: string;
  industry: string;
  employees: number;
  description: string;
  website?: string;
  // Valuation & Ratios
  forwardPE?: number;
  peg?: number;
  priceToBook?: number;
  priceToSalesTTM?: number;
  evToEbitda?: number;
  // UI-aligned aliases / convenience fields
  priceToSales?: number;
  // Financials (TTM)
  revenueTTM?: number;
  grossProfitTTM?: number;
  ebitdaTTM?: number;
  netIncomeTTM?: number;
  freeCashFlowTTM?: number;
  operatingCashFlowTTM?: number;
  // Profitability & Margins
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  roa?: number;
  roe?: number;
  // Balance Sheet & Liquidity
  totalDebt?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  cashAndShortTermInvestments?: number;
  // Dividends
  dividendYield?: number;
  payoutRatio?: number;
  exDividendDate?: string;
  annualDividend?: number;
  // Performance - Available from FMP
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  beta?: number;
  ytdReturn?: number;
  oneYearReturn?: number;
  // Additional Company Info - Available from FMP Profile API
  country?: string;
  exchange?: string;
  currency?: string;
  ceo?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  image?: string;
  ipoDate?: string;
  cik?: string;
  isin?: string;
  cusip?: string;
  averageVolume?: number;
  // Financial Ratios - Available from FMP Ratios API  
  ebitMargin?: number;
  ebitdaMargin?: number;
  receivablesTurnover?: number;
  payablesTurnover?: number;
  inventoryTurnover?: number;
  fixedAssetTurnover?: number;
  assetTurnover?: number;
  cashRatio?: number;
  priceToEarningsRatio?: number;
  priceToBookRatio?: number;
  priceToSalesRatio?: number;
  priceToFreeCashFlowRatio?: number;
  priceToOperatingCashFlowRatio?: number;
  debtToAssetsRatio?: number;
  debtToEquityRatio?: number;
  debtToCapitalRatio?: number;
  longTermDebtToCapitalRatio?: number;
  financialLeverageRatio?: number;
  operatingCashFlowRatio?: number;
  operatingCashFlowSalesRatio?: number;
  freeCashFlowOperatingCashFlowRatio?: number;
  debtServiceCoverageRatio?: number;
  interestCoverageRatio?: number;
  dividendPayoutRatio?: number;
  dividendYieldRatio?: number;
  revenuePerShare?: number;
  netIncomePerShare?: number;
  cashPerShare?: number;
  bookValuePerShare?: number;
  tangibleBookValuePerShare?: number;
  operatingCashFlowPerShare?: number;
  freeCashFlowPerShare?: number;
  effectiveTaxRate?: number;
  enterpriseValueMultiple?: number;
  historicalData?: HistoricalDataPoint[];
  // UI-aligned
  cityState?: string;
}

export interface HistoricalDataPoint {
  date: string;
  price: number;
  volume: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  status_code?: number;
  json?: T;
}

// Centralized error handling following Node.js best practices
class FinancialDataError extends Error {
  public readonly isOperational: boolean;
  public readonly source: string;
  public readonly ticker: string;

  constructor(message: string, source: string, ticker: string, isOperational: boolean = true) {
    super(message);
    this.name = 'FinancialDataError';
    this.source = source;
    this.ticker = ticker;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, FinancialDataError);
  }
}

// Data validation utility
function validateCompanyData(data: any, source: string, ticker: string): CompanyData {
  if (!data || typeof data !== 'object') {
    throw new FinancialDataError(`Invalid data structure from ${source}`, source, ticker);
  }

  // Validate required fields
  if (!data.symbol || !data.price || data.price <= 0) {
    throw new FinancialDataError(`Missing or invalid required fields from ${source}`, source, ticker);
  }

  // Ensure all fields have proper types and fallback values, but preserve enriched fields
  const validatedBasics: CompanyData = {
    symbol: data.symbol || ticker.toUpperCase(),
    name: data.name || `${ticker} Company`,
    price: Number(data.price) || 0,
    change: Number(data.change) || 0,
    changePercent: Number(data.changePercent) || 0,
    volume: Number(data.volume) || 0,
    marketCap: Number(data.marketCap) || 0,
    pe: Number(data.pe) || 0,
    dividend: Number(data.dividend) || 0,
    sector: data.sector || 'Unknown',
    industry: data.industry || 'Unknown',
    employees: Number(data.employees) || 0,
    description: data.description || `Financial data for ${ticker}`,
    website: data.website || undefined
  } as CompanyData;
  // Preserve all other mapped fields
  return { ...(data as CompanyData), ...validatedBasics };
}

// Cached API calls to prevent rate limiting
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function cachedGet(url: string, params?: Record<string, string>): Promise<ApiResponse> {
  const cacheKey = `${url}?${new URLSearchParams(params).toString()}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return Promise.resolve({ success: true, data: cached.data, json: cached.data });
  }

  return fetch(url, { 
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(response => response.json())
  .then(data => {
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return { success: true, data, json: data, status_code: 200 };
  })
  .catch(error => ({
    success: false,
    error: error.message,
    status_code: 500
  }));
}

// Priority 1: Alpha Vantage API with enhanced error handling
async function getAlphaVantageCompanyData(ticker: string): Promise<CompanyData | null> {
  console.log(`🚀 Alpha Vantage function called with ticker: ${ticker}`);
  
  if (!ALPHA_VANTAGE_API_KEY) {
    console.log(`❌ Alpha Vantage: No API key found`);
    return null;
  }
  
  try {
    console.log(`🔍 Alpha Vantage: Starting API calls for ${ticker}`);
    
    // Get company overview
    const overviewResponse = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    if (!overviewResponse.ok) {
      throw new FinancialDataError(`Overview API failed with status ${overviewResponse.status}`, 'Alpha Vantage', ticker);
    }
    
    const overview = await overviewResponse.json();
    console.log(`🔍 Alpha Vantage: Overview data received for ${ticker}`);
    
    // Check for API error messages
    if (overview['Error Message']) {
      throw new FinancialDataError(`Alpha Vantage error: ${overview['Error Message']}`, 'Alpha Vantage', ticker);
    }
    
    if (overview['Note']) {
      throw new FinancialDataError(`Alpha Vantage rate limit: ${overview['Note']}`, 'Alpha Vantage', ticker);
    }
    
    // Get real-time quote
    const quoteResponse = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    if (!quoteResponse.ok) {
      throw new FinancialDataError(`Quote API failed with status ${quoteResponse.status}`, 'Alpha Vantage', ticker);
    }
    
    const quote = await quoteResponse.json();
    console.log(`🔍 Alpha Vantage: Quote data received for ${ticker}`);
    
    const globalQuote = quote['Global Quote'];
    if (!overview.Symbol || !globalQuote) {
      throw new FinancialDataError('Missing Symbol or Global Quote data', 'Alpha Vantage', ticker);
    }
    
    const currentPrice = parseFloat(globalQuote['05. price'] || '0');
    const previousClose = parseFloat(globalQuote['08. previous close'] || '0');
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
    
    // Enhanced data processing with ALL available Alpha Vantage fields
    const result = {
      symbol: overview.Symbol,
      name: overview.Name || `${ticker} Company`,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      volume: parseInt(globalQuote['06. volume'] || '0'),
      marketCap: parseFloat(overview.MarketCapitalization || '0'),
      pe: parseFloat(overview.PERatio || '0'),
      dividend: parseFloat(overview.DividendYield || '0'),
      sector: overview.Sector || 'Unknown',
      industry: overview.Industry || 'Unknown',
      employees: overview.FullTimeEmployees ? parseInt(overview.FullTimeEmployees) : 0,
      description: overview.Description || `Financial data for ${ticker}`,
      website: overview.OfficialSite || undefined,
      
      // Valuation & Ratios - Enhanced mapping
      forwardPE: parseFloat(overview.ForwardPE || '0') || undefined,
      peg: parseFloat(overview.PEGRatio || '0') || undefined,
      priceToBook: parseFloat(overview.PriceToBookRatio || '0') || undefined,
      priceToSalesTTM: parseFloat(overview.PriceToSalesRatioTTM || '0') || undefined,
      // Valuation & Ratios - add UI alias
      priceToSales: parseFloat(overview.PriceToSalesRatioTTM || overview.PriceToSalesRatio || '0') || undefined,
      evToEbitda: parseFloat(overview.EVToEBITDA || '0') || undefined,
      
      // Financials (TTM) - Alpha Vantage provides these
      revenueTTM: parseFloat(overview.RevenueTTM || '0') || undefined,
      grossProfitTTM: parseFloat(overview.GrossProfitTTM || '0') || undefined,
      ebitdaTTM: parseFloat(overview.EBITDA || '0') || undefined,
      netIncomeTTM: parseFloat(overview.NetIncomeTTM || '0') || undefined,
      freeCashFlowTTM: parseFloat(overview.FreeCashFlowTTM || '0') || undefined,
      // Financials (TTM) - add Operating Cash Flow TTM alias if present
      operatingCashFlowTTM: parseFloat(overview.OperatingCashFlowTTM || '0') || undefined,
      
      // Margins - Alpha Vantage provides these (convert to percentages)
      grossMargin: parseFloat(overview.GrossMargin || '0') ? parseFloat(overview.GrossMargin) * 100 : undefined,
      operatingMargin: parseFloat(overview.OperatingMargin || '0') ? parseFloat(overview.OperatingMargin) * 100 : undefined,
      netMargin: parseFloat(overview.ProfitMargin || '0') ? parseFloat(overview.ProfitMargin) * 100 : undefined,
      roa: parseFloat(overview.ReturnOnAssetsTTM || '0') ? parseFloat(overview.ReturnOnAssetsTTM) * 100 : undefined,
      roe: parseFloat(overview.ReturnOnEquityTTM || '0') ? parseFloat(overview.ReturnOnEquityTTM) * 100 : undefined,
      
      // Balance Sheet - Alpha Vantage provides these
      totalDebt: parseFloat(overview.TotalDebt || '0') || undefined,
      debtToEquity: parseFloat(overview.DebtToEquityRatio || '0') || undefined,
      currentRatio: parseFloat(overview.CurrentRatio || '0') || undefined,
      quickRatio: parseFloat(overview.QuickRatio || '0') || undefined,
      cashRatio: parseFloat(overview.CashRatio || '0') || undefined,
      
      // Dividends - Alpha Vantage provides these (use ratio 0-1)
      dividendYield: parseFloat(overview.DividendYield || '0') || undefined,
      payoutRatio: parseFloat(overview.PayoutRatio || '0') ? parseFloat(overview.PayoutRatio) * 100 : undefined,
      exDividendDate: overview.ExDividendDate || undefined,
      // Dividends - add annual dividend (per-share) if present
      annualDividend: parseFloat(overview.DividendPerShare || '0') || undefined,
      
      // Performance - Alpha Vantage provides these
      fiftyTwoWeekHigh: parseFloat(overview['52WeekHigh'] || '0') || undefined,
      fiftyTwoWeekLow: parseFloat(overview['52WeekLow'] || '0') || undefined,
      beta: parseFloat(overview.Beta || '0') || undefined,
      
      // Company Details - Alpha Vantage provides these
      country: overview.Country || undefined,
      exchange: overview.Exchange || undefined,
      currency: overview.Currency || undefined,
      
      // Additional Alpha Vantage fields
      bookValuePerShare: parseFloat(overview.BookValue || '0') || undefined,
      enterpriseValue: parseFloat(overview.EnterpriseValue || '0') || undefined,
      sharesOutstanding: parseFloat(overview.SharesOutstanding || '0') || undefined,
      sharesFloat: parseFloat(overview.SharesFloat || '0') || undefined,
      sharesShort: parseFloat(overview.SharesShort || '0') || undefined,
      sharesShortPriorMonth: parseFloat(overview.SharesShortPriorMonth || '0') || undefined,
      shortRatio: parseFloat(overview.ShortRatio || '0') || undefined,
      shortPercentOfFloat: parseFloat(overview.ShortPercentOfFloat || '0') || undefined,
      
      // Financial metrics
      revenueGrowth: parseFloat(overview.RevenueGrowth || '0') ? parseFloat(overview.RevenueGrowth) * 100 : undefined,
      earningsGrowth: parseFloat(overview.EarningsGrowth || '0') ? parseFloat(overview.EarningsGrowth) * 100 : undefined,
      earningsQuarterlyGrowth: parseFloat(overview.EarningsQuarterlyGrowth || '0') ? parseFloat(overview.EarningsQuarterlyGrowth) * 100 : undefined,
      revenueQuarterlyGrowth: parseFloat(overview.RevenueQuarterlyGrowth || '0') ? parseFloat(overview.RevenueQuarterlyGrowth) * 100 : undefined,
      
      // Additional ratios
      priceToEarningsGrowth: parseFloat(overview.PriceToEarningsGrowthRatio || '0') || undefined,
      priceToSalesRatio: parseFloat(overview.PriceToSalesRatio || '0') || undefined,
      priceToBookRatio: parseFloat(overview.PriceToBookRatio || '0') || undefined,
      priceToFreeCashFlowRatio: parseFloat(overview.PriceToFreeCashFlowRatio || '0') || undefined,
      
      // Cash flow metrics
      operatingCashFlow: parseFloat(overview.OperatingCashFlow || '0') || undefined,
      freeCashFlow: parseFloat(overview.FreeCashFlow || '0') || undefined,
      
      // Asset metrics
      returnOnTangibleAssets: parseFloat(overview.ReturnOnTangibleAssets || '0') ? parseFloat(overview.ReturnOnTangibleAssets) * 100 : undefined,
      returnOnCapitalEmployed: parseFloat(overview.ReturnOnCapitalEmployed || '0') ? parseFloat(overview.ReturnOnCapitalEmployed) * 100 : undefined,
      returnOnInvestedCapital: parseFloat(overview.ReturnOnInvestedCapital || '0') ? parseFloat(overview.ReturnOnInvestedCapital) * 100 : undefined,
      
      // Additional financial metrics
      interestCoverageRatio: parseFloat(overview.InterestCoverageRatio || '0') || undefined,
      assetTurnover: parseFloat(overview.AssetTurnover || '0') || undefined,
      inventoryTurnover: parseFloat(overview.InventoryTurnover || '0') || undefined,
      receivablesTurnover: parseFloat(overview.ReceivablesTurnover || '0') || undefined,
      payablesTurnover: parseFloat(overview.PayablesTurnover || '0') || undefined,
      fixedAssetTurnover: parseFloat(overview.FixedAssetTurnover || '0') || undefined,
      
      // Per-share metrics
      revenuePerShare: parseFloat(overview.RevenuePerShare || '0') || undefined,
      netIncomePerShare: parseFloat(overview.NetIncomePerShare || '0') || undefined,
      cashPerShare: parseFloat(overview.CashPerShare || '0') || undefined,
      operatingCashFlowPerShare: parseFloat(overview.OperatingCashFlowPerShare || '0') || undefined,
      freeCashFlowPerShare: parseFloat(overview.FreeCashFlowPerShare || '0') || undefined,
      
      // Additional company information
      cik: overview.CIK || undefined,
      isin: overview.ISIN || undefined,
      cusip: overview.CUSIP || undefined,
      averageVolume: parseFloat(overview.AverageVolume || '0') || undefined
    };
    
    // Validate and return data
    return validateCompanyData(result, 'Alpha Vantage', ticker);
    
  } catch (error) {
    if (error instanceof FinancialDataError) {
      throw error;
    }
    console.error('Alpha Vantage API error:', error);
    throw new FinancialDataError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`, 'Alpha Vantage', ticker, false);
  }
}

// Priority 2: Finnhub API with enhanced error handling
async function getFinnhubCompanyData(ticker: string): Promise<CompanyData | null> {
  if (!FINNHUB_API_KEY) return null;
  
  try {
    console.log(`🔍 Finnhub: Starting API calls for ${ticker}`);
    
    // Get company profile
    const profileResponse = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    
    if (!profileResponse.ok) {
      throw new FinancialDataError(`Profile API failed with status ${profileResponse.status}`, 'Finnhub', ticker);
    }
    
    const profile = await profileResponse.json();
    
    // Get quote
    const quoteResponse = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    
    if (!quoteResponse.ok) {
      throw new FinancialDataError(`Quote API failed with status ${quoteResponse.status}`, 'Finnhub', ticker);
    }
    
    const quote = await quoteResponse.json();
    
    if (!profile.ticker || !quote.c) {
      throw new FinancialDataError('Missing profile or quote data', 'Finnhub', ticker);
    }
    
    const currentPrice = quote.c || 0;
    const previousClose = quote.pc || 0;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
    
    const result = {
      symbol: profile.ticker,
      name: profile.name || `${ticker} Company`,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      volume: quote.v || 0,
      marketCap: profile.marketCapitalization || 0,
      pe: profile.pe || 0,
      dividend: profile.dividendYield || 0,
      sector: profile.finnhubIndustry || 'Unknown',
      industry: profile.industry || 'Unknown',
      employees: profile.employeeTotal || 0,
      description: profile.description || `Financial data for ${ticker}`
    };
    // UI convenience fields from Finnhub where available
    (result as any).cityState = profile?.city || '';
    (result as any).annualDividend = typeof profile?.dps === 'number' ? profile.dps : 0;

    console.log(`🔍 Finnhub: Successfully processed data for ${ticker}`);
    return validateCompanyData(result, 'Finnhub', ticker);
    
  } catch (error) {
    if (error instanceof FinancialDataError) {
      throw error;
    }
    console.error('Finnhub API error:', error);
    throw new FinancialDataError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`, 'Finnhub', ticker, false);
  }
}

// Priority 3: FMP API with backend proxy (best practice implementation)
async function getFMPCompanyData(ticker: string): Promise<CompanyData | null> {
  if (!FMP_API_KEY) {
    console.log(`❌ FMP: No API key found`);
    return null;
  }
  
  console.log(`🔍 FMP: Starting consolidated API call for ${ticker} via backend proxy`);
  // OPTIONAL: Show which BASE will be used
  console.log(`🔧 FMP: Using base URL for proxy calls: ${API_BASE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}`);
  
  // Add timeout wrapper to prevent hanging
  const timeoutPromise = new Promise<null>((_, reject) => {
    setTimeout(() => reject(new Error('FMP API timeout after 15 seconds')), 15000);
  });
  
  const fmpPromise = async (): Promise<CompanyData | null> => {
    try {
      console.log(`🔍 FMP: Starting consolidated API call for ${ticker}`);
      
      // Build a proper absolute base URL for server-side fetches
      const resolveBase = () => {
        // Prefer explicit API base if provided
        if (API_BASE_URL) return API_BASE_URL.replace(/\/$/, '');
        // Try Vercel-style public URL
        const vercel = process.env.NEXT_PUBLIC_VERCEL_URL; // e.g. myapp.vercel.app
        if (vercel) return `https://${vercel}`;
        // Fallback to localhost for dev server-side execution
        return 'http://localhost:3000';
      };
      const BASE = resolveBase();
      
      // Make all 4 API calls through backend proxy to avoid CORS issues
      console.log(`🔍 FMP: Making parallel API calls via backend proxy for ${ticker}...`);
      
      const [profileResponse, quoteResponse, ratiosResponse, keyMetricsResponse] = await Promise.all([
        fetch(`${BASE}/api/fmp-proxy?ticker=${ticker}&endpoint=profile`),
        fetch(`${BASE}/api/fmp-proxy?ticker=${ticker}&endpoint=quote`),
        fetch(`${BASE}/api/fmp-proxy?ticker=${ticker}&endpoint=ratios-ttm`),
        fetch(`${BASE}/api/fmp-proxy?ticker=${ticker}&endpoint=key-metrics-ttm`)
      ]);
      
      console.log(`🔍 FMP: All proxy calls completed for ${ticker}`);
      console.log(`🔍 FMP: Profile response status:`, profileResponse.status, profileResponse.ok);
      console.log(`🔍 FMP: Quote response status:`, quoteResponse.status, quoteResponse.ok);
      console.log(`🔍 FMP: Ratios response status:`, ratiosResponse.status, ratiosResponse.ok);
      console.log(`🔍 FMP: Key Metrics response status:`, keyMetricsResponse.status, keyMetricsResponse.ok);
      
      // Check all responses
      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error(`❌ FMP: Profile API failed with status ${profileResponse.status}:`, errorText);
        throw new FinancialDataError(`Profile API failed with status ${profileResponse.status}: ${errorText}`, 'FMP', ticker);
      }
      if (!quoteResponse.ok) {
        const errorText = await quoteResponse.text();
        console.error(`❌ FMP: Quote API failed with status ${quoteResponse.status}:`, errorText);
        throw new FinancialDataError(`Quote API failed with status ${quoteResponse.status}: ${errorText}`, 'FMP', ticker);
      }
      if (!ratiosResponse.ok) {
        const errorText = await ratiosResponse.text();
        console.error(`❌ FMP: Ratios API failed with status ${ratiosResponse.status}:`, errorText);
        throw new FinancialDataError(`Ratios API failed with status ${ratiosResponse.status}: ${errorText}`, 'FMP', ticker);
      }
      if (!keyMetricsResponse.ok) {
        const errorText = await keyMetricsResponse.text();
        console.error(`❌ FMP: Key Metrics API failed with status ${keyMetricsResponse.status}:`, errorText);
        throw new FinancialDataError(`Key Metrics API failed with status ${keyMetricsResponse.status}: ${errorText}`, 'FMP', ticker);
      }
      
      console.log(`🔍 FMP: All API responses are OK, parsing JSON...`);
      
      // Parse all responses with error guard for server-side relative URL issues
      let profile, quote, ratios, keyMetrics;
      try {
        [profile, quote, ratios, keyMetrics] = await Promise.all([
          profileResponse.json(),
          quoteResponse.json(),
          ratiosResponse.json(),
          keyMetricsResponse.json()
        ]);
      } catch (e) {
        console.error('❌ FMP: Failed to parse JSON from proxy responses. This often happens when server-side fetch used a relative URL. Ensure BASE is absolute.', e);
        throw e;
      }
      
      console.log(`🔍 FMP: All API calls completed for ${ticker}`);
      console.log(`🔍 FMP: Profile:`, profile ? 'Success' : 'Failed', profile);
      console.log(`🔍 FMP: Quote:`, quote ? 'Success' : 'Failed', quote);
      console.log(`🔍 FMP: Ratios:`, ratios ? 'Success' : 'Failed', ratios);
      console.log(`🔍 FMP: Key Metrics:`, keyMetrics ? 'Success' : 'Failed', keyMetrics);
      
      // Validate data
      if (!profile || profile.length === 0) {
        console.error(`❌ FMP: No profile data returned for ${ticker}:`, profile);
        throw new FinancialDataError('No profile data returned', 'FMP', ticker);
      }
      if (!quote || quote.length === 0) {
        console.error(`❌ FMP: No quote data returned for ${ticker}:`, quote);
        throw new FinancialDataError('No quote data returned', 'FMP', ticker);
      }
      
      const company = profile[0];
      const stockQuote = quote[0];
      const ratiosData = ratios && ratios.length > 0 ? ratios[0] : null;
      const keyMetricsData = keyMetrics && keyMetrics.length > 0 ? keyMetrics[0] : null;
      
      console.log(`🔍 FMP: Company profile processed for ${ticker}:`, company.symbol, company.companyName);
      
      // Calculate price data
      const currentPrice = stockQuote.price || 0;
      const previousClose = stockQuote.previousClose || 0;
      const change = currentPrice - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
      
      console.log(`🔍 FMP: Price data for ${ticker}:`, { currentPrice, previousClose, change, changePercent });
      console.log(`🔍 FMP: Ratios keys available:`, ratiosData ? Object.keys(ratiosData).slice(0, 10) : 'None');
      console.log(`🔍 FMP: Key metrics keys available:`, keyMetricsData ? Object.keys(keyMetricsData).slice(0, 10) : 'None');
      
      // Enhanced data mapping with ALL available FMP fields using consolidated data
      const result = {
        symbol: company.symbol,
        name: company.companyName || `${ticker} Company`,
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        volume: stockQuote.volume || 0,
        averageVolume: stockQuote.avgVolume || company.averageVolume || undefined,
        marketCap: stockQuote.marketCap || company.marketCap || company.mktCap || 0,
        pe: stockQuote.pe || company.pe || (ratiosData?.peRatioTTM ?? 0),
        sharesOutstanding: stockQuote.sharesOutstanding || company.sharesOutstanding || undefined,
        dividend: company.lastDividend || 0,
        sector: company.sector || 'Unknown',
        industry: company.industry || 'Unknown',
        employees: company.fullTimeEmployees || 0,
        description: company.description || `Financial data for ${ticker} from FMP`,
        website: company.website || undefined,

        // Valuation & Ratios - Enhanced mapping
        forwardPE: company.forwardPE || undefined,
        peg: ratiosData?.pegRatioTTM || undefined,
        priceToBook: ratiosData?.priceToBookRatioTTM || undefined,
        priceToSalesTTM: ratiosData?.priceToSalesRatioTTM || undefined,
        // Valuation & Ratios - UI alias
        priceToSales: ratiosData?.priceToSalesRatioTTM || undefined,
        evToEbitda: (keyMetricsData?.enterpriseValueOverEBITDATTM ?? keyMetricsData?.evToEBITDATTM) || undefined,

        // Financials TTM - Prefer totals from key metrics; fallback to per-share × shares
        revenueTTM: (keyMetricsData?.revenueTTM
          ?? (ratiosData?.revenuePerShareTTM && stockQuote?.sharesOutstanding
              ? ratiosData.revenuePerShareTTM * stockQuote.sharesOutstanding
              : undefined)) || undefined,
        grossProfitTTM: (keyMetricsData?.grossProfitTTM
          ?? (ratiosData?.grossProfitMarginTTM && ratiosData?.revenuePerShareTTM && stockQuote?.sharesOutstanding
              ? ratiosData.grossProfitMarginTTM * (ratiosData.revenuePerShareTTM * stockQuote.sharesOutstanding)
              : undefined)) || undefined,
        ebitdaTTM: (keyMetricsData?.ebitdaTTM
          ?? (ratiosData?.ebitdaPerShareTTM && stockQuote?.sharesOutstanding
              ? ratiosData.ebitdaPerShareTTM * stockQuote.sharesOutstanding
              : (ratiosData?.ebitdaMarginTTM && ratiosData?.revenuePerShareTTM && stockQuote?.sharesOutstanding
                  ? ratiosData.ebitdaMarginTTM * (ratiosData.revenuePerShareTTM * stockQuote.sharesOutstanding)
                  : undefined))) || undefined,
        netIncomeTTM: (keyMetricsData?.netIncomeTTM
          ?? (ratiosData?.netIncomePerShareTTM && stockQuote?.sharesOutstanding
              ? ratiosData.netIncomePerShareTTM * stockQuote.sharesOutstanding
              : undefined)) || undefined,
        freeCashFlowTTM: (keyMetricsData?.freeCashFlowTTM
          ?? (ratiosData?.freeCashFlowPerShareTTM && stockQuote?.sharesOutstanding
              ? ratiosData.freeCashFlowPerShareTTM * stockQuote.sharesOutstanding
              : undefined)) || undefined,
        operatingCashFlowPerShare: ratiosData?.operatingCashFlowPerShareTTM || undefined,
        operatingCashFlowTTM: (keyMetricsData?.operatingCashFlowTTM
          ?? (ratiosData?.operatingCashFlowPerShareTTM && stockQuote?.sharesOutstanding
              ? ratiosData.operatingCashFlowPerShareTTM * stockQuote.sharesOutstanding
              : undefined)) || undefined,

        // Profitability & Margins - Enhanced mapping
        grossMargin: ratiosData?.grossProfitMarginTTM ? ratiosData.grossProfitMarginTTM * 100 : undefined,
        operatingMargin: ratiosData?.operatingProfitMarginTTM ? ratiosData.operatingProfitMarginTTM * 100 : undefined,
        netMargin: ratiosData?.netProfitMarginTTM ? ratiosData.netProfitMarginTTM * 100 : undefined,
        roa: ratiosData?.returnOnAssetsTTM ? ratiosData.returnOnAssetsTTM * 100 : undefined,
        roe: ratiosData?.returnOnEquityTTM ? ratiosData.returnOnEquityTTM * 100 : undefined,

        // Balance Sheet & Liquidity - Enhanced mapping
        totalDebt: company.totalDebt || keyMetricsData?.totalDebtTTM || undefined,
        debtToEquity: ratiosData?.debtEquityRatioTTM || undefined,
        currentRatio: ratiosData?.currentRatioTTM || undefined,
        quickRatio: ratiosData?.quickRatioTTM || undefined,
        cashAndShortTermInvestments: company.cashAndShortTermInvestments || undefined,

        // Dividends - Enhanced mapping (use ratio 0-1, not percent)
        dividendYield: typeof ratiosData?.dividendYieldTTM === 'number' ? ratiosData.dividendYieldTTM : undefined,
        payoutRatio: ratiosData?.payoutRatioTTM ? ratiosData.payoutRatioTTM * 100 : undefined,
        exDividendDate: company.exDividendDate || undefined,
        // Dividends - annual dividend per share if available; fallback to yield × price
        annualDividend: (keyMetricsData?.dividendPerShareTTM ?? ratiosData?.dividendPerShareTTM)
          ?? (typeof (ratiosData?.dividendYieldTTM) === 'number' && currentPrice
              ? (ratiosData.dividendYieldTTM <= 1 ? ratiosData.dividendYieldTTM * currentPrice
                                                  : (ratiosData.dividendYieldTTM / 100) * currentPrice)
              : undefined),

        // Performance - Enhanced mapping
        fiftyTwoWeekHigh: stockQuote.yearHigh || undefined,
        fiftyTwoWeekLow: stockQuote.yearLow || undefined,
        beta: company.beta || undefined,
        ytdReturn: company.ytdReturn || undefined,
        oneYearReturn: company.oneYearReturn || undefined,

        // Company Details - Enhanced mapping
        country: company.country || undefined,
        exchange: company.exchange || undefined,
        currency: company.currency || undefined,
        ceo: company.ceo || undefined,
        phone: company.phone || undefined,
        address: company.address || undefined,
        city: company.city || undefined,
        state: company.state || undefined,
        zip: company.zip || undefined,
        image: company.image || undefined,
        ipoDate: company.ipoDate || undefined,
        cik: company.cik || undefined,
        isin: company.isin || undefined,
        cusip: company.cusip || undefined,
        // averageVolume: company.averageVolume || undefined, // REMOVE per instructions
        // Company Details - combined city/state for UI
        cityState: [company.city, company.state].filter(Boolean).join(', ') || undefined,

        // Financial Ratios - Comprehensive mapping from ratios TTM
        ...(ratiosData && {
          // Additional margins
          ebitMargin: ratiosData.ebitPerRevenueTTM ? ratiosData.ebitPerRevenueTTM * 100 : undefined,
          ebitdaMargin: ratiosData.ebitdaMarginTTM ? ratiosData.ebitdaMarginTTM * 100 : undefined,

          // Turnover ratios
          receivablesTurnover: ratiosData.receivablesTurnoverTTM || undefined,
          payablesTurnover: ratiosData.payablesTurnoverTTM || undefined,
          inventoryTurnover: ratiosData.inventoryTurnoverTTM || undefined,
          fixedAssetTurnover: ratiosData.fixedAssetTurnoverTTM || undefined,
          assetTurnover: ratiosData.assetTurnoverTTM || undefined,

          // Valuation ratios - using correct FMP field names
          priceToEarningsRatio: ratiosData.peRatioTTM || undefined,
          priceToBookRatio: ratiosData.priceToBookRatioTTM || undefined,
          priceToSalesRatio: ratiosData.priceToSalesRatioTTM || undefined,
          priceToFreeCashFlowRatio: ratiosData.priceToFreeCashFlowsRatioTTM || undefined,
          priceToOperatingCashFlowRatio: ratiosData.priceToOperatingCashFlowsRatioTTM || undefined,

          // Debt ratios - using correct FMP field names
          debtToAssetsRatio: ratiosData.debtRatioTTM || undefined,
          debtToEquity: ratiosData.debtEquityRatioTTM || undefined,
          debtToCapitalRatio: ratiosData.totalDebtToCapitalizationTTM || undefined,
          longTermDebtToCapitalRatio: ratiosData.longTermDebtToCapitalizationTTM || undefined,
          financialLeverageRatio: ratiosData.companyEquityMultiplierTTM || undefined,

          // Cash flow ratios
          operatingCashFlowRatio: ratiosData.operatingCashFlowRatioTTM || undefined,
          operatingCashFlowSalesRatio: ratiosData.operatingCashFlowSalesRatioTTM || undefined,
          freeCashFlowOperatingCashFlowRatio: ratiosData.freeCashFlowOperatingCashFlowRatioTTM || undefined,
          debtServiceCoverageRatio: ratiosData.debtServiceCoverageRatioTTM || undefined,
          interestCoverageRatio: ratiosData.interestCoverageTTM || undefined,

          // Per-share metrics
          revenuePerShare: ratiosData.revenuePerShareTTM || undefined,
          netIncomePerShare: ratiosData.netIncomePerShareTTM || undefined,
          cashPerShare: ratiosData.cashPerShareTTM || undefined,
          bookValuePerShare: ratiosData.bookValuePerShareTTM || undefined,
          operatingCashFlowPerShare: ratiosData.operatingCashFlowPerShareTTM || undefined,
          freeCashFlowPerShare: ratiosData.freeCashFlowPerShareTTM || undefined,

          // Additional metrics
          effectiveTaxRate: ratiosData.effectiveTaxRateTTM ? ratiosData.effectiveTaxRateTTM * 100 : undefined,
          enterpriseValueMultiple: ratiosData.enterpriseValueMultipleTTM || undefined
        }),

        // Additional key metrics from key metrics TTM
        ...(keyMetricsData && {
          // Additional financial data
          enterpriseValue: keyMetricsData.enterpriseValueTTM || undefined,
          workingCapital: keyMetricsData.workingCapitalTTM || undefined,
          returnOnTangibleAssets: keyMetricsData.returnOnTangibleAssetsTTM || undefined,
          returnOnCapitalEmployed: keyMetricsData.returnOnCapitalEmployedTTM || undefined,
          returnOnInvestedCapital: keyMetricsData.returnOnInvestedCapitalTTM || undefined,
          returnOnEquity: keyMetricsData.returnOnEquityTTM || undefined,
          returnOnAssets: keyMetricsData.returnOnAssetsTTM || undefined
        })
      };

      // --- Post-processing: fill gaps using safe fallbacks ---
      // Market Cap from price * shares if missing
      if ((!result.marketCap || result.marketCap === 0) && result.price && (result as any).sharesOutstanding) {
        result.marketCap = result.price * (result as any).sharesOutstanding;
      }
      // Shares outstanding from market cap / price if missing
      if (!(result as any).sharesOutstanding && result.marketCap && result.price) {
        (result as any).sharesOutstanding = result.marketCap / result.price;
      }

      // Revenue/Gross/EBITDA/Net Income fallbacks using market cap & ratios
      if (!result.revenueTTM && result.marketCap && result.priceToSales) {
        result.revenueTTM = result.marketCap / (result.priceToSales || result.priceToSalesTTM || 1);
      }
      if (!result.grossProfitTTM && result.revenueTTM && ratiosData?.grossProfitMarginTTM) {
        result.grossProfitTTM = ratiosData.grossProfitMarginTTM * result.revenueTTM;
      }
      if (!result.ebitdaTTM && result.revenueTTM) {
        if (ratiosData?.ebitdaMarginTTM) {
          result.ebitdaTTM = ratiosData.ebitdaMarginTTM * result.revenueTTM;
        } else if (ratiosData?.ebitdaPerShareTTM && (result as any).sharesOutstanding) {
          result.ebitdaTTM = ratiosData.ebitdaPerShareTTM * (result as any).sharesOutstanding;
        }
      }
      if (!result.netIncomeTTM && result.revenueTTM && ratiosData?.netProfitMarginTTM) {
        result.netIncomeTTM = ratiosData.netProfitMarginTTM * result.revenueTTM;
      }
      if (!result.freeCashFlowTTM && ratiosData?.freeCashFlowPerShareTTM && (result as any).sharesOutstanding) {
        result.freeCashFlowTTM = ratiosData.freeCashFlowPerShareTTM * (result as any).sharesOutstanding;
      }

      // Dividend yield fallback from annual dividend and price (ratio 0–1)
      if ((result.dividendYield === undefined || result.dividendYield === null) && result.annualDividend && result.price) {
        result.dividendYield = result.annualDividend / result.price;
      }

      // Average volume: ensure coming from quote if possible
      if (!result.averageVolume && stockQuote?.avgVolume) {
        result.averageVolume = stockQuote.avgVolume;
      }
      
      console.log(`🔍 FMP: Successfully processed consolidated data for ${ticker}`);
      console.log(`🔍 FMP: Final data summary:`, {
        hasRatios: !!ratiosData,
        hasKeyMetrics: !!keyMetricsData,
        ratiosFields: ratiosData ? Object.keys(ratiosData).length : 0,
        keyMetricsFields: keyMetricsData ? Object.keys(keyMetricsData).length : 0
      });
      
      return validateCompanyData(result, 'FMP', ticker);
      
    } catch (error) {
      console.error(`❌ FMP: Error occurred for ${ticker}:`, error);
      if (error instanceof FinancialDataError) {
        throw error;
      }
      console.error('FMP API error:', error);
      throw new FinancialDataError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`, 'FMP', ticker, false);
    }
  };
  
  return Promise.race([fmpPromise(), timeoutPromise]);
}

// Priority 4: Yahoo Finance with enhanced error handling
async function getYahooFinanceCompanyData(ticker: string): Promise<CompanyData | null> {
  try {
    console.log(`🔍 Yahoo Finance: Starting API calls for ${ticker}`);
    
    const response = await fetch(
      `/api/yahoo-finance/quote?ticker=${encodeURIComponent(ticker)}`
    );
    
    if (!response.ok) {
      throw new FinancialDataError(`Yahoo Finance API failed with status ${response.status}`, 'Yahoo Finance', ticker);
    }
    
    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new FinancialDataError('Invalid response from Yahoo Finance API', 'Yahoo Finance', ticker);
    }
    
    const quoteData = result.data;
    
    const currentPrice = quoteData.regularMarketPrice || 0;
    const previousClose = quoteData.previousClose || 0;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
    
    const processedData = {
      symbol: ticker.toUpperCase(),
      name: quoteData.longName || quoteData.shortName || quoteData.displayName || `${ticker} Company`,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      volume: quoteData.regularMarketVolume || quoteData.averageDailyVolume3Month || 0,
      marketCap: quoteData.marketCap || 0,
      pe: quoteData.trailingPE || quoteData.pe || 0,
      dividend: quoteData.trailingAnnualDividendYield ? quoteData.trailingAnnualDividendYield * 100 : quoteData.dividendYield || 0,
      sector: quoteData.sector || null,
      industry: quoteData.industry || null,
      employees: quoteData.fullTimeEmployees || null,
      description: quoteData.businessSummary || `Financial data for ${ticker} from Yahoo Finance`,
      // Enhanced fields from Yahoo Finance
      currency: quoteData.currency || 'USD',
      beta: quoteData.beta || undefined,
      bookValuePerShare: quoteData.bookValue || undefined,
      debtToEquity: quoteData.debtToEquity || undefined,
      // Additional fields if available
      forwardPE: quoteData.forwardPE || undefined,
      priceToBook: quoteData.bookValue ? (currentPrice / quoteData.bookValue) : undefined,
      // 52-week high/low
      fiftyTwoWeekHigh: quoteData.fiftyTwoWeekHigh || quoteData.yearHigh || undefined,
      fiftyTwoWeekLow: quoteData.fiftyTwoWeekLow || quoteData.yearLow || undefined,
      // Average volume
      averageVolume: quoteData.averageDailyVolume3Month || quoteData.averageDailyVolume10Day || undefined,
      // Additional enhanced fields that frontend expects
      dividendYield: quoteData.dividendYield || undefined,
      // Performance metrics
      ytdReturn: quoteData.ytdReturn || undefined,
      oneYearReturn: quoteData.oneYearReturn || undefined,
      // Company details
      country: quoteData.country || undefined,
      exchange: quoteData.exchange || undefined,
      ceo: quoteData.ceo || undefined,
      ipoDate: quoteData.ipoDate || undefined,
      // Financial ratios
      currentRatio: quoteData.currentRatio || undefined,
      quickRatio: quoteData.quickRatio || undefined,
      // Additional valuation metrics
      peg: quoteData.peg || undefined,
      priceToSalesTTM: quoteData.priceToSalesTTM || undefined,
      evToEbitda: quoteData.evToEbitda || undefined
    };
    
    console.log(`🔍 Yahoo Finance: Successfully processed data for ${ticker}`);
    return validateCompanyData(processedData, 'Yahoo Finance', ticker);
    
  } catch (error) {
    if (error instanceof FinancialDataError) {
      throw error;
    }
    console.error('Yahoo Finance API error:', error);
    throw new FinancialDataError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`, 'Yahoo Finance', ticker, false);
  }
}

// Priority 5: Backend API
async function getBackendCompanyData(ticker: string): Promise<CompanyData | null> {
  if (!API_BASE_URL) return null;
  
  try {
    const response = await cachedGet(`${API_BASE_URL}/api/stocks/${ticker}`);
    if (response.status_code === 200 && response.json) {
      return validateCompanyData(response.json, 'Backend API', ticker);
    }
  } catch (error) {
    console.error('Backend API error:', error);
  }
  return null;
}

// Historical Data Functions
async function getPolygonHistoricalData(ticker: string, period: string): Promise<HistoricalDataPoint[] | null> {
  if (!POLYGON_API_KEY) return null;
  
  try {
    console.log(`🔄 Polygon.io: Fetching historical data for ${ticker} (${period})`);
    
    // Calculate date range based on period
    const now = new Date();
    const days = period === '1M' ? 30 : period === '3M' ? 90 : period === '6M' ? 180 : period === '1Y' ? 365 : 730;
    const from = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const fromStr = from.toISOString().split('T')[0];
    const toStr = now.toISOString().split('T')[0];
    
    console.log(`🔄 Polygon.io: Date range ${fromStr} to ${toStr}`);
    
    // Use Polygon.io aggregates endpoint for historical data
    const response = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=asc&limit=5000&apiKey=${POLYGON_API_KEY}`
    );
    
    if (!response.ok) {
      console.log(`❌ Polygon.io: HTTP ${response.status} - ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      console.log(`❌ Polygon.io: Invalid response structure`, data);
      return null;
    }
    
    console.log(`✅ Polygon.io: Received ${data.results.length} data points`);
    
    const historicalData: HistoricalDataPoint[] = data.results.map((bar: any) => ({
      date: new Date(bar.t).toISOString().split('T')[0],
      price: bar.c || 0, // Close price
      volume: bar.v || 0,
      open: bar.o || 0,
      high: bar.h || 0,
      low: bar.l || 0,
      close: bar.c || 0
    }));
    
    // Filter out invalid data points
    const validData = historicalData.filter(point => 
      point.date && point.price > 0 && point.volume >= 0
    );
    
    console.log(`✅ Polygon.io: ${validData.length} valid data points after filtering`);
    
    return validData.length > 0 ? validData : null;
    
  } catch (error) {
    console.error('❌ Polygon.io historical data error:', error);
    return null;
  }
}

async function getAlphaVantageHistoricalData(ticker: string, period: string): Promise<HistoricalDataPoint[] | null> {
  if (!ALPHA_VANTAGE_API_KEY) return null;
  
  try {
    const interval = period === '1M' ? 'daily' : 'daily';
    const outputsize = period === '1M' ? 'compact' : 'full';
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_${interval.toUpperCase()}&symbol=${ticker}&outputsize=${outputsize}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const timeSeriesKey = `Time Series (${interval.charAt(0).toUpperCase() + interval.slice(1)})`;
    const timeSeries = data[timeSeriesKey];
    
    if (!timeSeries) return null;
    
    const historicalData: HistoricalDataPoint[] = [];
    const dates = Object.keys(timeSeries).sort().reverse();
    
    // Limit data points based on period
    const maxPoints = period === '1M' ? 30 : period === '3M' ? 90 : period === '6M' ? 180 : period === '1Y' ? 365 : 730;
    const limitedDates = dates.slice(0, maxPoints);
    
    for (const date of limitedDates) {
      const dayData = timeSeries[date];
      historicalData.push({
        date: date,
        price: parseFloat(dayData['4. close'] || '0'),
        volume: parseInt(dayData['5. volume'] || '0'),
        open: parseFloat(dayData['1. open'] || '0'),
        high: parseFloat(dayData['2. high'] || '0'),
        low: parseFloat(dayData['3. low'] || '0'),
        close: parseFloat(dayData['4. close'] || '0')
      });
    }
    
    return historicalData;
  } catch (error) {
    console.error('Alpha Vantage historical data error:', error);
    return null;
  }
}

async function getFinnhubHistoricalData(ticker: string, period: string): Promise<HistoricalDataPoint[] | null> {
  if (!FINNHUB_API_KEY) return null;
  
  try {
    const now = Math.floor(Date.now() / 1000);
    const days = period === '1M' ? 30 : period === '3M' ? 90 : period === '6M' ? 180 : period === '1Y' ? 365 : 730;
    const from = now - (days * 24 * 60 * 60);
    
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${now}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (!data.s || data.s !== 'ok') return null;
    
    const historicalData: HistoricalDataPoint[] = [];
    
    for (let i = 0; i < data.t.length; i++) {
      historicalData.push({
        date: new Date(data.t[i] * 1000).toISOString().split('T')[0],
        price: data.c[i] || 0,
        volume: data.v[i] || 0,
        open: data.o[i] || 0,
        high: data.h[i] || 0,
        low: data.l[i] || 0,
        close: data.c[i] || 0
      });
    }
    
    return historicalData;
  } catch (error) {
    console.error('Finnhub historical data error:', error);
    return null;
  }
}

async function getYahooFinanceHistoricalData(ticker: string, period: string): Promise<HistoricalDataPoint[] | null> {
  try {
    const range = period === '1M' ? '1mo' : period === '3M' ? '3mo' : period === '6M' ? '6mo' : period === '1Y' ? '1y' : '2y';
    
    // Use our API route that uses yahoo-finance2 library (no CORS issues)
    const response = await fetch(
      `/api/yahoo-finance/chart?ticker=${encodeURIComponent(ticker)}&range=${range}&interval=1d`
    );
    
    if (!response.ok) return null;
    
    const result = await response.json();
    
    if (!result.success || !result.data || !result.data.result || !result.data.result[0]) return null;
    
    const chartResult = result.data.result[0];
    const timestamps = chartResult.timestamp;
    const quote = chartResult.indicators.quote[0];
    
    if (!timestamps || !quote) return null;
    
    const historicalData: HistoricalDataPoint[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      historicalData.push({
        date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
        price: quote.close[i] || 0,
        volume: quote.volume[i] || 0,
        open: quote.open[i] || 0,
        high: quote.high[i] || 0,
        low: quote.low[i] || 0,
        close: quote.close[i] || 0
      });
    }
    
    return historicalData;
  } catch (error) {
    console.error('Yahoo Finance historical data error:', error);
    return null;
  }
}

async function getFMPHistoricalData(ticker: string, period: string): Promise<HistoricalDataPoint[] | null> {
  if (!FMP_API_KEY) return null;
  
  try {
    // FMP uses different period formats
    const fmpPeriod = period === '1M' ? '1month' : 
                     period === '3M' ? '3months' : 
                     period === '6M' ? '6months' : 
                     period === '1Y' ? '1year' : 
                     period === '2Y' ? '2years' : '5years';
    
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?timeseries=${fmpPeriod}&apikey=${FMP_API_KEY}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (!data.historical || !Array.isArray(data.historical)) return null;
    
    const historicalData: HistoricalDataPoint[] = [];
    
    // FMP returns data in reverse chronological order
    for (const day of data.historical) {
      historicalData.push({
        date: day.date,
        price: day.close || 0,
        volume: day.volume || 0,
        open: day.open || 0,
        high: day.high || 0,
        low: day.low || 0,
        close: day.close || 0
      });
    }
    
    return historicalData;
  } catch (error) {
    console.error('FMP historical data error:', error);
    return null;
  }
}

async function getBackendHistoricalData(ticker: string, period: string): Promise<HistoricalDataPoint[] | null> {
  if (!API_BASE_URL) return null;
  
  try {
    const response = await cachedGet(`${API_BASE_URL}/api/stocks/${ticker}/history`, { period });
    if (response.status_code === 200 && response.json) {
      return response.json;
    }
  } catch (error) {
    console.error('Backend historical data error:', error);
  }
  return null;
}

// Helper function to filter historical data based on period
function filterHistoricalDataByPeriod(data: HistoricalDataPoint[], period: string): HistoricalDataPoint[] {
  if (!data || data.length === 0) return [];
  
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  let startDate: Date;
  
  switch (period) {
    case '1M':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      break;
    case '3M':
      startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
      break;
    case '6M':
      startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      break;
    case '1Y':
      startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      break;
    case '2Y':
      startDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
      break;
    case '5Y':
      startDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
      break;
    default:
      startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()); // Default to 1Y
  }
  
  startDate.setHours(0, 0, 0, 0); // Start of the day
  
  console.log(`📅 Filtering data for period ${period}:`);
  console.log(`   Start date: ${startDate.toISOString().split('T')[0]}`);
  console.log(`   End date: ${today.toISOString().split('T')[0]}`);
  console.log(`   Original data points: ${data.length}`);
  
  // Filter data to include only points within the date range
  const filteredData = data.filter(point => {
    if (!point.date) return false;
    
    const pointDate = new Date(point.date);
    return pointDate >= startDate && pointDate <= today;
  });
  
  // Sort by date (oldest to newest)
  const sortedData = filteredData.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  
  console.log(`   Filtered data points: ${sortedData.length}`);
  
  // Log date range of filtered data
  if (sortedData.length > 0) {
    const firstDate = new Date(sortedData[0].date);
    const lastDate = new Date(sortedData[sortedData.length - 1].date);
    console.log(`   Data spans: ${firstDate.toISOString().split('T')[0]} to ${lastDate.toISOString().split('T')[0]}`);
  }
  
  return sortedData;
}

// Main function to fetch comprehensive company data with robust fallbacks
export async function fetchComprehensiveCompanyData(ticker: string): Promise<CompanyData | null> {
  console.log(`🔍 Fetching comprehensive company data for ${ticker}...`);
  
  // Define API functions with metadata for better error handling
  const apiFunctions = [
    {
      name: 'FMP',
      func: () => getFMPCompanyData(ticker),
      priority: 1,
      hasCompanyDetails: true
    },
    {
      name: 'Alpha Vantage',
      func: () => getAlphaVantageCompanyData(ticker),
      priority: 2,
      hasCompanyDetails: true
    },
    {
      name: 'Finnhub',
      func: () => getFinnhubCompanyData(ticker),
      priority: 3,
      hasCompanyDetails: true
    },
    {
      name: 'Backend API',
      func: () => getBackendCompanyData(ticker),
      priority: 4,
      hasCompanyDetails: true
    },
    {
      name: 'Yahoo Finance',
      func: () => getYahooFinanceCompanyData(ticker),
      priority: 5,
      hasCompanyDetails: false // Yahoo Finance doesn't provide company details
    }
  ];
  
  let bestResult: CompanyData | null = null;
  let bestScore = 0;
  let lastError: FinancialDataError | null = null;
  const apiResults: Array<{ name: string; success: boolean; error?: string; score?: number }> = [];
  
  // Try all APIs and score the results
  for (const api of apiFunctions) {
    try {
      console.log(`🔄 Trying ${api.name} (Priority ${api.priority})...`);
      const data = await api.func();
      
      if (data && data.symbol && data.price > 0) {
        // Calculate quality score based on available data
        let score = 1; // Base score for having basic data
        
        // Bonus points for company details
        if (data.sector && data.sector !== 'Unknown') score += 2;
        if (data.industry && data.industry !== 'Unknown') score += 2;
        if (data.employees && data.employees > 0) score += 2;
        if (data.description && data.description.length > 10) score += 1;
        if (data.marketCap && data.marketCap > 0) score += 1;
        if (data.pe && data.pe > 0) score += 1;
        if (data.dividend && data.dividend > 0) score += 1;
        
        // Bonus points for enhanced financial data
        if (data.revenueTTM) score += 3;
        if (data.grossMargin) score += 3;
        if (data.debtToEquity) score += 3;
        if (data.currentRatio) score += 3;
        if (data.country) score += 2;
        if (data.ceo) score += 2;
        
        console.log(`📊 ${api.name} score: ${score} (${api.hasCompanyDetails ? 'Has company details' : 'Basic data only'})`);
        console.log(`📊 ${api.name} enhanced data:`, {
          hasRevenue: !!data.revenueTTM,
          hasMargins: !!data.grossMargin,
          hasRatios: !!data.debtToEquity,
          hasCompanyDetails: !!data.country
        });
        
        apiResults.push({ name: api.name, success: true, score });
        
        // If this API has company details and we don't have a better result, use it
        if (api.hasCompanyDetails && score > bestScore) {
          bestResult = data;
          bestScore = score;
          
          // If we have excellent data (score >= 12), use it immediately
          if (score >= 12) {
            console.log(`✅ ${api.name} succeeded with excellent data (score: ${score})!`);
            return data;
          }
        }
        
        // Keep track of the best basic data as fallback
        if (!bestResult || score > bestScore) {
          bestResult = data;
          bestScore = score;
        }
      } else {
        const errorMsg = `Invalid data returned`;
        console.log(`⚠️ ${api.name} returned invalid data:`, {
          hasData: !!data,
          hasSymbol: !!(data && data.symbol),
          hasPrice: !!(data && data.price > 0),
          symbol: data?.symbol,
          price: data?.price,
          sector: data?.sector,
          industry: data?.industry,
          employees: data?.employees
        });
        apiResults.push({ name: api.name, success: false, error: errorMsg });
      }
      
    } catch (error) {
      if (error instanceof FinancialDataError) {
        lastError = error;
        console.log(`❌ ${api.name} failed:`, error.message);
        apiResults.push({ name: api.name, success: false, error: error.message });
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`❌ ${api.name} failed:`, errorMsg);
        apiResults.push({ name: api.name, success: false, error: errorMsg });
      }
      continue;
    }
  }
  
  // Return the best result we found
  if (bestResult) {
    const hasCompanyDetails = bestResult.sector && bestResult.sector !== 'Unknown' && 
                             bestResult.industry && bestResult.industry !== 'Unknown' &&
                             bestResult.employees && bestResult.employees > 0;
    
    console.log(`✅ Using best available data (score: ${bestScore})${hasCompanyDetails ? ' with company details' : ' (basic data only)'}`);
    
    // Log API results summary
    const successfulApis = apiResults.filter(r => r.success);
    const failedApis = apiResults.filter(r => !r.success);
    
    console.log(`📊 API Results Summary:`);
    console.log(`   ✅ Successful: ${successfulApis.map(r => r.name).join(', ')}`);
    if (failedApis.length > 0) {
      console.log(`   ❌ Failed: ${failedApis.map(r => `${r.name} (${r.error})`).join(', ')}`);
    }
    
    return bestResult;
  }
  
  // If we get here, all APIs failed
  console.error(`❌ All APIs failed to fetch company data for ${ticker}`);
  
  // Log detailed failure information
  console.log(`📊 Final API Results:`);
  apiResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const details = result.success ? `(score: ${result.score})` : `(${result.error})`;
    console.log(`   ${status} ${result.name}: ${details}`);
  });
  
  if (lastError) {
    console.error('Last error details:', {
      source: lastError.source,
      ticker: lastError.ticker,
      message: lastError.message,
      isOperational: lastError.isOperational
    });
  }
  
  return null;
}

// Main function to fetch historical data with robust fallbacks
export async function getHistoricalDataMultiSource(ticker: string, period: string = "1Y"): Promise<HistoricalDataPoint[] | null> {
  console.log(`📊 Fetching historical data for ${ticker} (${period})...`);
  
  const dataSources = [
    {
      name: 'Polygon.io',
      func: () => getPolygonHistoricalData(ticker, period),
      priority: 1
    },
    {
      name: 'Backend API',
      func: () => getBackendHistoricalData(ticker, period),
      priority: 2
    },
    {
      name: 'Alpha Vantage',
      func: () => getAlphaVantageHistoricalData(ticker, period),
      priority: 3
    },
    {
      name: 'FMP',
      func: () => getFMPHistoricalData(ticker, period),
      priority: 4
    },
    {
      name: 'Finnhub',
      func: () => getFinnhubHistoricalData(ticker, period),
      priority: 5
    },
    {
      name: 'Yahoo Finance',
      func: () => getYahooFinanceHistoricalData(ticker, period),
      priority: 6
    }
  ];
  
  for (const source of dataSources) {
    try {
      console.log(`🔄 Trying ${source.name} (Priority ${source.priority})...`);
      const data = await source.func();
      
      if (data && data.length > 0) {
        // Validate data quality
        const validDataPoints = data.filter(point => 
          point.date && point.price > 0 && point.volume >= 0
        );
        
        if (validDataPoints.length > 0) {
          console.log(`✅ ${source.name} succeeded with ${validDataPoints.length} valid data points!`);
          
          // Apply period filtering to ensure correct date range
          const filteredData = filterHistoricalDataByPeriod(validDataPoints, period);
          
          if (filteredData.length > 0) {
            console.log(`✅ Period filtering successful: ${filteredData.length} points within ${period} range`);
            return filteredData;
          } else {
            console.log(`⚠️ Period filtering resulted in no data points, trying next source...`);
          }
        } else {
          console.log(`⚠️ ${source.name} returned data but no valid points, trying next...`);
        }
      } else {
        console.log(`⚠️ ${source.name} returned empty data, trying next...`);
      }
      
    } catch (error) {
      console.log(`❌ ${source.name} failed:`, error instanceof Error ? error.message : 'Unknown error');
      continue;
    }
  }
  
  console.error(`❌ All historical data sources failed for ${ticker}`);
  return null;
}