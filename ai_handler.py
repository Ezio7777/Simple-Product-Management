import os
from google import genai
from dotenv import load_dotenv

# Load key from your key.env
load_dotenv("key.env")

# Initialize the NEW Client for 2026
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def get_warehouse_advice(user_query, product_data):
    """
    Sends user query + DB context to Gemini.
    product_data: A list of dicts like [{'name': 'Laptop', 'quantity': 2}, ...]
    """
    system_instruction = f"""
    You are the ProMan Warehouse Expert. 
    Current Inventory Data: {product_data}
    
    Instructions:
    1. Answer based ONLY on the inventory data provided above.
    2. If stock is below 5, suggest restocking that specific item.
    3. If the user asks for a summary, tell them total items and total value.
    4. Keep answers short, helpful, and professional.
    """
    
    try:
        response = client.models.generate_content(
            model="models/gemini-2.5-flash-lite", 
            contents=f"System Context: {system_instruction}\nUser Question: {user_query}"
        )
        return response.text
    except Exception as e:
        return f"AI Error: {str(e)}"