from google import genai
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

api_key = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=api_key)

print("Modelos disponibles para generar contenido:")
for m in client.models.list():
    if 'generateContent' in m.supported_actions:
        print(f"-> {m.name}")