# 🚀 Quick Start: Get Your KYC API Keys

## ⏱️ **Estimated Time: 30-45 minutes**

## 📋 **Prerequisites**
- Email address for registration
- Web browser
- Basic understanding of APIs

---

## 🔑 **Step 1: Email Verification APIs (5-10 minutes)**

### **Abstract API Email Validation**
1. **Go to**: https://www.abstractapi.com/email-validation-verification-api
2. **Click**: "Get Free API Key" (orange button)
3. **Sign up** with your email
4. **Verify email** (check spam folder)
5. **Copy API key** from dashboard
6. **Test**: Visit dashboard to see your 100 free requests/month

### **MillionVerifier**
1. **Go to**: https://millionverifier.com/
2. **Click**: "Sign Up" or "Get Started"
3. **Create account** with email
4. **Go to API section** in dashboard
5. **Copy API key**
6. **Test**: Check your 100 free requests/month limit

---

## 🏢 **Step 2: Company Verification APIs (10-15 minutes)**

### **Companies House API (UK Companies)**
1. **Go to**: https://developer.company-information.service.gov.uk/
2. **Click**: "Get started"
3. **Create account** with email
4. **Fill out form** (business purpose, usage details)
5. **Submit for approval** (usually 24-48 hours)
6. **Note**: This is the longest process, but worth it for UK company data

### **Fiscal.ai API (Global Companies - Better Alternative)**
1. **Go to**: https://docs.fiscal.ai/docs/guides/free-trial
2. **Click**: "Get Free Trial" or "Contact Sales"
3. **Sign up** for free account
4. **Copy API key** from dashboard
5. **Test**: Check your 250 requests/day limit (much better!)

### **Logo API (Company Brand Verification)**
1. **Go to**: https://logo.dev/
2. **Click**: "Get Started" or "Sign Up"
3. **Create free account**
4. **Copy API key**
5. **Test**: Unlimited requests with registration

---

## 🔍 **Step 3: Web Search API (10-15 minutes)**

### **Brave Search API (Much Better Alternative!)**
1. **Go to**: https://api-dashboard.search.brave.com/
2. **Click**: "Get Started" or "Sign Up"
3. **Create free account** with email
4. **Copy API key** from dashboard
5. **Test**: Check your 1000 requests/month limit (much better!)

### **SerpAPI (Multi-Engine Search)**
1. **Go to**: https://serpapi.com/
2. **Click**: "Get Free API Key"
3. **Sign up** for free account
4. **Copy API key** from dashboard
5. **Test**: Check your 100 requests/month limit

---

## ⚡ **Step 4: Quick Testing (5 minutes)**

### **Test Abstract API**
```bash
curl "https://emailvalidation.abstractapi.com/v1/?api_key=YOUR_KEY&email=test@example.com"
```

### **Test MillionVerifier**
```bash
curl "https://api.millionverifier.com/api/v3/?api=YOUR_KEY&email=test@example.com"
```

### **Test Fiscal.ai API**
```bash
curl "https://api.fiscal.ai/v1/companies-list?apiKey=YOUR_KEY"
```

### **Test Logo API**
```bash
curl "https://logo.clearbit.com/v1/companies/find?domain=apple.com"
```

---

## 📁 **Step 5: Environment Setup (2 minutes)**

1. **Copy template**: `cp env.template .env.local`
2. **Edit file**: Add your API keys
3. **Test all APIs**: `node scripts/test-kyc-apis.js`

---

## 🎯 **Pro Tips**

### **Save Time**
- Use the same email for all services
- Keep a text file with all your API keys
- Bookmark the dashboard URLs

### **Avoid Common Mistakes**
- Don't use disposable emails
- Read the free tier limits carefully
- Test APIs immediately after getting keys
- Check spam folders for verification emails

### **If You Get Stuck**
- **Abstract API**: Usually instant, check spam folder
- **MillionVerifier**: May need email verification
- **Companies House**: Requires business justification
- **OpenCorporates**: Should be instant
- **Google**: May need to enable billing (but stays free)

---

## ✅ **Success Checklist**

- [ ] Abstract API key obtained
- [ ] MillionVerifier API key obtained
- [ ] Companies House API key requested
- [ ] Fiscal.ai API key obtained
- [ ] Logo API key obtained
- [ ] Brave Search API key obtained
- [ ] SerpAPI key obtained
- [ ] `.env.local` file created with all keys
- [ ] All APIs tested successfully
- [ ] Ready to implement KYC services!

---

## 🆘 **Need Help?**

If you encounter issues with any API:
1. Check the service's documentation
2. Look for FAQ sections
3. Contact their support (most have live chat)
4. Check if the service is down

**Remember**: Most of these services want you to succeed - they're designed to be developer-friendly!
