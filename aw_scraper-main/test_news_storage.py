#!/usr/bin/env python3
"""
Test script to verify news storage with error handling
"""

import sys
import os
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_news_storage():
    try:
        print("Testing news storage with error handling...")
        
        # Import the updated news fetcher
        from services.news_fetcher import NewsFetcherService
        
        # Create a news fetcher instance
        fetcher = NewsFetcherService()
        
        # Test with some sample news items
        test_news = [
            {
                'title': 'Test News Article 1',
                'summary': 'This is a test news article to verify storage works.',
                'url': 'https://example.com/test1',
                'published_at': '2025-08-23T01:00:00Z',
                'source': 'test',
                'api_source': 'test',
                'category': 'test'
            },
            {
                'title': 'Test News Article 2',
                'summary': 'This is another test news article.',
                'url': 'https://example.com/test2',
                'published_at': '2025-08-23T01:00:00Z',
                'source': 'test',
                'api_source': 'test',
                'category': 'test'
            }
        ]
        
        print(f"Attempting to store {len(test_news)} test articles...")
        
        # Try to store the news
        stored_count = fetcher.store_news_in_database(test_news)
        
        print(f"Successfully stored {stored_count} articles")
        
        # Check if they're in the database
        from pymongo import MongoClient
        client = MongoClient('mongodb://localhost:27017/')
        db = client['dashboard_db']
        
        count = db.news_metadata.count_documents({})
        print(f"Total articles in database: {count}")
        
        # Show recent articles
        recent = list(db.news_metadata.find().sort('created_at', -1).limit(5))
        print(f"Recent articles:")
        for article in recent:
            print(f"  - {article.get('title', 'No title')} (AI processed: {article.get('ai_processed', 'Unknown')})")
        
        return 0
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = test_news_storage()
    sys.exit(exit_code)

