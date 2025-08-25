// FINRA BrokerCheck Scraper
// Verifies brokers and investment advisors using FINRA's public database

import { BaseScraper } from '../utils/BaseScraper';
import { 
  BrokerVerificationResult, 
  AdvisorVerificationResult,
  License,
  EmploymentRecord,
  DisciplinaryAction,
  ExamRecord,
  ScrapingResult 
} from '../models/FINRAKYCTypes';

export class FINRABrokerCheckScraper extends BaseScraper {
  private baseUrl = 'https://brokercheck.finra.org';
  private searchUrl = 'https://brokercheck.finra.org/search';

  async scrape(request: { identifier: string; type: 'broker' | 'advisor' }): Promise<ScrapingResult<BrokerVerificationResult | AdvisorVerificationResult>> {
    try {
      this.log(`Starting FINRA BrokerCheck scrape for ${request.identifier}`);

      if (request.type === 'broker') {
        const result = await this.scrapeBroker(request.identifier);
        return this.createScrapingResult(
          result,
          'FINRA_BrokerCheck',
          result.confidence,
          result
        );
      } else {
        const result = await this.scrapeAdvisor(request.identifier);
        return this.createScrapingResult(
          result,
          'FINRA_BrokerCheck',
          result.confidence,
          result
        );
      }

    } catch (error) {
      this.log(`FINRA BrokerCheck scraping failed: ${error}`, 'error');
      return this.createErrorResult<BrokerVerificationResult | AdvisorVerificationResult>(
        'FINRA_BrokerCheck',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async scrapeBroker(identifier: string): Promise<BrokerVerificationResult> {
    // Search for broker by CRD number or name
    const searchUrl = `${this.searchUrl}?searchText=${encodeURIComponent(identifier)}&searchType=individual`;
    
    const response = await this.makeRequest(searchUrl);
    const $ = this.loadCheerio(response.data);

    // Extract broker information
    const brokerName = this.extractText($('.broker-name'));
    const crdNumber = this.extractCRDNumber($('.crd-number'));
    
    if (!brokerName || !crdNumber) {
      throw new Error(`Broker not found: ${identifier}`);
    }

    // Get detailed broker information
    const brokerDetails = await this.getBrokerDetails(crdNumber);
    
    return {
      ...brokerDetails,
      crdNumber,
      name: brokerName,
      confidence: 90
    };
  }

  private async scrapeAdvisor(identifier: string): Promise<AdvisorVerificationResult> {
    // Search for investment advisor by CRD number or name
    const searchUrl = `${this.searchUrl}?searchText=${encodeURIComponent(identifier)}&searchType=firm`;
    
    const response = await this.makeRequest(searchUrl);
    const $ = this.loadCheerio(response.data);

    // Extract advisor information
    const advisorName = this.extractText($('.firm-name'));
    const crdNumber = this.extractCRDNumber($('.crd-number'));
    
    if (!advisorName || !crdNumber) {
      throw new Error(`Investment advisor not found: ${identifier}`);
    }

    // Get detailed advisor information
    const advisorDetails = await this.getAdvisorDetails(crdNumber);
    
    return {
      ...advisorDetails,
      crdNumber,
      name: advisorName,
      confidence: 90
    };
  }

  private async getBrokerDetails(crdNumber: string): Promise<BrokerVerificationResult> {
    const brokerUrl = `${this.baseUrl}/individual/summary/${crdNumber}`;
    
    const response = await this.makeRequest(brokerUrl);
    const $ = this.loadCheerio(response.data);

    // Extract basic information
    const status = this.extractBrokerStatus($('.registration-status'));
    const registrationType = this.extractRegistrationTypes($);
    
    // Extract licenses
    const licenses = this.extractLicenses($);
    
    // Extract employment history
    const employmentHistory = this.extractEmploymentHistory($);
    
    // Extract disciplinary history
    const disciplinaryHistory = this.extractDisciplinaryHistory($);
    
    // Extract exam records
    const exams = this.extractExamRecords($);

    return {
      success: true,
      crdNumber,
      name: '', // Will be set by caller
      status,
      registrationType,
      licenses,
      employmentHistory,
      disciplinaryHistory,
      exams,
      confidence: 85,
      source: 'FINRA_BrokerCheck',
      lastUpdated: new Date().toISOString()
    };
  }

  private async getAdvisorDetails(crdNumber: string): Promise<AdvisorVerificationResult> {
    const advisorUrl = `${this.baseUrl}/firm/summary/${crdNumber}`;
    
    const response = await this.makeRequest(advisorUrl);
    const $ = this.loadCheerio(response.data);

    // Extract basic information
    const status = this.extractAdvisorStatus($('.registration-status'));
    
    // Extract firm affiliations
    const firmAffiliations = this.extractFirmAffiliations($);
    
    // Extract qualifications
    const qualifications = this.extractQualifications($);
    
    // Extract disclosures
    const disclosures = this.extractDisclosures($);
    
    // Extract assets under management
    const aum = this.extractAssetsUnderManagement($);
    
    // Extract client types
    const clientTypes = this.extractClientTypes($);

    return {
      success: true,
      crdNumber,
      name: '', // Will be set by caller
      status,
      firmAffiliations,
      qualifications,
      disclosures,
      assetsUnderManagement: aum,
      clientTypes,
      confidence: 85,
      source: 'FINRA_BrokerCheck',
      lastUpdated: new Date().toISOString()
    };
  }

  private extractBrokerStatus(element: any): 'active' | 'inactive' | 'suspended' | 'revoked' | 'unknown' {
    const statusText = this.extractText(element).toLowerCase();
    
    if (statusText.includes('active') || statusText.includes('registered')) return 'active';
    if (statusText.includes('inactive') || statusText.includes('unregistered')) return 'inactive';
    if (statusText.includes('suspended')) return 'suspended';
    if (statusText.includes('revoked') || statusText.includes('barred')) return 'revoked';
    
    return 'unknown';
  }

  private extractAdvisorStatus(element: any): 'active' | 'inactive' | 'suspended' | 'revoked' | 'unknown' {
    return this.extractBrokerStatus(element);
  }

  private extractRegistrationTypes($: any): string[] {
    const types: string[] = [];
    
    $('.registration-type').each((index: number, element: any) => {
      const type = this.extractText($(element));
      if (type) types.push(type);
    });
    
    return types;
  }

  private extractLicenses($: any): License[] {
    const licenses: License[] = [];
    
    $('.license-item').each((index: number, element: any) => {
      const $license = $(element);
      
      const type = this.extractText($license.find('.license-type'));
      const state = this.extractText($license.find('.license-state'));
      const status = this.extractLicenseStatus($license.find('.license-status'));
      const issueDate = this.extractDate(this.extractText($license.find('.issue-date'))) || '';
      const expiryDate = this.extractDate(this.extractText($license.find('.expiry-date'))) || '';
      const number = this.extractText($license.find('.license-number'));
      
      if (type && state && number) {
        licenses.push({
          type,
          state,
          status,
          issueDate,
          expiryDate,
          number
        });
      }
    });
    
    return licenses;
  }

  private extractLicenseStatus(element: any): 'active' | 'inactive' | 'suspended' | 'revoked' {
    const statusText = this.extractText(element).toLowerCase();
    
    if (statusText.includes('active') || statusText.includes('current')) return 'active';
    if (statusText.includes('inactive') || statusText.includes('expired')) return 'inactive';
    if (statusText.includes('suspended')) return 'suspended';
    if (statusText.includes('revoked')) return 'revoked';
    
    return 'inactive';
  }

  private extractEmploymentHistory($: any): EmploymentRecord[] {
    const employment: EmploymentRecord[] = [];
    
    $('.employment-item').each((index: number, element: any) => {
      const $emp = $(element);
      
      const firmName = this.extractText($emp.find('.firm-name'));
      const crdNumber = this.extractCRDNumber($emp.find('.firm-crd').attr('href') || '');
      const position = this.extractText($emp.find('.position'));
      const startDate = this.extractDate(this.extractText($emp.find('.start-date'))) || '';
      const endDate = this.extractDate(this.extractText($emp.find('.end-date'))) || '';
      const status = endDate ? 'previous' : 'current';
      
      if (firmName && position && startDate) {
        employment.push({
          firmName,
          crdNumber,
          position,
          startDate,
          endDate,
          status
        });
      }
    });
    
    return employment;
  }

  private extractDisciplinaryHistory($: any): DisciplinaryAction[] {
    const disciplinary: DisciplinaryAction[] = [];
    
    $('.disciplinary-item').each((index: number, element: any) => {
      const $disc = $(element);
      
      const date = this.extractDate(this.extractText($disc.find('.disciplinary-date'))) || '';
      const type = this.extractText($disc.find('.disciplinary-type'));
      const description = this.extractText($disc.find('.disciplinary-description'));
      const sanction = this.extractText($disc.find('.disciplinary-sanction'));
      const fine = this.extractNumber(this.extractText($disc.find('.disciplinary-fine')));
      const suspension = this.extractText($disc.find('.disciplinary-suspension'));
      
      if (date && type && description) {
        disciplinary.push({
          date,
          type,
          description,
          sanction,
          fine: fine || undefined,
          suspension: suspension || undefined,
          source: 'FINRA_BrokerCheck'
        });
      }
    });
    
    return disciplinary;
  }

  private extractExamRecords($: any): ExamRecord[] {
    const exams: ExamRecord[] = [];
    
    $('.exam-item').each((index: number, element: any) => {
      const $exam = $(element);
      
      const exam = this.extractText($exam.find('.exam-name'));
      const date = this.extractDate(this.extractText($exam.find('.exam-date'))) || '';
      const score = this.extractText($exam.find('.exam-score'));
      const status = this.extractExamStatus($exam.find('.exam-status'));
      
      if (exam && date) {
        exams.push({
          exam,
          date,
          score: score || undefined,
          status
        });
      }
    });
    
    return exams;
  }

  private extractExamStatus(element: any): 'passed' | 'failed' | 'pending' {
    const statusText = this.extractText(element).toLowerCase();
    
    if (statusText.includes('pass') || statusText.includes('completed')) return 'passed';
    if (statusText.includes('fail')) return 'failed';
    
    return 'pending';
  }

  private extractFirmAffiliations($: any): any[] {
    // Implementation for firm affiliations
    return [];
  }

  private extractQualifications($: any): any[] {
    // Implementation for qualifications
    return [];
  }

  private extractDisclosures($: any): any[] {
    // Implementation for disclosures
    return [];
  }

  private extractAssetsUnderManagement($: any): number | undefined {
    const aumText = this.extractText($('.aum-amount'));
    return this.extractNumber(aumText) || undefined;
  }

  private extractClientTypes($: any): string[] {
    const clientTypes: string[] = [];
    
    $('.client-type').each((index: number, element: any) => {
      const type = this.extractText($(element));
      if (type) clientTypes.push(type);
    });
    
    return clientTypes;
  }

  private extractCRDNumber(href: string): string {
    const match = href.match(/\/summary\/(\d+)/);
    return match ? match[1] : '';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.makeRequest('https://brokercheck.finra.org/');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
