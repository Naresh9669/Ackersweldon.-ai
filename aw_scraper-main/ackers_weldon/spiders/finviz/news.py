import scrapy
from urllib.parse import urlparse

def extract_title(link: str)-> str:
    parsed_url = urlparse(link)
    site_name = parsed_url.netloc

    site_name = site_name.replace("www.", "")
    return site_name

class finviz(scrapy.Spider):
    name = "finviz_news"
    custom_settings = {
        "ITEM_PIPELINES": {
            "ackers_weldon.pipelines.finviz.news.NewsPipeline": 300,
        }
    }

    start_urls = [
        "https://finviz.com/news.ashx",
        "https://finviz.com/news.ashx?v=3",
        "https://finviz.com/news.ashx?v=4",
        "https://finviz.com/news.ashx?v=5"
    ]

    def parse(self, response):
        data = []
        count = 0
        title = response.css("title::text").get()
        for item in response.css(".styled-table-new"):
            count += 1
            for row in item.css(".news_table-row"):
                curr ={
                    "categories" : [title],
                    "type": "news" if count == 1 else "blog",
                    "_id": row.css("a::attr(href)").get(),
                    "title": row.css("a::text").get(),
                    "source" : "finviz",
                    "summary": None,
                    "date": row.css(".news_date-cell::text").get(),
                    "image": None,
                    "site_scrape": extract_title(row.css("a::attr(href)").get())
                }
                data.append(curr)

        for item in data:
            yield scrapy.Request(
                url= item["_id"],
                callback=self.parse_detail,
                meta={"item": item}
            )

    def parse_detail(self, response):
        item = response.meta.get("item")
        item["temp_summary"] = response.text
        yield item