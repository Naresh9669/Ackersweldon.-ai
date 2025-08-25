db = db.getSiblingDB('dashboard_db');
db.createUser({
  user: "aw-research-desk",
  pwd: "HIGHLYSECUREPASSWORD",
  roles: [
    {
      role: 'readWrite',
      db: 'dashboard_db',
    },
    {
      role: 'readWrite',
      db: 'config',
    }
  ],
});
db.createCollection('news');
db.createCollection('sidemenus');
db.createCollection('geo_urns');

db.sidemenus.insertMany([
  {
      "_id": "bloomberg",
      "name": "Bloomberg",
      "icon": null,
      "categories": [
          {
              "name": "Technology",
              "category": "technology",
              "icon": null
          }
      ],
      "hasSearch": true
  },
  {
      "_id": "finviz",
      "name": "Finviz",
      "icon": null,
      "categories": [
          {
              "name": "Stock Market News & Blogs",
              "category": "stock-market-news-blogs",
              "icon": null
          },
          {
              "name": "Stocks News",
              "category": "stocks-news",
              "icon": null
          },
          {
              "name": "ETF News",
              "category": "etf-news",
              "icon": null
          },
          {
              "name": "Cryptocurrency News",
              "category": "cryptocurrency-news",
              "icon": null
          }
      ],
      "hasSearch": false
  },
  {
      "_id": "mckinsey",
      "name": "McKinsey",
      "icon": null,
      "categories": [
          {
              "name": "Technology",
              "category": "technology",
              "icon": null
          }
      ],
      "hasSearch": false
  },
  {
      "_id": "sharesight",
      "name": "Sharesight",
      "icon": null,
      "categories": [
          {
              "name": "Sharesight Blog",
              "category": "sharesight-blog",
              "icon": null
          }
      ],
      "hasSearch": false
  },
  {
      "_id": "yahoo_finance",
      "name": "Yahoo Finance",
      "icon": null,
      "categories": [
          {
              "name": "Latest News",
              "category": "latest-news",
              "icon": null
          },
          {
              "name": "Stock Market News",
              "category": "stock-market-news",
              "icon": null
          },
          {
              "name": "Yahoo Finance Originals",
              "category": "yahoo-finance-originals",
              "icon": null
          },
          {
              "name": "Morning Brief",
              "category": "morning-brief",
              "icon": null
          },
          {
              "name": "Economic News",
              "category": "economic-news",
              "icon": null
          },
          {
              "name": "Housing Market",
              "category": "housing-market",
              "icon": null
          },
          {
              "name": "Earnings",
              "category": "earnings",
              "icon": null
          },
          {
              "name": "Technology",
              "category": "technology",
              "icon": null
          },
          {
              "name": "Cryptocurrency",
              "category": "cryptocurrency",
              "icon": null
          }
      ],
      "hasSearch": true
  }
]);

db.geo_urns.insertMany([
    {
        "_id": "105015875",
        "name": "France",
        "urn": "france"
    },
    {
        "_id": "100565514",
        "name": "Belgium",
        "urn": "belgium"
    },
    {
        "_id": "105646813",
        "name": "Spain",
        "urn": "spain"
    },
    {
        "_id": "102299470",
        "name": "England",
        "urn": "england"
    },
    {
        "_id": "101282230",
        "name": "Germany",
        "urn": "germany"
    },
    {
        "_id": "103350119",
        "name": "Italy",
        "urn": "italy"
    },
    {
        "_id": "103644278",
        "name": "United States",
        "urn": "united-states"
    },
    {
        "_id": "101174742",
        "name": "Canada",
        "urn": "canada"
    },
    {
        "_id": "101452733",
        "name": "Australia",
        "urn": "australia"
    },
    {
        "_id": "102713980",
        "name": "India",
        "urn": "india"
    },
    {
        "_id": "102890883",
        "name": "China",
        "urn": "china"
    },
    {
        "_id": "101355337",
        "name": "Japan",
        "urn": "japan"
    },
    {
        "_id": "106057199",
        "name": "Brazil",
        "urn": "brazil"
    },
    {
        "_id": "103323778",
        "name": "Mexico",
        "urn": "mexico"
    },
    {
        "_id": "102890719",
        "name": "Netherlands",
        "urn": "netherlands"
    },
    {
        "_id": "102454443",
        "name": "Singapore",
        "urn": "singapore"
    },
    {
        "_id": "106693272",
        "name": "Switzerland",
        "urn": "switzerland"
    },
    {
        "_id": "105117694",
        "name": "Sweden",
        "urn": "sweden"
    },
    {
        "_id": "105149562",
        "name": "South Korea",
        "urn": "south-korea"
    },
    {
        "_id": "101728296",
        "name": "Russia",
        "urn": "russia"
    },
    {
        "_id": "104305776",
        "name": "United Arab Emirates",
        "urn": "united-arab-emirates"
    }
]);