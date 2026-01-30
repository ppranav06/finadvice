"""
Test script to debug Gemini API issues.
Tests increasing complexity to find where it fails.
"""

import os
import time

# Set the API key directly for testing
API_KEY = "AIzaSyBYR2dgrMd_y2eH31Yvue5EkpxA43lAOUc"
MODEL = "gemini-3-flash-preview"

print(f"🔑 Using API Key: {API_KEY[:20]}...")
print(f"🤖 Using Model: {MODEL}")
print("=" * 60)

# Test 1: Basic HTTP request (like your working curl)
print("\n📋 TEST 1: Basic HTTP request (raw requests library)")
try:
    import requests
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": API_KEY
    }
    data = {
        "contents": [{"parts": [{"text": "Say hello"}]}]
    }
    
    response = requests.post(url, headers=headers, json=data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        text = result['candidates'][0]['content']['parts'][0]['text']
        print(f"   ✅ Response: {text[:100]}...")
    else:
        print(f"   ❌ Error: {response.text[:200]}")
except Exception as e:
    print(f"   ❌ Exception: {e}")

time.sleep(1)

# Test 2: Using google-genai SDK - simple text
print("\n📋 TEST 2: google-genai SDK - simple text generation")
try:
    from google import genai
    from google.genai import types
    
    client = genai.Client(api_key=API_KEY)
    
    response = client.models.generate_content(
        model=MODEL,
        contents="What is 2+2?"
    )
    
    print(f"   ✅ Response: {response.text[:100]}...")
except Exception as e:
    print(f"   ❌ Exception: {e}")

time.sleep(1)

# Test 3: Using google-genai SDK with Content objects
print("\n📋 TEST 3: google-genai SDK - with Content objects")
try:
    from google import genai
    from google.genai import types
    
    client = genai.Client(api_key=API_KEY)
    
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text="What is the capital of France?")]
        )
    ]
    
    response = client.models.generate_content(
        model=MODEL,
        contents=contents
    )
    
    print(f"   ✅ Response: {response.text[:100]}...")
except Exception as e:
    print(f"   ❌ Exception: {e}")

time.sleep(1)

# Test 4: With system instruction
print("\n📋 TEST 4: google-genai SDK - with system instruction")
try:
    from google import genai
    from google.genai import types
    
    client = genai.Client(api_key=API_KEY)
    
    config = types.GenerateContentConfig(
        system_instruction="You are a helpful assistant. Always respond in English."
    )
    
    response = client.models.generate_content(
        model=MODEL,
        contents="Hello, how are you?",
        config=config
    )
    
    print(f"   ✅ Response: {response.text[:100]}...")
except Exception as e:
    print(f"   ❌ Exception: {e}")

time.sleep(1)

# Test 5: With function declarations (tools)
print("\n📋 TEST 5: google-genai SDK - with function declarations")
try:
    from google import genai
    from google.genai import types
    
    client = genai.Client(api_key=API_KEY)
    
    # Define a simple function
    functions = [
        types.FunctionDeclaration(
            name="get_weather",
            description="Get the weather for a city",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "city": types.Schema(
                        type=types.Type.STRING,
                        description="The city name"
                    )
                },
                required=["city"]
            )
        )
    ]
    
    tools = [types.Tool(function_declarations=functions)]
    
    config = types.GenerateContentConfig(
        system_instruction="You are a helpful assistant.",
        tools=tools
    )
    
    response = client.models.generate_content(
        model=MODEL,
        contents="What's the weather in Tokyo?",
        config=config
    )
    
    # Check if it's a function call or text
    if response.candidates and response.candidates[0].content.parts:
        part = response.candidates[0].content.parts[0]
        if part.function_call:
            print(f"   ✅ Function call: {part.function_call.name}({dict(part.function_call.args)})")
        elif part.text:
            print(f"   ✅ Text response: {part.text[:100]}...")
        else:
            print(f"   ⚠️ Unknown part type: {part}")
    else:
        print(f"   ⚠️ No candidates or parts")
except Exception as e:
    print(f"   ❌ Exception: {e}")
    import traceback
    traceback.print_exc()

time.sleep(1)

# Test 6: Function call with response
print("\n📋 TEST 6: google-genai SDK - function call + response loop")
try:
    from google import genai
    from google.genai import types
    
    client = genai.Client(api_key=API_KEY)
    
    # Define a simple function
    functions = [
        types.FunctionDeclaration(
            name="get_balance",
            description="Get the user's account balance",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={},
                required=[]
            )
        )
    ]
    
    tools = [types.Tool(function_declarations=functions)]
    
    config = types.GenerateContentConfig(
        system_instruction="You are a financial assistant. Use the get_balance function to answer balance questions.",
        tools=tools
    )
    
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text="What is my balance?")]
        )
    ]
    
    # First request
    print("   Sending initial request...")
    response = client.models.generate_content(
        model=MODEL,
        contents=contents,
        config=config
    )
    
    # Check for function call
    if response.candidates and response.candidates[0].content.parts:
        part = response.candidates[0].content.parts[0]
        if part.function_call:
            print(f"   📞 Function call: {part.function_call.name}")
            
            # Add model's response to contents
            contents.append(response.candidates[0].content)
            
            # Add function response
            contents.append(types.Content(
                role="user",
                parts=[types.Part.from_function_response(
                    name="get_balance",
                    response={"balance": 4127002.50, "formatted": "₹41.27L"}
                )]
            ))
            
            print("   Sending function response...")
            
            # Second request with function response
            response = client.models.generate_content(
                model=MODEL,
                contents=contents,
                config=config
            )
            
            if response.candidates and response.candidates[0].content.parts:
                for p in response.candidates[0].content.parts:
                    if p.text:
                        print(f"   ✅ Final response: {p.text[:150]}...")
                        break
            else:
                print(f"   ⚠️ No response after function call")
                print(f"   Candidates: {response.candidates}")
        else:
            print(f"   Text response (no function call): {part.text[:100]}...")
except Exception as e:
    print(f"   ❌ Exception: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("✅ Tests complete!")
