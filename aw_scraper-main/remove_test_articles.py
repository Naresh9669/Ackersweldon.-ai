#!/usr/bin/env python3
"""
Script to remove test articles from the database
"""

import sys
import os
from pymongo import MongoClient

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def remove_test_articles():
    try:
        print("Connecting to MongoDB...")
        
        # Connect to MongoDB
        client = MongoClient('mongodb://localhost:27017/')
        db = client['dashboard_db']
        
        print("Connected to MongoDB successfully")
        
        # Find and remove test articles
        test_articles = db.news_metadata.find({'api_source': 'test'})
        test_count = db.news_metadata.count_documents({'api_source': 'test'})
        
        print(f"Found {test_count} test articles to remove")
        
        if test_count > 0:
            # Remove all test articles
            result = db.news_metadata.delete_many({'api_source': 'test'})
            print(f"Removed {result.deleted_count} test articles")
            
            # Verify removal
            remaining_test = db.news_metadata.count_documents({'api_source': 'test'})
            print(f"Remaining test articles: {remaining_test}")
            
            # Show remaining articles
            total_articles = db.news_metadata.count_documents({})
            print(f"Total articles in database: {total_articles}")
            
            if total_articles > 0:
                print("\nRemaining articles:")
                remaining = list(db.news_metadata.find().limit(5))
                for article in remaining:
                    print(f"  - {article.get('title', 'No title')} (Source: {article.get('api_source', 'Unknown')})")
        else:
            print("No test articles found to remove")
            
        return 0
        
    except Exception as e:
        print(f"Error removing test articles: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = remove_test_articles()
    sys.exit(exit_code)
