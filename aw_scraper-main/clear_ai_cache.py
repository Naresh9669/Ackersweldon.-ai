#!/usr/bin/env python3
"""
Script to clear old cached AI sentiment results from the database
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

def clear_ai_cache():
    """Clear old cached AI sentiment results"""
    
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
    
    # Clear old AI sentiment cache
    try:
        # Find documents with old failed AI sentiment results
        old_results = db.news_metadata.find({
            "$or": [
                {"ai_sentiment_reasoning": "Analysis failed"},
                {"ai_sentiment_reasoning": "JSON parsing failed"},
                {"ai_sentiment_reasoning": "No reasoning provided"}
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
                print(f"Cleared AI cache for article: {doc.get('title', 'Unknown')[:50]}...")
        
        print(f"\n✅ Successfully cleared AI cache for {count} articles")
        
        # Also clear any AI summary cache that might be broken
        summary_count = 0
        summary_results = db.news_metadata.find({
            "$or": [
                {"ai_summary": {"$regex": "failed"}},
                {"ai_summary": {"$regex": "error"}},
                {"ai_summary": {"$regex": "Analysis failed"}}
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
        
    except Exception as e:
        print(f"Error clearing cache: {e}")
    
    finally:
        client.close()

if __name__ == "__main__":
    print("🧹 Clearing old AI sentiment cache...")
    clear_ai_cache()
    print("✨ Done!")
