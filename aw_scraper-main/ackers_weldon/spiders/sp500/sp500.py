import scrapy

class SP500(scrapy.Spider):
    name = "sp500"
    custom_settings = {
        "ITEM_PIPELINES": {
            "ackers_weldon.pipelines.sp500.sp500.SP500Pipeline": 300,
        }
    }
    def start_requests(self):
        return [
            scrapy.Request(
                url=f'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies',
                method="GET",
                callback=self.parse
            )
        ]
    
    def parse(self, response):
        for row in response.xpath('//*[@id="constituents"]//tr')[1:]:
            yield {
                "ticker": row.xpath('td[1]/a/text()').get(),
                "name": row.xpath('td[2]/a/text()').get(),
                "sector": row.xpath('td[3]/text()').get(),
                "industry": row.xpath('td[4]/text()').get(),
                "location": row.xpath('td[5]/a/text()').get(),
                "date": row.xpath('td[6]/text()').get(),
                "cik": row.xpath('td[7]/text()').get(),
                "founded": (row.xpath('td[8]/text()').get() or '').replace('\n', '')
            }
        