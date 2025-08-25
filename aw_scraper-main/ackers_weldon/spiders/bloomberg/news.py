import scrapy
import json
from ...constants import options
import pymongo
from scrapy.utils.project import get_project_settings


class News(scrapy.Spider):
    name = "bloomberg_news"

    custom_settings = {
        "ITEM_PIPELINES": {
            "ackers_weldon.pipelines.bloomberg.news.NewsPipeline": 300,
        }
    }

    bloomberg = options.get("spiders", {}).get("bloomberg", {})
    start_urls = [(sub["url"], [category["name"], sub["name"]]) for category in options["spiders"]["bloomberg"]["news"]["categories"]
                  for sub in category["subcategories"]] + [(category["url"], [category["name"]]) for category in options["spiders"]["bloomberg"]["news"]["categories"]]
    domain = "https://www.bloomberg.com/lineup-next/api/paginate?id=archive_story_list&type=lineup_content"
    
    limit = 50
    custom_headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Cookie": "bbgconsentstring=req1fun1pad1; _user-data=%7B%22status%22%3A%22anonymous%22%7D; __stripe_mid=f1f6abab-7806-45bc-840e-22c8a1de95f54f1153; exp_pref=AFRICA; _reg-csrf=s%3AB-ZX2CwDbixQ8hYKeWcPqeYm.b769jRZGM33hW5ldUIeIOXdJRyexHUfCoC1RgJXNA54; bdfpc=004.1980929995.1732029819854; geo_info={%22country%22:%22MU%22%2C%22region%22:%22Africa%22%2C%22fieldN%22:%22hf%22}|1732634620894; country_code=MU; _last-refresh=2024-11-19%2016%3A23; _reg-csrf-token=IAKgOytG-xz1wzBB09mdV4a4xI5pwWfevuy8",

    }

    def __init__(self, *args, **kwargs):
        super(News, self).__init__(*args, **kwargs)
        self.db = pymongo.MongoClient(
            get_project_settings().get("MONGO_URI"))[get_project_settings().get("MONGO_DATABASE", "items")]

    def start_requests(self):
        for url in self.start_urls:
            yield scrapy.Request(url[0], headers=self.custom_headers, meta={"category": url[1]}, callback=self.parseInitial)

    def parseInitial(self, response):
        domain = "https://www.bloomberg.com"
        self.count = 0
        
        data = json.loads(response.xpath(
            '//script[@id="__NEXT_DATA__"]/text()').extract_first())
        data = data.get("props", {}).get("pageProps", {}).get(
            "initialState", {}).get("modulesById", {})
        page = None

        for _, value in data.items():
            if value.get("type") == "ad" or value.get("type") == "section_front_header":
                continue
            page = value.get("pageId") or page
            items = value.get("items") or []
            for news in items:
                news["_id"] = self.getUrl(domain, news.get("url"))
                news["category"] = response.meta["category"]
                yield news
        yield scrapy.Request(f"{self.domain}&page={page}&offset={0}", headers=self.custom_headers, meta={"page": page, "category": response.meta["category"]}, callback=self.parse)

    def parse(self, response):
        data = json.loads(response.body)
        data = data.get("archive_story_list", {})

        offset = data.get("nextItemOffset") or 60
        nextPage = offset <= self.limit

        items = data.get("items") or []
        domain = "https://www.bloomberg.com"

        _ids = []
        for news in items:
            news["_id"] = self.getUrl(domain, news.get("url"))
            news["category"] = response.meta["category"]
            _ids.append(news["_id"])

        if nextPage and len(list(self.db["news"].find({"_id": {"$in": _ids}, "source": "bloomberg", "categories": response.meta["category"][1] if len(response.meta["category"]) > 1 else response.meta["category"][0]}, {"_id": 1}))) > 0:
            nextPage = False

        for news in items:
            yield news

        if nextPage:
            yield scrapy.Request(f"{self.domain}&page={response.meta['page']}&offset={offset}", headers=self.custom_headers, meta={"page": response.meta["page"], "category": response.meta["category"]}, callback=self.parse)

    def getUrl(self, domain, url):
        if not url or url == "":
            return ""

        if url.startswith("/"):
            url = domain + url
        elif not url.startswith("http"):
            url = domain + "/" + url

        return url.split("?")[0] if "?" in url else url
