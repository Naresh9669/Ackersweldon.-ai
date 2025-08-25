options = {
    "spiders": {
        "yahoo_finance": {
            "name": "yahoo_finance",
            "news": {
                "categories": [
                    "news",
                    "latest-news",
                    "stock-market-news",
                    "yahoo-finance-originals",
                    "morning-brief",
                    "economic-news",
                    "housing-market",
                    "earnings",
                    "tech",
                    "crypto"
                ]
            }
        },
        "bloomberg": {
            "name": "bloomberg",
            "news": {
                "categories": [
                    {
                        "name": "Markets",
                        "url": "https://www.bloomberg.com/markets",
                        "subcategories": [
                            {
                                "name": "Deals",
                                "url": "https://www.bloomberg.com/deals"
                            },
                            {
                                "name": "Fixed Income",
                                "url": "https://www.bloomberg.com/markets/fixed-income"
                            },
                            {
                                "name": "Factor Investing",
                                "url": "https://www.bloomberg.com/factor-investing"
                            },
                            {
                                "name": "Alternative Investing",
                                "url": "https://www.bloomberg.com/alternative-investments"
                            },
                            {
                                "name": "ETFs",
                                "url": "https://www.bloomberg.com/markets/etfs"
                            },
                            {
                                "name": "FX Center",
                                "url": "https://www.bloomberg.com/fx-center"
                            }
                        ]
                    },
                    {
                        "name": "Economics",
                        "url": "https://www.bloomberg.com/economics",
                        "subcategories": [
                            {
                                "name": "Indicators",
                                "url": "https://www.bloomberg.com/economics/indicators"
                            },
                            {
                                "name": "Central Banks",
                                "url": "https://www.bloomberg.com/economics/central-banks"
                            },
                            {
                                "name": "Jobs",
                                "url": "https://www.bloomberg.com/economics/jobs"
                            },
                            {
                                "name": "Trade",
                                "url": "https://www.bloomberg.com/economics/trade"
                            },
                            {
                                "name": "Tax & Spend",
                                "url": "https://www.bloomberg.com/economics/tax-and-spend"
                            },
                            {
                                "name": "Inflation & Prices",
                                "url": "https://www.bloomberg.com/economics/inflation-and-prices"
                            }
                        ]
                    },
                    {
                        "name": "Industries",
                        "url": "https://www.bloomberg.com/industries",
                        "subcategories": [
                            {
                                "name": "Energy",
                                "url": "https://www.bloomberg.com/industries/energy"
                            },
                            {
                                "name": "Entertainment",
                                "url": "https://www.bloomberg.com/industries/entertainment"
                            },
                            {
                                "name": "Finance",
                                "url": "https://www.bloomberg.com/industries/finance"
                            },
                            {
                                "name": "Health",
                                "url": "https://www.bloomberg.com/industries/health"
                            },
                            {
                                "name": "Consumer",
                                "url": "https://www.bloomberg.com/industries/consumer"
                            },
                            {
                                "name": "Real Estate",
                                "url": "https://www.bloomberg.com/industries/real-estate"
                            },
                            {
                                "name": "Legal",
                                "url": "https://www.bloomberg.com/industries/legal"
                            },
                            {
                                "name": "Transportation",
                                "url": "https://www.bloomberg.com/industries/transportation"
                            },
                            {
                                "name": "Telecom",
                                "url": "https://www.bloomberg.com/industries/telecom"
                            },
                            {
                                "name": "Sports",
                                "url": "https://www.bloomberg.com/business-of-sports"
                            },
                            {
                                "name": "Space",
                                "url": "https://www.bloomberg.com/space"
                            }
                        ]
                    },
                    {
                        "name": "Technology",
                        "url": "https://www.bloomberg.com/technology",
                        "subcategories": [
                            {
                                "name": "AI",
                                "url": "https://www.bloomberg.com/technology/ai"
                            },
                            {
                                "name": "Big Tech",
                                "url": "https://www.bloomberg.com/technology/big-tech"
                            },
                            {
                                "name": "Cybersecurity",
                                "url": "https://www.bloomberg.com/technology/cybersecurity"
                            },
                            {
                                "name": "Startups",
                                "url": "https://www.bloomberg.com/technology/startups"
                            },
                            {
                                "name": "Screentime",
                                "url": "https://www.bloomberg.com/screentime"
                            }
                        ]
                    }
                ]
            }
        }
    }
}

bloomberg_urls_cat_and_subcat = [sub["url"] for category in options["spiders"]["bloomberg"]["news"]["categories"] for sub in category["subcategories"] ] + [category["url"] for category in options["spiders"]["bloomberg"]["news"]["categories"]]
