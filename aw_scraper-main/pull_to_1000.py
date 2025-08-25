#!/usr/bin/env python3
"""
Script to pull new articles until we reach 1000 articles in the database
"""

import sys
import os
import time
import requests
from pymongo import MongoClient

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def pull_to_1000():
    try:
        print("Connecting to MongoDB...")
        
        # Connect to MongoDB
        client = MongoClient('mongodb://localhost:27017/')
        db = client['dashboard_db']
        
        print("Connected to MongoDB successfully")
        
        target_count = 1000
        current_count = db.news_metadata.count_documents({})
        
        print(f"Current articles in database: {current_count}")
        print(f"Target: {target_count} articles")
        print(f"Need to add: {target_count - current_count} articles")
        
        if current_count >= target_count:
            print("✅ Already have 1000+ articles! No need to pull more.")
            return 0
        
        # Import and initialize news fetcher
        from services.news_fetcher import NewsFetcherService
        news_fetcher = NewsFetcherService()
        
        rounds = 0
        max_rounds = 20  # Prevent infinite loops
        
        while current_count < target_count and rounds < max_rounds:
            rounds += 1
            print(f"\n🔄 Round {rounds}: Pulling new articles...")
            
            # Trigger news fetch via API
            try:
                response = requests.post('http://127.0.0.1:5001/api/trigger-news-fetch', 
                                      headers={'Content-Type': 'application/json'})
                
                if response.ok:
                    print("✅ Backend news fetch triggered")
                    
                    # Wait for processing
                    print("⏳ Waiting for articles to be processed...")
                    time.sleep(10)  # Wait 10 seconds for processing
                    
                    # Check new count
                    new_count = db.news_metadata.count_documents({})
                    added = new_count - current_count
                    
                    if added > 0:
                        print(f"✅ Added {added} new articles")
                        print(f"📊 Total articles now: {new_count}")
                        current_count = new_count
                    else:
                        print("⚠️ No new articles added in this round")
                        
                        # Try direct fetch as fallback
                        print("🔄 Trying direct news fetch...")
                        try:
                            stored_count = news_fetcher.fetch_all_news()
                            print(f"✅ Direct fetch stored {stored_count} articles")
                            
                            # Check count again
                            new_count = db.news_metadata.count_documents({})
                            added = new_count - current_count
                            if added > 0:
                                print(f"✅ Direct fetch added {added} articles")
                                current_count = new_count
                            else:
                                print("⚠️ Direct fetch also didn't add articles")
                        except Exception as e:
                            print(f"❌ Direct fetch failed: {e}")
                    
                else:
                    print(f"❌ Backend API failed: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Error triggering news fetch: {e}")
            
            # Progress update
            progress = (current_count / target_count) * 100
            print(f"📈 Progress: {current_count}/{target_count} ({progress:.1f}%)")
            
            # If we're close, wait a bit longer
            if current_count >= target_count * 0.9:  # 90% there
                print("🎯 Almost there! Waiting a bit longer...")
                time.sleep(15)
            
            # Don't overwhelm the system
            time.sleep(5)
        
        # Final status
        final_count = db.news_metadata.count_documents({})
        print(f"\n🎉 Final Results:")
        print(f"📊 Total articles: {final_count}")
        print(f"🎯 Target reached: {'✅' if final_count >= target_count else '❌'}")
        
        if final_count >= target_count:
            print("🎊 Successfully reached 1000+ articles!")
        else:
            print(f"⚠️ Stopped at {final_count} articles after {rounds} rounds")
        
        # Show some recent articles
        print(f"\n📰 Recent articles:")
        recent = list(db.news_metadata.find().sort('fetched_at', -1).limit(5))
        for article in recent:
            print(f"  - {article.get('title', 'No title')} (Source: {article.get('api_source', 'Unknown')})")
        
        return 0
        
    except Exception as e:
        print(f"Error in pull_to_1000: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = pull_to_1000()
    sys.exit(exit_code)
