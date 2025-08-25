import scrapy
import json
from ...constants import options
import pymongo
from scrapy.utils.project import get_project_settings


class News(scrapy.Spider):
    name = "bloomberg_search"

    custom_settings = {
        "ITEM_PIPELINES": {
            "ackers_weldon.pipelines.bloomberg.news.NewsPipeline": 300,
        }
    }

    page = 1
    custom_headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Cookie": "bbgconsentstring=req1fun1pad1; _user-data=%7B%22status%22%3A%22anonymous%22%7D; __stripe_mid=f1f6abab-7806-45bc-840e-22c8a1de95f54f1153; exp_pref=AFRICA; _reg-csrf=s%3AB-ZX2CwDbixQ8hYKeWcPqeYm.b769jRZGM33hW5ldUIeIOXdJRyexHUfCoC1RgJXNA54; bdfpc=004.1980929995.1732029819854; geo_info={%22country%22:%22MU%22%2C%22region%22:%22Africa%22%2C%22fieldN%22:%22hf%22}|1732634620894; country_code=MU; _last-refresh=2024-11-19%2016%3A23; _reg-csrf-token=IAKgOytG-xz1wzBB09mdV4a4xI5pwWfevuy8",

    }

    def start_requests(self):
        return [
            scrapy.Request(
                url=f"https://www.bloomberg.com/markets2/api/search?query={self.query}&page={self.page}&sort=time:desc",
                method="GET",
                headers=self.custom_headers,
                callback=self.parse
            )
        ]
    
    def parse(self, response):
        data = json.loads(response.body)
        nextPage = data.get("total", 0) > self.page * 10
        self.page += 1

        data = data.get("results", [])
        for news in data:
            news["_id"] = news.get("url")
            yield news

        if nextPage and self.page < 5:
            yield scrapy.Request(
                url=f"https://www.bloomberg.com/markets2/api/search?query={self.query}&page={self.page}&sort=time:desc",
                method="GET",
                headers=self.custom_headers,
                callback=self.parse
            )
