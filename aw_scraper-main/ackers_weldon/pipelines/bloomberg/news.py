from itemadapter import ItemAdapter
import datetime
import pymongo

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
        if "publishedAt" in item:
            pubtime = datetime.datetime.strptime(item["publishedAt"], "%B %d, %Y").timestamp()
            item["category"] = [(item.get("eyebrow") or "").capitalize()]
        else:
            try:
                pubtime = datetime.datetime.strptime(item["publishedAt"], "%Y-%m-%dT%H:%M:%S.%fZ").timestamp()
            except:
                pubtime = datetime.datetime.now().timestamp()

        title = item.get("headline") or ""
        summary = item.get("summary") or ""

        news = {
            "_id": item.get("_id"),
            "title": title,
            "summary": summary,
            "date": pubtime,
            "source": "bloomberg",
            "categories": list(set(item.get("category", []) + [item.get("label")])),
            "type": item.get("type"),
            "image": item.get("image", {}).get("baseUrl") or item.get("thumbnail"),
            "read": False
        }
        split_url = news["_id"].replace("https://www.bloomberg.com/", "").split("/")
        if news["_id"] != "" and len(split_url) > 1:
            try:
                self.db[self.collection_name].insert_one(
                    ItemAdapter(news).asdict())
            except pymongo.errors.DuplicateKeyError:
                pass

        return item
