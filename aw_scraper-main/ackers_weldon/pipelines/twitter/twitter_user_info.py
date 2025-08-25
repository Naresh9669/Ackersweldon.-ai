from itemadapter import ItemAdapter
import pymongo

class TwitterUserInfoPipeline:
    collection_name ="twitter_user_info"
    
    def __init__(self, mongo_uri, mongo_db):
        self.mongo_uri = mongo_uri
        self.mongo_db = mongo_db

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            mongo_uri=crawler.settings.get("MONGO_URI"),
            mongo_db=crawler.settings.get("MONGO_DATABASE", "items"),
        )

    def open_spider(self, spider):
        self.client = pymongo.MongoClient(self.mongo_uri)
        self.db = self.client[self.mongo_db]

    def close_spider(self, spider):
        self.client.close()

    def process_item(self, item, spider):
        item["_id"] = item["user_id"]
        del item["user_id"]
        try:
            self.db[self.collection_name].insert_one(
                ItemAdapter(item).asdict())
        except pymongo.errors.DuplicateKeyError:
            pass
        return item