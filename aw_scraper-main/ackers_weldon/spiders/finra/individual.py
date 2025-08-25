import scrapy
import json

class Individual(scrapy.Spider):
    name = "finra_individual"

    def start_requests(self):
        return [
            scrapy.Request(
                url= f'https://api.brokercheck.finra.org/search/individual?query={self.query}&{"" if not self.firm or self.firm == "" else "firm=" + self.firm}&includePrevious=true&hl=true&hl=true&nrows=12&start={self.page}&r=25&sort=score%2Bdesc&wt=json',
                method="GET",
                callback=self.parse
            )
        ]
    
    def parse(self, response):  
        data = response.json().get("hits", {})

        for _individual in data.get("hits", []):
            individual = _individual.get("_source", {})
            isFinra = True if "ind_industry_cal_date" in individual else False
            meta = {
                "isFinra": isFinra,
            }
            if isFinra:
                yield scrapy.Request(
                    url= f'https://api.brokercheck.finra.org/search/individual/{individual.get("ind_source_id", "")}',
                    method="GET",
                    callback=self.parseDetail,
                    meta=meta
                )
            else:
                yield scrapy.Request(
                    url= f'https://api.adviserinfo.sec.gov/search/individual/{individual.get("ind_source_id", "")}',
                    method="GET",
                    callback=self.parseDetail,
                    meta=meta
                )

    def parseDetail(self, response):
        data = response.json()
        isFinra = response.meta.get("isFinra")

        data = data.get("hits", {}).get("hits", [{}])[0].get("_source", {}).get("content" if isFinra else "iacontent", "")

        data = json.loads(data.replace("\\", ""))

        yield {
            "basic_information": {
                "individual_id": data.get("basicInformation", {}).get("individualId", ""),
                "first_name": data.get("basicInformation", {}).get("firstName", ""),
                "last_name": data.get("basicInformation", {}).get("lastName", ""),
                "middle_name": data.get("basicInformation", {}).get("middleName", ""),
                "other_names": data.get("basicInformation", {}).get("otherNames", []),
                "days_in_industry": data.get("basicInformation", {}).get("daysInIndustryCalculatedDateIAPD") or data.get("basicInformation", {}).get("daysInIndustryCalculatedDate", ""),
            },
            "current_employments": data.get("currentEmployments", []) if isFinra else data.get("currentIAEmployments", []),
            "disclosure_flag": data.get("disclosureFlag", "N") if isFinra else data.get("iaDisclosureFlag", "N"),
            "disclosures": data.get("disclosures", []) if isFinra else data.get("iaDisclosures", []),
            "exams_count": data.get("examsCount", {}),
            "is_finra": isFinra,
            "previous_employments": data.get("previousEmployments", []) if isFinra else data.get("previousIAEmployments", []),
            "principal_exam_category": data.get("principalExamCategory", []),
            "product_exam_category": data.get("productExamCategory", []),
            "state_exam_category": data.get("stateExamCategory", []),
            "registeredSROs": data.get("registeredSROs", []),
            "registered_states": data.get("registeredStates", []),
            "registration_count": data.get("registrationCount", {}),
        }
        