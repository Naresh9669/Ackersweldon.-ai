from itemadapter import ItemAdapter
import pymongo
import datetime

class NewsPipeline:
    collection_name = "news"

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
        date = item["date"]

        if "AM" in date or "PM" in date:
            date = datetime.datetime.strptime(date, "%I:%M%p").strftime("%Y-%m-%d %H:%M:%S")
            date = datetime.datetime.now().strftime("%Y-%m-%d") + " " + date.split()[1]
        elif "-" in date:
            date = datetime.datetime.strptime(date, "%b-%d").strftime("%Y-%m-%d %H:%M:%S")
        elif "min" in date:
            date = datetime.datetime.now() - datetime.timedelta(minutes=int(date.split()[0]))
            date = date.strftime("%Y-%m-%d %H:%M:%S")
        elif "hour" in date:
            date = datetime.datetime.now() - datetime.timedelta(hours=int(date.split()[0]))
            date = date.strftime("%Y-%m-%d %H:%M:%S")
        else:
            date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        item["date"] = datetime.datetime.strptime(date, "%Y-%m-%d %H:%M:%S").timestamp()
        item["read"] = False

        try:
            self.db[self.collection_name].insert_one(ItemAdapter(item).asdict())
        except pymongo.errors.DuplicateKeyError:
            pass
        return item
