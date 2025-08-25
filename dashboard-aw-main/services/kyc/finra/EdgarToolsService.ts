// EdgarTools Integration Service for Real SEC/FINRA Data
// Based on Context7 research - using proper SEC EDGAR API integration
/* eslint-disable no-console, @typescript-eslint/no-explicit-any */

export interface EdgarCompanyData {
  success: boolean;
  data?: {
    company: {
      name: string;
      cik: string;
      ticker?: string;
      sic?: string;
      industry?: string;
      state?: string;
      fiscalYearEnd?: string;
    };
    filings: Array<{
      form: string;
      filingDate: string;
      accessionNumber: string;
      description?: string;
      isXBRL?: boolean;
    }>;
    riskAssessment: {
      overallRisk: 'low' | 'medium' | 'high' | 'critical';
      riskScore: number;
      confidence: number;
      riskFactors: string[];
      complianceStatus: 'compliant' | 'non_compliant' | 'under_review' | 'unknown';
      recommendations: string[];
      lastAssessment: string;
    };
    source: string;
    verificationType: string;
    metadata: {
      searchTime: string;
      processingTime: number;
      dataQuality: 'high' | 'medium' | 'low';
    };
  };
  error?: string;
}

export class EdgarToolsService {
  private static instance: EdgarToolsService;
  private readonly BASE_URL = 'https://data.sec.gov';
  private readonly COMPANY_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
  private readonly RATE_LIMIT_MS = 100; // SEC requirement: 10 requests per second
  private lastRequestTime = 0;

  private constructor() {}

  public static getInstance(): EdgarToolsService {
    if (!EdgarToolsService.instance) {
      EdgarToolsService.instance = new EdgarToolsService();
    }
    return EdgarToolsService.instance;
  }

  /**
   * Verify company using real SEC EDGAR data
   */
  async verifyCompany(identifier: string): Promise<EdgarCompanyData> {
    const startTime = Date.now();
    
    try {
      // Step 1: Get company CIK
      const cik = await this.getCompanyCIK(identifier);
      if (!cik) {
        return {
          success: false,
          error: `No matching company found for: ${identifier}`
        };
      }

      // Step 2: Get company facts and filings
      const [companyFacts, submissions] = await Promise.all([
        this.getCompanyFacts(cik),
        this.getCompanySubmissions(cik)
      ]);

      if (!companyFacts && !submissions) {
        return {
          success: false,
          error: `No SEC data available for CIK: ${cik}`
        };
      }

      // Step 3: Process and structure the data
      const company = this.extractCompanyInfo(companyFacts, submissions, cik);
      const filings = this.extractRecentFilings(submissions);
      const riskAssessment = this.assessCompanyRisk(company, filings);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          company,
          filings,
          riskAssessment,
          source: 'SEC EDGAR API',
          verificationType: 'company',
          metadata: {
            searchTime: new Date().toISOString(),
            processingTime,
            dataQuality: this.assessDataQuality(company, filings)
          }
        }
      };

    } catch (error) {
      console.error('EdgarTools company verification error:', error);
      return {
        success: false,
        error: `Company verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Verify broker/advisor using SEC filings
   */
  async verifyBroker(identifier: string): Promise<EdgarCompanyData> {
    const startTime = Date.now();
    
    try {
      // For brokers, we look for Form 4 (insider trading) and Form ADV filings
      const cik = await this.getCompanyCIK(identifier);
      if (!cik) {
        return {
          success: false,
          error: `No matching broker/advisor found for: ${identifier}`
        };
      }

      const submissions = await this.getCompanySubmissions(cik);
      if (!submissions) {
        return {
          success: false,
          error: `No SEC filings available for: ${identifier}`
        };
      }

      // Filter for relevant broker/advisor forms
      const relevantForms = ['4', 'ADV', '13F', '8-K'];
      const brokerFilings = submissions.recent?.form
        ?.map((form: string, index: number) => ({
          form,
          filingDate: submissions.recent.filingDate[index],
          accessionNumber: submissions.recent.accessionNumber[index],
          isRelevant: relevantForms.includes(form)
        }))
        .filter((filing: any) => filing.isRelevant)
        .slice(0, 10) || [];

      const company = {
        name: submissions.name || identifier,
        cik: submissions.cik || cik,
        ticker: submissions.tickers?.[0] || '',
        sic: submissions.sic || '',
        industry: this.getSICIndustry(submissions.sic),
        state: submissions.stateOfIncorporation || '',
        fiscalYearEnd: submissions.fiscalYearEnd || ''
      };

      const riskAssessment = this.assessBrokerRisk(company, brokerFilings);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          company,
          filings: brokerFilings,
          riskAssessment,
          source: 'SEC EDGAR API (Broker/Advisor)',
          verificationType: 'broker',
          metadata: {
            searchTime: new Date().toISOString(),
            processingTime,
            dataQuality: this.assessDataQuality(company, brokerFilings)
          }
        }
      };

    } catch (error) {
      console.error('EdgarTools broker verification error:', error);
      return {
        success: false,
        error: `Broker verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get company CIK by name or ticker
   */
  private async getCompanyCIK(identifier: string): Promise<string | null> {
    try {
      await this.enforceRateLimit();

      // Try direct CIK lookup first
      if (/^\d{10}$/.test(identifier)) {
        return identifier;
      }

      // Search company tickers
      const response = await fetch(this.COMPANY_TICKERS_URL, {
        headers: this.getSECHeaders()
      });

      if (!response.ok) {
        console.warn('Failed to fetch company tickers, trying search');
        return await this.searchCompanyCIK(identifier);
      }

      const tickers = await response.json();
      
      // Search by ticker
      const upperIdentifier = identifier.toUpperCase();
      for (const [, company] of Object.entries(tickers) as any) {
        if (company.ticker === upperIdentifier || 
            company.title.toUpperCase().includes(upperIdentifier)) {
          return String(company.cik_str).padStart(10, '0');
        }
      }

      // Fallback to search
      return await this.searchCompanyCIK(identifier);

    } catch (error) {
      console.error('CIK lookup error:', error);
      return null;
    }
  }

  /**
   * Search for company CIK using SEC search
   */
  private async searchCompanyCIK(identifier: string): Promise<string | null> {
    try {
      await this.enforceRateLimit();

      const searchUrl = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(identifier)}&category=custom&forms=10-K`;
      const response = await fetch(searchUrl, {
        headers: this.getSECHeaders()
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.hits?.hits?.[0]?._source?.ciks?.[0]) {
        return data.hits.hits[0]._source.ciks[0].padStart(10, '0');
      }

      return null;
    } catch (error) {
      console.error('CIK search error:', error);
      return null;
    }
  }

  /**
   * Get company facts from SEC API
   */
  private async getCompanyFacts(cik: string): Promise<any> {
    try {
      await this.enforceRateLimit();

      const url = `${this.BASE_URL}/api/xbrl/companyfacts/CIK${cik.padStart(10, '0')}.json`;
      const response = await fetch(url, {
        headers: this.getSECHeaders()
      });

      if (!response.ok) {
        console.warn(`Company facts not available for CIK ${cik}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Company facts error:', error);
      return null;
    }
  }

  /**
   * Get company submissions from SEC API
   */
  private async getCompanySubmissions(cik: string): Promise<any> {
    try {
      await this.enforceRateLimit();

      const url = `${this.BASE_URL}/submissions/CIK${cik.padStart(10, '0')}.json`;
      const response = await fetch(url, {
        headers: this.getSECHeaders()
      });

      if (!response.ok) {
        console.warn(`Company submissions not available for CIK ${cik}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Company submissions error:', error);
      return null;
    }
  }

  /**
   * Extract company information from SEC data
   */
  private extractCompanyInfo(companyFacts: any, submissions: any, cik: string): any {
    return {
      name: submissions?.name || companyFacts?.entityName || 'Unknown Company',
      cik: cik,
      ticker: submissions?.tickers?.[0] || '',
      sic: submissions?.sic || companyFacts?.sic || '',
      industry: this.getSICIndustry(submissions?.sic || companyFacts?.sic),
      state: submissions?.stateOfIncorporation || '',
      fiscalYearEnd: submissions?.fiscalYearEnd || ''
    };
  }

  /**
   * Extract recent filings
   */
  private extractRecentFilings(submissions: any): any[] {
    if (!submissions?.recent?.form) {
      return [];
    }

    return submissions.recent.form
      .map((form: string, index: number) => ({
        form,
        filingDate: submissions.recent.filingDate[index],
        accessionNumber: submissions.recent.accessionNumber[index],
        description: this.getFormDescription(form),
        isXBRL: submissions.recent.isXBRL?.[index] === 1
      }))
      .slice(0, 20); // Get last 20 filings
  }

  /**
   * Assess company risk based on real data
   */
  private assessCompanyRisk(company: any, filings: any[]): any {
    let riskScore = 50; // Base score
    let confidence = 0;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // Company completeness
    if (company.name && company.name !== 'Unknown Company') confidence += 20;
    if (company.cik) confidence += 15;
    if (company.ticker) confidence += 10;
    if (company.sic) confidence += 10;

    // Filing analysis
    if (filings.length > 0) {
      confidence += 20;
      
      // Recent filings reduce risk
      const recentFilings = filings.filter(f => {
        const filingDate = new Date(f.filingDate);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return filingDate > oneYearAgo;
      });

      if (recentFilings.length > 0) {
        riskScore -= 10;
        confidence += 15;
      } else {
        riskScore += 15;
        riskFactors.push('No recent SEC filings');
        recommendations.push('Review filing compliance');
      }

      // Form 10-K (annual report) presence
      const has10K = filings.some(f => f.form === '10-K');
      if (has10K) {
        riskScore -= 5;
        confidence += 10;
      }

      // Form 8-K (material events) frequency
      const form8Ks = filings.filter(f => f.form === '8-K');
      if (form8Ks.length > 10) {
        riskScore += 10;
        riskFactors.push('High frequency of material events (8-K filings)');
      }
    } else {
      riskScore += 20;
      riskFactors.push('No SEC filings found');
      recommendations.push('Verify company registration status');
    }

    // Normalize scores
    riskScore = Math.max(0, Math.min(100, riskScore));
    confidence = Math.max(0, Math.min(100, confidence));

    // Determine risk level
    let overallRisk: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore < 30) overallRisk = 'low';
    else if (riskScore < 60) overallRisk = 'medium';
    else if (riskScore < 80) overallRisk = 'high';
    else overallRisk = 'critical';

    return {
      overallRisk,
      riskScore,
      confidence,
      riskFactors,
      complianceStatus: overallRisk === 'low' ? 'compliant' : 
                       overallRisk === 'high' || overallRisk === 'critical' ? 'non_compliant' : 'under_review',
      recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring'],
      lastAssessment: new Date().toISOString()
    };
  }

  /**
   * Assess broker-specific risk
   */
  private assessBrokerRisk(company: any, filings: any[]): any {
    let riskScore = 50;
    let confidence = 0;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // Broker-specific form analysis
    const form4s = filings.filter(f => f.form === '4'); // Insider trading
    const formADVs = filings.filter(f => f.form === 'ADV'); // Investment advisor
    const form13Fs = filings.filter(f => f.form === '13F'); // Institutional holdings

    if (form4s.length > 0) {
      confidence += 25;
      if (form4s.length > 5) {
        riskScore += 15;
        riskFactors.push('High insider trading activity');
        recommendations.push('Review insider trading patterns');
      }
    }

    if (formADVs.length > 0) {
      confidence += 30;
      riskScore -= 10; // ADV filings indicate registered advisor
    }

    if (form13Fs.length > 0) {
      confidence += 20;
      riskScore -= 5; // Institutional holdings indicate larger operation
    }

    // Base assessment
    const baseAssessment = this.assessCompanyRisk(company, filings);
    
    return {
      ...baseAssessment,
      riskScore: Math.max(0, Math.min(100, baseAssessment.riskScore + (riskScore - 50))),
      confidence: Math.max(0, Math.min(100, baseAssessment.confidence + confidence - 20)),
      riskFactors: [...baseAssessment.riskFactors, ...riskFactors],
      recommendations: [...baseAssessment.recommendations, ...recommendations]
    };
  }

  /**
   * Assess data quality
   */
  private assessDataQuality(company: any, filings: any[]): 'high' | 'medium' | 'low' {
    let score = 0;
    
    // Company data completeness
    if (company.name && company.name !== 'Unknown Company') score += 20;
    if (company.cik) score += 20;
    if (company.ticker) score += 15;
    if (company.sic) score += 15;
    if (company.industry) score += 10;

    // Filing data
    if (filings.length > 0) score += 20;
    if (filings.length > 10) score += 10;

    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  /**
   * Get industry description from SIC code
   */
  private getSICIndustry(sic: string): string {
    if (!sic) return '';
    
    const sicCode = parseInt(sic);
    if (sicCode >= 6000 && sicCode <= 6799) return 'Financial Services';
    if (sicCode >= 3570 && sicCode <= 3579) return 'Technology';
    if (sicCode >= 2800 && sicCode <= 2899) return 'Chemicals';
    if (sicCode >= 3000 && sicCode <= 3999) return 'Manufacturing';
    if (sicCode >= 5000 && sicCode <= 5999) return 'Retail/Wholesale';
    
    return 'Other';
  }

  /**
   * Get form description
   */
  private getFormDescription(form: string): string {
    const descriptions: Record<string, string> = {
      '10-K': 'Annual Report',
      '10-Q': 'Quarterly Report',
      '8-K': 'Current Report',
      '4': 'Insider Trading',
      'ADV': 'Investment Advisor Registration',
      '13F': 'Institutional Holdings',
      'DEF 14A': 'Proxy Statement',
      'S-1': 'Registration Statement'
    };
    
    return descriptions[form] || form;
  }

  /**
   * Enforce SEC rate limiting (10 requests per second)
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      const delay = this.RATE_LIMIT_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Get SEC-compliant headers
   */
  private getSECHeaders(): Record<string, string> {
    return {
      'User-Agent': 'AckersWeldon KYC System 1.0 (compliance@ackersweldon.com)',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Host': 'data.sec.gov'
    };
  }
}

export const edgarToolsService = EdgarToolsService.getInstance();
