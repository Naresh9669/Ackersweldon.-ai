#!/usr/bin/env python3
"""
Database Deduplication Script
Runs deduplication on existing news articles in the database
"""

import os
import sys
from pathlib import Path

# Add the root directory to Python path
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir))

from dotenv import load_dotenv
load_dotenv('/home/ubuntu/.env')

from pymongo import MongoClient
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DatabaseDeduplicator:
    def __init__(self):
        # MongoDB connection
        MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
        try:
            self.client = MongoClient(MONGO_URI)
            self.db = self.client['dashboard_db']
            # Test connection
            self.client.admin.command('ping')
            logger.info("MongoDB connected successfully")
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            # Fallback to local connection
            self.client = MongoClient('mongodb://localhost:27017/')
            self.db = self.client['dashboard_db']
            logger.info("Using fallback MongoDB connection")
        
        # Initialize deduplicator
        from api_dashboard import NewsDeduplicator
        self.deduplicator = NewsDeduplicator(self.db)
    
    def get_all_articles(self):
        """Get all articles from the database"""
        try:
            articles = list(self.db.news_metadata.find({}))
            logger.info(f"Found {len(articles)} total articles in database")
            return articles
        except Exception as e:
            logger.error(f"Error fetching articles: {e}")
            return []
    
    def run_deduplication(self):
        """Run deduplication on existing database"""
        logger.info("Starting database deduplication...")
        
        # Get all articles
        all_articles = self.get_all_articles()
        if not all_articles:
            logger.warning("No articles found in database")
            return
        
        # Convert MongoDB documents to dictionaries for processing
        articles_dicts = []
        for article in all_articles:
            # Convert ObjectId to string for processing
            article['_id'] = str(article['_id'])
            articles_dicts.append(article)
        
        logger.info(f"Processing {len(articles_dicts)} articles for deduplication...")
        
        # Apply deduplication
        try:
            unique_articles = self.deduplicator.deduplicate_before_insert(
                articles_dicts, 
                title_window_hours=48
            )
            
            logger.info(f"Deduplication completed!")
            logger.info(f"Original articles: {len(articles_dicts)}")
            logger.info(f"Unique articles after dedup: {len(unique_articles)}")
            logger.info(f"Duplicates removed: {len(articles_dicts) - len(unique_articles)}")
            logger.info(f"Deduplication ratio: {((len(articles_dicts) - len(unique_articles)) / len(articles_dicts) * 100):.1f}%")
            
            # Show some examples of what was deduplicated
            if len(articles_dicts) > len(unique_articles):
                logger.info("Sample of duplicate articles that were removed:")
                # Find some examples of duplicates
                self.show_duplicate_examples(articles_dicts, unique_articles)
            
            return len(unique_articles)
            
        except Exception as e:
            logger.error(f"Error during deduplication: {e}")
            return None
    
    def show_duplicate_examples(self, original_articles, unique_articles):
        """Show examples of duplicate articles that were removed"""
        try:
            # Get titles from unique articles
            unique_titles = set()
            for article in unique_articles:
                if 'title' in article:
                    unique_titles.add(article['title'].lower().strip())
            
            # Find some examples of duplicates
            duplicate_examples = []
            seen_titles = set()
            
            for article in original_articles:
                if 'title' in article:
                    title = article['title'].lower().strip()
                    if title in seen_titles and title not in unique_titles:
                        duplicate_examples.append(article)
                        if len(duplicate_examples) >= 3:  # Show max 3 examples
                            break
                    seen_titles.add(title)
            
            for i, example in enumerate(duplicate_examples, 1):
                logger.info(f"  Example {i}: {example.get('title', 'No title')} (Source: {example.get('source', 'Unknown')})")
                
        except Exception as e:
            logger.error(f"Error showing duplicate examples: {e}")
    
    def cleanup_database(self):
        """Clean up the database by removing duplicates and keeping only unique articles"""
        logger.info("Starting database cleanup...")
        
        try:
            # Get current count
            before_count = self.db.news_metadata.count_documents({})
            logger.info(f"Articles before cleanup: {before_count}")
            
            # Create a temporary collection for unique articles
            temp_collection_name = f"news_metadata_clean_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            temp_collection = self.db[temp_collection_name]
            
            # Get all articles and deduplicate
            all_articles = self.get_all_articles()
            articles_dicts = []
            for article in all_articles:
                article['_id'] = str(article['_id'])
                articles_dicts.append(article)
            
            # Apply deduplication
            unique_articles = self.deduplicator.deduplicate_before_insert(
                articles_dicts, 
                title_window_hours=48
            )
            
            # Insert unique articles into temporary collection
            if unique_articles:
                # Remove _id field to avoid conflicts
                for article in unique_articles:
                    if '_id' in article:
                        del article['_id']
                
                temp_collection.insert_many(unique_articles)
                logger.info(f"Inserted {len(unique_articles)} unique articles into temporary collection")
                
                # Replace original collection with clean one
                self.db.news_metadata.drop()
                temp_collection.rename('news_metadata')
                
                after_count = self.db.news_metadata.count_documents({})
                logger.info(f"Articles after cleanup: {after_count}")
                logger.info(f"Removed {before_count - after_count} duplicate articles")
                
                # Recreate indexes
                self.recreate_indexes()
                
                return True
            else:
                logger.warning("No unique articles found after deduplication")
                return False
                
        except Exception as e:
            logger.error(f"Error during database cleanup: {e}")
            return False
    
    def recreate_indexes(self):
        """Recreate the deduplication indexes"""
        try:
            logger.info("Recreating deduplication indexes...")
            
            # Unique index on canonical URL
            self.db.news_metadata.create_index(
                [("canonical_url", 1)], 
                unique=True, 
                sparse=True,
                name="canonical_url_unique"
            )
            logger.info("✓ Recreated canonical_url_unique index")
            
            # Compound index for title+time deduplication
            self.db.news_metadata.create_index(
                [("normalized_title", 1), ("published_at", 1)],
                name="title_time_dedup"
            )
            logger.info("✓ Recreated title_time_dedup index")
            
            # TTL index for automatic cleanup
            self.db.news_metadata.create_index(
                [("fetched_at", 1)], 
                expireAfterSeconds=7776000,  # 90 days
                name="fetched_at_ttl"
            )
            logger.info("✓ Recreated fetched_at_ttl index")
            
        except Exception as e:
            logger.error(f"Error recreating indexes: {e}")

def main():
    """Main function"""
    logger.info("=" * 60)
    logger.info("DATABASE DEDUPLICATION SCRIPT")
    logger.info("=" * 60)
    
    try:
        deduplicator = DatabaseDeduplicator()
        
        # Option 1: Just analyze duplicates (safe)
        logger.info("\n1. ANALYZING DUPLICATES (Safe - Read Only)")
        logger.info("-" * 40)
        deduplicator.run_deduplication()
        
        # Option 2: Clean up database (destructive)
        logger.info("\n2. DATABASE CLEANUP (Destructive - Removes Duplicates)")
        logger.info("-" * 40)
        logger.warning("This will permanently remove duplicate articles from the database!")
        
        response = input("\nDo you want to proceed with database cleanup? (yes/no): ").lower().strip()
        
        if response in ['yes', 'y']:
            logger.info("Proceeding with database cleanup...")
            success = deduplicator.cleanup_database()
            if success:
                logger.info("✅ Database cleanup completed successfully!")
            else:
                logger.error("❌ Database cleanup failed!")
        else:
            logger.info("Database cleanup skipped. Only analysis was performed.")
        
        logger.info("\n" + "=" * 60)
        logger.info("DEDUPLICATION SCRIPT COMPLETED")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Script failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
