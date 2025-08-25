// Proxy Management Utility for FINRA KYC Scraping
// Rotates IP addresses to avoid detection

import { ProxyConfig } from '../models/FINRAKYCTypes';

export class ProxyManager {
  private config: ProxyConfig;
  private currentProxyIndex: number = 0;
  private proxyFailures: Map<string, number> = new Map();
  private maxFailures: number = 3;

  constructor(config: Partial<ProxyConfig> = {}) {
    this.config = {
      enabled: false,
      proxies: [],
      rotationStrategy: 'round_robin',
      ...config
    };
  }

  getNextProxy(): string | null {
    if (!this.config.enabled || this.config.proxies.length === 0) {
      return null;
    }

    let proxy: string;

    switch (this.config.rotationStrategy) {
      case 'round_robin':
        proxy = this.config.proxies[this.currentProxyIndex];
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.config.proxies.length;
        break;

      case 'random':
        const randomIndex = Math.floor(Math.random() * this.config.proxies.length);
        proxy = this.config.proxies[randomIndex];
        break;

      case 'failover':
        // Find first proxy with fewer than max failures
        proxy = this.config.proxies.find(p => 
          (this.proxyFailures.get(p) || 0) < this.maxFailures
        ) || this.config.proxies[0];
        break;

      default:
        proxy = this.config.proxies[0];
    }

    return proxy;
  }

  recordProxyFailure(proxy: string): void {
    if (!this.config.enabled) return;

    const failures = (this.proxyFailures.get(proxy) || 0) + 1;
    this.proxyFailures.set(proxy, failures);

    if (failures >= this.maxFailures) {
      console.log(`⚠️ Proxy ${proxy} marked as failed after ${failures} failures`);
    }
  }

  recordProxySuccess(proxy: string): void {
    if (!this.config.enabled) return;

    // Reset failure count on success
    this.proxyFailures.set(proxy, 0);
  }

  getProxyConfig(): ProxyConfig {
    return { ...this.config };
  }

  updateProxies(proxies: string[]): void {
    this.config.proxies = proxies;
    this.currentProxyIndex = 0;
    this.proxyFailures.clear();
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  getWorkingProxies(): string[] {
    return this.config.proxies.filter(proxy => 
      (this.proxyFailures.get(proxy) || 0) < this.maxFailures
    );
  }

  getProxyStats(): { total: number; working: number; failed: number } {
    const total = this.config.proxies.length;
    const failed = Array.from(this.proxyFailures.values()).filter(f => f >= this.maxFailures).length;
    const working = total - failed;

    return { total, working, failed };
  }
}
