// FINRA KYC Core Types and Interfaces
// Based on SEC API research and regulatory compliance requirements

export interface FINRAKYCRequest {
  type: 'broker' | 'advisor' | 'company' | 'executive' | 'institution';
  identifier: string; // CRD number, CIK, ticker, or name
  additionalData?: {
    state?: string;
    country?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    includeHistory?: boolean;
    includeFilings?: boolean;
  };
}

export interface FINRAKYCResponse {
  success: boolean;
  requestId: string;
  timestamp: string;
  type: string;
  identifier: string;
  results: {
    broker?: BrokerVerificationResult;
    advisor?: AdvisorVerificationResult;
    company?: CompanyVerificationResult;
    executive?: ExecutiveVerificationResult;
    institution?: InstitutionVerificationResult;
  };
  riskAssessment: FINRARiskAssessment;
  complianceScore: number;
  processingTime: number;
}

// Broker Verification Types
export interface BrokerVerificationResult {
  success: boolean;
  crdNumber: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended' | 'revoked' | 'unknown';
  registrationType: string[];
  licenses: any[];
  employmentHistory: any[];
  disciplinaryHistory: any[];
  exams: any[];
  confidence: number;
  source: string;
  lastUpdated: string;
}

// Advisor Verification Types
export interface AdvisorVerificationResult {
  success: boolean;
  crdNumber: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended' | 'revoked' | 'unknown';
  firmAffiliations: any[];
  qualifications: any[];
  disclosures: any[];
  assetsUnderManagement?: number;
  clientTypes: string[];
  confidence: number;
  source: string;
  lastUpdated: string;
}

// Company Verification Types
export interface CompanyVerificationResult {
  success: boolean;
  name: string;
  cik?: string;
  ticker?: string;
  status: 'active' | 'inactive' | 'delisted' | 'unknown';
  registrationStatus: string;
  secFilings: any[];
  financialData: FinancialData;
  executiveCompensation: any[];
  insiderTrading: any[];
  confidence: number;
  source: string;
  lastUpdated: string;
}

export interface FinancialData {
  revenue?: number;
  netIncome?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  cashAndEquivalents?: number;
  debt?: number;
  marketCap?: number;
  fiscalYearEnd: string;
  currency: string;
}

// Executive Verification Types
export interface ExecutiveVerificationResult {
  success: boolean;
  name: string;
  company?: string;
  position?: string;
  status: 'active' | 'former' | 'unknown';
  employmentHistory: any[];
  compensation: any[];
  insiderTrading: any[];
  boardMemberships: any[];
  confidence: number;
  source: string;
  lastUpdated: string;
}

// Institution Verification Types
export interface InstitutionVerificationResult {
  success: boolean;
  name: string;
  type: 'investment_advisor' | 'broker_dealer' | 'mutual_fund' | 'etf' | 'hedge_fund';
  crdNumber?: string;
  secNumber?: string;
  status: 'active' | 'inactive' | 'suspended' | 'revoked' | 'unknown';
  registrations: any[];
  assetsUnderManagement?: number;
  clientCount?: number;
  employees?: number;
  complianceHistory: any[];
  confidence: number;
  source: string;
  lastUpdated: string;
}

// Risk Assessment Types
export interface FINRARiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskFactors: any[];
  complianceStatus: 'compliant' | 'non_compliant' | 'under_review' | 'unknown';
  recommendations: string[];
  confidence: number;
  lastAssessment: string;
}
