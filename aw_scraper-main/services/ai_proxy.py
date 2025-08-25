"""
Ollama AI Proxy Service
Connects to Ollama server for AI-powered features
"""

import os
import requests
import json
import logging
from typing import List, Dict, Any, Generator

logger = logging.getLogger(__name__)

class AIProxyService:
    def __init__(self, base_url=None):
        if base_url is None:
            base_url = os.getenv("OLLAMA_BASE_URL", "http://3.80.91.238:11434")
        self.base_url = base_url
        self.default_model = "llama3.2:3b"  # Default model, simplified to use 3B version
        
    def _make_request(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Make a request to the Ollama API"""
        try:
            url = f"{self.base_url}{endpoint}"
            response = requests.post(url, json=data, timeout=120)  # Increased timeout to 120 seconds
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama API request failed: {e}")
            return {"error": str(e)}
    
    def chat(self, messages: List[Dict[str, str]], model: str = None, stream: bool = False) -> Dict[str, Any]:
        """Chat with the AI model"""
        if not model:
            model = self.default_model
            
        data = {
            "model": model,
            "messages": messages,
            "stream": stream
        }
        
        if stream:
            return self._stream_chat(data)
        else:
            return self._make_request("/api/chat", data)
    
    def _stream_chat(self, data: Dict[str, Any]) -> Generator[Dict[str, Any], None, None]:
        """Handle streaming chat responses"""
        try:
            url = f"{self.base_url}/api/chat"
            response = requests.post(url, json=data, stream=True, timeout=120)  # Increased timeout to 120 seconds
            response.raise_for_status()
            
            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line.decode('utf-8'))
                        yield chunk
                    except json.JSONDecodeError:
                        continue
        except requests.exceptions.RequestException as e:
            logger.error(f"Streaming chat failed: {e}")
            yield {"error": str(e)}
    
    def summarize(self, text: str, tone: str = 'neutral', model: str = None) -> Dict[str, Any]:
        """Summarize text with specified tone"""
        if not model:
            model = self.default_model
            
        prompt = f"""Please provide a {tone} summary of the following text. 
        Focus on the key points and main ideas. Keep it concise but informative.
        
        Text: {text}
        
        Summary:"""
        
        messages = [{"role": "user", "content": prompt}]
        
        result = self._make_request("/api/chat", {
            "model": model,
            "messages": messages,
            "stream": False
        })
        
        if "error" not in result:
            return {
                "summary": result.get("message", {}).get("content", "Summary generation failed"),
                "tone": tone,
                "original_length": len(text),
                "model": model
            }
        else:
            return result
    
    def extract_entities(self, text: str, model: str = None) -> Dict[str, Any]:
        """Extract named entities from text"""
        if not model:
            model = self.default_model
            
        prompt = f"""Please extract the key entities from the following text. 
        Identify people, organizations, locations, dates, and key topics.
        Return them as a JSON list with categories.
        
        Text: {text}
        
        Entities:"""
        
        messages = [{"role": "user", "content": prompt}]
        
        result = self._make_request("/api/chat", {
            "model": model,
            "messages": messages,
            "stream": False
        })
        
        if "error" not in result:
            try:
                # Try to parse the response as JSON
                content = result.get("message", {}).get("content", "")
                # Extract JSON from the response if it's wrapped in text
                if "{" in content and "}" in content:
                    start = content.find("{")
                    end = content.rfind("}") + 1
                    json_str = content[start:end]
                    entities = json.loads(json_str)
                else:
                    entities = {"entities": [content.strip()]}
                
                return {
                    "entities": entities,
                    "confidence": 0.9,
                    "model": model
                }
            except json.JSONDecodeError:
                return {
                    "entities": {"entities": [result.get("message", {}).get("content", "Entity extraction failed")]},
                    "confidence": 0.7,
                    "model": model
                }
        else:
            return result
    
    def analyze_sentiment(self, text: str, model: str = None) -> Dict[str, Any]:
        """Analyze sentiment of text"""
        if not model:
            model = self.default_model
            
        prompt = f"""Analyze the sentiment of this text and respond with ONLY a valid JSON object.

Text: {text}

Respond with ONLY this JSON format, no other text:
{{
    "sentiment": "positive|negative|neutral",
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation of why this sentiment was chosen"
}}"""
        
        messages = [{"role": "user", "content": prompt}]
        
        result = self._make_request("/api/chat", {
            "model": model,
            "messages": messages,
            "stream": False
        })
        
        if "error" not in result:
            try:
                content = result.get("message", {}).get("content", "")
                # Look for JSON content in the response
                if "{" in content and "}" in content:
                    start = content.find("{")
                    end = content.rfind("}") + 1
                    json_str = content[start:end]
                    
                    # Clean up the JSON string - remove any extra whitespace or newlines
                    json_str = json_str.strip()
                    
                    # Try to parse the JSON
                    analysis = json.loads(json_str)
                    
                    # Validate the required fields
                    if all(key in analysis for key in ["sentiment", "confidence", "reasoning"]):
                        return {
                            "sentiment": analysis["sentiment"],
                            "confidence": analysis["confidence"],
                            "reasoning": analysis["reasoning"],
                            "model": model
                        }
                    else:
                        # Missing required fields, use what we have
                        return {
                            "sentiment": analysis.get("sentiment", "neutral"),
                            "confidence": analysis.get("confidence", 0.5),
                            "reasoning": analysis.get("reasoning", "Partial analysis - missing fields"),
                            "model": model
                        }
                else:
                    # No JSON found, try to extract sentiment from text
                    content_lower = content.lower()
                    if any(word in content_lower for word in ["positive", "good", "great", "excellent", "love", "amazing"]):
                        return {
                            "sentiment": "positive",
                            "confidence": 0.7,
                            "reasoning": "Text analysis indicates positive sentiment based on enthusiastic language",
                            "model": model
                        }
                    elif any(word in content_lower for word in ["negative", "bad", "terrible", "hate", "awful"]):
                        return {
                            "sentiment": "negative",
                            "confidence": 0.7,
                            "reasoning": "Text analysis indicates negative sentiment based on critical language",
                            "model": model
                        }
                    else:
                        return {
                            "sentiment": "neutral",
                            "confidence": 0.5,
                            "reasoning": "Text analysis indicates neutral sentiment - no strong positive or negative indicators",
                            "model": model
                        }
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing failed for sentiment analysis: {e}")
                logger.error(f"Content received: {content}")
                # Try to extract sentiment from text as fallback
                content_lower = content.lower()
                if any(word in content_lower for word in ["positive", "good", "great", "excellent", "love", "amazing"]):
                    return {
                        "sentiment": "positive",
                        "confidence": 0.6,
                        "reasoning": "AI analysis indicates positive sentiment",
                        "model": model
                    }
                elif any(word in content_lower for word in ["negative", "bad", "terrible", "hate", "awful"]):
                    return {
                        "sentiment": "negative",
                        "confidence": 0.6,
                        "reasoning": "AI analysis indicates negative sentiment",
                        "model": model
                    }
                else:
                    return {
                        "sentiment": "neutral",
                        "confidence": 0.5,
                        "reasoning": "AI analysis indicates neutral sentiment",
                        "model": model
                    }
        else:
            return result
    
    def get_available_models(self) -> List[str]:
        """Get list of available models from Ollama"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=10)
            if response.status_code == 200:
                models = response.json().get("models", [])
                return [model["name"] for model in models]
            else:
                return [self.default_model]
        except requests.exceptions.RequestException:
            return [self.default_model]
    
    def stream_chat(self, message: str, context: str = '', model: str = None) -> Generator[Dict[str, Any], None, None]:
        """Stream chat with context"""
        if not model:
            model = self.default_model
            
        messages = []
        if context:
            messages.append({"role": "system", "content": context})
        messages.append({"role": "user", "content": message})
        
        return self._stream_chat({
            "model": model,
            "messages": messages,
            "stream": True
        })
