// Rate Limiting Utility for FINRA KYC Scraping
// Prevents being blocked by regulatory websites

import { RateLimitConfig } from '../models/FINRAKYCTypes';

export class RateLimiter {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRequestsPerMinute: 30,
      maxRequestsPerHour: 300,
      delayBetweenRequests: 2000, // 2 seconds
      retryAttempts: 3,
      retryDelay: 5000, // 5 seconds
      ...config
    };
  }

  async waitForRateLimit(domain: string): Promise<void> {
    const now = Date.now();
    const key = domain;
    
    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, { count: 0, resetTime: now + 60000 }); // 1 minute
    }

    const record = this.requestCounts.get(key)!;
    
    // Reset counter if minute has passed
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + 60000;
    }

    // Check if we're at the limit
    if (record.count >= this.config.maxRequestsPerMinute) {
      const waitTime = record.resetTime - now;
      console.log(`⚠️ Rate limit reached for ${domain}, waiting ${Math.ceil(waitTime / 1000)} seconds`);
      await this.sleep(waitTime);
      record.count = 0;
      record.resetTime = Date.now() + 60000;
    }

    // Add delay between requests
    if (record.count > 0) {
      await this.sleep(this.config.delayBetweenRequests);
    }

    record.count++;
  }

  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.retryAttempts
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        console.log(`⚠️ Attempt ${attempt} failed, retrying in ${Math.ceil(delay / 1000)} seconds...`);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats(): Map<string, { count: number; resetTime: number }> {
    return new Map(this.requestCounts);
  }

  resetStats(): void {
    this.requestCounts.clear();
  }
}
