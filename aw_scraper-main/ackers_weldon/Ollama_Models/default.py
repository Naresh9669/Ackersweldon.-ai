from bs4 import BeautifulSoup
import requests
import ast
import os

def getCategory(paragraphs : str, llm_model = "llama3.1:8b", API = None) -> list:
    '''
    This function takes in a paragraph and returns a list of categories that it falls into.
    
    @Params:
        * paragraphs: String -- The paragraph to be analyzed
        * llm_model: string -- by default it is going to use `llama3.2:latest` but you can change it to any other model that is available on your server
    
    @Returns:
        * list -- A list of categories that the paragraph falls into
    '''
    # Use external Ollama server
    if API is None:
        API = os.getenv("OLLAMA_BASE_URL", "http://3.80.91.238:11434")
    
    try:
        response = requests.post(
            f"{API}/api/chat",
            json={
                "model": llm_model,
                "messages": [
                    {
                        'role': 'user',
                        'content': "Analyze the categories in which this paragraphs falls in. Use the categories provided below: ['Technology', 'Green Energy', 'Economics', 'Stock Market', 'Science', 'Medical', 'Cryptocurrency']. IMPORTANT: Do not add additional text only output the categories and output the categories in a literal python list format.",
                    },
                    {
                        'role': 'user',
                        'content': paragraphs,
                    }
                ],
                "stream": False
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            response_data = response.json()
            return list(ast.literal_eval(response_data['message']['content']))
        else:
            print(f"Error from Ollama server: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"Error calling Ollama server: {str(e)}")
        return []


def getSummary(html_text : str, llm_model = "llama3.1:8b", API = None) -> str:
    '''
    This function takes parses an HTML string block to an `llm` (by default it uses llama3.2:latest). It returns a summary of the content of the HTML string block.
    
    @Params:
        * html_text: *str* - The HTML string block that you want to parse
    
    @Optional-Params:
        * llm_model: *str* - The model to use for parsing the HTML. Default is `llama3.2:latest`
        * API : *str* - The default endpoint is the ollama's provided endpoint.
    
    @Returns:
        `str` - Summary of the content of the HTML string block.
    '''
    # Use external Ollama server
    if API is None:
        API = os.getenv("OLLAMA_BASE_URL", "http://3.80.91.238:11434")
    
    try:
        response = requests.post(
            f"{API}/api/chat",
            json={
                "model": llm_model,
                "messages": [
                    {
                        'role': 'user',
                        'content': "Make a concise and detail summary in about 250 to 500 words based on the article extract provided below.",
                    },
                    {
                        'role': 'user',
                        'content': "IMPORTANT DO NOT IGNORE: Do not add any personal comment or additional texts apart from the summary. Additionally, if the input text provided is empty and or undefined, output: \"Page Could not be processed due to IP ban\".",
                    },
                    {
                        'role': 'user',
                        'content': html_text,
                    }
                ],
                "stream": False
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            response_data = response.json()
            return response_data['message']['content']
        else:
            print(f"Error from Ollama server: {response.status_code}")
            return "Page Could not be processed due to server error"
            
    except Exception as e:
        print(f"Error calling Ollama server: {str(e)}")
        return "Page Could not be processed due to connection error"


def getServerRequestSummary(html_text:str, llm_model = "llama3.2:latest", API = None) -> str:
    if API is None:
        API = os.getenv('OLLAMA_API_URL', 'http://192.168.100.78:5001/api/chatnostream')
    '''
    '''
    request = {
        "model": llm_model,
        "messages": [
            {
                'role' : 'user',
                'content': "Make a concise and detail summary in about 250 to 500 words based on the article extract provided below.",
            },
            {
                'role' : 'user',
                'content': "IMPORTANT DO NOT IGNORE: Do not add any personal comment or additional texts apart from the summary. Additionally, if the input text provided is empty and or undefined, output: \"Page Could not be processed due to IP ban\".",
            },
            {
                'role': 'user',
                'content': html_text,
            }
        ],
        "stream": False,
        "options": {"num_predict": 4096, "num_ctx": 8096},
        "keep_alive": 1800
    }

    headers={"Content-Type": "application/json"}

    try:
        res = requests.post(API, headers=headers, json=request)
    except:
        print("server summary failed!")
        return None
    print(f"\n\n{res.json()['message']['content']}\n\n")
    return res.json()["message"]["content"]

def getServerRequestCategory(html_text:str, llm_model = "llama3.2:latest", API = None) -> list:
    if API is None:
        API = os.getenv('OLLAMA_API_URL', 'http://192.168.100.78:5001/api/chatnostream')
    '''
    '''
    request = {
        "model": llm_model,
        "messages": [
            {
                "role": "user",
                "Content": "Analyze the categories in which this paragraphs falls in. Use the categories provided below: ['Technology', 'Green Energy', 'Economics', 'Stock Market', 'Science', 'Medical', 'Cryptocurrency']. IMPORTANT: Do not add additional text only output the categories in a literal python list format." 
            },
            {
                'role': 'user',
                'content': html_text,
            }
        ],
        "stream": False,
        "options": {"num_predict": 4096, "num_ctx": 8096},
        "keep_alive": 1800
    }

    headers={"Content-Type": "application/json"}

    try:
        res = requests.post(API, headers=headers, json=request)
    except:
        print("Server Category failed!")
        return []
    
    # print(res.json())
    # print(list(ast.literal_eval(res['message']['content'])))
    return list(ast.literal_eval(res.json()['message']['content']))


def getBodyText(url : str):
    '''
    This function takes in a url and returns the HTML content of the page. **Add a check to see if the return value is a 404 error code.**
    
    @Params:
        * url:  *str* - The URL of the page you want to get the HTML content from.
    @Returns:
        `str` - The HTML content of the page.
        `int` - ERROR code  {404: "Not Found", 204: "No Content"}
    '''
    html = requests.get(url)

    if html.status_code == 200:
        soup = BeautifulSoup(html.text, 'html.parser')
        
        body_tag = soup.find('body')
        if body_tag:
            body_text = body_tag.get_text(strip=True)
            return body_text
        else:
            print("<body> tag not found")
            return 204
    
    else:
        print("page Not found!")
        return 404



