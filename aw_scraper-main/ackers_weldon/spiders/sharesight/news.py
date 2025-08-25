import scrapy

class News(scrapy.Spider):
    name = "sharesight_news"
    custom_settings = {
        "ITEM_PIPELINES": {
            "ackers_weldon.pipelines.sharesight.news.NewsPipeline": 300,
        }
    }    
 
    def start_requests(self):
        extension = "/blog/"
        return [
            scrapy.Request(
                url= f"https://www.sharesight.com/page-data{extension}page-data.json",
                method="GET",
                headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                },
                callback=self.parse
            )
        ]

    
    def parse(self, response):
        stream = response.json().get("result", {}).get("pageContext", {}).get("entries" , [])
        extension = response.json().get("result", {}).get("pageContext", {}).get("nextPath", {})

        for blog in stream:
            yield blog

        if extension:
            yield scrapy.Request(
                url= f"https://www.sharesight.com/page-data{extension}page-data.json",
                method="GET",
                headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                },
                callback=self.parse
            )
        
           
    

