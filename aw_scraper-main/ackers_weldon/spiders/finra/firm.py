import scrapy
import json


class Firm(scrapy.Spider):
    name = "finra_firm"

    def start_requests(self):
        # https://api.brokercheck.finra.org/search/firm?query=apple&hl=true&nrows=12&start=0&r=25&sort=score+desc&wt=json
        return [
            scrapy.Request(
                url=f'https://api.brokercheck.finra.org/search/firm?query={self.query}&hl=true&nrows=12&start={self.page}&r=25&sort=score%2Bdesc&wt=json',
                method="GET",
                callback=self.parse
            )
        ]

    def parse(self, response):
        data = response.json().get("hits", {})

        for _firm in data.get("hits", []):
            firm = _firm.get("_source", {})
            isFinra = True if "firm_bd_sec_number" in firm else False
            meta = {
                "isFinra": isFinra,
            }

        for _individual in data.get("hits", []):
            individual = _individual.get("_source", {})
            isFinra = True if "ind_industry_cal_date" in individual else False
            meta = {
                "isFinra": isFinra,
            }
            if isFinra:
                yield scrapy.Request(
                    url=f'https://api.brokercheck.finra.org/search/firm/{individual.get("firm_source_id", "")}',
                    method="GET",
                    callback=self.parseDetail,
                    meta=meta
                )
            else:
                yield scrapy.Request(
                    url=f'https://api.adviserinfo.sec.gov/search/firm/{individual.get("firm_source_id", "")}',
                    method="GET",
                    callback=self.parseDetail,
                    meta=meta
                )

    def parseDetail(self, response):
        data = response.json()


        isFinra = response.meta.get("isFinra")

        data = data.get("hits", {}).get("hits", [{}])[0].get("_source", {}).get("content" if isFinra else "iacontent", "")

        data = json.loads(data.replace("\\", ""))

        yield data
