import scrapy
import json
from scrapy.utils.project import get_project_settings
import pymongo


class News(scrapy.Spider):
    name = "yahoo_finance_news"
    custom_settings = {
        "ITEM_PIPELINES": {
            "ackers_weldon.pipelines.yahoo_finance.news.NewsPipeline": 300,
        }
    }

    formdata = {
        "serviceConfig": {}
    }
    payload = {
        "gqlVariables": {
            "main": {
                "pagination": {
                    "uuids": None
                }
            }
        }
    }

    category = {}

    def __init__(self, *args, **kwargs):
        super(News, self).__init__(*args, **kwargs)
        self.db = pymongo.MongoClient(
            get_project_settings().get("MONGO_URI"))[get_project_settings().get("MONGO_DATABASE", "items")]

    def start_requests(self):
        self.formdata = {"serviceConfig": {}}
        return [
            scrapy.Request(
                url="https://finance.yahoo.com/xhr/ncp?queryRef=newsHubNewsStreamNeo&serviceKey=ncp_fin",
                method="POST",
                headers={
                    "Content-Type": "application/json",
                    "Accept": "*/*",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Connection": "keep-alive",
                },
                body=json.dumps(self.formdata),
                callback=self.getUUIDS
            )
        ]

    def getUUIDS(self, response):
        self.formdata = {
            "requests": {
                "g0": {
                    "resource": "StreamService",
                    "operation": "read",
                    "params": {
                        "ui": {
                            "comments_offnet": True,
                            "editorial_featured_count": 1,
                            "image_quality_override": True,
                            "link_out_allowed": True,
                            "needtoknow_template": "filmstrip",
                            "ntk_bypassA3c": True,
                            "pubtime_maxage": 0,
                            "show_comment_count": True,
                            "smart_crop": True,
                            "storyline_count": 2,
                            "storyline_enabled": True,
                            "storyline_min": 2,
                            "summary": True,
                            "thumbnail_size": 100,
                            "view": "mega",
                            "editorial_content_count": 6,
                            "enable_lead_fallback_image": True,
                            "finance_upsell_threshold": 4
                        },
                        "category": None,
                        "forceJpg": True,
                        "releasesParams": {
                            "limit": 20,
                            "offset": 0
                        },
                        "ncpParams": {
                            "body": {
                                "gqlVariables": {
                                    "main": {}
                                }
                            }
                        },
                        "offnet": {
                            "include_lcp": True,
                            "use_preview": True,
                            "url_scheme": "domain"
                        },
                        "use_content_site": True,
                        "useNCP": True,
                        "batches": {
                            "pagination": True,
                            "size": 10,
                            "timeout": 1500,
                            "total": 170
                        },
                        "enableAuthorBio": True,
                        "content_type": "topic",
                        "content_site": "finance"
                    }
                }
            },
            "context": {
                "crumb": "6nuf3r4tmLI",
                "lang": "en-US",
                "prid": "32mro3pjj0v0q",
                "site": "finance"
            }
        }
        self.payload = {
            "pagination": None
        }

        stream = response.json()["data"]["main"]["stream"]
        news = [f'{news.get("id")}:{news.get("content", {}).get("contentType")}' for news in stream]

        uuids = response.json()["data"]["main"]["pagination"]["uuids"]
        uuids = uuids.replace("\\", "")
        uuids = uuids.replace("paginationString=", "")
        news_meta = json.loads(uuids)["streamPagination"]["uuids"]
        news = news + [f'{news.get("id")}:{news.get("type", {}).split(":")[1].split("=")[1].upper()}' for news in news_meta]
        news = ','.join(news)
        self.payload["pagination"] = {
            "uuids": news
        }
        self.formdata["requests"]["g0"]["params"]["ncpParams"]["body"]["gqlVariables"]["main"] = self.payload

        self.category = self.YahooFinanceNewsCategory

        yield scrapy.Request(
            url="https://finance.yahoo.com/_finance_doubledown/api/resource",
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
            },
            body=json.dumps(self.formdata),
            callback=self.parse
        )
    
    limit = 5

    def parse(self, response):
        self.formdata["requests"]["g0"]["params"]["ncpParams"]["body"]["gqlVariables"]["main"] = self.payload
        data = response.json().get("g0", {}).get("data", {})
        nextPage = data.get("stream_pagination", {}).get("gqlVariables", {}).get(
            "main", {}).get("pagination", {}).get("remainingCount", 0) > 0
        self.payload["pagination"] = data.get("stream_pagination", {}).get(
            "gqlVariables", {}).get("main", {}).get("pagination", {})

        stream = data["stream_items"]

        _ids = [news["link"] for news in stream]
        current_category = self.category.get("name") if self.category else 'Cryptocurrency' 
        
        match = len(list(self.db["news"].find({"_id": {"$in": _ids}, "source": "yahoo_finance", "categories": current_category}, {"_id": 1}))) > 0
        if nextPage and match and self.limit <= 0:
            nextPage = False
            self.limit = 5
        elif nextPage and match:
            self.limit -= 1

        for news in stream:
            news["category"] = current_category
            yield {
                "news": news
            }

        if nextPage:
            yield scrapy.Request(
                url="https://finance.yahoo.com/_finance_doubledown/api/resource",
                method="POST",
                headers={
                    "Content-Type": "application/json",
                    "Accept": "*/*",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Connection": "keep-alive",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
                },
                body=json.dumps(self.formdata),
                callback=self.parse
            )
        elif not nextPage and self.category:
            self.payload["pagination"] = None
            self.formdata["requests"]["g0"]["params"]["ncpParams"]["body"]["gqlVariables"]["main"] = self.payload
            self.formdata["requests"]["g0"]["params"]["category"] = self.category.get(
                "id")
            self.category = self.category.get("next")
            yield scrapy.Request(
                url="https://finance.yahoo.com/_finance_doubledown/api/resource",
                method="POST",
                headers={
                    "Content-Type": "application/json",
                    "Accept": "*/*",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Connection": "keep-alive",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
                },
                body=json.dumps(self.formdata),
                callback=self.parse
            )

    YahooFinanceNewsCategory = {
        "name": "Latest News",
        "id": "LISTID:530aec16-61ed-4c8e-8fd8-f60d01bd0722",
        "next": {
            "name": "Stock Market News",
            "id": "LISTID:db1d46e0-a969-11e9-bff5-6dfdb80d79cf",
            "next": {
                "name": "Yahoo Finance Originals",
                "id": "LISTID:0897608a-7d79-47df-9377-b07bd22b0fde",
                "next": {
                    "name": "Morning Brief",
                    "id": "LISTID:32ef1e10-a174-11e8-b72b-b7a58875a002",
                    "next": {
                        "name": "Economic News",
                        "id": "LISTID:7ce2bfb8-c363-4498-930b-b6d86ae4dccf",
                        "next": {
                            "name": "Housing Market",
                            "id": "LISTID:aff2792f-3630-433b-9d0b-0692f91e2a92",
                            "next": {
                                "name": "Earnings",
                                "id": "LISTID:04d9350a-bbd1-4787-95be-740cc5ee8852",
                                "next": {
                                    "name": "Technology",
                                    "id": "LISTID:dffbd430-02a2-11e7-bcfc-437e9432ca73",
                                    "next": {
                                        "name": "Cryptocurrency",
                                        "id": "LISTID:b1f0c990-db7a-11e7-a937-0d92c86f9da1",
                                        "next": None
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
    }
