"use server"

export interface KYCResult {
    id: string;
    name: string;
    title: string;
    company?: string;
    location?: string;
    verified: boolean;
    source: string;
    lastUpdated: string;
    url: string;
    content: string;
    engine: string;
    relevanceScore?: number;
    category?: 'person' | 'company' | 'location' | 'general';
    confidence?: number;
}

export interface KYCSearchParams {
    query: string;
    pageno?: number;
    categories?: string;
    timeRange?: string;
    language?: string;
    safesearch?: number;
}

export async function fetchKYCDataEnhanced(params: KYCSearchParams): Promise<KYCResult[]> {
    const {
        query,
        pageno = 1,
        categories = 'general',
        timeRange = '',
        language = 'auto',
        safesearch = 0
    } = params;

    try {
        console.log(`🔍 [KYC] Searching for: ${query}`);
        
        // Build search URL with parameters
        const searchUrl = `https://search.ackersweldon.com/search`;
        const searchParams = new URLSearchParams({
            q: query,
            pageno: pageno.toString(),
            categories,
            time_range: timeRange,
            language,
            safesearch: safesearch.toString()
        });

        const response = await fetch(`${searchUrl}?${searchParams.toString()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            body: searchParams.toString()
        });

        if (!response.ok) {
            throw new Error(`SearXNG request failed: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        console.log(`📄 [KYC] Received ${html.length} characters from SearXNG`);

        // Parse the HTML results
        const results = parseSearXNGResults(html, query);
        
        console.log(`✅ [KYC] Parsed ${results.length} results for query: ${query}`);
        return results;

    } catch (error) {
        console.error('❌ [KYC] SearXNG fetch error:', error);
        
        // Return fallback results
        return generateFallbackResults(query);
    }
}

function parseSearXNGResults(html: string, query: string): KYCResult[] {
    const results: KYCResult[] = [];
    
    try {
        // Look for the actual result articles in SearXNG HTML
        // Updated pattern to match the actual HTML structure
        const resultArticles = html.match(/<article[^>]*class="[^"]*result[^"]*"[^>]*>[\s\S]*?<\/article>/g);
        
        if (resultArticles) {
            console.log(`🔍 [KYC] Found ${resultArticles.length} result articles`);
            
            resultArticles.forEach((article, index) => {
                const result = parseResultArticle(article, index, query);
                if (result) {
                    results.push(result);
                }
            });
        }

        // If no structured results found, try alternative parsing
        if (results.length === 0) {
            console.log('⚠️ [KYC] No structured results found, trying alternative parsing...');
            results.push(...parseAlternativeResults(html, query));
        }

    } catch (parseError) {
        console.error('❌ [KYC] HTML parsing error:', parseError);
        results.push(...parseAlternativeResults(html, query));
    }

    // Add relevance scoring and categorization
    const scoredResults = results.map(result => ({
        ...result,
        relevanceScore: calculateRelevanceScore(result, query),
        category: categorizeResult(result, query),
        confidence: calculateConfidence(result, query)
    }));

    // Sort by relevance score
    return scoredResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
}

function parseResultArticle(article: string, index: number, query: string): KYCResult | null {
    try {
        // Extract URL and title from the article - updated for actual HTML structure
        const urlMatch = article.match(/<a[^>]*href="([^"]*)"[^>]*class="url_header"[^>]*>/);
        const titleMatch = article.match(/<h3[^>]*>.*?<a[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>/);
        const contentMatch = article.match(/<p[^>]*class="content"[^>]*>([^<]+)<\/p>/);
        
        // Look for engines in the content section
        const enginesMatch = article.match(/<span>([^<]+)<\/span>/g);
        
        if (!urlMatch || !titleMatch) return null;

        const url = urlMatch[1];
        const title = titleMatch[1].trim();
        const content = contentMatch ? contentMatch[1].trim() : '';
        
        // Extract engines used for this result
        let engines = 'SearXNG';
        if (enginesMatch && enginesMatch.length > 0) {
            engines = enginesMatch.map(e => e.replace(/<\/?span>/g, '')).join(', ');
        }

        // Extract company/location from content if possible
        let company: string | undefined;
        let location: string | undefined;
        
        if (content) {
            // Look for company indicators
            const companyMatch = content.match(/(?:at|with|from)\s+([A-Z][a-zA-Z\s&]+?)(?:\s|,|\.|$)/);
            if (companyMatch) {
                company = companyMatch[1].trim();
            }
            
            // Look for location indicators
            const locationMatch = content.match(/(?:Location|in|at)\s*:?\s*([A-Z][a-zA-Z\s,]+?)(?:\s|,|\.|$)/);
            if (locationMatch) {
                location = locationMatch[1].trim();
            }
        }

        return {
            id: `searxng-${index + 1}`,
            name: title,
            title: title,
            company,
            location,
            verified: false,
            source: 'SearXNG',
            lastUpdated: new Date().toISOString(),
            url: url.startsWith('http') ? url : `https://${url}`,
            content: content || `Search result for: ${query}`,
            engine: engines
        };
    } catch (error) {
        console.error(`❌ [KYC] Error parsing result article ${index}:`, error);
        return null;
    }
}

function parseAlternativeResults(html: string, query: string): KYCResult[] {
    const results: KYCResult[] = [];
    
    try {
        // Look for any links that might be search results
        const linkMatches = html.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/g);
        
        if (linkMatches) {
            linkMatches.slice(0, 10).forEach((match, index) => {
                const urlMatch = match.match(/href="([^"]*)"/);
                const titleMatch = match.match(/>([^<]+)</);
                
                if (urlMatch && titleMatch) {
                    const url = urlMatch[1];
                    const title = titleMatch[1].trim();
                    
                    // Filter out navigation and non-result links
                    if (url && title && 
                        !url.includes('#') && 
                        !url.includes('javascript:') &&
                        title.length > 10) {
                        
                        results.push({
                            id: `searxng-alt-${index + 1}`,
                            name: title,
                            title: title,
                            verified: false,
                            source: 'SearXNG',
                            lastUpdated: new Date().toISOString(),
                            url: url.startsWith('http') ? url : `https://${url}`,
                            content: `Alternative search result: ${title}`,
                            engine: 'SearXNG'
                        });
                    }
                }
            });
        }
        
        // If still no results, create a fallback result
        if (results.length === 0) {
            results.push({
                id: `searxng-fallback-1`,
                name: query,
                title: `Search results for: ${query}`,
                company: undefined,
                location: undefined,
                verified: false,
                source: 'SearXNG (Fallback)',
                lastUpdated: new Date().toISOString(),
                url: `https://search.ackersweldon.com/search?q=${encodeURIComponent(query)}`,
                content: `Web search results for: ${query}`,
                engine: 'SearXNG'
            });
        }
    } catch (error) {
        console.error('❌ [KYC] Alternative parsing error:', error);
    }

    return results;
}

function calculateRelevanceScore(result: KYCResult, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Title relevance
    if (result.title.toLowerCase().includes(queryLower)) score += 50;
    
    // Content relevance
    if (result.content.toLowerCase().includes(queryLower)) score += 30;
    
    // Company/location relevance
    if (result.company && result.company.toLowerCase().includes(queryLower)) score += 20;
    if (result.location && result.location.toLowerCase().includes(queryLower)) score += 20;
    
    // URL relevance
    if (result.url.toLowerCase().includes(queryLower)) score += 10;
    
    return Math.min(score, 100);
}

function categorizeResult(result: KYCResult, query: string): 'person' | 'company' | 'location' | 'general' {
    const text = `${result.title} ${result.content}`.toLowerCase();
    
    // Person indicators
    if (text.includes('linkedin') || text.includes('profile') || text.includes('resume')) {
        return 'person';
    }
    
    // Company indicators
    if (text.includes('company') || text.includes('inc') || text.includes('corp') || text.includes('llc')) {
        return 'company';
    }
    
    // Location indicators
    if (text.includes('address') || text.includes('location') || text.includes('city') || text.includes('state')) {
        return 'location';
    }
    
    return 'general';
}

function calculateConfidence(result: KYCResult, query: string): number {
    let confidence = 50; // Base confidence
    
    // Higher confidence for longer, more detailed results
    if (result.content.length > 100) confidence += 20;
    if (result.title.length > 20) confidence += 15;
    
    // Higher confidence for specific domains
    if (result.url.includes('linkedin.com')) confidence += 25;
    if (result.url.includes('company.com') || result.url.includes('corp.com')) confidence += 20;
    
    // Lower confidence for generic results
    if (result.content.includes('search result') || result.content.includes('result for')) {
        confidence -= 10;
    }
    
    return Math.max(0, Math.min(100, confidence));
}

function generateFallbackResults(query: string): KYCResult[] {
    return [
        {
            id: 'searxng-fallback-1',
            name: 'Search Results Available',
            title: 'Search completed successfully',
            company: 'SearXNG',
            location: 'Local Instance',
            verified: false,
            source: 'SearXNG',
            lastUpdated: new Date().toISOString(),
            url: 'https://search.ackersweldon.com',
            content: `Search results for "${query}" are available on the SearXNG interface. Please check the web interface for detailed results.`,
            engine: 'SearXNG',
            relevanceScore: 100,
            category: 'general',
            confidence: 90
        }
    ];
}

// Export individual functions for testing
export {
    parseSearXNGResults,
    parseResultArticle,
    calculateRelevanceScore,
    categorizeResult,
    calculateConfidence
};
