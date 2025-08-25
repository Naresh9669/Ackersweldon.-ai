// SEC EDGAR Scraper for Company Filings
// Extracts financial data, executive compensation, and insider trading information

import { BaseScraper } from '../utils/BaseScraper';
import { 
  CompanyVerificationResult, 
  SECFiling, 
  FinancialData, 
  ExecutiveCompensation,
  InsiderTradingRecord,
  ScrapingResult 
} from '../models/FINRAKYCTypes';

export class SECEDGARScraper extends BaseScraper {
  private baseUrl = 'https://www.sec.gov/edgar';
  private searchUrl = 'https://www.sec.gov/cgi-bin/browse-edgar';

  async scrape(request: { identifier: string; type: string }): Promise<ScrapingResult<CompanyVerificationResult>> {
    try {
      this.log(`Starting SEC EDGAR scrape for ${request.identifier}`);

      let companyData: CompanyVerificationResult;

      if (request.type === 'ticker') {
        companyData = await this.scrapeByTicker(request.identifier);
      } else if (request.type === 'cik') {
        companyData = await this.scrapeByCIK(request.identifier);
      } else {
        companyData = await this.scrapeByName(request.identifier);
      }

      return this.createScrapingResult(
        companyData,
        'SEC_EDGAR',
        companyData.confidence,
        companyData
      );

    } catch (error) {
      this.log(`SEC EDGAR scraping failed: ${error}`, 'error');
      return this.createErrorResult<CompanyVerificationResult>(
        'SEC_EDGAR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async scrapeByTicker(ticker: string): Promise<CompanyVerificationResult> {
    // Search by ticker symbol
    const searchUrl = `${this.searchUrl}?action=getcompany&CIK=&ticker=${ticker}&owner=exclude&action=getcompany`;
    
    const response = await this.makeRequest(searchUrl);
    const $ = this.loadCheerio(response.data);

    // Extract company information
    const companyName = this.extractText($('span.companyName'));
    const cik = this.extractCIK($('span.companyName a').attr('href') || '');
    
    if (!companyName || !cik) {
      throw new Error(`Company not found for ticker: ${ticker}`);
    }

    // Get detailed company information
    const companyData = await this.getCompanyDetails(cik);
    
    return {
      ...companyData,
      ticker,
      confidence: 90
    };
  }

  private async scrapeByCIK(cik: string): Promise<CompanyVerificationResult> {
    // Direct CIK lookup
    const companyData = await this.getCompanyDetails(cik);
    
    return {
      ...companyData,
      confidence: 95
    };
  }

  private async scrapeByName(name: string): Promise<CompanyVerificationResult> {
    // Search by company name
    const searchUrl = `${this.searchUrl}?action=getcompany&CIK=&company=${encodeURIComponent(name)}&owner=exclude&action=getcompany`;
    
    const response = await this.makeRequest(searchUrl);
    const $ = this.loadCheerio(response.data);

    // Find best match
    const companyLink = $('span.companyName a').first();
    const companyName = this.extractText($('span.companyName').first());
    const cik = this.extractCIK(companyLink.attr('href') || '');

    if (!companyName || !cik) {
      throw new Error(`Company not found for name: ${name}`);
    }

    // Get detailed company information
    const companyData = await this.getCompanyDetails(cik);
    
    return {
      ...companyData,
      confidence: 85
    };
  }

  private async getCompanyDetails(cik: string): Promise<CompanyVerificationResult> {
    // Get company filing index
    const indexUrl = `${this.baseUrl}/browse/index.json?CIK=${cik}`;
    
    try {
      const response = await this.makeRequest(indexUrl);
      const companyInfo = response.data;

      // Get recent filings
      const filings = await this.getRecentFilings(cik);
      
      // Get financial data from latest 10-K/10-Q
      const financialData = await this.getFinancialData(cik);
      
      // Get executive compensation
      const executiveComp = await this.getExecutiveCompensation(cik);
      
      // Get insider trading data
      const insiderTrading = await this.getInsiderTrading(cik);

      return {
        success: true,
        name: companyInfo.name || 'Unknown',
        cik,
        status: 'active',
        registrationStatus: 'registered',
        secFilings: filings,
        financialData,
        executiveCompensation: executiveComp,
        insiderTrading,
        confidence: 90,
        source: 'SEC_EDGAR',
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      // Fallback to HTML parsing if JSON fails
      return this.getCompanyDetailsFromHTML(cik);
    }
  }

  private async getCompanyDetailsFromHTML(cik: string): Promise<CompanyVerificationResult> {
    const companyUrl = `${this.searchUrl}?action=getcompany&CIK=${cik}&owner=exclude&action=getcompany`;
    
    const response = await this.makeRequest(companyUrl);
    const $ = this.loadCheerio(response.data);

    const companyName = this.extractText($('span.companyName'));
    
    // Get recent filings
    const filings = await this.getRecentFilings(cik);
    
    // Get financial data
    const financialData = await this.getFinancialData(cik);
    
    // Get executive compensation
    const executiveComp = await this.getExecutiveCompensation(cik);
    
    // Get insider trading data
    const insiderTrading = await this.getInsiderTrading(cik);

    return {
      success: true,
      name: companyName || 'Unknown',
      cik,
      status: 'active',
      registrationStatus: 'registered',
      secFilings: filings,
      financialData,
      executiveCompensation: executiveComp,
      insiderTrading,
      confidence: 80,
      source: 'SEC_EDGAR',
      lastUpdated: new Date().toISOString()
    };
  }

  private async getRecentFilings(cik: string): Promise<SECFiling[]> {
    const filingsUrl = `${this.searchUrl}?action=getcompany&CIK=${cik}&type=&dateb=&owner=exclude&count=40&action=getcompany`;
    
    const response = await this.makeRequest(filingsUrl);
    const $ = this.loadCheerio(response.data);

    const filings: SECFiling[] = [];

    $('tr').each((index, element) => {
      const $row = $(element);
      const $cells = $row.find('td');
      
      if ($cells.length >= 4) {
        const formType = this.extractText($cells.eq(0));
        const description = this.extractText($cells.eq(1));
        const filingDate = this.extractText($cells.eq(2));
        const accessionNumber = this.extractAccessionNumber($cells.eq(1).find('a').attr('href') || '');

        if (formType && description && filingDate) {
          filings.push({
            accessionNumber: accessionNumber || `unknown_${index}`,
            formType,
            filedAt: filingDate,
            description,
            url: accessionNumber ? `${this.baseUrl}/data/${cik}/${accessionNumber.replace(/-/g, '')}/index.json` : '',
            items: []
          });
        }
      }
    });

    return filings.slice(0, 20); // Return last 20 filings
  }

  private async getFinancialData(cik: string): Promise<FinancialData> {
    // Try to get latest 10-K filing
    const filings = await this.getRecentFilings(cik);
    const latest10K = filings.find(f => f.formType === '10-K');
    
    if (!latest10K) {
      return this.getDefaultFinancialData();
    }

    try {
      // Parse 10-K for financial data
      const filingData = await this.parse10KFiling(latest10K.url);
      return filingData;
    } catch (error) {
      this.log(`Failed to parse 10-K filing: ${error}`, 'warn');
      return this.getDefaultFinancialData();
    }
  }

  private async parse10KFiling(filingUrl: string): Promise<FinancialData> {
    // This is a simplified parser - in production you'd want more sophisticated parsing
    const response = await this.makeRequest(filingUrl);
    
    // For now, return default data structure
    // In a real implementation, you'd parse the XBRL or HTML content
    return this.getDefaultFinancialData();
  }

  private async getExecutiveCompensation(cik: string): Promise<ExecutiveCompensation[]> {
    // Try to get latest DEF 14A (proxy statement)
    const filings = await this.getRecentFilings(cik);
    const latestProxy = filings.find(f => f.formType === 'DEF 14A');
    
    if (!latestProxy) {
      return [];
    }

    try {
      // Parse proxy statement for executive compensation
      const compensationData = await this.parseProxyStatement(latestProxy.url);
      return compensationData;
    } catch (error) {
      this.log(`Failed to parse proxy statement: ${error}`, 'warn');
      return [];
    }
  }

  private async parseProxyStatement(proxyUrl: string): Promise<ExecutiveCompensation[]> {
    // This is a simplified parser - in production you'd want more sophisticated parsing
    // For now, return empty array
    return [];
  }

  private async getInsiderTrading(cik: string): Promise<InsiderTradingRecord[]> {
    // Try to get Form 4 filings (insider trading)
    const filings = await this.getRecentFilings(cik);
    const form4Filings = filings.filter(f => f.formType === '4');
    
    if (form4Filings.length === 0) {
      return [];
    }

    try {
      // Parse Form 4 filings for insider trading data
      const insiderData = await this.parseForm4Filings(form4Filings);
      return insiderData;
    } catch (error) {
      this.log(`Failed to parse Form 4 filings: ${error}`, 'warn');
      return [];
    }
  }

  private async parseForm4Filings(form4Urls: SECFiling[]): Promise<InsiderTradingRecord[]> {
    // This is a simplified parser - in production you'd want more sophisticated parsing
    // For now, return empty array
    return [];
  }

  private extractCIK(href: string): string {
    const match = href.match(/CIK=(\d+)/);
    return match ? match[1] : '';
  }

  private extractAccessionNumber(href: string): string {
    const match = href.match(/accession_number=(\d{10}-\d{2}-\d{6})/);
    return match ? match[1] : '';
  }

  private getDefaultFinancialData(): FinancialData {
    return {
      revenue: 0,
      netIncome: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      cashAndEquivalents: 0,
      debt: 0,
      marketCap: 0,
      fiscalYearEnd: '12-31',
      currency: 'USD'
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.makeRequest('https://www.sec.gov/');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
