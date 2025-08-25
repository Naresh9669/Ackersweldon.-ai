# aw_scraper-main/api/routes/search.py
from __future__ import annotations

import os
from flask import Blueprint, jsonify, request

bp = Blueprint("search", __name__, url_prefix="/api/search")

@bp.get("/web")
def web_search():
    # Fail fast on missing config, but the blueprint still exists
    searx_url = os.getenv("SEARX_BASE_URL", "http://localhost:8081")
    
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify({"error": "missing query param q"}), 400

    # Import heavy deps lazily to avoid import-time crashes
    import requests

    try:
        # Adjust to your searx API; common path is /search with format=json
        # e.g. GET {searx_url}/search?q={q}&format=json
        r = requests.get(f"{searx_url.rstrip('/')}/search",
                         params={"q": q, "format": "json"}, timeout=15)
        r.raise_for_status()
        data = r.json()
        
        # Format results for dashboard
        formatted_results = []
        if 'results' in data:
            for result in data['results']:
                formatted_results.append({
                    'title': result.get('title', ''),
                    'url': result.get('url', ''),
                    'description': result.get('content', ''),
                    'source': result.get('engines', []),
                    'published_date': result.get('publishedDate', ''),
                    'score': result.get('score', 0)
                })
        
        return jsonify({
            'success': True,
            'data': {
                'query': q,
                'results': formatted_results,
                'total_results': len(formatted_results),
                'search_metadata': {
                    'query_time': data.get('query_time', 0),
                    'total_results_estimate': data.get('number_of_results', 0)
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 502
