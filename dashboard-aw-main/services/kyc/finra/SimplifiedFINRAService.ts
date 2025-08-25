// Simplified FINRA Service for Production Demo
// Provides realistic demo data for company verification only
/* eslint-disable no-console, @typescript-eslint/no-explicit-any */

export interface FINRACompanyData {
  success: boolean;
  data?: {
    company: {
      name: string;
      ticker: string;
      cik?: string;
      industry?: string;
      sector?: string;
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

export class SimplifiedFINRAService {
  private static instance: SimplifiedFINRAService;

  private constructor() {}

  public static getInstance(): SimplifiedFINRAService {
    if (!SimplifiedFINRAService.instance) {
      SimplifiedFINRAService.instance = new SimplifiedFINRAService();
    }
    return SimplifiedFINRAService.instance;
  }

  /**
   * Company verification with realistic demo data
   */
  async verifyCompany(identifier: string): Promise<FINRACompanyData> {
    const startTime = Date.now();
    
    try {
      // Simulate API processing delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

      // Get company info from known companies database
      const companyInfo = this.getCompanyInfo(identifier);
      
      if (!companyInfo) {
        return {
          success: false,
          error: `No matching company found for: ${identifier}. Please try well-known companies like Apple, Microsoft, Tesla, Amazon, Google, etc.`
        };
      }

      // Generate realistic risk assessment
      const riskAssessment = this.generateRiskAssessment(companyInfo);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          company: companyInfo,
          riskAssessment,
          source: 'FINRA/SEC Demo Data',
          verificationType: 'company',
          metadata: {
            searchTime: new Date().toISOString(),
            processingTime,
            dataQuality: 'high'
          }
        }
      };

    } catch (error) {
      console.error('Simplified FINRA company verification error:', error);
      return {
        success: false,
        error: `Company verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get company information from known companies
   */
  private getCompanyInfo(identifier: string): any {
    const companies: Record<string, any> = {
      'AAPL': {
        name: 'Apple Inc.',
        ticker: 'AAPL',
        cik: '0000320193',
        industry: 'Technology Hardware',
        sector: 'Technology'
      },
      'APPLE': {
        name: 'Apple Inc.',
        ticker: 'AAPL',
        cik: '0000320193',
        industry: 'Technology Hardware',
        sector: 'Technology'
      },
      'MSFT': {
        name: 'Microsoft Corporation',
        ticker: 'MSFT',
        cik: '0000789019',
        industry: 'Software',
        sector: 'Technology'
      },
      'MICROSOFT': {
        name: 'Microsoft Corporation',
        ticker: 'MSFT',
        cik: '0000789019',
        industry: 'Software',
        sector: 'Technology'
      },
      'TSLA': {
        name: 'Tesla, Inc.',
        ticker: 'TSLA',
        cik: '0001318605',
        industry: 'Auto Manufacturers',
        sector: 'Consumer Cyclical'
      },
      'TESLA': {
        name: 'Tesla, Inc.',
        ticker: 'TSLA',
        cik: '0001318605',
        industry: 'Auto Manufacturers',
        sector: 'Consumer Cyclical'
      },
      'AMZN': {
        name: 'Amazon.com, Inc.',
        ticker: 'AMZN',
        cik: '0001018724',
        industry: 'Internet Retail',
        sector: 'Consumer Cyclical'
      },
      'AMAZON': {
        name: 'Amazon.com, Inc.',
        ticker: 'AMZN',
        cik: '0001018724',
        industry: 'Internet Retail',
        sector: 'Consumer Cyclical'
      },
      'GOOGL': {
        name: 'Alphabet Inc.',
        ticker: 'GOOGL',
        cik: '0001652044',
        industry: 'Internet Content & Information',
        sector: 'Communication Services'
      },
      'GOOGLE': {
        name: 'Alphabet Inc.',
        ticker: 'GOOGL',
        cik: '0001652044',
        industry: 'Internet Content & Information',
        sector: 'Communication Services'
      },
      'META': {
        name: 'Meta Platforms, Inc.',
        ticker: 'META',
        cik: '0001326801',
        industry: 'Internet Content & Information',
        sector: 'Communication Services'
      },
      'NVDA': {
        name: 'NVIDIA Corporation',
        ticker: 'NVDA',
        cik: '0001045810',
        industry: 'Semiconductors',
        sector: 'Technology'
      },
      'NVIDIA': {
        name: 'NVIDIA Corporation',
        ticker: 'NVDA',
        cik: '0001045810',
        industry: 'Semiconductors',
        sector: 'Technology'
      }
    };

    const upperIdentifier = identifier.toUpperCase();
    return companies[upperIdentifier] || null;
  }

  /**
   * Generate realistic risk assessment based on company
   */
  private generateRiskAssessment(company: any): any {
    let riskScore = 30 + Math.random() * 40; // Base score 30-70
    let confidence = 70 + Math.random() * 25; // High confidence 70-95
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // Adjust based on company characteristics
    if (company.sector === 'Technology') {
      riskScore -= 5; // Tech companies generally lower risk
      confidence += 5;
      riskFactors.push('Technology sector - generally stable');
    }

    if (company.industry.includes('Auto')) {
      riskScore += 8; // Auto industry has regulatory risks
      riskFactors.push('Automotive industry regulatory considerations');
      recommendations.push('Monitor regulatory compliance');
    }

    // Well-known companies get better scores
    const wellKnownTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA'];
    if (wellKnownTickers.includes(company.ticker)) {
      riskScore -= 10;
      confidence += 10;
      riskFactors.push('Well-established public company');
      recommendations.push('Continue standard monitoring');
    }

    // Add some random factors for realism
    if (Math.random() > 0.7) {
      riskFactors.push('Recent market volatility considerations');
    }

    if (Math.random() > 0.8) {
      riskFactors.push('Industry competitive pressures');
      recommendations.push('Monitor competitive landscape');
    }

    // Normalize scores
    riskScore = Math.max(10, Math.min(90, riskScore));
    confidence = Math.max(60, Math.min(95, confidence));

    // Determine risk level
    let overallRisk: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore < 35) overallRisk = 'low';
    else if (riskScore < 60) overallRisk = 'medium';
    else if (riskScore < 80) overallRisk = 'high';
    else overallRisk = 'critical';

    return {
      overallRisk,
      riskScore: Math.round(riskScore),
      confidence: Math.round(confidence),
      riskFactors,
      complianceStatus: overallRisk === 'low' ? 'compliant' : 
                       overallRisk === 'high' || overallRisk === 'critical' ? 'under_review' : 'compliant',
      recommendations: recommendations.length > 0 ? recommendations : ['Continue standard monitoring'],
      lastAssessment: new Date().toISOString()
    };
  }
}

export const simplifiedFINRAService = SimplifiedFINRAService.getInstance();
