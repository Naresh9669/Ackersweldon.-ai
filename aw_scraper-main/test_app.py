#!/usr/bin/env python3
"""
Minimal test Flask app to test search blueprint registration
"""

from flask import Flask, jsonify

app = Flask(__name__)

# Register search blueprint
from api.routes.search import bp as search_bp
app.register_blueprint(search_bp)

@app.route("/health")
def health():
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(debug=True, port=5001)
