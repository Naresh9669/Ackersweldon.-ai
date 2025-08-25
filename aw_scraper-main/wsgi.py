#!/usr/bin/env python3
"""Production WSGI entry point for Dashboard API"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables from the root .env file in user's home directory
load_dotenv('/home/ubuntu/.env')

# Import the Flask app
from api_dashboard import app

if __name__ == "__main__":
    app.run()
