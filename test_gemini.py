import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key="AIzaSyDIXFi83mOj5FRSLkYo731VRQdvmieCQNQ")

models_to_test = [
    "models/gemini-1.5-flash",
    "gemini-1.5-flash",
    "models/gemini-pro",
    "gemini-pro",
    "models/gemini-1.0-pro",
    "gemini-1.0-pro"
]

for model_name in models_to_test:
    print(f"Testing {model_name}...")
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hello")
        print(f"SUCCESS with {model_name}")
        break
    except Exception as e:
        print(f"FAILED {model_name}: {e}")
