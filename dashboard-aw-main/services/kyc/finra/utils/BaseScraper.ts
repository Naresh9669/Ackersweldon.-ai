// Base Scraper Class for FINRA KYC
// Provides common functionality for all regulatory data scrapers

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { RateLimiter } from './RateLimiter';
import { ProxyManager } from './ProxyManager';
import { ScrapingResult } from '../models/FINRAKYCTypes';

export abstract class BaseScraper {
  protected rateLimiter: RateLimiter;
  protected proxyManager: ProxyManager;
  protected userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
  ];

  constructor() {
    this.rateLimiter = new RateLimiter();
    this.proxyManager = new ProxyManager();
  }

  protected async makeRequest(
    url: string,
    options: Partial<AxiosRequestConfig> = {}
  ): Promise<AxiosResponse> {
    const domain = new URL(url).hostname;
    
    // Wait for rate limit
    await this.rateLimiter.waitForRateLimit(domain);

    // Get proxy if enabled
    const proxy = this.proxyManager.getNextProxy();
    
    const config: AxiosRequestConfig = {
      timeout: 30000,
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers
      },
      ...options
    };

    if (proxy) {
      config.proxy = {
        host: proxy.split(':')[0],
        port: parseInt(proxy.split(':')[1]),
        protocol: 'http'
      };
    }

    try {
      const response = await axios.get(url, config);
      
      if (proxy) {
        this.proxyManager.recordProxySuccess(proxy);
      }
      
      return response;
    } catch (error) {
      if (proxy) {
        this.proxyManager.recordProxyFailure(proxy);
      }
      throw error;
    }
  }

  protected async makePostRequest(
    url: string,
    data: any,
    options: Partial<AxiosRequestConfig> = {}
  ): Promise<AxiosResponse> {
    const domain = new URL(url).hostname;
    
    // Wait for rate limit
    await this.rateLimiter.waitForRateLimit(domain);

    // Get proxy if enabled
    const proxy = this.proxyManager.getNextProxy();
    
    const config: AxiosRequestConfig = {
      timeout: 30000,
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        ...options.headers
      },
      ...options
    };

    if (proxy) {
      config.proxy = {
        host: proxy.split(':')[0],
        port: parseInt(proxy.split(':')[1]),
        protocol: 'http'
      };
    }

    try {
      const response = await axios.post(url, data, config);
      
      if (proxy) {
        this.proxyManager.recordProxySuccess(proxy);
      }
      
      return response;
    } catch (error) {
      if (proxy) {
        this.proxyManager.recordProxyFailure(proxy);
      }
      throw error;
    }
  }

  protected loadCheerio(html: string): cheerio.CheerioAPI {
    return cheerio.load(html, {
      decodeEntities: false,
      xmlMode: false
    });
  }

  protected getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  protected async retryRequest<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    return this.rateLimiter.retryWithBackoff(operation);
  }

  protected createScrapingResult<T>(
    data: T,
    source: string,
    confidence: number,
    rawData?: any
  ): ScrapingResult<T> {
    return {
      success: true,
      data,
      source,
      timestamp: new Date().toISOString(),
      confidence,
      rawData
    };
  }

  protected createErrorResult<T>(
    source: string,
    error: string,
    rawData?: any
  ): ScrapingResult<T> {
    return {
      success: false,
      data: {} as T,
      source,
      timestamp: new Date().toISOString(),
      confidence: 0,
      rawData
    };
  }

  protected extractText(element: cheerio.Cheerio<cheerio.Element>): string {
    return element.text().trim();
  }

  protected extractAttribute(element: cheerio.Cheerio<cheerio.Element>, attribute: string): string {
    return element.attr(attribute) || '';
  }

  protected extractNumber(text: string): number | null {
    const match = text.replace(/[^\d.-]/g, '');
    const num = parseFloat(match);
    return isNaN(num) ? null : num;
  }

  protected extractDate(text: string): string | null {
    // Common date patterns in regulatory filings
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      /(\d{4}-\d{2}-\d{2})/g,
      /(\w+ \d{1,2},? \d{4})/g,
      /(\d{1,2}-\d{1,2}-\d{4})/g
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  protected sanitizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\r\n\t]/g, ' ')
      .trim();
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.constructor.name}]`;
    
    switch (level) {
      case 'info':
        console.log(`${prefix} ℹ️ ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️ ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ❌ ${message}`);
        break;
    }
  }

  // Abstract methods that must be implemented by subclasses
  abstract scrape(request: any): Promise<ScrapingResult<any>>;
  abstract isAvailable(): Promise<boolean>;
}
