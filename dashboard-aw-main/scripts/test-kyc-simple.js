#!/usr/bin/env node

/**
 * Simple KYC Test Script
 * 
 * Tests the enhanced KYC functionality with actual SearXNG results.
 */

const https = require('https');

async function testKYCSearch(query) {
    return new Promise((resolve, reject) => {
        const postData = `q=${encodeURIComponent(query)}&pageno=1&categories=general&time_range=&language=auto&safesearch=0`;
        
        const options = {
            hostname: 'search.ackersweldon.com',
            port: 443,
            path: '/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    // Parse the results using the same logic as the enhanced KYC
                    const results = parseSearXNGResults(data, query);
                    resolve(results);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

function parseSearXNGResults(html, query) {
    const results = [];
    
    try {
        // Look for result articles
        const resultArticles = html.match(/<article[^>]*class="[^"]*result[^"]*"[^>]*>[\s\S]*?<\/article>/g);
        
        if (resultArticles) {
            console.log(`Found ${resultArticles.length} result articles`);
            
            resultArticles.forEach((article, index) => {
                const result = parseResultArticle(article, index, query);
                if (result) {
                    results.push(result);
                }
            });
        }
    } catch (error) {
        console.error('Parsing error:', error);
    }

    return results;
}

function parseResultArticle(article, index, query) {
    try {
        // Extract URL and title
        const urlMatch = article.match(/<a[^>]*href="([^"]*)"[^>]*class="url_header"[^>]*>/);
        const titleMatch = article.match(/<h3[^>]*>.*?<a[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>/);
        const contentMatch = article.match(/<p[^>]*class="content"[^>]*>([^<]+)<\/p>/);
        
        if (!urlMatch || !titleMatch) return null;

        const url = urlMatch[1];
        const title = titleMatch[1].trim();
        const content = contentMatch ? contentMatch[1].trim() : '';

        return {
            id: `test-${index + 1}`,
            title: title,
            url: url.startsWith('http') ? url : `https://${url}`,
            content: content,
            category: categorizeResult(title, query),
            relevanceScore: calculateRelevanceScore(title, query)
        };
    } catch (error) {
        console.error(`Error parsing article ${index}:`, error);
        return null;
    }
}

function categorizeResult(title, query) {
    const text = title.toLowerCase();
    
    if (text.includes('linkedin') || text.includes('profile')) return 'person';
    if (text.includes('company') || text.includes('inc') || text.includes('corp')) return 'company';
    if (text.includes('address') || text.includes('location')) return 'location';
    
    return 'general';
}

function calculateRelevanceScore(title, query) {
    let score = 0;
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes(queryLower)) score += 50;
    if (titleLower.includes('linkedin')) score += 30;
    if (titleLower.includes('profile')) score += 20;
    
    return Math.min(score, 100);
}

async function main() {
    console.log('🧪 Testing Enhanced KYC with SearXNG\n');
    
    const testQueries = [
        'John Smith LinkedIn',
        'Apple Inc company',
        'Microsoft Corporation'
    ];

    for (const query of testQueries) {
        console.log(`🔍 Testing: "${query}"`);
        
        try {
            const results = await testKYCSearch(query);
            
            if (results && results.length > 0) {
                console.log(`✅ Found ${results.length} results`);
                
                results.slice(0, 3).forEach((result, index) => {
                    console.log(`  ${index + 1}. ${result.title}`);
                    console.log(`     URL: ${result.url}`);
                    console.log(`     Category: ${result.category}`);
                    console.log(`     Relevance: ${result.relevanceScore}`);
                    console.log('');
                });
            } else {
                console.log('❌ No results found');
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log('---\n');
    }
    
    console.log('🎯 Test completed!');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    testKYCSearch,
    parseSearXNGResults,
    parseResultArticle
};
