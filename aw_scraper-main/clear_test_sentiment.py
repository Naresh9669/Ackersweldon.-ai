#!/usr/bin/env python3
"""
Script to clear the specific test sentiment record from the database
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

def clear_test_sentiment():
    """Clear the specific test sentiment record"""
    
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
    
    # Clear the specific test sentiment record
    try:
        # Find and remove the test sentiment record
        result = db.news_metadata.update_many(
            {
                "ai_sentiment_reasoning": {
                    "$regex": "the presence of 'love' and 'amazing product' indicate a strong positive emotion"
                }
            },
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
        
        print(f"✅ Cleared test sentiment record: {result.modified_count} document(s) updated")
        
        # Also clear any other test records that might have similar test content
        test_result = db.news_metadata.update_many(
            {
                "$or": [
                    {"ai_sentiment_reasoning": {"$regex": "love.*amazing product"}},
                    {"ai_sentiment_reasoning": {"$regex": "test.*sentiment"}},
                    {"ai_sentiment_reasoning": {"$regex": "I love this amazing product"}}
                ]
            },
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
        
        if test_result.modified_count > 0:
            print(f"✅ Also cleared {test_result.modified_count} additional test records")
        
    except Exception as e:
        print(f"Error clearing test sentiment: {e}")
    
    finally:
        client.close()

if __name__ == "__main__":
    print("🧹 Clearing test sentiment record...")
    clear_test_sentiment()
    print("✨ Done!")
