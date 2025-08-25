# KYC API Setup & Testing Guide

## 🎯 **Free KYC APIs to Implement**

### **1. Email Verification APIs**
- **Abstract API Email Validation** (Free: 100 requests/month)
- **MillionVerifier** (Free: 100 requests/month)

### **2. Company Verification APIs**
- **Companies House API** (Free: 600 requests/day)
- **Fiscal.ai API** (Free: 250 requests/day) - *Better alternative to OpenCorporates*
- **Logo API** (Free: Unlimited with registration) - *Company brand verification*

### **3. Web Search APIs**
- **Brave Search API** (Free: 1000 requests/month) - *Much better alternative to Google!*
- **SerpAPI** (Free: 100 requests/month) - *Multi-engine search results*

## 📋 **Step-by-Step Setup Process**

### **Phase 1: Get API Keys**

#### **1.1 Abstract API Email Validation**
1. Go to: https://www.abstractapi.com/email-validation-verification-api
2. Click "Get Free API Key"
3. Sign up with email
4. Copy your API key
5. Test endpoint: `https://emailvalidation.abstractapi.com/v1/?api_key=YOUR_KEY&email=test@example.com`

#### **1.2 MillionVerifier**
1. Go to: https://millionverifier.com/
2. Click "Sign Up" or "Get Started"
3. Create account
4. Go to API section
5. Copy your API key
6. Test endpoint: `https://api.millionverifier.com/api/v3/?api=YOUR_KEY&email=test@example.com`

#### **1.3 Companies House API**
1. Go to: https://developer.company-information.service.gov.uk/
2. Click "Get started"
3. Create account
4. Request API key
5. Wait for approval (usually 24-48 hours)
6. Test endpoint: `https://api.company-information.service.gov.uk/company/00000006`

#### **1.4 Fiscal.ai API (Better Alternative)**
1. Go to: https://docs.fiscal.ai/docs/guides/free-trial
2. Click "Get Free Trial" or "Contact Sales"
3. Sign up for free account
4. Copy your API key
5. Test endpoint: `https://api.fiscal.ai/v1/companies-list?apiKey=YOUR_KEY`

#### **1.5 Logo API (Company Brand Verification)**
1. Go to: https://logo.dev/
2. Click "Get Started" or "Sign Up"
3. Create free account
4. Copy your API key
5. Test endpoint: `https://logo.clearbit.com/v1/companies/find?domain=apple.com`

#### **1.6 Brave Search API (Much Better Alternative!)**
1. Go to: https://api-dashboard.search.brave.com/
2. Click "Get Started" or "Sign Up"
3. Create free account
4. Copy your API key
5. Test endpoint: `https://api.search.brave.com/res/v1/web/search?q=test&key=YOUR_API_KEY`

#### **1.7 SerpAPI (Multi-Engine Search)**
1. Go to: https://serpapi.com/
2. Click "Get Free API Key"
3. Sign up for free account
4. Copy your API key
5. Test endpoint: `https://serpapi.com/search.json?engine=google&q=test&api_key=YOUR_KEY`

## 🧪 **Testing Plan**

### **Test 1: Email Verification APIs**
```bash
# Test Abstract API
curl "https://emailvalidation.abstractapi.com/v1/?api_key=YOUR_KEY&email=john@example.com"

# Test MillionVerifier
curl "https://api.millionverifier.com/api/v3/?api=YOUR_KEY&email=john@example.com"
```

### **Test 2: Company Verification APIs**
```bash
# Test Companies House (UK companies)
curl -u "YOUR_API_KEY:" "https://api.company-information.service.gov.uk/company/00000006"

# Test Fiscal.ai API
curl "https://api.fiscal.ai/v1/companies-list?apiKey=YOUR_KEY"

# Test Logo API
curl "https://logo.clearbit.com/v1/companies/find?domain=apple.com"
```

### **Test 3: Web Search APIs**
```bash
# Test Brave Search API
curl "https://api.search.brave.com/res/v1/web/search?q=Apple+Inc&key=YOUR_API_KEY"

# Test SerpAPI
curl "https://serpapi.com/search.json?engine=google&q=Apple+Inc&api_key=YOUR_KEY"
```

## 📁 **Environment Configuration**

Create `.env.local` file in your project root:

```bash
# Email Verification APIs
NEXT_PUBLIC_ABSTRACT_API_KEY=your_abstract_api_key_here
NEXT_PUBLIC_MILLIONVERIFIER_API_KEY=your_millionverifier_api_key_here

# Company Verification APIs
NEXT_PUBLIC_COMPANIES_HOUSE_API_KEY=your_companies_house_api_key_here
NEXT_PUBLIC_FISCAL_AI_API_KEY=your_fiscal_ai_api_key_here
NEXT_PUBLIC_LOGO_API_KEY=your_logo_api_key_here

# Web Search APIs
NEXT_PUBLIC_BRAVE_SEARCH_API_KEY=your_brave_search_api_key_here
NEXT_PUBLIC_SERPAPI_KEY=your_serpapi_key_here

# Backend API URL (optional)
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## 🔍 **Expected Test Results**

### **Abstract API Email Validation Response**
```json
{
  "email": "john@example.com",
  "deliverability": "DELIVERABLE",
  "quality_score": 0.9,
  "is_valid_format": {"value": true, "text": "TRUE"},
  "is_free_email": {"value": true, "text": "TRUE"},
  "is_disposable_email": {"value": false, "text": "FALSE"}
}
```

### **MillionVerifier Response**
```json
{
  "email": "john@example.com",
  "quality": "good",
  "result": "ok",
  "resultcode": 1,
  "free": false,
  "role": false,
  "credits": 3454
}
```

### **Companies House Response**
```json
{
  "company_name": "MARKS AND SPENCER GROUP PLC",
  "company_number": "00000006",
  "company_status": "active",
  "date_of_creation": "1884-01-01",
  "registered_office_address": {...}
}
```

### **Fiscal.ai Response**
```json
{
  "companies": [
    {
      "name": "Apple Inc.",
      "ticker": "AAPL",
      "cik": "0000320193",
      "exchangeName": "NASDAQ",
      "exchangeSymbol": "NASDAQ",
      "countryName": "United States",
      "countryCode": "US",
      "sector": "Technology",
      "industry": "Technology Hardware, Storage & Peripherals"
    }
  ]
}
```

### **Logo API Response**
```json
{
  "name": "Apple Inc.",
  "domain": "apple.com",
  "logo": "https://logo.clearbit.com/apple.com",
  "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide."
}
```

### **Brave Search API Response**
```json
{
  "query": {
    "original": "Apple Inc",
    "altered": "Apple Inc"
  },
  "web": {
    "results": [
      {
        "title": "Apple Inc. - Official Site",
        "url": "https://www.apple.com/",
        "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide."
      }
    ]
  }
}
```

### **SerpAPI Response**
```json
{
  "search_metadata": {
    "status": "Success",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "search_parameters": {
    "engine": "google",
    "q": "Apple Inc"
  },
  "organic_results": [
    {
      "title": "Apple Inc. - Official Site",
      "link": "https://www.apple.com/",
      "snippet": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide."
    }
  ]
}
```

## ⚠️ **Common Issues & Solutions**

### **Rate Limiting**
- **Abstract API**: 1 request/second on free plan
- **MillionVerifier**: 100 requests/month on free plan
- **Companies House**: 600 requests/day
- **Fiscal.ai**: 250 requests/day
- **Logo API**: Unlimited (with registration)
- **Brave Search**: 1000 requests/month
- **SerpAPI**: 100 requests/month

### **API Key Issues**
- Ensure API keys are properly formatted
- Check if keys are activated
- Verify account status
- Check usage limits

### **CORS Issues**
- Some APIs may have CORS restrictions
- Use backend proxy if needed
- Check API documentation for CORS policies

## 📊 **Next Steps After Testing**

1. **Document working APIs** and their response formats
2. **Create service interfaces** for each working API
3. **Implement fallback logic** between services
4. **Build unified KYC service** that uses all working APIs
5. **Update frontend** to use new services
6. **Add monitoring** and error handling

## 🔗 **Useful Links**

- [Abstract API Documentation](https://www.abstractapi.com/email-validation-verification-api)
- [MillionVerifier API Docs](https://millionverifier.com/api)
- [Companies House API Docs](https://developer.company-information.service.gov.uk/)
- [Fiscal.ai API Docs](https://docs.fiscal.ai/)
- [Logo API Docs](https://logo.dev/)
- [Brave Search API Docs](https://api-dashboard.search.brave.com/)
- [SerpAPI Docs](https://serpapi.com/)
