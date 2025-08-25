'use client';

import React, { useState, Suspense } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavBar } from "@/components/components/NavBar";
import { SideBar } from "@/components/components/SideBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Info, Building2, TrendingUp, Shield, Clock } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';

interface FINRAKYCResponse {
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
    filings?: Array<{
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
      sourcesUsed?: string[];
    };
  };
  error?: string;
}

function FINRAKYCPageContent() {
  const [verificationType, setVerificationType] = useState<string>('company');
  const [identifier, setIdentifier] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FINRAKYCResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationHistory, setVerificationHistory] = useState<Array<{
    id: string;
    identifier: string;
    timestamp: Date;
    success: boolean;
    riskLevel?: string;
  }>>([]);

  const handleVerification = async () => {
    if (!identifier.trim()) {
      setError('Please enter a company name or ticker symbol');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/finra-kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: verificationType,
          identifier: identifier.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      if (data.success && data.data) {
        setResult(data);
        
        // Add to history
        setVerificationHistory(prev => [{
          id: Date.now().toString(),
          identifier: identifier.trim(),
          timestamp: new Date(),
          success: true,
          riskLevel: data.data.riskAssessment.overallRisk
        }, ...prev.slice(0, 4)]); // Keep only last 5 entries
      } else {
        throw new Error(data.error || 'Invalid response structure');
      }
    } catch (err) {
      console.error('FINRA KYC Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      
      // Add failed attempt to history
      setVerificationHistory(prev => [{
        id: Date.now().toString(),
        identifier: identifier.trim(),
        timestamp: new Date(),
        success: false
      }, ...prev.slice(0, 4)]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 border-green-200';
      case 'non_compliant': return 'bg-red-100 text-red-800 border-red-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDataQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-gray-100">
        <SideBar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Suspense fallback={<div className="h-16 bg-white border-b"></div>}>
            <NavBar />
          </Suspense>
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FINRA KYC Verification</h1>
          <p className="text-gray-600">
            Comprehensive Know Your Customer verification using FINRA and SEC regulatory databases
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Verification Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Verification Request</CardTitle>
                <CardDescription>
                  Enter company details to begin KYC verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verificationType">Verification Type</Label>
                  <Select value="company" onValueChange={() => setVerificationType('company')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Company Verification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company Verification</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Other verification types (Broker, Advisor, Executive, Institution) are under development
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identifier">Company Identifier</Label>
                  <Input
                    id="identifier"
                    placeholder="Enter company name or ticker (e.g., Apple, AAPL, Microsoft, Tesla)"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleVerification()}
                  />
                  <p className="text-xs text-gray-500">
                    Try: Apple, Microsoft, Tesla, Amazon, Google, NVIDIA, Meta
                  </p>
                </div>

                <Button
                  onClick={handleVerification}
                  disabled={isLoading || !identifier.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Start Verification'
                  )}
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Verification History */}
            {verificationHistory.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Verifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {verificationHistory.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.identifier}</p>
                          <p className="text-xs text-gray-500">
                            {item.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.success ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              {item.riskLevel && (
                                <Badge className={getRiskColor(item.riskLevel)} variant="outline">
                                  {item.riskLevel}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Latest Verification Results */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Latest Verification Results
                </CardTitle>
                <CardDescription>
                  {result ? 'Verification completed successfully' : 'Results will appear here after verification'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result?.success && result.data ? (
                  <div className="space-y-6">
                    {/* Company Information */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Company Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Company Name</Label>
                          <p className="text-lg font-semibold text-gray-900">{result.data.company.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Ticker Symbol</Label>
                          <p className="text-lg font-semibold text-gray-900">{result.data.company.ticker}</p>
                        </div>
                        {result.data.company.cik && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">CIK Number</Label>
                            <p className="text-sm text-gray-700">{result.data.company.cik}</p>
                          </div>
                        )}
                        {result.data.company.industry && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Industry</Label>
                            <p className="text-sm text-gray-700">{result.data.company.industry}</p>
                          </div>
                        )}
                        {result.data.company.sector && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Sector</Label>
                            <p className="text-sm text-gray-700">{result.data.company.sector}</p>
                          </div>
                        )}
                        {result.data.company.sic && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">SIC Code</Label>
                            <p className="text-sm text-gray-700">{result.data.company.sic}</p>
                          </div>
                        )}
                        {result.data.company.stateOfIncorporation && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">State of Incorporation</Label>
                            <p className="text-sm text-gray-700">{result.data.company.stateOfIncorporation}</p>
                          </div>
                        )}
                        {result.data.company.fiscalYearEnd && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Fiscal Year End</Label>
                            <p className="text-sm text-gray-700">{result.data.company.fiscalYearEnd}</p>
                          </div>
                        )}
                        {result.data.company.ein && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">EIN</Label>
                            <p className="text-sm text-gray-700">{result.data.company.ein}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Risk Assessment & Metrics */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        Risk Assessment & Metrics
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                          </div>
                          <p className="text-2xl font-bold text-blue-600 mb-1">
                            {result.data.riskAssessment.confidence}%
                          </p>
                          <p className="text-xs text-gray-600 font-medium">Confidence</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Shield className="w-6 h-6 text-purple-600" />
                          </div>
                          <p className="text-2xl font-bold text-purple-600 mb-1">
                            {result.data.riskAssessment.riskScore}
                          </p>
                          <p className="text-xs text-gray-600 font-medium">Risk Score</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
                          <Badge className={getRiskColor(result.data.riskAssessment.overallRisk)} variant="outline">
                            {result.data.riskAssessment.overallRisk.toUpperCase()}
                          </Badge>
                          <p className="text-xs text-gray-600 font-medium mt-2">Overall Risk</p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
                          <Badge className={getComplianceColor(result.data.riskAssessment.complianceStatus)} variant="outline">
                            {result.data.riskAssessment.complianceStatus.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <p className="text-xs text-gray-600 font-medium mt-2">Compliance</p>
                        </div>
                      </div>
                    </div>

                    {/* Risk Factors */}
                    {result.data.riskAssessment.riskFactors.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          Risk Factors
                        </h4>
                        <div className="space-y-2">
                          {result.data.riskAssessment.riskFactors.map((factor, index) => (
                            <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <p className="text-sm text-orange-800">{factor}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {result.data.riskAssessment.recommendations.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-600" />
                          Recommendations
                        </h4>
                        <div className="space-y-2">
                          {result.data.riskAssessment.recommendations.map((rec, index) => (
                            <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-800">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SEC Filings */}
                    {result.data.filings && result.data.filings.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-green-600" />
                          Recent SEC Filings
                        </h4>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="space-y-3">
                            {result.data.filings.slice(0, 5).map((filing, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white border border-green-100 rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                      {filing.form}
                                    </Badge>
                                    <span className="font-medium text-gray-900">{filing.description}</span>
                                  </div>
                                  <div className="mt-1 text-sm text-gray-600">
                                    Filed: {new Date(filing.filingDate).toLocaleDateString()} | 
                                    Report Date: {new Date(filing.reportDate).toLocaleDateString()}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-500">
                                    Accession: {filing.accessionNumber}
                                  </div>
                                </div>
                                <a
                                  href={filing.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-4 text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                  View Filing →
                                </a>
                              </div>
                            ))}
                          </div>
                          {result.data.filings.length > 5 && (
                            <div className="mt-3 text-center">
                              <p className="text-sm text-green-700">
                                Showing 5 of {result.data.filings.length} recent filings
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Verification Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-gray-600">Data Source</Label>
                          <p className="font-medium">{result.data.source}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Processing Time</Label>
                          <p className="font-medium">{result.data.metadata.processingTime}ms</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Data Quality</Label>
                          <p className={`font-medium ${getDataQualityColor(result.data.metadata.dataQuality)}`}>
                            {result.data.metadata.dataQuality.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No verification results yet</h3>
                    <p className="text-gray-600 mb-4">
                      Complete a verification request to see comprehensive results here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Access SEC EDGAR filings, financial statements, and comprehensive company verification data.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Automated risk scoring and compliance assessment with detailed recommendations for due diligence.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Real-Time Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Live verification results using current regulatory databases and financial data sources.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function FINRAKYCPage() {
  return (
    <ErrorBoundary>
      <FINRAKYCPageContent />
    </ErrorBoundary>
  );
}