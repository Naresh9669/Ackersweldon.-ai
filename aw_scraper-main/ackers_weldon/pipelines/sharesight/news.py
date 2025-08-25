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
        domain = "https://www.sharesight.com/blog/"
                
        try:

            title = item.get("title", {}).get("title") or ""
            summary = item.get("metaDescription", {}).get("metaDescription") or ""

            
            categories = item.get("categories") or []

            news = {
                "_id": domain + item.get("urlSlug", ""),
                "title": title,
                "summary": summary,
                "date":  item.get("created_at", datetime.datetime.now().isoformat()),
                "source": "sharesight",
                "categories": list(set([entry.get("name", {}).get("name", "") for entry in categories])),
                "type": "blog",
                "image": None,
                "read": False
            }
            try:
                news["date"] = datetime.datetime.strptime(news["date"], "%Y-%m-%dT%H:%M%z").timestamp()
            except:
                news["date"] = datetime.datetime.strptime(news["date"], "%Y-%m-%d").timestamp()
            images = item.get("image", {}).get("gatsbyImageData", {}).get("images", {})
            news["image"] = images.get("sources", []).pop().get("src") or images.get("fallback", {}).get("src")
            news["image"] = news["image"].replace(" ", "%20")

            self.db[self.collection_name].insert_one(ItemAdapter(news).asdict())
        except pymongo.errors.DuplicateKeyError:
            spider.crawler.engine.close_spider(self, reason='cancelled')

        return news