// Real SEC Data Service using SEC EDGAR APIs
// Based on EdgarTools methodology for production-ready KYC verification
/* eslint-disable no-console, @typescript-eslint/no-explicit-any */

export interface SECCompanyData {
  success: boolean;
  data?: {
    company: {
      name: string;
      ticker: string;
      cik: string;
      industry?: string;
      sector?: string;
      sic?: string;
      sicDescription?: string;
      ein?: string;
      stateOfIncorporation?: string;
      fiscalYearEnd?: string;
    };
    riskAssessment: {
      overallRisk: 'low' | 'medium' | 'high' | 'critical';
      riskScore: number;
      confidence: number;
      riskFactors: string[];
      complianceStatus: 'compliant' | 'non_compliant' | 'under_review' | 'unknown';
      recommendations: string[];
      lastAssessment: string;
    };
    filings: Array<{
      form: string;
      filingDate: string;
      reportDate: string;
      accessionNumber: string;
      description: string;
      url: string;
    }>;
    source: string;
    verificationType: string;
    metadata: {
      searchTime: string;
      processingTime: number;
      dataQuality: 'high' | 'medium' | 'low';
      sourcesUsed: string[];
    };
  };
  error?: string;
}

export class RealSECDataService {
  private static instance: RealSECDataService;
  private readonly SEC_BASE_URL = 'https://data.sec.gov';
  private readonly SEC_COMPANY_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
  private readonly USER_AGENT = 'Mozilla/5.0 (compatible; AckersWeldon-KYC/1.0; +https://ackersweldon.com/contact)';
  
  // Rate limiting: SEC allows 10 requests per second
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_MS = 100;

  private constructor() {}

  public static getInstance(): RealSECDataService {
    if (!RealSECDataService.instance) {
      RealSECDataService.instance = new RealSECDataService();
    }
    return RealSECDataService.instance;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      const delay = this.RATE_LIMIT_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  private getSECHeaders(): Record<string, string> {
    return {
      'User-Agent': this.USER_AGENT,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive'
    };
  }

  /**
   * Get company CIK by ticker or name using SEC's company tickers JSON
   */
  private async getCompanyCIK(identifier: string): Promise<{ cik: string; name: string; ticker: string } | null> {
    await this.enforceRateLimit();
    
    try {
      const response = await fetch(this.SEC_COMPANY_TICKERS_URL, { 
        headers: this.getSECHeaders(),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch company tickers: ${response.status}`);
        return null;
      }
      
      const tickersData = await response.json();
      const lowerIdentifier = identifier.toLowerCase().trim();
      
      // Search through the tickers data
      for (const [, company] of Object.entries(tickersData) as any) {
        if (company.ticker?.toLowerCase() === lowerIdentifier || 
            company.title?.toLowerCase().includes(lowerIdentifier) ||
            String(company.cik_str) === lowerIdentifier) {
          return {
            cik: String(company.cik_str).padStart(10, '0'),
            name: company.title,
            ticker: company.ticker
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching company CIK:', error);
      return null;
    }
  }

  /**
   * Fetch company submissions data from SEC API
   */
  private async fetchCompanySubmissions(cik: string): Promise<any> {
    await this.enforceRateLimit();
    
    try {
      const url = `${this.SEC_BASE_URL}/submissions/CIK${cik}.json`;
      const response = await fetch(url, { 
        headers: this.getSECHeaders(),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      if (!response.ok) {
        console.warn(`Failed to fetch company submissions for CIK ${cik}: ${response.status}`);
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching company submissions for CIK ${cik}:`, error);
      return null;
    }
  }

  /**
   * Fetch company facts from SEC XBRL API
   */
  private async fetchCompanyFacts(cik: string): Promise<any> {
    await this.enforceRateLimit();
    
    try {
      const url = `${this.SEC_BASE_URL}/api/xbrl/companyfacts/CIK${cik}.json`;
      const response = await fetch(url, { 
        headers: this.getSECHeaders(),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      if (!response.ok) {
        console.warn(`Failed to fetch company facts for CIK ${cik}: ${response.status}`);
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching company facts for CIK ${cik}:`, error);
      return null;
    }
  }

  /**
   * Assess company risk based on real SEC data
   */
  private assessCompanyRisk(submissions: any, facts: any, recentFilings: any[] = []): any {
    let riskScore = 30; // Base score
    let confidence = 60; // Base confidence
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // Analyze submissions data and extracted filings
    if (submissions) {
      confidence += 20;
    }
    
    // Use extracted filings for consistent analysis
    if (recentFilings && recentFilings.length > 0) {
      confidence += 15;
      
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      // Count recent filings (last 90 days)
      const recentFilingsCount = recentFilings.filter(filing => {
        const filingDate = new Date(filing.filingDate);
        return filingDate > ninetyDaysAgo;
      }).length;
      
      if (recentFilingsCount > 0) {
        riskFactors.push(`${recentFilingsCount} recent SEC filings in the last 90 days - active compliance`);
        riskScore -= 5; // Recent filings are good
      }
      
      // Check for recent 10-K (annual report)
      const recent10K = recentFilings.some(filing => {
        if (filing.form === '10-K') {
          const filingDate = new Date(filing.filingDate);
          return filingDate > oneYearAgo;
        }
        return false;
      });
      
      if (!recent10K) {
        riskScore += 15;
        riskFactors.push('No recent annual report (10-K) filed within the last year');
        recommendations.push('Verify company\'s annual reporting compliance status');
      } else {
        riskFactors.push('Recent annual report (10-K) filed - good compliance record');
        riskScore -= 10;
      }
      
      // Check for 8-K filings (material events)
      const recent8Ks = recentFilings.filter(filing => {
        if (filing.form === '8-K') {
          const filingDate = new Date(filing.filingDate);
          return filingDate > ninetyDaysAgo;
        }
        return false;
      });
      
      if (recent8Ks.length > 3) {
        riskScore += 10;
        riskFactors.push(`${recent8Ks.length} recent 8-K filings indicating frequent material events`);
        recommendations.push('Review recent 8-K filings for material event details');
      } else if (recent8Ks.length > 0) {
        riskFactors.push(`${recent8Ks.length} recent 8-K filing(s) - normal material event reporting`);
      }
      
      // General filing activity assessment
      riskFactors.push(`Total of ${recentFilings.length} recent SEC filings found - regular reporting activity`);
      
    } else {
      riskScore += 30;
      riskFactors.push('No recent SEC filings found in extracted data');
      recommendations.push('Investigate company\'s regulatory reporting status');
    }
      
    // Industry risk assessment
    if (submissions?.sicDescription) {
      confidence += 10;
      const industry = submissions.sicDescription.toLowerCase();
      
      if (industry.includes('bank') || industry.includes('financial')) {
        riskScore += 5;
        riskFactors.push('Financial services industry - subject to additional regulatory oversight');
        recommendations.push('Review banking and financial regulations compliance');
      } else if (industry.includes('technology') || industry.includes('software')) {
        riskScore -= 5; // Tech companies generally lower risk
        riskFactors.push('Technology sector - generally stable with growth potential');
      }
    }

    // Analyze XBRL facts
    if (facts) {
      confidence += 15;
      
      // Check for financial health indicators
      try {
        const gaapFacts = facts.facts?.['us-gaap'];
        if (gaapFacts) {
          // Look for revenue trends (simplified analysis)
          const revenues = gaapFacts['Revenues'] || gaapFacts['RevenueFromContractWithCustomerExcludingAssessedTax'];
          if (revenues) {
            const revenueData = Object.values(revenues)[0] as any[];
            if (revenueData && revenueData.length > 1) {
              // Simple trend analysis
              const latestRevenue = revenueData[revenueData.length - 1];
              const previousRevenue = revenueData[revenueData.length - 2];
              
              if (latestRevenue.val < previousRevenue.val) {
                riskScore += 15;
                riskFactors.push('Recent revenue decline observed in financial statements');
                recommendations.push('Analyze detailed financial statements for revenue trends');
              } else {
                riskScore -= 5;
                riskFactors.push('Positive revenue trend indicated in recent filings');
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error analyzing XBRL facts:', error);
      }
    }

    // Normalize scores
    riskScore = Math.max(10, Math.min(90, riskScore));
    confidence = Math.max(60, Math.min(95, confidence));

    // Determine overall risk level
    let overallRisk: 'low' | 'medium' | 'high' | 'critical';
    let complianceStatus: 'compliant' | 'non_compliant' | 'under_review' | 'unknown';

    if (riskScore >= 70) {
      overallRisk = 'critical';
      complianceStatus = 'non_compliant';
    } else if (riskScore >= 50) {
      overallRisk = 'high';
      complianceStatus = 'under_review';
    } else if (riskScore >= 35) {
      overallRisk = 'medium';
      complianceStatus = 'compliant';
    } else {
      overallRisk = 'low';
      complianceStatus = 'compliant';
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue standard monitoring procedures');
    }

    return {
      overallRisk,
      riskScore: Math.round(riskScore),
      confidence: Math.round(confidence),
      riskFactors,
      recommendations,
      complianceStatus,
      lastAssessment: new Date().toISOString()
    };
  }

  /**
   * Extract recent filings from submissions data
   */
  private extractRecentFilings(submissions: any, cik: string): any[] {
    if (!submissions?.filings?.recent) {
      return [];
    }

    const recent = submissions.filings.recent;
    const relevantForms = ['10-K', '10-Q', '8-K', '4', 'DEF 14A', 'S-1', 'S-3'];
    const filings: any[] = [];

    for (let i = 0; i < Math.min(recent.form.length, 10); i++) {
      const form = recent.form[i];
      if (relevantForms.includes(form)) {
        const cleanCik = cik.replace(/^0+/, '');
        const cleanAccession = recent.accessionNumber[i].replace(/-/g, '');
        
        filings.push({
          form,
          filingDate: recent.filingDate[i],
          reportDate: recent.reportDate[i] || recent.filingDate[i],
          accessionNumber: recent.accessionNumber[i],
          description: recent.primaryDocDescription[i] || form,
          url: `https://www.sec.gov/Archives/edgar/data/${cleanCik}/${cleanAccession}/${recent.primaryDocument[i] || 'filing.htm'}`
        });
      }
    }

    return filings.sort((a, b) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime());
  }

  /**
   * Verify company using real SEC data
   */
  public async verifyCompany(identifier: string): Promise<SECCompanyData> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 [Real SEC Service] Starting verification for: ${identifier}`);
      
      // Step 1: Get company CIK
      const companyInfo = await this.getCompanyCIK(identifier);
      if (!companyInfo) {
        return {
          success: false,
          error: `Company not found in SEC database: ${identifier}. Please verify the company name or ticker symbol.`
        };
      }

      console.log(`✅ [Real SEC Service] Found company: ${companyInfo.name} (CIK: ${companyInfo.cik})`);

      // Step 2: Fetch company data in parallel
      const [submissions, facts] = await Promise.allSettled([
        this.fetchCompanySubmissions(companyInfo.cik),
        this.fetchCompanyFacts(companyInfo.cik)
      ]);

      const submissionsData = submissions.status === 'fulfilled' ? submissions.value : null;
      const factsData = facts.status === 'fulfilled' ? facts.value : null;

      // Step 3: Extract company details
      const companyDetails = {
        name: companyInfo.name,
        ticker: companyInfo.ticker,
        cik: companyInfo.cik,
        industry: submissionsData?.sicDescription || undefined,
        sector: this.mapSICToSector(submissionsData?.sic),
        sic: submissionsData?.sic,
        sicDescription: submissionsData?.sicDescription,
        ein: submissionsData?.ein,
        stateOfIncorporation: submissionsData?.stateOfIncorporation,
        fiscalYearEnd: submissionsData?.fiscalYearEnd
      };

      // Step 4: Extract recent filings first (to use in risk assessment)
      const recentFilings = this.extractRecentFilings(submissionsData, companyInfo.cik);

      // Step 5: Assess risk using both submissions data and extracted filings
      const riskAssessment = this.assessCompanyRisk(submissionsData, factsData, recentFilings);

      const processingTime = Date.now() - startTime;
      const sourcesUsed = [
        'SEC Company Tickers API',
        submissionsData ? 'SEC Submissions API' : null,
        factsData ? 'SEC XBRL CompanyFacts API' : null
      ].filter(Boolean) as string[];

      console.log(`✅ [Real SEC Service] Verification completed for ${identifier} in ${processingTime}ms`);

      return {
        success: true,
        data: {
          company: companyDetails,
          riskAssessment,
          filings: recentFilings,
          source: 'SEC EDGAR Database (Real-Time)',
          verificationType: 'company',
          metadata: {
            searchTime: new Date().toISOString(),
            processingTime,
            dataQuality: (submissionsData && factsData) ? 'high' : (submissionsData || factsData) ? 'medium' : 'low',
            sourcesUsed
          }
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ [Real SEC Service] Verification failed:', error);
      
      return {
        success: false,
        error: `SEC data verification failed: ${error instanceof Error ? error.message : 'Unknown error'}. Processing time: ${processingTime}ms`
      };
    }
  }

  /**
   * Map SIC code to sector (simplified mapping)
   */
  private mapSICToSector(sic?: string): string | undefined {
    if (!sic) return undefined;
    
    const sicCode = parseInt(sic);
    
    if (sicCode >= 100 && sicCode <= 999) return 'Agriculture, Forestry, and Fishing';
    if (sicCode >= 1000 && sicCode <= 1499) return 'Mining';
    if (sicCode >= 1500 && sicCode <= 1799) return 'Construction';
    if (sicCode >= 2000 && sicCode <= 3999) return 'Manufacturing';
    if (sicCode >= 4000 && sicCode <= 4999) return 'Transportation and Public Utilities';
    if (sicCode >= 5000 && sicCode <= 5199) return 'Wholesale Trade';
    if (sicCode >= 5200 && sicCode <= 5999) return 'Retail Trade';
    if (sicCode >= 6000 && sicCode <= 6799) return 'Finance, Insurance, and Real Estate';
    if (sicCode >= 7000 && sicCode <= 8999) return 'Services';
    if (sicCode >= 9100 && sicCode <= 9729) return 'Public Administration';
    
    return 'Other';
  }
}

export const realSECDataService = RealSECDataService.getInstance();
