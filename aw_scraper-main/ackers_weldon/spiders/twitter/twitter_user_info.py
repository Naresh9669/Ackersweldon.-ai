import scrapy
import json, os
from dotenv import load_dotenv

load_dotenv()
# from keys import TWITTER_API

class TwitterUserInfo(scrapy.Spider):
    name = "twitter_user_info"
    
    # Needs to create the pipeline first.
    custom_settings ={
        "ITEM_PIPELINES": {
            "ackers_weldon.pipelines.twitter.twitter_user_info.TwitterUserInfoPipeline": 300,
        }
    }

    header = {
        "x-rapidapi-host": "twitter-v1-1-v2-api.p.rapidapi.com",
        "x-rapidapi-key": os.getenv("TWITTER_API"),
        "Content-Type": "application/json"
    }
    
    def __init__(self, payload=None, *args, **kwargs):
        super(TwitterUserInfo, self).__init__(*args, **kwargs)
        # Default payload if none provided
        self.payload = payload or {
            "screen_name": "twitter",
            "withSafetyModeUserFields": True,
            "withHighlightedLabel": True
        }
    
    def start_requests(self):
        return [
            scrapy.Request(
                url=f"https://twitter-v1-1-v2-api.p.rapidapi.com/graphql/UserByScreenName?variables={json.dumps(self.payload)}",
                method="GET",
                headers=self.header,
                callback=self.parse
            )
        ]
    
    def parse(self, response):
        yield (response.json())
        
        res = {
            "user_id": response.json()["data"]["user"]["result"]["rest_id"],
            "user_name": response.json()["data"]["user"]["result"]["legacy"]["name"],
            "user_handle": response.json()["data"]["user"]["result"]["legacy"]["screen_name"]
        }

        print(res)
        yield res