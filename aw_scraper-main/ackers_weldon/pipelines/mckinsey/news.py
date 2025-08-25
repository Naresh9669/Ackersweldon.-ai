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
        domain = "https://www.mckinsey.com"

        title = item.get("title") or ""
        summary = item.get("description") or ""

        try:
            news = {
                "_id": domain + item.get("url", ""),
                "title": title,
                "summary": summary,
                "date":  item.get("displaydate", datetime.datetime.now().isoformat()),
                "source": "mckinsey",
                "categories": list(set([entry.get("name") or entry.get("title") for entry in item.get("blogentrytags", [])])),
                "type": "blog",
                "image": domain + (item.get("imageurl") or item.get("heroimage") or ""),
                "read": False
            }

            news["_id"] = news["_id"].replace(" ", "%20")
            news["image"] = news["image"].replace(" ", "%20")
            try:
                news["date"] = datetime.datetime.strptime(news["date"], "%Y-%m-%dT%H:%M:%S").timestamp()
            except:
                return news

            self.db[self.collection_name].insert_one(
                ItemAdapter(news).asdict())
        except pymongo.errors.DuplicateKeyError:
            spider.crawler.engine.close_spider(self, reason='cancelled')

        return news