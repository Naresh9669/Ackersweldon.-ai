#!/usr/bin/env python3
"""
Script to clear old messy AI sentiment cache entries from the database
"""

import os
import sys
from pathlib import Path

# Add the root directory to Python path to access the consolidated .env
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir))

# Load environment variables from the root .env file in user's home directory
from dotenv import load_dotenv
load_dotenv('/home/ubuntu/.env')

from pymongo import MongoClient
from datetime import datetime

def clear_old_sentiment_cache():
    """Clear old messy AI sentiment cache entries"""
    
    # MongoDB connection
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    try:
        client = MongoClient(MONGO_URI)
        db = client['dashboard_db']
        # Test connection
        client.admin.command('ping')
        print("MongoDB connected successfully")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        # Fallback to local connection without auth
        client = MongoClient('mongodb://localhost:27017/')
        db = client['dashboard_db']
        print("Using fallback MongoDB connection")
    
    # Clear old messy AI sentiment cache
    try:
        # Find documents with old messy AI sentiment results
        old_results = db.news_metadata.find({
            "$or": [
                {"ai_sentiment_reasoning": {"$regex": "Extracted from text:"}},
                {"ai_sentiment_reasoning": {"$regex": "Could not parse JSON"}},
                {"ai_sentiment_reasoning": {"$regex": "Partial analysis"}},
                {"ai_sentiment_reasoning": {"$regex": "JSON parsing failed"}},
                {"ai_sentiment_reasoning": {"$regex": "Analysis failed"}},
                {"ai_sentiment_reasoning": {"$regex": "No reasoning provided"}},
                {"ai_sentiment_reasoning": {"$regex": "Extracted from text after"}},
                {"ai_sentiment_reasoning": {"$regex": "Could not extract sentiment"}}
            ]
        })
        
        count = 0
        for doc in old_results:
            # Remove the old AI sentiment fields
            result = db.news_metadata.update_one(
                {"_id": doc["_id"]},
                {
                    "$unset": {
                        "ai_sentiment": "",
                        "ai_sentiment_confidence": "",
                        "ai_sentiment_reasoning": "",
                        "ai_sentiment_model": "",
                        "ai_sentiment_created_at": ""
                    }
                }
            )
            if result.modified_count > 0:
                count += 1
                print(f"Cleared messy AI sentiment cache for article: {doc.get('title', 'Unknown')[:50]}...")
                if doc.get('ai_sentiment_reasoning'):
                    print(f"  Old reasoning: {doc['ai_sentiment_reasoning'][:100]}...")
        
        print(f"\n✅ Successfully cleared messy AI sentiment cache for {count} articles")
        
        # Also clear any AI summary cache that might be broken
        summary_count = 0
        summary_results = db.news_metadata.find({
            "$or": [
                {"ai_summary": {"$regex": "failed"}},
                {"ai_summary": {"$regex": "error"}},
                {"ai_summary": {"$regex": "Analysis failed"}},
                {"ai_summary": {"$regex": "JSON parsing failed"}},
                {"ai_summary": {"$regex": "Extracted from text"}}
            ]
        })
        
        for doc in summary_results:
            result = db.news_metadata.update_one(
                {"_id": doc["_id"]},
                {
                    "$unset": {
                        "ai_summary": "",
                        "ai_summary_model": "",
                        "ai_summary_created_at": ""
                    }
                }
            )
            if result.modified_count > 0:
                summary_count += 1
        
        if summary_count > 0:
            print(f"✅ Also cleared {summary_count} broken AI summary cache entries")
        
        # Check if there are any remaining messy entries
        remaining_messy = db.news_metadata.count_documents({
            "$or": [
                {"ai_sentiment_reasoning": {"$regex": "Extracted from text:"}},
                {"ai_sentiment_reasoning": {"$regex": "Could not parse JSON"}},
                {"ai_sentiment_reasoning": {"$regex": "Analysis failed"}}
            ]
        })
        
        if remaining_messy == 0:
            print("✅ All messy sentiment cache entries have been cleared!")
        else:
            print(f"⚠️  {remaining_messy} messy entries still remain - may need manual cleanup")
        
    except Exception as e:
        print(f"Error clearing cache: {e}")
    
    finally:
        client.close()

if __name__ == "__main__":
    print("🧹 Clearing old messy AI sentiment cache...")
    clear_old_sentiment_cache()
    print("✨ Done!")
