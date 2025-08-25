"""
News Fetcher Service
Automatically fetches news from multiple sources and stores metadata in database
"""

import os
import requests
import asyncio
from datetime import datetime, timedelta
from pymongo import MongoClient
# Environment variables loaded by main application
import time
import logging
import feedparser
from urllib.parse import urlparse
import hashlib
import re
import urllib3
from services.ai_proxy import AIProxyService
from typing import List, Dict, Any, Optional
from returns.result import Result, Success, Failure, safe
from returns.pipeline import flow
from returns.pointfree import bind, map_

# Suppress SSL warnings for SearXNG
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Add retry logic and better error handling
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Load environment variables from consolidated .env
# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv('/home/ubuntu/.env')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NewsFetcherService:
    def __init__(self):
        self.mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
        self.client = MongoClient(self.mongo_uri)
        self.db = self.client['dashboard_db']
        self.alpha_vantage_key = os.getenv('ALPHA_VANTAGE_API_KEY', '')
        self.newsapi_key = os.getenv('NEWSAPI_KEY')
        self.searx_url = os.getenv("SEARX_BASE_URL", "https://search.ackersweldon.com")
        
        # Log environment variable status
        logger.info(f"Environment check - Alpha Vantage: {'✅' if self.alpha_vantage_key else '❌'}")
        logger.info(f"Environment check - NewsAPI: {'✅' if self.newsapi_key else '❌'}")
        logger.info(f"Environment check - SearXNG: {self.searx_url}")
        
        # Initialize AI service
        self.ai_service = AIProxyService()
        
        # Setup retry session with exponential backoff
        self.session = self._create_retry_session()
        
        # RSS feeds configuration
        self.rss_feeds = [
            {
                'name': 'TechCrunch',
                'url': 'https://techcrunch.com/feed/',
                'category': 'technology'
            },
            {
                'name': 'BBC Technology',
                'url': 'https://feeds.bbci.co.uk/news/technology/rss.xml',
                'category': 'technology'
            },
            {
                'name': 'Reuters Business',
                'url': 'https://feeds.reuters.com/reuters/businessNews',
                'category': 'business'
            },
            {
                'name': 'CNN Business',
                'url': 'https://rss.cnn.com/rss/money_latest.rss',
                'category': 'business'
            }
        ]
    
    def _create_retry_session(self):
        """Create a requests session with retry logic and exponential backoff"""
        session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=3,  # Maximum 3 retries
            status_forcelist=[429, 500, 502, 503, 504],  # Retry on these status codes
            allowed_methods=["HEAD", "GET", "OPTIONS"],  # Only retry safe methods
            backoff_factor=1,  # Exponential backoff: 1, 2, 4 seconds
        )
        
        # Mount adapter with retry strategy
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # Set default timeout
        session.timeout = 15
        
        return session
        
    def fetch_alpha_vantage_news(self, topics=None):
        """Fetch financial news from Alpha Vantage with retry logic"""
        if not self.alpha_vantage_key:
            logger.warning("Alpha Vantage API key not found")
            return []
            
        topics = topics or ['FOREX', 'CRYPTO', 'STOCKS', 'ECONOMY']
        all_news = []
        
        for topic in topics:
            try:
                url = "https://www.alphavantage.co/query"
                params = {
                    'function': 'NEWS_SENTIMENT',
                    'topics': topic,
                    'apikey': self.alpha_vantage_key,
                    'limit': 50
                }
                
                # Use retry session with exponential backoff
                response = self.session.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    if 'feed' in data:
                        for article in data['feed']:
                            news_item = {
                                'title': article.get('title', ''),
                                'summary': article.get('summary', ''),
                                'source': article.get('source', 'Alpha Vantage'),
                                'published_at': article.get('time_published', ''),
                                'url': article.get('url', ''),
                                'sentiment_score': article.get('overall_sentiment_score', 0),
                                'sentiment_label': article.get('overall_sentiment_label', ''),
                                'category': 'financial',
                                'topic': topic.lower(),
                                'api_source': 'alpha_vantage',
                                'fetched_at': datetime.now().isoformat(),
                                'relevance_score': article.get('relevance_score', 0)
                            }
                            all_news.append(news_item)
                            
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                logger.error(f"Error fetching Alpha Vantage news for {topic}: {e}")
                
        return all_news
    
    def fetch_newsapi_news(self, categories=None):
        """Fetch news from NewsAPI with best practices"""
        if not self.newsapi_key:
            logger.warning("NewsAPI key not found")
            return []
            
        categories = categories or ['business', 'technology', 'science', 'health']
        all_news = []
        
        # Rate limiting: 1 request per second to respect API limits
        for i, category in enumerate(categories):
            try:
                # Add delay between requests to respect rate limits
                if i > 0:
                    time.sleep(1)
                url = "https://newsapi.org/v2/top-headlines"
                params = {
                    'country': 'us',
                    'category': category,
                    'apiKey': self.newsapi_key,
                    'pageSize': 50
                }
                
                # Use retry session with exponential backoff
                response = self.session.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    if 'articles' in data:
                        for article in data['articles']:
                            news_item = {
                                'title': article.get('title', ''),
                                'summary': article.get('description', ''),
                                'source': article.get('source', {}).get('name', 'NewsAPI'),
                                'published_at': article.get('publishedAt', ''),
                                'url': article.get('url', ''),
                                'category': category,
                                'api_source': 'newsapi',
                                'fetched_at': datetime.now().isoformat(),
                                'relevance_score': 0.5
                            }
                            all_news.append(news_item)
                            
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                logger.error(f"Error fetching NewsAPI news for {category}: {e}")
                
        return all_news
    
    def fetch_searx_news(self, topics=None):
        """Fetch news from SearXNG"""
        topics = topics or ['technology news', 'business news', 'science news', 'crypto news']
        all_news = []
        
        for topic in topics:
            try:
                url = f"{self.searx_url.rstrip('/')}/search"
                params = {
                    'q': topic,
                    'format': 'json',
                    'categories': 'news',
                    'time_range': 'day',
                    'language': 'en'
                }
                
                # Use retry session with SSL verification disabled
                response = self.session.get(url, params=params, verify=False)
                if response.status_code == 200:
                    data = response.json()
                    if 'results' in data:
                        for result in data['results'][:10]:  # Limit to 10 per topic
                            news_item = {
                                'title': result.get('title', ''),
                                'summary': result.get('content', ''),
                                'source': result.get('engines', ['SearXNG'])[0],
                                'published_at': result.get('publishedDate', ''),
                                'url': result.get('url', ''),
                                'category': 'general',
                                'topic': topic,
                                'api_source': 'searxng',
                                'fetched_at': datetime.now().isoformat(),
                                'relevance_score': result.get('score', 0)
                            }
                            all_news.append(news_item)
                            
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                logger.error(f"Error fetching SearXNG news for {topic}: {e}")
                
        return all_news
    
    def fetch_crypto_news(self):
        """Fetch cryptocurrency news from multiple sources"""
        crypto_news = []
        
        # CryptoCompare API (free tier)
        try:
            url = "https://min-api.cryptocompare.com/data/v2/news/?lang=EN"
            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                data = response.json()
                if 'Data' in data:
                    for article in data['Data'][:15]:
                        news_item = {
                            'title': article.get('title', ''),
                            'summary': article.get('body', ''),
                            'source': article.get('source', 'CryptoCompare'),
                            'published_at': datetime.fromtimestamp(article.get('published_on', 0)).isoformat(),
                            'url': article.get('url', ''),
                            'category': 'cryptocurrency',
                            'topic': 'crypto',
                            'api_source': 'cryptocompare',
                            'fetched_at': datetime.now().isoformat(),
                            'relevance_score': 0.8
                        }
                        crypto_news.append(news_item)
        except Exception as e:
            logger.error(f"Error fetching CryptoCompare news: {e}")
        
        return crypto_news
    
    def fetch_rss_news(self):
        """Fetch news from RSS feeds"""
        all_news = []
        
        for feed_config in self.rss_feeds:
            try:
                logger.info(f"Fetching RSS from {feed_config['name']}")
                
                # Parse RSS feed
                feed = feedparser.parse(feed_config['url'])
                
                for entry in feed.entries[:15]:  # Limit to 15 articles per feed
                    try:
                        # Create unique identifier
                        title_hash = hashlib.md5(entry.title.encode()).hexdigest()
                        source_hash = hashlib.md5(feed_config['name'].encode()).hexdigest()
                        unique_id = f"{title_hash}_{source_hash}"
                        
                        # Check if already exists
                        existing = self.db.news_metadata.find_one({'unique_id': unique_id})
                        if existing:
                            continue
                        
                        # Parse publication date
                        pub_date = datetime.now()
                        if hasattr(entry, 'published_parsed') and entry.published_parsed:
                            try:
                                pub_date = datetime(*entry.published_parsed[:6])
                            except:
                                pass
                        
                        # Extract summary
                        summary = ""
                        if hasattr(entry, 'summary'):
                            summary = entry.summary
                        elif hasattr(entry, 'description'):
                            summary = entry.description
                        
                        # Clean HTML tags from summary
                        summary = re.sub(r'<[^>]+>', '', summary)
                        
                        news_item = {
                            'title': entry.title,
                            'summary': summary[:500] if summary else '',  # Limit summary length
                            'source': feed_config['name'],
                            'published_at': pub_date.isoformat(),
                            'url': entry.link,
                            'category': feed_config['category'],
                            'topic': feed_config['category'],
                            'api_source': 'rss',
                            'fetched_at': datetime.now().isoformat(),
                            'relevance_score': 0.8,
                            'unique_id': unique_id,
                            'language': 'en'
                        }
                        
                        all_news.append(news_item)
                        
                    except Exception as e:
                        logger.error(f"Error processing RSS entry from {feed_config['name']}: {e}")
                        continue
                
                time.sleep(1)  # Rate limiting between feeds
                
            except Exception as e:
                logger.error(f"Error fetching RSS from {feed_config['name']}: {e}")
                continue
        
        logger.info(f"Fetched {len(all_news)} news items from RSS feeds")
        return all_news
    
    def fetch_hackernews_news(self):
        """Fetch top stories from Hacker News"""
        try:
            logger.info("Fetching Hacker News top stories")
            
            # Get top story IDs
            response = requests.get('https://hacker-news.firebaseio.com/v0/topstories.json', timeout=10)
            if response.status_code != 200:
                return []
            
            story_ids = response.json()[:20]  # Top 20 stories
            all_news = []
            
            for story_id in story_ids:
                try:
                    # Get story details
                    story_response = requests.get(f'https://hacker-news.firebaseio.com/v0/item/{story_id}.json', timeout=10)
                    if story_response.status_code != 200:
                        continue
                    
                    story = story_response.json()
                    
                    # Skip if no title or URL
                    if not story.get('title') or not story.get('url'):
                        continue
                    
                    # Create unique identifier
                    title_hash = hashlib.md5(story['title'].encode()).hexdigest()
                    unique_id = f"hn_{title_hash}"
                    
                    # Check if already exists
                    existing = self.db.news_metadata.find_one({'unique_id': unique_id})
                    if existing:
                        continue
                    
                    news_item = {
                        'title': story['title'],
                        'summary': f"Score: {story.get('score', 0)} | Comments: {story.get('descendants', 0)}",
                        'source': 'Hacker News',
                        'published_at': datetime.fromtimestamp(story.get('time', time.time())).isoformat(),
                        'url': story['url'],
                        'category': 'technology',
                        'topic': 'tech',
                        'api_source': 'hackernews',
                        'fetched_at': datetime.now().isoformat(),
                        'relevance_score': story.get('score', 0) / 100,  # Normalize score
                        'unique_id': unique_id,
                        'language': 'en'
                    }
                    
                    all_news.append(news_item)
                    time.sleep(0.1)  # Rate limiting
                    
                except Exception as e:
                    logger.error(f"Error processing Hacker News story {story_id}: {e}")
                    continue
            
            logger.info(f"Fetched {len(all_news)} news items from Hacker News")
            return all_news
            
        except Exception as e:
            logger.error(f"Error fetching Hacker News: {e}")
            return []
    
    def fetch_reddit_news(self):
        """Fetch news from Reddit subreddits"""
        try:
            logger.info("Fetching Reddit news")
            
            subreddits = ['technology', 'business', 'science', 'cryptocurrency']
            all_news = []
            
            for subreddit in subreddits:
                try:
                    # Use Reddit's JSON API
                    url = f'https://www.reddit.com/r/{subreddit}/hot.json?limit=10'
                    headers = {'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'}
                    
                    response = requests.get(url, headers=headers, timeout=15)
                    if response.status_code != 200:
                        continue
                    
                    data = response.json()
                    
                    for post in data['data']['children']:
                        post_data = post['data']
                        
                        # Skip if no title or URL
                        if not post_data.get('title') or not post_data.get('url'):
                            continue
                        
                        # Create unique identifier
                        title_hash = hashlib.md5(post_data['title'].encode()).hexdigest()
                        unique_id = f"reddit_{title_hash}"
                        
                        # Check if already exists
                        existing = self.db.news_metadata.find_one({'unique_id': unique_id})
                        if existing:
                            continue
                        
                        # Determine category based on subreddit
                        category_map = {
                            'technology': 'technology',
                            'business': 'business',
                            'science': 'science',
                            'cryptocurrency': 'cryptocurrency'
                        }
                        
                        news_item = {
                            'title': post_data['title'],
                            'summary': f"Score: {post_data.get('score', 0)} | Comments: {post_data.get('num_comments', 0)} | Subreddit: r/{subreddit}",
                            'source': f'Reddit r/{subreddit}',
                            'published_at': datetime.fromtimestamp(post_data.get('created_utc', time.time())).isoformat(),
                            'url': post_data['url'],
                            'category': category_map.get(subreddit, 'general'),
                            'topic': subreddit,
                            'api_source': 'reddit',
                            'fetched_at': datetime.now().isoformat(),
                            'relevance_score': post_data.get('score', 0) / 1000,  # Normalize score
                            'unique_id': unique_id,
                            'language': 'en'
                        }
                        
                        all_news.append(news_item)
                    
                    time.sleep(1)  # Rate limiting between subreddits
                    
                except Exception as e:
                    logger.error(f"Error fetching Reddit subreddit {subreddit}: {e}")
                    continue
            
            logger.info(f"Fetched {len(all_news)} news items from Reddit")
            return all_news
            
        except Exception as e:
            logger.error(f"Error fetching Reddit news: {e}")
            return []
    
    def store_news_in_database(self, news_items: List[Dict[str, Any]]) -> int:
        """Store news items with robust error handling and fallback"""
        if not news_items:
            return 0
            
        try:
            # Import the deduplicator from the main app
            from api_dashboard import news_deduplicator
            
            # Apply advanced deduplication before insertion
            unique_articles = news_deduplicator.deduplicate_before_insert(
                news_items, 
                title_window_hours=48
            )
            
            if not unique_articles:
                logger.info("All articles were duplicates - nothing to insert")
                return 0
                
            stored_count = 0
            
            for article in unique_articles:
                try:
                    # Process with AI if available, with fallback
                    processed_article = self._process_article_with_ai(article).value_or(article)
                    
                    # Store the article with error handling
                    if self._store_article_safely(processed_article).value_or(False):
                        stored_count += 1
                        
                except Exception as e:
                    logger.error(f"Error processing article {article.get('title', 'Unknown')}: {e}")
                    # Try to store without AI processing as fallback
                    try:
                        article['ai_processed'] = False
                        article['sentiment_score'] = 0
                        article['sentiment_label'] = 'neutral'
                        if self._store_article_safely(article).value_or(False):
                            stored_count += 1
                    except Exception as fallback_error:
                        logger.error(f"Fallback storage also failed for article {article.get('title', 'Unknown')}: {fallback_error}")
                        
            logger.info(f"Successfully stored {stored_count} out of {len(unique_articles)} unique articles")
            return stored_count
            
        except Exception as e:
            logger.error(f"Critical error in store_news_in_database: {e}")
            # Emergency fallback: try to store articles without any processing
            return self._emergency_store(news_items)
    
    def _emergency_store(self, news_items: List[Dict[str, Any]]) -> int:
        """Emergency fallback storage when main storage fails"""
        logger.warning("Using emergency fallback storage")
        stored_count = 0
        
        for article in news_items:
            try:
                # Minimal processing - just ensure required fields
                article['ai_processed'] = False
                article['sentiment_score'] = 0
                article['sentiment_label'] = 'neutral'
                article['created_at'] = datetime.utcnow()
                article['updated_at'] = datetime.utcnow()
                
                # Simple insert without deduplication
                result = self.db.news_metadata.insert_one(article)
                stored_count += 1
                logger.info(f"Emergency stored article: {article.get('title', 'Unknown')}")
                
            except Exception as e:
                logger.error(f"Emergency storage failed for article {article.get('title', 'Unknown')}: {e}")
                
        return stored_count
    
    @safe
    def _process_article_with_ai(self, article: Dict[str, Any]) -> Dict[str, Any]:
        """Process article with AI service, with proper error handling"""
        try:
            if not self.ai_service:
                logger.warning("AI service not available, skipping AI processing")
                return article
                
            # Ensure we have valid content for AI processing
            content_for_sentiment = article.get('summary') or article.get('title') or 'No content available'
            if not content_for_sentiment or len(str(content_for_sentiment).strip()) == 0:
                logger.warning(f"Article {article.get('title', 'Unknown')} has no content for AI processing")
                return article
                
            # Process with AI sentiment analysis
            sentiment_result = self.ai_service.analyze_sentiment(content_for_sentiment)
            
            if 'error' not in sentiment_result:
                # Convert sentiment to numeric value
                sentiment_score = self._convert_sentiment_to_score(sentiment_result.get('sentiment', 'neutral'))
                article['sentiment_score'] = sentiment_score
                article['sentiment_label'] = sentiment_result.get('sentiment', 'neutral')
                article['ai_processed'] = True
            else:
                logger.warning(f"AI sentiment analysis failed for article {article.get('title', 'Unknown')}: {sentiment_result.get('error')}")
                article['ai_processed'] = False
                article['sentiment_score'] = 0
                article['sentiment_label'] = 'neutral'
                
        except Exception as e:
            logger.error(f"Error in AI processing for article {article.get('title', 'Unknown')}: {e}")
            article['ai_processed'] = False
            article['sentiment_score'] = 0
            article['sentiment_label'] = 'neutral'
            
        return article
    
    @safe
    def _store_article_safely(self, article: Dict[str, Any]) -> bool:
        """Store a single article with error handling"""
        try:
            # Create a unique identifier
            title_hash = hashlib.md5(article.get('title', '').lower().encode()).hexdigest()
            source_hash = hashlib.md5(article.get('source', '').lower().encode()).hexdigest()
            unique_id = f"{title_hash}_{source_hash}"
            
            # Check if news already exists
            existing = self.db.news_metadata.find_one({'unique_id': unique_id})
            
            if not existing:
                # Add basic fields
                article['unique_id'] = unique_id
                article['created_at'] = datetime.utcnow()
                article['updated_at'] = datetime.utcnow()
                
                # Insert the article
                result = self.db.news_metadata.insert_one(article)
                logger.info(f"Stored article: {article.get('title', 'Unknown')} with ID: {result.inserted_id}")
                return True
            else:
                logger.debug(f"Article already exists: {article.get('title', 'Unknown')}")
                return False
                
        except Exception as e:
            logger.error(f"Error storing article {article.get('title', 'Unknown')}: {e}")
            return False
    
    def _convert_sentiment_to_score(self, sentiment: str) -> float:
        """Convert sentiment label to a numeric score."""
        if sentiment == 'positive':
            return 0.8
        elif sentiment == 'negative':
            return -0.8
        else:
            return 0.0
    
    def fetch_all_news(self):
        """Fetch news from all sources and store in database with enhanced error handling"""
        logger.info("Starting news fetch from all sources...")
        
        all_news = []
        source_results = {}
        
        # Fetch from all sources with individual error handling
        try:
            alpha_news = self.fetch_alpha_vantage_news()
            all_news.extend(alpha_news)
            source_results['alpha_vantage'] = len(alpha_news)
            logger.info(f"✅ Alpha Vantage: {len(alpha_news)} articles")
        except Exception as e:
            logger.error(f"❌ Alpha Vantage failed: {e}")
            source_results['alpha_vantage'] = 0
        
        try:
            newsapi_news = self.fetch_newsapi_news()
            all_news.extend(newsapi_news)
            source_results['newsapi'] = len(newsapi_news)
            logger.info(f"✅ NewsAPI: {len(newsapi_news)} articles")
        except Exception as e:
            logger.error(f"❌ NewsAPI failed: {e}")
            source_results['newsapi'] = 0
        
        try:
            searx_news = self.fetch_searx_news()
            all_news.extend(searx_news)
            source_results['searxng'] = len(searx_news)
            logger.info(f"✅ SearXNG: {len(searx_news)} articles")
        except Exception as e:
            logger.error(f"❌ SearXNG failed: {e}")
            source_results['searxng'] = 0
        
        try:
            crypto_news = self.fetch_crypto_news()
            all_news.extend(crypto_news)
            source_results['cryptocompare'] = len(crypto_news)
            logger.info(f"✅ CryptoCompare: {len(crypto_news)} articles")
        except Exception as e:
            logger.error(f"❌ CryptoCompare failed: {e}")
            source_results['cryptocompare'] = 0
        
        try:
            rss_news = self.fetch_rss_news()
            all_news.extend(rss_news)
            source_results['rss'] = len(rss_news)
            logger.info(f"✅ RSS Feeds: {len(rss_news)} articles")
        except Exception as e:
            logger.error(f"❌ RSS Feeds failed: {e}")
            source_results['rss'] = 0
        
        try:
            hn_news = self.fetch_hackernews_news()
            all_news.extend(hn_news)
            source_results['hackernews'] = len(hn_news)
            logger.info(f"✅ Hacker News: {len(hn_news)} articles")
        except Exception as e:
            logger.error(f"❌ Hacker News failed: {e}")
            source_results['hackernews'] = 0
        
        try:
            reddit_news = self.fetch_reddit_news()
            all_news.extend(reddit_news)
            source_results['reddit'] = len(reddit_news)
            logger.info(f"✅ Reddit: {len(reddit_news)} articles")
        except Exception as e:
            logger.error(f"❌ Reddit failed: {e}")
            source_results['reddit'] = 0
        
        # Log summary of all sources
        logger.info("📊 News Fetch Summary:")
        for source, count in source_results.items():
            logger.info(f"  {source}: {count} articles")
        
        logger.info(f"Total fetched: {len(all_news)} news items from all sources")
        
        # Store in database
        stored_count = self.store_news_in_database(all_news)
        logger.info(f"Stored {stored_count} new news items in database")
        
        return stored_count
    
    def get_latest_news(self, limit=50, category=None, source=None):
        """Retrieve latest news from database"""
        query = {}
        
        if category:
            query['category'] = category
        if source:
            query['api_source'] = source
            
        cursor = self.db.news_metadata.find(query).sort('published_at', -1).limit(limit)
        
        news_list = []
        for news in cursor:
            news['_id'] = str(news['_id'])
            news_list.append(news)
            
        return news_list

# Global instance
news_fetcher = NewsFetcherService()
