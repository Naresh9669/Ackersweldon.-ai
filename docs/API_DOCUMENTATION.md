# 🚀 ACKERS WELDON Dashboard - API Documentation

**API Version:** 1.0.0  
**Last Updated:** August 26, 2025  
**Base URL:** https://api.ackersweldon.com  
**Status:** Production Ready ✅

---

## 📋 **API Overview**

The ACKERS WELDON Dashboard provides a comprehensive REST API for accessing news data, financial information, KYC services, and AI-powered insights. All endpoints are secured with HTTPS and include proper CORS configuration.

### **Authentication**
Currently, the API is configured for public access with rate limiting. Future versions may include API key authentication.

### **Rate Limiting**
- **Standard Endpoints:** 100 requests per minute
- **Data-Intensive Endpoints:** 20 requests per minute
- **KYC Endpoints:** 10 requests per minute

### **Response Format**
All API responses follow a consistent format:
```json
{
  "success": true,
  "data": {...},
  "metadata": {
    "timestamp": "2025-08-26T03:45:00Z",
    "version": "1.0.0"
  }
}
```

---

## 📰 **NEWS & MEDIA API**

### **Get News Articles**

#### **Endpoint:** `GET /api/news`

Retrieves a paginated list of news articles with optional filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 100 | Number of articles to return (max 1000) |
| `page` | integer | 1 | Page number for pagination |
| `category` | string | all | Filter by category (general, business, technology, etc.) |
| `source` | string | all | Filter by news source |
| `date_from` | string | 30 days ago | Start date (YYYY-MM-DD) |
| `date_to` | string | today | End date (YYYY-MM-DD) |

**Response Model:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "title": "string",
      "summary": "string",
      "source": "string",
      "category": "string",
      "published_at": "2025-08-26T03:45:00Z",
      "url": "string",
      "sentiment_score": 0.75,
      "sentiment_label": "positive"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 25,
    "total_available": 2500,
    "has_next": true,
    "has_prev": false
  }
}
```

**Example Request:**
```bash
curl "https://api.ackersweldon.com/api/news?limit=50&category=business&page=1"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f678901234",
      "title": "Federal Reserve Announces New Policy Changes",
      "summary": "The Federal Reserve has announced significant changes to its monetary policy...",
      "source": "Reuters",
      "category": "business",
      "published_at": "2025-08-26T02:30:00Z",
      "url": "https://example.com/article1",
      "sentiment_score": 0.65,
      "sentiment_label": "positive"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 25,
    "total_available": 2500,
    "has_next": true,
    "has_prev": false
  },
  "metadata": {
    "timestamp": "2025-08-26T03:45:00Z",
    "version": "1.0.0"
  }
}
```

---

## 🤖 **AI SUMMARIES API**

### **Get AI-Processed News**

#### **Endpoint:** `GET /api/ai-news`

Retrieves news articles that have been processed by AI for enhanced insights and sentiment analysis.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 100 | Number of articles to return |
| `page` | integer | 1 | Page number for pagination |
| `ai_summary` | boolean | true | Filter for articles with AI summaries |
| `sentiment` | string | all | Filter by sentiment (positive, negative, neutral) |

**Response Model:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "title": "string",
      "summary": "string",
      "source": "string",
      "category": "string",
      "published_at": "2025-08-26T03:45:00Z",
      "url": "string",
      "ai_summary": "string",
      "ai_sentiment_analysis": "string",
      "ai_sentiment_score": 0.85,
      "ai_sentiment_label": "positive",
      "ai_summary_timestamp": "2025-08-26T03:40:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 15,
    "total_available": 1500,
    "has_next": true,
    "has_prev": false
  }
}
```

**Example Request:**
```bash
curl "https://api.ackersweldon.com/api/ai-news?limit=25&sentiment=positive"
```

---

## 💹 **FINANCIAL DATA API**

### **Get Company Information**

#### **Endpoint:** `GET /api/yahoo-finance/quote`

Retrieves comprehensive financial information for a specific company or stock.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string | ✅ | Stock ticker symbol (e.g., AAPL, TSLA) |

**Response Model:**
```json
{
  "success": true,
  "data": {
    "ok": true,
    "data": {
      "regularMarketPrice": 150.25,
      "regularMarketChange": 2.50,
      "regularMarketChangePercent": 1.69,
      "regularMarketPreviousClose": 147.75,
      "marketCap": 2500000000000,
      "fiftyTwoWeekHigh": 180.00,
      "fiftyTwoWeekLow": 120.00,
      "trailingPE": 25.5,
      "priceToBook": 15.2,
      "priceToSales": 8.5
    },
    "sector": "Technology",
    "industry": "Consumer Electronics",
    "fullTimeEmployees": 154000,
    "businessSummary": "Apple Inc. designs, manufactures, and markets...",
    "enterpriseValue": 2600000000000,
    "returnOnEquity": 0.85,
    "returnOnAssets": 0.25,
    "debtToEquity": 1.2,
    "beta": 1.15,
    "priceToBook": 15.2,
    "enterpriseToRevenue": 8.5,
    "enterpriseToEbitda": 18.5
  }
}
```

**Example Request:**
```bash
curl "https://api.ackersweldon.com/api/yahoo-finance/quote?ticker=AAPL"
```

### **Get Historical Chart Data**

#### **Endpoint:** `GET /api/yahoo-finance/simple-chart`

Retrieves historical price data for chart visualization.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string | ✅ | Stock ticker symbol |
| `range` | string | 1Y | Time range (1M, 3M, 6M, 1Y, 2Y, 5Y) |

**Response Model:**
```json
{
  "success": true,
  "data": {
    "quotes": [
      {
        "date": "2025-08-25",
        "close": 150.25,
        "open": 149.50,
        "high": 151.00,
        "low": 148.75,
        "volume": 45000000
      }
    ],
    "meta": {
      "symbol": "AAPL",
      "range": "1Y",
      "dataPoints": 249,
      "dataSource": "polygon_io_historical_data",
      "note": "Real historical data from Polygon.io with fallbacks"
    }
  }
}
```

**Example Request:**
```bash
curl "https://api.ackersweldon.com/api/yahoo-finance/simple-chart?ticker=AAPL&range=1Y"
```

### **Get Market Indices**

#### **Endpoint:** `GET /api/yahoo-finance/market-data`

Retrieves real-time data for major market indices (S&P 500, Dow Jones, NASDAQ, VIX).

**Response Model:**
```json
{
  "success": true,
  "data": {
    "GSPC": {
      "price": 5792.04,
      "change": 23.35,
      "volume": 2847500000,
      "symbol": "GSPC",
      "name": "S&P 500",
      "changePercent": 0.40
    },
    "DJI": {
      "price": 42025.19,
      "change": 156.87,
      "volume": 285600000,
      "symbol": "DJI",
      "name": "Dow Jones",
      "changePercent": 0.37
    },
    "IXIC": {
      "price": 18567.19,
      "change": -77.06,
      "volume": 4234500000,
      "symbol": "IXIC",
      "name": "NASDAQ",
      "changePercent": -0.41
    },
    "VIX": {
      "price": 14.23,
      "change": -0.45,
      "volume": 12450000,
      "symbol": "VIX",
      "name": "VIX",
      "changePercent": -3.07
    }
  },
  "metadata": {
    "timestamp": "2025-08-26T03:45:00Z",
    "symbolsRequested": 4,
    "symbolsRetrieved": 4
  }
}
```

**Example Request:**
```bash
curl "https://api.ackersweldon.com/api/yahoo-finance/market-data"
```

---

## 🛡️ **KYC VERIFICATION API**

### **FINRA KYC Verification**

#### **Endpoint:** `POST /api/finra-kyc`

Performs KYC verification using FINRA data and multiple verification sources.

**Request Body:**
```json
{
  "type": "broker",
  "identifier": "string",
  "firstName": "string",
  "lastName": "string",
  "middleName": "string",
  "ssn": "string",
  "dateOfBirth": "YYYY-MM-DD"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | ✅ | Verification type: broker, advisor, company, executive, institution |
| `identifier` | string | ✅ | License number, CRD number, or company identifier |
| `firstName` | string | ✅ | Individual's first name |
| `lastName` | string | ✅ | Individual's last name |
| `middleName` | string | ❌ | Individual's middle name |
| `ssn` | string | ❌ | Social Security Number (for enhanced verification) |
| `dateOfBirth` | string | ❌ | Date of birth (YYYY-MM-DD) |

**Response Model:**
```json
{
  "success": true,
  "data": {
    "verification_id": "string",
    "status": "completed",
    "confidence": 99.5,
    "riskScore": 12.5,
    "sources": [
      {
        "name": "FINRA",
        "status": "verified",
        "lastUpdated": "2025-08-26T03:45:00Z"
      }
    ],
    "details": {
      "name": "John Doe",
      "licenseNumber": "12345678",
      "status": "Active",
      "expirationDate": "2026-12-31",
      "firm": "ABC Securities"
    },
    "metadata": {
      "processingTime": 1250,
      "timestamp": "2025-08-26T03:45:00Z"
    }
  }
}
```

**Example Request:**
```bash
curl -X POST "https://api.ackersweldon.com/api/finra-kyc" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "broker",
    "identifier": "12345678",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### **Enhanced KYC Verification**

#### **Endpoint:** `POST /api/kyc`

Performs enhanced KYC verification with additional data sources and risk assessment.

**Request Body:** Same as FINRA KYC endpoint.

**Response Model:**
```json
{
  "success": true,
  "data": {
    "verification_id": "string",
    "status": "completed",
    "confidence": 99.8,
    "riskScore": 8.5,
    "riskLevel": "low",
    "sources": [
      {
        "name": "FINRA",
        "status": "verified",
        "confidence": 99.5
      },
      {
        "name": "SEC",
        "status": "verified",
        "confidence": 99.8
      },
      {
        "name": "State Registry",
        "status": "verified",
        "confidence": 99.2
      }
    ],
    "riskAssessment": {
      "overallRisk": "low",
      "factors": [
        "Clean regulatory history",
        "Valid license status",
        "No disciplinary actions"
      ]
    },
    "metadata": {
      "processingTime": 2100,
      "timestamp": "2025-08-26T03:45:00Z"
    }
  }
}
```

---

## 🔍 **SEARCH API**

### **General Search**

#### **Endpoint:** `GET /api/search`

Performs comprehensive search across multiple data sources.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | ✅ | Search query |
| `type` | string | all | Search type: news, financial, kyc, all |
| `limit` | integer | 50 | Number of results to return |
| `page` | integer | 1 | Page number for pagination |

**Response Model:**
```json
{
  "success": true,
  "data": {
    "query": "string",
    "totalResults": 1250,
    "results": [
      {
        "type": "news",
        "title": "string",
        "summary": "string",
        "url": "string",
        "source": "string",
        "published_at": "2025-08-26T03:45:00Z",
        "relevance_score": 0.95
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 25,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

**Example Request:**
```bash
curl "https://api.ackersweldon.com/api/search?q=Federal+Reserve&type=news&limit=25"
```

---

## 📊 **ANALYTICS API**

### **Dashboard Statistics**

#### **Endpoint:** `GET /api/dashboard/stats`

Retrieves real-time dashboard statistics and metrics.

**Response Model:**
```json
{
  "success": true,
  "data": {
    "totalNews": 2847,
    "aiProcessedNews": 1234,
    "totalDataStreams": 3500,
    "activeUsers": 890,
    "engagementRate": 89,
    "todayArticles": 156,
    "systemHealth": {
      "status": "healthy",
      "uptime": "99.95%",
      "lastCheck": "2025-08-26T03:45:00Z"
    }
  }
}
```

**Example Request:**
```bash
curl "https://api.ackersweldon.com/api/dashboard/stats"
```

---

## 🚨 **ERROR HANDLING**

### **Error Response Format**

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "error_code": "ERROR_CODE",
  "details": "Additional error details",
  "timestamp": "2025-08-26T03:45:00Z"
}
```

### **Common HTTP Status Codes**

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid parameters or request format |
| 401 | Unauthorized | Authentication required (future versions) |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Service temporarily unavailable |

### **Error Codes Reference**

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `INVALID_PARAMETER` | Missing or invalid parameter | Check request parameters |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `SERVICE_UNAVAILABLE` | External service down | Retry later |
| `DATA_NOT_FOUND` | Requested data not available | Check query parameters |
| `VALIDATION_ERROR` | Data validation failed | Check request format |

---

## 🔒 **SECURITY & COMPLIANCE**

### **HTTPS Enforcement**
- All API endpoints require HTTPS
- TLS 1.2 and 1.3 supported
- HSTS headers enabled

### **CORS Configuration**
```json
{
  "Access-Control-Allow-Origin": "https://dashboard.ackersweldon.com",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true"
}
```

### **Data Privacy**
- No personal data stored unless required for KYC verification
- All data encrypted in transit and at rest
- Compliance with data protection regulations

---

## 📈 **PERFORMANCE & MONITORING**

### **Response Time Targets**
- **Simple API calls:** < 200ms
- **Data retrieval:** < 500ms
- **Complex operations:** < 2 seconds
- **KYC verification:** < 5 seconds

### **Availability**
- **Target uptime:** 99.9%
- **Monitoring:** 24/7 system monitoring
- **Alerting:** Automatic notifications for issues

### **Rate Limiting Headers**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🧪 **TESTING & DEVELOPMENT**

### **Test Endpoints**

#### **Health Check**
```bash
curl "https://api.ackersweldon.com/health"
```

#### **API Status**
```bash
curl "https://api.ackersweldon.com/status"
```

### **Development Environment**
- **Base URL:** https://api.ackersweldon.com
- **Documentation:** This document
- **Testing Tools:** Postman, curl, or any HTTP client

### **Sample Integration Code**

#### **JavaScript/Node.js**
```javascript
const API_BASE = 'https://api.ackersweldon.com';

async function getNews(limit = 50, page = 1) {
  try {
    const response = await fetch(
      `${API_BASE}/api/news?limit=${limit}&page=${page}`
    );
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Usage
getNews(25, 1).then(news => console.log(news));
```

#### **Python**
```python
import requests

API_BASE = 'https://api.ackersweldon.com'

def get_news(limit=50, page=1):
    try:
        response = requests.get(
            f'{API_BASE}/api/news',
            params={'limit': limit, 'page': page}
        )
        response.raise_for_status()
        data = response.json()
        
        if data['success']:
            return data['data']
        else:
            raise Exception(data['error'])
    except Exception as e:
        print(f'API Error: {e}')
        raise e

# Usage
news = get_news(25, 1)
print(news)
```

---

## 📞 **SUPPORT & CONTACT**

### **API Support**
- **Documentation:** This document
- **Status Page:** https://dashboard.ackersweldon.com/status
- **Health Check:** https://api.ackersweldon.com/health

### **Rate Limits & Quotas**
- **Standard Tier:** 100 requests/minute
- **Premium Tier:** 1000 requests/minute (contact for access)
- **Enterprise:** Custom limits available

### **Getting Help**
1. **Check this documentation** for common issues
2. **Review error responses** for specific error codes
3. **Check system status** at dashboard
4. **Contact support** for complex issues

---

## 🎉 **API STATUS: PRODUCTION READY** 🎉

**The ACKERS WELDON Dashboard API is fully operational with:**
- ✅ **Comprehensive endpoints** for all platform features
- ✅ **Enterprise-grade security** with HTTPS and CORS
- ✅ **Robust error handling** and rate limiting
- ✅ **Real-time data** from multiple sources
- ✅ **Comprehensive documentation** and examples

**Ready for production use and integration!** 🚀

---

*This API documentation is regularly updated. For the latest version, check the dashboard or contact support.*
