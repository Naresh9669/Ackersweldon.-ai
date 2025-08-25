#!/usr/bin/env python3
"""
News Fetching Cron Script
Run this script periodically to automatically fetch news from all sources
"""

import sys
import os
import logging
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/news_fetch.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def main():
    try:
        logger.info("Starting automatic news fetch...")
        
        # Import and initialize news fetcher
        from services.news_fetcher import news_fetcher
        
        # Fetch news from all sources
        stored_count = news_fetcher.fetch_all_news()
        
        logger.info(f"Successfully fetched and stored {stored_count} news items")
        
        # Note: Cleanup removed - keeping all news articles for historical data
        logger.info("News fetch completed - no cleanup performed (keeping all articles)")
        
        logger.info("News fetch completed successfully")
        return 0
        
    except Exception as e:
        logger.error(f"Error during news fetch: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
