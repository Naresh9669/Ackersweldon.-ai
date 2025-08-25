import { NextRequest, NextResponse } from 'next/server';
import { realSECDataService } from '../../../services/kyc/finra/RealSECDataService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, identifier, additionalData } = body;

    if (!type || !identifier) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type and identifier' },
        { status: 400 }
      );
    }

    if (type !== 'company') {
      return NextResponse.json(
        { success: false, error: 'Only company verification is currently supported. Other verification types are under development.' },
        { status: 400 }
      );
    }

    console.log(`🔍 [FINRA KYC API] Processing ${type} verification for: ${identifier}`);

    const result = await realSECDataService.verifyCompany(identifier);

    console.log(`✅ [FINRA KYC API] ${type} verification completed for: ${identifier}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [FINRA KYC API] Verification failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'FINRA KYC verification failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const identifier = searchParams.get('identifier');

    if (!type || !identifier) {
      return NextResponse.json(
        { success: false, error: 'Missing required query parameters: type and identifier' },
        { status: 400 }
      );
    }

    if (type !== 'company') {
      return NextResponse.json(
        { success: false, error: 'Only company verification is currently supported. Other verification types are under development.' },
        { status: 400 }
      );
    }

    console.log(`🔍 [FINRA KYC API] GET request: ${type} - ${identifier}`);

    const result = await realSECDataService.verifyCompany(identifier);

    console.log(`✅ [FINRA KYC API] ${type} verification completed for: ${identifier}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [FINRA KYC API] Verification failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'FINRA KYC verification failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}