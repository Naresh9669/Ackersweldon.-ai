from itemadapter import ItemAdapter
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
        if "news" in item:
            pubtime = item["news"].get("pubtime", 0)
            if pubtime > 1000000000000:
                pubtime = pubtime / 1000

            title = item["news"]["title"]
            summary = item["news"]["summary"]

            news = {
                "_id": item["news"]["link"],
                "title": title,
                "summary": summary,
                "date":  pubtime,
                "source": "yahoo_finance",
                "categories": list(set([item["news"]['category'], item["news"]["property"]])),
                "type": item["news"]["type"],
                "image": None,
                "read": False
            }
            images = item["news"].get("images")
            if images:
                image = list(images.keys())[-1]
                image = images[image]
                news["image"] = image['url']
            else:
                news["image"] = ''

            try:
                self.db[self.collection_name].insert_one(
                    ItemAdapter(news).asdict())
            except pymongo.errors.DuplicateKeyError:
                pass
            return news
        return item