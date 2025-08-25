import scrapy


class News(scrapy.Spider):
    name = "mckinsey_news"
    custom_settings = {
        "ITEM_PIPELINES": {
            "ackers_weldon.pipelines.mckinsey.news.NewsPipeline": 300,
        }
    }
    domain = "https://prd-api.mckinsey.com"

    def start_requests(self):
        return [
           scrapy.Request(
                url = self.domain + "/v1/blogs/new-at-mckinsey-blog",
                method = "GET",
                headers = {
                    "Content-Type": "application/json",
                    "Accept": "*/*",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Connection": "keep-alive",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
                },
                
                callback=self.parse
            )
        ]



    def parse(self, response):
        data =response.json()
        nextpage = data["links"]["next"]
        
        result= data["results"]
        for news in result:
            yield news
    
        if nextpage != "":
            yield scrapy.Request(
                url = self.domain + nextpage,
                method = "GET",
                headers = {
                    "Content-Type": "application/json",
                    "Accept": "*/*",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Connection": "keep-alive",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
                },
                
                callback=self.parse
            )


