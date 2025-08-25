import pymongo
import requests
import os
from .default import getSummary, getCategory

class NewsProcessor:
    def __init__(self, mongo_uri, db_name, coll_name):
        self.connection = pymongo.MongoClient(mongo_uri)
        self.collection = self.connection[db_name][coll_name]
        self.ollama_url = os.getenv("OLLAMA_BASE_URL", "http://3.80.91.238:11434")

    def process_news(self, news):
        summary = news.get("summary")
        temp_summary = news.get("temp_summary")
        if not summary and temp_summary:
            html_text = temp_summary
            _summary = None
            if (html_text != 204 and html_text != 404):
                _summary = getSummary(html_text)
            summary = _summary or ""

        categories = getCategory(f'Title: {news["title"]}\nSummary: {summary}') or []

        news["categories"] = list(set(categories + news.get("categories", [])))
        news["summary"] = summary

        text = f'Title: {news["title"]}. Summary: {news["summary"]}'
        
        # Get embedding from external Ollama server
        try:
            response = requests.post(
                f"{self.ollama_url}/api/embeddings",
                json={
                    "model": "llama3.2:latest",
                    "prompt": text
                },
                timeout=30
            )
            
            if response.status_code == 200:
                embedding_data = response.json()
                vector = embedding_data.get("embedding", [])
            else:
                print(f"Error getting embedding: {response.status_code}")
                vector = []
                
        except Exception as e:
            print(f"Error calling Ollama server for embedding: {str(e)}")
            vector = []

        news["plot_embedding"] = vector

        self.collection.update_one(
            {"_id": news["_id"]},
            {
                "$set": {
                    "plot_embedding": vector,
                    "categories": news["categories"],
                    "summary": news["summary"],
                }
            },
            upsert=True,
        )

    def process_all_news(self):
        for news in self.collection.find({"plot_embedding": {"$exists": False}}, {}):
            self.process_news(news)
