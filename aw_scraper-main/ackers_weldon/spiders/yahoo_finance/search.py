import scrapy
import json


class Search(scrapy.Spider):
    name = "yahoo_finance_search"
    custom_settings = {
        "ITEM_PIPELINES": {
            "ackers_weldon.pipelines.yahoo_finance.news.NewsPipeline": 300,
        }
    }

    formdata = {
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
    payload = {
        "pagination": None
    }
    news_list = []

    def start_requests(self):
        return [
            scrapy.Request(
                url=f"https://query1.finance.yahoo.com/v1/finance/search?q={self.query}&quotesCount={self.quotes_count}&newsCount={self.news_count}&listsCount=0&newsQueryId=news_cie_vespa&quotesQueryId=tss_match_phrase_query&multiQuoteQueryId=multi_quote_single_token_query",
                method="GET",
                headers={
                    "Accept": "*/*",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Connection": "keep-alive",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
                },
                callback=self.parse
            )
        ]

    def parse(self, response):
        if self.news_count == 0:
            quotes_list = response.json()["quotes"]
            yield {
                "count": len(quotes_list),
                "quotes": quotes_list
            }
            return

        news_list = response.json()["news"]
        news = ",".join([f'{news["uuid"]}:{news["type"]}' for news in news_list])
        self.news_list = []
        self.payload["pagination"] = {
            "uuids": news
        }
        self.formdata["requests"]["g0"]["params"]["ncpParams"]["body"]["gqlVariables"]["main"] = self.payload


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
            callback=self.parseNews
        )

    def parseNews(self, response):
        self.formdata["requests"]["g0"]["params"]["ncpParams"]["body"]["gqlVariables"]["main"] = self.payload
        data = response.json().get("g0", {}).get("data", {})
        nextPage = data.get("stream_pagination", {}).get("gqlVariables", {}).get(
            "main", {}).get("pagination", {}).get("remainingCount", 0) > 0
        self.payload["pagination"] = data.get("stream_pagination", {}).get(
            "gqlVariables", {}).get("main", {}).get("pagination", {})

        stream = data["stream_items"]
        self.news_list.extend(stream)

        for news in stream:
            news["category"] = news.get("categoryLabel") or news.get("property") or "Business"
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
                callback=self.parseNews
            )
