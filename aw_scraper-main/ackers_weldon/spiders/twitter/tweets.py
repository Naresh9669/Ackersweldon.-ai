import scrapy
from datetime import datetime
import json
import os
from dotenv import load_dotenv
load_dotenv()
# from keys import TWITTER_API

class Tweets(scrapy.Spider):
    name = "twitter_tweets"
    custom_settings = {
        "ITEM_PIPELINES": {
            "ackers_weldon.pipelines.twitter.tweets.TweetsPipeline": 300,
        }
    }
    headers = {
        "x-rapidapi-host": "twitter-v1-1-v2-api.p.rapidapi.com",
        "x-rapidapi-key": os.getenv("TWITTER_API"),
        "Content-Type": "application/json"
    }
    date_format = "%a %b %d %H:%M:%S +0000 %Y"

    def __init__(self, payload=None, *args, **kwargs):
        super(Tweets, self).__init__(*args, **kwargs)
        # Default payload if none provided
        self.payload = payload or {
            "userId": "783214",  # Default to Twitter's user ID
            "count": 20,
            "includePromotedContent": False,
            "withQuickPromoteEligibilityTweetFields": True,
            "withVoice": True,
            "withV2Timeline": True
        }

    def start_requests(self):
        return [
            scrapy.Request(
                url=f"https://twitter-v1-1-v2-api.p.rapidapi.com/graphql/UserTweets?variables={json.dumps(self.payload)}",
                method="GET",
                headers=self.headers,
                callback=self.parse
            )
        ]

    def parse(self, response):
        entries = response.json()["data"]["user"]["result"]["timeline_v2"]["timeline"]["instructions"][1]["entries"]

        count = 0
        for tweet in entries:
            if count >= 20:
                break
            item = {
                "post_id": tweet["content"]["itemContent"]["tweet_results"]["result"]["legacy"]["id_str"],
                "user_id": self.payload["userId"],
                "user_name": tweet["content"]["itemContent"]["tweet_results"]["result"]["core"]["user_results"]["result"]["legacy"]["name"],
                "user_handle": tweet["content"]["itemContent"]["tweet_results"]["result"]["core"]["user_results"]["result"]["legacy"]["screen_name"],
                "profile_img": tweet["content"]["itemContent"]["tweet_results"]["result"]["core"]["user_results"]["result"]["legacy"]["profile_image_url_https"],
                "likes": tweet["content"]["itemContent"]["tweet_results"]["result"]["legacy"]["favorite_count"],
                "retweets": tweet["content"]["itemContent"]["tweet_results"]["result"]["legacy"]["retweet_count"],
                "reply": tweet["content"]["itemContent"]["tweet_results"]["result"]["legacy"]["reply_count"],
                "full_text": tweet["content"]["itemContent"]["tweet_results"]["result"]["legacy"]["full_text"],
                "date_posted": datetime.strptime(tweet["content"]["itemContent"]["tweet_results"]["result"]["legacy"]["created_at"], self.date_format).timestamp(),
                "img_path": (
                            tweet.get("content", {})
                            .get("itemContent", {})
                            .get("tweet_results", {})
                            .get("result", {})
                            .get("legacy", {})
                            .get("extended_entities", {})
                            .get("media", [{}])[0].get("media_url_https", None)
                        ) if tweet.get("content") else None,
                "hashtags": tweet["content"]["itemContent"]["tweet_results"]["result"]["legacy"]["entities"]["hashtags"] if tweet["content"]["itemContent"]["tweet_results"]["result"]["legacy"]["entities"]["hashtags"] else None,
            }
            
            count+=1
            yield item