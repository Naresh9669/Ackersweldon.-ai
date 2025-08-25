// FINRA Risk Assessment Service
// Evaluates compliance and risk factors for KYC verification results

import { 
  FINRARiskAssessment, 
  RiskFactor,
  BrokerVerificationResult,
  AdvisorVerificationResult,
  CompanyVerificationResult,
  ExecutiveVerificationResult,
  InstitutionVerificationResult
} from '../models/FINRAKYCTypes';

export class FINRARiskAssessmentService {
  constructor() {}

  async assessRisk(
    results: {
      broker?: BrokerVerificationResult;
      advisor?: AdvisorVerificationResult;
      company?: CompanyVerificationResult;
      executive?: ExecutiveVerificationResult;
      institution?: InstitutionVerificationResult;
    }
  ): Promise<FINRARiskAssessment> {
    try {
      let riskScore = 50;
      const riskFactors: RiskFactor[] = [];
      const recommendations: string[] = [];

      // Assess broker risk
      if (results.broker) {
        const brokerRisk = this.assessBrokerRisk(results.broker);
        riskScore += brokerRisk.score;
        riskFactors.push(...brokerRisk.factors);
        recommendations.push(...brokerRisk.recommendations);
      }

      // Assess advisor risk
      if (results.advisor) {
        const advisorRisk = this.assessAdvisorRisk(results.advisor);
        riskScore += advisorRisk.score;
        riskFactors.push(...advisorRisk.factors);
        recommendations.push(...advisorRisk.recommendations);
      }

      // Assess company risk
      if (results.company) {
        const companyRisk = this.assessCompanyRisk(results.company);
        riskScore += companyRisk.score;
        riskFactors.push(...companyRisk.factors);
        recommendations.push(...companyRisk.recommendations);
      }

      // Assess executive risk
      if (results.executive) {
        const executiveRisk = this.assessExecutiveRisk(results.executive);
        riskScore += executiveRisk.score;
        riskFactors.push(...executiveRisk.factors);
        recommendations.push(...executiveRisk.recommendations);
      }

      // Assess institution risk
      if (results.institution) {
        const institutionRisk = this.assessInstitutionRisk(results.institution);
        riskScore += institutionRisk.score;
        riskFactors.push(...institutionRisk.factors);
        recommendations.push(...institutionRisk.recommendations);
      }

      // Normalize risk score
      riskScore = Math.max(0, Math.min(100, riskScore));

      // Determine overall risk level
      const overallRisk = this.calculateRiskLevel(riskScore);

      // Determine compliance status
      const complianceStatus = this.calculateComplianceStatus(riskScore, riskFactors);

      // Generate additional recommendations if none exist
      if (recommendations.length === 0) {
        recommendations.push(...this.generateDefaultRecommendations(overallRisk, riskScore));
      }

      return {
        overallRisk,
        riskScore,
        riskFactors,
        complianceStatus,
        recommendations,
        lastAssessment: new Date().toISOString()
      };

    } catch (error) {
      console.error('[FINRA Risk Assessment] Assessment failed:', error);
      return {
        overallRisk: 'critical',
        riskScore: 100,
        riskFactors: [{
          category: 'system_error',
          severity: 'critical',
          description: 'Risk assessment system error',
          impact: 'Unable to assess risk',
          mitigation: 'Contact system administrator'
        }],
        complianceStatus: 'unknown',
        recommendations: ['Retry risk assessment', 'Contact support if issue persists'],
        lastAssessment: new Date().toISOString()
      };
    }
  }

  private assessBrokerRisk(broker: BrokerVerificationResult): { score: number; factors: RiskFactor[]; recommendations: string[] } {
    let score = 0;
    const factors: RiskFactor[] = [];
    const recommendations: string[] = [];

    // Check registration status
    if (broker.status === 'suspended') {
      score += 40;
      factors.push({
        category: 'registration_status',
        severity: 'critical',
        description: 'Broker registration is suspended',
        impact: 'High risk - broker cannot conduct business',
        mitigation: 'Verify suspension reasons and duration'
      });
      recommendations.push('Broker is currently suspended - high risk');
    } else if (broker.status === 'revoked') {
      score += 50;
      factors.push({
        category: 'registration_status',
        severity: 'critical',
        description: 'Broker registration is revoked',
        impact: 'Critical risk - broker is barred from industry',
        mitigation: 'Avoid any business relationship'
      });
      recommendations.push('Broker registration is revoked - avoid completely');
    } else if (broker.status === 'inactive') {
      score += 20;
      factors.push({
        category: 'registration_status',
        severity: 'high',
        description: 'Broker registration is inactive',
        impact: 'Medium risk - broker may not be authorized',
        mitigation: 'Verify current registration status'
      });
      recommendations.push('Broker registration is inactive - verify current status');
    }

    // Check disciplinary history
    if (broker.disciplinaryHistory.length > 0) {
      const recentDisciplinary = broker.disciplinaryHistory.filter(d => {
        const date = new Date(d.date);
        const now = new Date();
        const yearsDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
        return yearsDiff <= 5;
      });

      if (recentDisciplinary.length > 0) {
        score += recentDisciplinary.length * 15;
        factors.push({
          category: 'disciplinary_history',
          severity: 'high',
          description: `Broker has ${recentDisciplinary.length} recent disciplinary actions`,
          impact: 'High risk - pattern of regulatory violations',
          mitigation: 'Review disciplinary details and compliance improvements'
        });
        recommendations.push(`Broker has ${recentDisciplinary.length} recent disciplinary actions - review details`);
      }
    }

    // Check license status
    const expiredLicenses = broker.licenses.filter(l => l.status === 'expired' || l.status === 'revoked');
    if (expiredLicenses.length > 0) {
      score += expiredLicenses.length * 10;
      factors.push({
        category: 'license_status',
        severity: 'medium',
        description: `Broker has ${expiredLicenses.length} expired/revoked licenses`,
        impact: 'Medium risk - may not be authorized in certain jurisdictions',
        mitigation: 'Verify current license status in relevant jurisdictions'
      });
      recommendations.push(`Broker has ${expiredLicenses.length} expired/revoked licenses - verify current status`);
    }

    // Check employment history
    if (broker.employmentHistory.length === 0) {
      score += 15;
      factors.push({
        category: 'employment_history',
        severity: 'medium',
        description: 'No employment history available',
        impact: 'Medium risk - unable to verify work experience',
        mitigation: 'Request additional employment documentation'
      });
      recommendations.push('No employment history available - request additional documentation');
    }

    return { score, factors, recommendations };
  }

  private assessAdvisorRisk(advisor: AdvisorVerificationResult): { score: number; factors: RiskFactor[]; recommendations: string[] } {
    let score = 0;
    const factors: RiskFactor[] = [];
    const recommendations: string[] = [];

    // Check registration status
    if (advisor.status === 'suspended') {
      score += 40;
      factors.push({
        category: 'registration_status',
        severity: 'critical',
        description: 'Advisor registration is suspended',
        impact: 'High risk - advisor cannot provide services',
        mitigation: 'Verify suspension reasons and duration'
      });
      recommendations.push('Advisor is currently suspended - high risk');
    } else if (advisor.status === 'revoked') {
      score += 50;
      factors.push({
        category: 'registration_status',
        severity: 'critical',
        description: 'Advisor registration is revoked',
        impact: 'Critical risk - advisor is barred from industry',
        mitigation: 'Avoid any business relationship'
      });
      recommendations.push('Advisor registration is revoked - avoid completely');
    }

    // Check disclosures
    if (advisor.disclosures.length > 0) {
      const openDisclosures = advisor.disclosures.filter(d => d.status === 'open');
      if (openDisclosures.length > 0) {
        score += openDisclosures.length * 20;
        factors.push({
          category: 'disclosures',
          severity: 'high',
          description: `Advisor has ${openDisclosures.length} open disclosures`,
          impact: 'High risk - unresolved regulatory issues',
          mitigation: 'Review disclosure details and resolution status'
        });
        recommendations.push(`Advisor has ${openDisclosures.length} open disclosures - review details`);
      }
    }

    // Check assets under management
    if (advisor.assetsUnderManagement && advisor.assetsUnderManagement < 1000000) {
      score += 10;
      factors.push({
        category: 'business_scale',
        severity: 'low',
        description: 'Advisor manages less than $1M in assets',
        impact: 'Low risk - small business scale',
        mitigation: 'Verify business stability and resources'
      });
      recommendations.push('Advisor manages less than $1M in assets - verify business stability');
    }

    return { score, factors, recommendations };
  }

  private assessCompanyRisk(company: CompanyVerificationResult): { score: number; factors: RiskFactor[]; recommendations: string[] } {
    let score = 0;
    const factors: RiskFactor[] = [];
    const recommendations: string[] = [];

    // Check company status
    if (company.status === 'delisted') {
      score += 30;
      factors.push({
        category: 'company_status',
        severity: 'high',
        description: 'Company is delisted from exchanges',
        impact: 'High risk - company may be in financial distress',
        mitigation: 'Verify current financial status and reasons for delisting'
      });
      recommendations.push('Company is delisted - verify current financial status');
    }

    // Check recent filings
    if (company.secFilings.length === 0) {
      score += 20;
      factors.push({
        category: 'sec_filings',
        severity: 'medium',
        description: 'No recent SEC filings available',
        impact: 'Medium risk - unable to verify current financial status',
        mitigation: 'Request additional financial documentation'
      });
      recommendations.push('No recent SEC filings available - request additional documentation');
    }

    // Check financial data
    if (company.financialData) {
      if (company.financialData.totalLiabilities && company.financialData.totalAssets) {
        const debtRatio = company.financialData.totalLiabilities / company.financialData.totalAssets;
        if (debtRatio > 0.7) {
          score += 25;
          factors.push({
            category: 'financial_health',
            severity: 'high',
            description: 'High debt-to-asset ratio',
            impact: 'High risk - company may be overleveraged',
            mitigation: 'Review debt structure and repayment capacity'
          });
          recommendations.push('High debt-to-asset ratio - review debt structure');
        }
      }

      if (company.financialData.netIncome && company.financialData.netIncome < 0) {
        score += 20;
        factors.push({
          category: 'financial_health',
          severity: 'medium',
          description: 'Company reporting negative net income',
          impact: 'Medium risk - company may be unprofitable',
          mitigation: 'Review business model and turnaround plans'
        });
        recommendations.push('Company reporting negative net income - review business model');
      }
    }

    return { score, factors, recommendations };
  }

  private assessExecutiveRisk(executive: ExecutiveVerificationResult): { score: number; factors: RiskFactor[]; recommendations: string[] } {
    let score = 0;
    const factors: RiskFactor[] = [];
    const recommendations: string[] = [];

    // Check employment status
    if (executive.status === 'former') {
      score += 15;
      factors.push({
        category: 'employment_status',
        severity: 'medium',
        description: 'Executive is former employee',
        impact: 'Medium risk - may not have current company information',
        mitigation: 'Verify current employment status and company affiliation'
      });
      recommendations.push('Executive is former employee - verify current status');
    }

    // Check insider trading
    if (executive.insiderTrading.length > 0) {
      const recentTrading = executive.insiderTrading.filter(t => {
        const date = new Date(t.date);
        const now = new Date();
        const monthsDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsDiff <= 6;
      });

      if (recentTrading.length > 0) {
        score += recentTrading.length * 10;
        factors.push({
          category: 'insider_trading',
          severity: 'medium',
          description: `Executive has ${recentTrading.length} recent insider trading transactions`,
          impact: 'Medium risk - may indicate material non-public information',
          mitigation: 'Review trading patterns and compliance with insider trading rules'
        });
        recommendations.push(`Executive has ${recentTrading.length} recent insider trading transactions - review patterns`);
      }
    }

    return { score, factors, recommendations };
  }

  private assessInstitutionRisk(institution: InstitutionVerificationResult): { score: number; factors: RiskFactor[]; recommendations: string[] } {
    let score = 0;
    const factors: RiskFactor[] = [];
    const recommendations: string[] = [];

    // Check registration status
    if (institution.status === 'suspended') {
      score += 40;
      factors.push({
        category: 'registration_status',
        severity: 'critical',
        description: 'Institution registration is suspended',
        impact: 'High risk - institution cannot conduct business',
        mitigation: 'Verify suspension reasons and duration'
      });
      recommendations.push('Institution is currently suspended - high risk');
    } else if (institution.status === 'revoked') {
      score += 50;
      factors.push({
        category: 'registration_status',
        severity: 'critical',
        description: 'Institution registration is revoked',
        impact: 'Critical risk - institution is barred from industry',
        mitigation: 'Avoid any business relationship'
      });
      recommendations.push('Institution registration is revoked - avoid completely');
    }

    // Check compliance history
    if (institution.complianceHistory.length > 0) {
      const recentViolations = institution.complianceHistory.filter(c => {
        const date = new Date(c.date);
        const now = new Date();
        const yearsDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
        return yearsDiff <= 3;
      });

      if (recentViolations.length > 0) {
        score += recentViolations.length * 20;
        factors.push({
          category: 'compliance_history',
          severity: 'high',
          description: `Institution has ${recentViolations.length} recent compliance violations`,
          impact: 'High risk - pattern of regulatory non-compliance',
          mitigation: 'Review compliance program and corrective actions'
        });
        recommendations.push(`Institution has ${recentViolations.length} recent compliance violations - review program`);
      }
    }

    return { score, factors, recommendations };
  }

  private calculateRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore <= 25) return 'low';
    if (riskScore <= 50) return 'medium';
    if (riskScore <= 75) return 'high';
    return 'critical';
  }

  private calculateComplianceStatus(riskScore: number, riskFactors: RiskFactor[]): 'compliant' | 'non_compliant' | 'under_review' | 'unknown' {
    if (riskScore <= 25) return 'compliant';
    if (riskScore <= 50) return 'compliant';
    if (riskScore <= 75) return 'under_review';
    return 'non_compliant';
  }

  private generateDefaultRecommendations(riskLevel: string, riskScore: number): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'low') {
      recommendations.push('Risk assessment completed successfully');
      recommendations.push('Continue monitoring for changes in risk factors');
      recommendations.push('Maintain current due diligence procedures');
    } else if (riskLevel === 'medium') {
      recommendations.push('Additional verification recommended');
      recommendations.push('Consider enhanced due diligence');
      recommendations.push('Monitor risk factors more frequently');
    } else if (riskLevel === 'high') {
      recommendations.push('High risk detected - enhanced due diligence required');
      recommendations.push('Consider additional verification sources');
      recommendations.push('Implement risk mitigation measures');
    } else {
      recommendations.push('Critical risk detected - immediate action required');
      recommendations.push('Avoid business relationship until risk is mitigated');
      recommendations.push('Consult compliance officer or legal counsel');
    }

    return recommendations;
  }
}
