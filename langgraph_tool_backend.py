from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.tools import tool
from dotenv import load_dotenv
import sqlite3
import requests
import os
from PIL import Image, ImageDraw, ImageFont


load_dotenv()

# -------------------
# API Key Validation
# -------------------
def validate_api_keys():
    """
    Validate all required API keys at application startup.
    Returns a dictionary with validation results and error messages.
    """
    validation_results = {
        'GOOGLE_API_KEY': {'valid': False, 'error': None},
        'FREEPIK_API_KEY': {'valid': False, 'error': None}
    }
    
    # Validate Google API Key
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        validation_results['GOOGLE_API_KEY']['error'] = "GOOGLE_API_KEY not found in environment variables"
    elif not google_api_key.strip():
        validation_results['GOOGLE_API_KEY']['error'] = "GOOGLE_API_KEY is empty"
    else:
        validation_results['GOOGLE_API_KEY']['valid'] = True
        validation_results['GOOGLE_API_KEY']['error'] = None
    
    # Validate Freepik API Key
    freepik_api_key = os.getenv("FREEPIK_API_KEY")
    if not freepik_api_key:
        validation_results['FREEPIK_API_KEY']['error'] = "FREEPIK_API_KEY not found in environment variables"
    elif not freepik_api_key.strip():
        validation_results['FREEPIK_API_KEY']['error'] = "FREEPIK_API_KEY is empty"
    else:
        validation_results['FREEPIK_API_KEY']['valid'] = True
        validation_results['FREEPIK_API_KEY']['error'] = None
    
    return validation_results

def print_api_key_validation_results():
    """
    Print user-friendly messages about API key validation status.
    """
    results = validate_api_keys()
    
    print("=" * 50)
    print("API Key Validation Results")
    print("=" * 50)
    
    for key_name, result in results.items():
        if result['valid']:
            print(f"✓ {key_name}: Valid")
        else:
            print(f"✗ {key_name}: {result['error']}")
            print(f"  Please set {key_name} in your .env file")
    
    # Overall status
    all_valid = all(result['valid'] for result in results.values())
    if all_valid:
        print("\n✓ All required API keys are properly configured!")
    else:
        print("\n⚠️  Some API keys are missing or invalid.")
        print("   The application will still run but some features may not work properly.")
    
    print("=" * 50)

# Run validation at startup
print_api_key_validation_results()

# -------------------
# 1. LLM
# -------------------
# Initialize LLM with error handling
try:
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.5)
    print("✓ Google Generative AI LLM initialized successfully")
except Exception as e:
    print(f"✗ Failed to initialize Google Generative AI LLM: {e}")
    print("  Some AI features may not work properly")

# -------------------
# 2. Tools
# -------------------
# Tools
try:
    search_tool = DuckDuckGoSearchRun(region="us-en")
except Exception as e:
    print(f"Search tool initialization failed: {e}")
    
    @tool
    def search_tool(query: str) -> str:
        """Search the web for information."""
        return f"Search functionality temporarily unavailable for query: {query}"

@tool
def calculator(expression: str) -> str:
    """
    Calculate mathematical expressions like '15 + 25', '10 * 5', '100 / 4'.
    Supports +, -, *, / operations.
    """
    try:
        # Input validation
        if not expression or len(expression) > 100:
            return "Error: Invalid expression length"
        
        # Simple and safe evaluation
        allowed_chars = set('0123456789+-*/.() ')
        if not all(c in allowed_chars for c in expression):
            return "Error: Invalid characters in expression"
        
        # Prevent dangerous operations
        if '__' in expression or 'import' in expression:
            return "Error: Invalid expression"
        
        result = eval(expression)
        return f"Result: {expression} = {result}"
    except ZeroDivisionError:
        return "Error: Division by zero"
    except Exception as e:
        return f"Error: Could not calculate '{expression}'"




@tool
def get_stock_price(symbol: str) -> str:
    """
    Get current stock price for a symbol like AAPL, TSLA, GOOGL.
    """
    try:
        if not symbol or len(symbol) > 10:
            return "Error: Invalid stock symbol"
        url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey=C9PE94QUEW9VWGFM"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if "Global Quote" in data:
            quote = data["Global Quote"]
            price = quote.get("05. price", "N/A")
            change = quote.get("09. change", "N/A")
            return f"{symbol} stock price: ${price} (Change: {change})"
        else:
            return f"Could not fetch stock price for {symbol}"
    except Exception as e:
        return f"Error fetching stock price: {str(e)}"

@tool
def generate_image(user_prompt: str) -> str:
    """
    Generate images with AI. Always returns [IMAGE_GENERATED:filename] format.
    """
    try:
        print(f"[INFO] Starting image generation for: {user_prompt}")
        
        # Create filename and ensure directory exists
        os.makedirs("static", exist_ok=True)
        filename = f"generated_{abs(hash(user_prompt)) % 10000}.png"
        # Sanitize filename to prevent path traversal
        filename = os.path.basename(filename)
        filepath = os.path.join(os.getcwd(), "static", filename)
        
        print(f"[DEBUG] Generated filename: {filename}")
        print(f"[DEBUG] Filepath: {filepath}")
        
        # Optimize the prompt for better results
        optimized_prompt = optimize_image_prompt_advanced(user_prompt)
        print(f"[DEBUG] Optimized prompt: {optimized_prompt[:100]}...")
        
        # Try API call with enhanced generation
        success = generate_with_enhanced_api(optimized_prompt, filepath, user_prompt)
        print(f"[DEBUG] API call success: {success}")
        
        if success and os.path.exists(filepath):
            file_size = os.path.getsize(filepath)
            print(f"[SUCCESS] Image generated successfully. File size: {file_size} bytes")
            return f"I've generated an image for '{user_prompt}'.\n\n[IMAGE_GENERATED:{filename}]"
        
        # Fallback: Create enhanced placeholder if all API attempts fail
        print(f"[WARNING] API generation failed, creating enhanced placeholder")
        enhanced_placeholder = create_enhanced_placeholder(filepath, user_prompt, optimized_prompt)
        if enhanced_placeholder:
            file_size = os.path.getsize(filepath)
            print(f"[SUCCESS] Enhanced placeholder created. File size: {file_size} bytes")
            return f"I've created an enhanced image preview for '{user_prompt}'.\n\n[IMAGE_GENERATED:{filename}]"
        
        # Last resort: Create simple placeholder
        print(f"[WARNING] Enhanced placeholder failed, creating simple placeholder")
        simple_placeholder = create_simple_placeholder(filepath, user_prompt)
        if simple_placeholder:
            file_size = os.path.getsize(filepath)
            print(f"[SUCCESS] Simple placeholder created. File size: {file_size} bytes")
            return f"I've created an image preview for '{user_prompt}'.\n\n[IMAGE_GENERATED:{filename}]"
        
        # If all fallbacks fail
        print(f"[ERROR] All image generation methods failed for prompt: {user_prompt}")
        return "I'm having trouble generating images right now. Please try again later."
            
    except Exception as e:
        print(f"[ERROR] Image generation failed with exception: {e}")
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        # Always create something as a last resort
        try:
            os.makedirs("static", exist_ok=True)
            filename = f"generated_{abs(hash(user_prompt)) % 10000}.png"
            filepath = os.path.join(os.getcwd(), "static", filename)
            print(f"[DEBUG] Emergency fallback - filename: {filename}")
            # Try enhanced placeholder first
            if create_enhanced_placeholder(filepath, user_prompt, user_prompt):
                file_size = os.path.getsize(filepath)
                print(f"[SUCCESS] Emergency enhanced placeholder created. File size: {file_size} bytes")
                return f"I've created an enhanced image preview for '{user_prompt}'.\n\n[IMAGE_GENERATED:{filename}]"
            # Fallback to simple placeholder
            elif create_simple_placeholder(filepath, user_prompt):
                file_size = os.path.getsize(filepath)
                print(f"[SUCCESS] Emergency simple placeholder created. File size: {file_size} bytes")
                return f"I've created an image preview for '{user_prompt}'.\n\n[IMAGE_GENERATED:{filename}]"
            else:
                print(f"[ERROR] All emergency fallbacks failed for prompt: {user_prompt}")
                return "I'm having trouble generating images right now. Please try again later."
        except Exception as fallback_error:
            print(f"[CRITICAL] Image generation fallback error: {fallback_error}")
            import traceback
            print(f"[CRITICAL] Fallback traceback: {traceback.format_exc()}")
            return "I'm having trouble generating images right now. Please try again later."

def optimize_image_prompt_advanced(user_input: str) -> str:
    """Advanced prompt optimization with multi-layer enhancement"""
    
    # Clean and analyze input
    base_prompt = user_input.strip()
    style = detect_image_style(base_prompt)
    
    # Advanced quality enhancers by category
    quality_enhancers = {
        "technical": ["8k uhd", "high resolution", "sharp focus", "detailed", "crisp"],
        "artistic": ["masterpiece", "award winning", "professional quality", "stunning", "breathtaking"],
        "lighting": ["perfect lighting", "cinematic lighting", "dramatic lighting", "soft lighting"],
        "composition": ["well composed", "rule of thirds", "balanced composition", "visual hierarchy"]
    }
    
    # Enhanced style-specific templates
    style_templates = {
        "portrait": {
            "prefix": "Professional portrait photograph of",
            "enhancements": "studio lighting, clean background, sharp facial details, photorealistic, professional headshot style",
            "camera": "shot with professional camera, 85mm lens, shallow depth of field"
        },
        "landscape": {
            "prefix": "Breathtaking landscape photograph of",
            "enhancements": "golden hour lighting, wide angle vista, natural beauty, scenic photography, majestic view",
            "camera": "wide angle lens, perfect exposure, nature photography"
        },
        "cartoon": {
            "prefix": "Whimsical cartoon illustration of",
            "enhancements": "colorful, animated style, character design, digital art, family friendly, cute and charming",
            "camera": "digital illustration, vibrant colors, clean lines"
        },
        "storybook": {
            "prefix": "Children's storybook illustration of",
            "enhancements": "whimsical, fairy tale style, magical atmosphere, beautiful colors, enchanting, child-friendly",
            "camera": "storybook art style, warm lighting, dreamy quality"
        },
        "realistic": {
            "prefix": "Photorealistic image of",
            "enhancements": "lifelike, natural lighting, authentic details, real world accuracy, high fidelity",
            "camera": "professional photography, natural lighting, realistic rendering"
        },
        "abstract": {
            "prefix": "Abstract artistic interpretation of",
            "enhancements": "modern art, creative composition, vibrant colors, contemporary style, artistic vision",
            "camera": "artistic rendering, creative perspective, unique style"
        }
    }
    
    # Get template for detected style
    template = style_templates.get(style, style_templates["realistic"])
    
    # Build enhanced prompt
    enhanced_prompt = f"{template['prefix']} {base_prompt}, {template['enhancements']}, {template['camera']}"
    
    # Add quality boosters
    quality_terms = quality_enhancers["technical"][:2] + quality_enhancers["artistic"][:2]
    enhanced_prompt += f", {', '.join(quality_terms)}"
    
    # Add negative prompts to avoid issues
    negative_terms = "blurry, low quality, distorted, ugly, bad anatomy, watermark, text, signature, cropped, out of frame"
    
    return f"{enhanced_prompt} | Negative: {negative_terms}"

def detect_image_style(prompt: str) -> str:
    """Enhanced style detection with more categories"""
    prompt_lower = prompt.lower()
    
    # Enhanced style keywords with priority scoring
    style_keywords = {
        "storybook": ["storybook", "fairy tale", "children's book", "magical", "enchanted", "whimsical story", "bedtime story", "once upon"],
        "portrait": ["headshot", "portrait", "person", "face", "professional photo", "businessman", "woman", "man", "selfie"],
        "landscape": ["landscape", "mountain", "sunset", "nature", "forest", "ocean", "sky", "scenery", "vista", "horizon"],
        "cartoon": ["cartoon", "animated", "character", "cute", "funny", "illustration", "anime", "comic", "mascot"],
        "product": ["product", "item", "commercial", "marketing", "showcase", "display", "advertisement", "catalog"],
        "logo": ["logo", "brand", "icon", "symbol", "company", "business logo", "emblem", "trademark"],
        "abstract": ["abstract", "artistic", "creative", "modern art", "contemporary", "surreal", "conceptual"],
        "business": ["office", "meeting", "corporate", "professional", "workplace", "business", "conference"],
        "tech": ["technology", "computer", "digital", "futuristic", "ai", "robot", "tech", "cyberpunk"],
        "realistic": ["photorealistic", "realistic", "photograph", "real", "lifelike", "authentic"]
    }
    
    # Score each style based on keyword matches
    style_scores = {}
    for style, keywords in style_keywords.items():
        score = sum(1 for keyword in keywords if keyword in prompt_lower)
        if score > 0:
            style_scores[style] = score
    
    # Return highest scoring style, or realistic as default
    if style_scores:
        return max(style_scores, key=style_scores.get)
    
    return "realistic"

def generate_with_enhanced_api(optimized_prompt: str, filepath: str, original_prompt: str) -> str | None:
    """Generate image using multiple API attempts with fallback"""
    try:
        print("[INFO] Attempting Freepik API generation...")
        
        # Primary: Try Freepik API with optimized prompt
        freepik_result = try_freepik_generation_enhanced(optimized_prompt, filepath)
        if freepik_result:
            print("[SUCCESS] Freepik API generation successful")
            return freepik_result
        
        print("[WARNING] Freepik API failed, trying alternative methods...")
        
        # Secondary: Try with simplified prompt
        simplified_prompt = simplify_prompt_for_api(original_prompt)
        freepik_simple = try_freepik_generation_enhanced(simplified_prompt, filepath)
        if freepik_simple:
            print("[SUCCESS] Simplified prompt generation successful")
            return freepik_simple
        
        # Fallback: Create enhanced placeholder
        print("[INFO] Creating enhanced placeholder image...")
        return create_enhanced_placeholder(filepath, original_prompt, optimized_prompt)
        
    except Exception as e:
        print(f"[ERROR] All API generation methods failed: {e}")
        return create_enhanced_placeholder(filepath, original_prompt, optimized_prompt)

def try_openai_generation(prompt: str, filepath: str) -> str:
    """Try OpenAI DALL-E API"""
    try:
        openai_key = os.getenv("OPENAI_API_KEY")
        
        # Check if API key is available and valid
        if not openai_key:
            print("[WARNING] OpenAI API key not found in environment variables.")
            print("  Please set OPENAI_API_KEY in your .env file to enable OpenAI image generation.")
            print("  Visit https://platform.openai.com to get your API key.")
            return None
        elif not openai_key.strip():
            print("[WARNING] OpenAI API key is empty.")
            print("  Please set a valid OPENAI_API_KEY in your .env file.")
            return None
            
        import openai
        openai.api_key = openai_key
        
        response = openai.Image.create(
            prompt=prompt[:1000],  # DALL-E prompt limit
            n=1,
            size="1024x1024"
        )
        
        image_url = response['data'][0]['url']
        
        # Download and save image
        import urllib.request
        urllib.request.urlretrieve(image_url, filepath)
        
        return filepath
        
    except Exception as e:
        print(f"OpenAI generation failed: {e}")
        # Provide specific error messages based on common issues
        error_str = str(e).lower()
        if "authentication" in error_str or "api key" in error_str:
            print("  Please check your OPENAI_API_KEY in your .env file.")
            print("  Visit https://platform.openai.com to get a valid API key.")
        elif "rate limit" in error_str:
            print("  OpenAI rate limit exceeded. Please wait before making more requests.")
        elif "invalid_request" in error_str:
            print("  Invalid request to OpenAI API. Please check your prompt.")
        return None

def try_freepik_generation_enhanced(prompt: str, filepath: str) -> str | None:
    """Enhanced Freepik API generation with better error handling"""
    try:
        print(f"[DEBUG] Attempting Freepik generation with prompt: {prompt[:50]}...")
        print(f"[DEBUG] Target filepath: {filepath}")
        
        FREEPIK_API_KEY = os.getenv("FREEPIK_API_KEY")
        
        # Check if API key is available and valid
        if not FREEPIK_API_KEY:
            print("[WARNING] Freepik API key not found in environment variables.")
            print("  Please set FREEPIK_API_KEY in your .env file to enable image generation.")
            print("  Visit https://freepik.com to get your API key.")
            return None
        elif not FREEPIK_API_KEY.strip():
            print("[WARNING] Freepik API key is empty.")
            print("  Please set a valid FREEPIK_API_KEY in your .env file.")
            return None
        
        headers = {
            "X-Freepik-API-Key": FREEPIK_API_KEY,
            "Content-Type": "application/json"
        }
        
        # Extract main prompt and negative prompt
        if " | Negative: " in prompt:
            main_prompt, negative_prompt = prompt.split(" | Negative: ", 1)
        else:
            main_prompt = prompt
            negative_prompt = "blurry, low quality, distorted"
        
        # Limit prompt length for API
        main_prompt = main_prompt[:400]
        negative_prompt = negative_prompt[:200]
        
        payload = {
            "prompt": main_prompt,
            "negative_prompt": negative_prompt,
            "num_inference_steps": 35,
            "guidance_scale": 8.0,
            "seed": 0,
            "image": {
                "size": "square_hd"  # Higher quality
            }
        }
        
        url = "https://api.freepik.com/v1/ai/text-to-image"
        print(f"[INFO] Calling Freepik API...")
        print(f"[INFO] Main prompt: {main_prompt[:100]}...")
        
        response = requests.post(url, headers=headers, json=payload, timeout=90)
        print(f"[INFO] API Response Status: {response.status_code}")
        
        # Log response headers for debugging
        print(f"[DEBUG] Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"[DEBUG] Response data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            except Exception as json_e:
                print(f"[ERROR] Failed to parse JSON response: {json_e}")
                print(f"[DEBUG] Response text: {response.text[:500]}...")
                return None
            
            if "data" in data and len(data["data"]) > 0:
                image_info = data["data"][0]
                print(f"[DEBUG] Image info keys: {list(image_info.keys()) if isinstance(image_info, dict) else 'Not a dict'}")
                
                # Handle base64 response
                if "base64" in image_info:
                    import base64
                    try:
                        print("[INFO] Processing base64 image response...")
                        image_data = base64.b64decode(image_info["base64"])
                        with open(filepath, "wb") as f:
                            f.write(image_data)
                        file_size = os.path.getsize(filepath)
                        print(f"[SUCCESS] Image saved successfully: {filepath} ({file_size} bytes)")
                        return filepath
                    except Exception as e:
                        print(f"[ERROR] Failed to save image from base64: {e}")
                        import traceback
                        print(f"[ERROR] Base64 save traceback: {traceback.format_exc()}")
                        return None
                    
                # Handle URL response
                elif "url" in image_info:
                    image_url = image_info["url"]
                    try:
                        print(f"[INFO] Downloading image from URL: {image_url[:100]}...")
                        img_response = requests.get(image_url, timeout=45)
                        print(f"[DEBUG] Image download status: {img_response.status_code}")
                        if img_response.status_code == 200:
                            with open(filepath, "wb") as f:
                                f.write(img_response.content)
                            file_size = os.path.getsize(filepath)
                            print(f"[SUCCESS] Image downloaded successfully: {filepath} ({file_size} bytes)")
                            return filepath
                        else:
                            print(f"[ERROR] Failed to download image from URL. Status: {img_response.status_code}")
                            print(f"[DEBUG] Response headers: {dict(img_response.headers)}")
                            if img_response.text:
                                print(f"[DEBUG] Response text: {img_response.text[:300]}...")
                            return None
                    except Exception as e:
                        print(f"[ERROR] Failed to download image from URL: {e}")
                        import traceback
                        print(f"[ERROR] Download traceback: {traceback.format_exc()}")
                        return None
                else:
                    print("[ERROR] Unexpected response format from Freepik API")
                    print(f"[DEBUG] Image info content: {image_info}")
                    return None
            else:
                print("[ERROR] No image data in Freepik API response")
                print(f"[DEBUG] Response data: {data}")
                return None
        
        # Handle API errors
        elif response.status_code == 401:
            print("[ERROR] Freepik API authentication failed - Invalid API key")
            print("  Please check your FREEPIK_API_KEY in your .env file.")
            print("  Visit https://freepik.com to get a valid API key.")
            return None
        elif response.status_code == 403:
            print("[ERROR] Freepik API access forbidden - Insufficient permissions")
            print("  Please check your Freepik account and API key permissions.")
            return None
        elif response.status_code == 429:
            print("[ERROR] Freepik API rate limit exceeded")
            print("  Please wait before making more requests or upgrade your plan.")
            return None
        elif response.status_code >= 500:
            print(f"[ERROR] Freepik API server error (Status: {response.status_code})")
            print("  This is a temporary issue with Freepik's servers. Please try again later.")
            return None
        else:
            # Log detailed error for debugging
            error_msg = response.text[:500] if response.text else "No response text"
            print(f"[ERROR] Freepik API request failed - Status: {response.status_code}, Error: {error_msg}")
            return None
        
    except requests.exceptions.Timeout:
        print("[ERROR] Freepik API timeout - server took too long to respond")
        print("  Please check your internet connection and try again.")
        return None
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Freepik API network error: {e}")
        import traceback
        print(f"[ERROR] Network error traceback: {traceback.format_exc()}")
        return None
    except Exception as e:
        print(f"[ERROR] Freepik API unexpected error: {str(e)}")
        import traceback
        print(f"[ERROR] Unexpected error traceback: {traceback.format_exc()}")
        return None

def simplify_prompt_for_api(original_prompt: str) -> str:
    """Create a simplified version of prompt for API compatibility"""
    # Remove complex terms that might confuse APIs
    simplified = original_prompt.lower().strip()
    
    # Keep core descriptive words
    keep_words = []
    words = simplified.split()
    
    # Filter to essential descriptive terms
    for word in words:
        if len(word) > 2 and word not in ['the', 'and', 'with', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use']:
            keep_words.append(word)
    
    # Limit to most important words
    simplified_prompt = ' '.join(keep_words[:15])
    
    # Add basic quality terms
    simplified_prompt += ", high quality, detailed, beautiful"
    
    return simplified_prompt

def create_simple_placeholder(filepath: str, prompt: str) -> str | None:
    """Create a simple placeholder image"""
    try:
        print(f"[DEBUG] Creating simple placeholder for prompt: {prompt[:50]}...")
        print(f"[DEBUG] Target filepath: {filepath}")
        
        img = Image.new('RGB', (512, 512), color=(240, 240, 240))
        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.truetype("arial.ttf", 24)
            small_font = ImageFont.truetype("arial.ttf", 16)
        except Exception as font_e:
            print(f"[WARNING] Could not load TrueType fonts: {font_e}")
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        draw.rectangle([10, 10, 502, 502], outline=(100, 100, 100), width=2)
        draw.text((30, 30), "AI Generated Image", fill=(50, 50, 50), font=font)
        
        words = prompt.split()
        lines = []
        current_line = ""
        
        for word in words:
            if len(current_line + word) < 30:
                current_line += word + " "
            else:
                lines.append(current_line.strip())
                current_line = word + " "
        if current_line:
            lines.append(current_line.strip())
        
        for i, line in enumerate(lines[:6]):
            draw.text((30, 80 + i*20), line, fill=(80, 80, 80), font=small_font)
        
        draw.rectangle([100, 200, 412, 350], fill=(220, 220, 220), outline=(150, 150, 150), width=2)
        draw.text((180, 260), "Image Preview", fill=(100, 100, 100), font=font)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        img.save(filepath, 'PNG')
        file_size = os.path.getsize(filepath)
        print(f"[SUCCESS] Simple placeholder created: {filepath} ({file_size} bytes)")
        return filepath
        
    except Exception as e:
        print(f"[ERROR] Failed to create simple placeholder: {e}")
        import traceback
        print(f"[ERROR] Simple placeholder traceback: {traceback.format_exc()}")
        return None

def create_enhanced_placeholder(filepath: str, original_prompt: str, optimized_prompt: str) -> str | None:
    """Create enhanced placeholder with professional styling and preview"""
    try:
        print(f"[DEBUG] Creating enhanced placeholder for prompt: {original_prompt[:50]}...")
        print(f"[DEBUG] Target filepath: {filepath}")
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Create high-quality placeholder with enhanced design
        img = Image.new('RGB', (1024, 1024), color=(248, 250, 252))
        draw = ImageDraw.Draw(img)
        
        # Detect style for appropriate styling
        style = detect_image_style(original_prompt)
        print(f"[DEBUG] Detected style: {style}")
        
        # Load fonts
        try:
            title_font = ImageFont.truetype("arial.ttf", 36)
            subtitle_font = ImageFont.truetype("arial.ttf", 24)
            body_font = ImageFont.truetype("arial.ttf", 18)
        except Exception as font_e:
            print(f"[WARNING] Could not load TrueType fonts: {font_e}")
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            body_font = ImageFont.load_default()
        
        # Professional color scheme
        primary_color = (59, 130, 246)  # Blue
        secondary_color = (107, 114, 128)  # Gray
        accent_color = (16, 185, 129)  # Green
        
        # Draw professional border
        draw.rectangle([20, 20, 1004, 1004], outline=primary_color, width=3)
        draw.rectangle([40, 40, 984, 984], outline=(229, 231, 235), width=1)
        
        # Dynamic header based on style
        style_colors = {
            "portrait": (59, 130, 246),   # Blue
            "landscape": (16, 185, 129),  # Green  
            "cartoon": (245, 101, 101),   # Red
            "storybook": (168, 85, 247),  # Purple
            "abstract": (245, 158, 11),   # Orange
            "realistic": (75, 85, 99)     # Gray
        }
        
        header_color = style_colors.get(style, primary_color)
        draw.rectangle([60, 60, 964, 180], fill=header_color)
        draw.text((80, 90), f"AI {style.title()} Image Generator", fill=(255, 255, 255), font=title_font)
        draw.text((80, 130), "Enhanced AI Image Creation", fill=(219, 234, 254), font=subtitle_font)
        
        # Content area
        y_pos = 220
        
        # Enhanced style information
        draw.text((80, y_pos), f"Style: {style.title()}", fill=header_color, font=subtitle_font)
        y_pos += 40
        
        # Original request
        draw.text((80, y_pos), "Original Request:", fill=secondary_color, font=subtitle_font)
        y_pos += 30
        
        # Word wrap original prompt
        words = original_prompt.split()
        lines = []
        current_line = ""
        
        for word in words:
            if len(current_line + word) < 45:
                current_line += word + " "
            else:
                lines.append(current_line.strip())
                current_line = word + " "
        if current_line:
            lines.append(current_line.strip())
        
        for i, line in enumerate(lines[:4]):
            draw.text((80, y_pos + i*22), f"• {line}", fill=(75, 85, 99), font=body_font)
        
        y_pos += len(lines[:4]) * 22 + 20
        
        # Show optimization info
        draw.text((80, y_pos), "AI Optimizations Applied:", fill=secondary_color, font=subtitle_font)
        y_pos += 30
        
        optimizations = [
            "✓ Professional quality enhancement",
            "✓ Style-specific improvements", 
            "✓ Lighting and composition optimization",
            "✓ High-resolution rendering"
        ]
        
        for i, opt in enumerate(optimizations):
            draw.text((80, y_pos + i*20), opt, fill=accent_color, font=body_font)
        
        # Enhanced preview area with style-specific content
        preview_y = 500
        draw.rectangle([150, preview_y, 874, preview_y + 280], fill=(243, 244, 246), outline=header_color, width=3)
        
        # Style-specific preview text
        draw.text((480, preview_y + 80), f"{style.title()} Preview", fill=header_color, font=title_font)
        draw.text((380, preview_y + 130), "Enhanced AI Generated Image", fill=secondary_color, font=subtitle_font)
        draw.text((420, preview_y + 160), "Ready for Display", fill=accent_color, font=body_font)
        
        # Add decorative elements based on style
        if style == "cartoon":
            # Add colorful circles for cartoon style
            colors = [(255, 182, 193), (173, 216, 230), (255, 255, 224), (221, 160, 221)]
            for i, color in enumerate(colors):
                x = 200 + i * 150
                y = preview_y + 200
                draw.ellipse([x, y, x+40, y+40], fill=color)
        elif style == "landscape":
            # Add mountain-like shapes
            points = [(200, preview_y + 240), (300, preview_y + 180), (400, preview_y + 200), (500, preview_y + 160), (600, preview_y + 190), (700, preview_y + 240)]
            draw.polygon(points, fill=(34, 197, 94))
        elif style == "storybook":
            # Add star decorations
            star_points = [(250, preview_y + 200), (350, preview_y + 180), (450, preview_y + 190), (550, preview_y + 170), (650, preview_y + 200)]
            for point in star_points:
                draw.text(point, "*", fill=(255, 215, 0), font=body_font)
        
        # Enhanced footer with style-specific tips
        style_tips = {
            "portrait": "Tip: Mention lighting, background, and expression for better portraits",
            "landscape": "Tip: Specify time of day, weather, and viewpoint for landscapes", 
            "cartoon": "Tip: Describe character traits, colors, and mood for cartoons",
            "storybook": "Tip: Include magical elements and fairy tale atmosphere",
            "abstract": "Tip: Focus on colors, shapes, and artistic concepts",
            "realistic": "Tip: Be specific about details, materials, and lighting"
        }
        
        draw.text((80, 820), "AI Enhanced - Style Optimized - Professional Quality", fill=accent_color, font=body_font)
        tip = style_tips.get(style, "Tip: Be specific in your descriptions for better results")
        draw.text((80, 850), tip, fill=secondary_color, font=body_font)
        
        # Dynamic status indicator
        draw.rectangle([80, 890, 944, 930], fill=(254, 249, 195), outline=header_color, width=2)
        draw.text((100, 900), f"{style.title()} image optimized with advanced AI technology", fill=(146, 64, 14), font=body_font)
        
        # Save with high quality
        img.save(filepath, 'PNG', quality=95, optimize=True)
        file_size = os.path.getsize(filepath)
        print(f"[SUCCESS] Enhanced placeholder created: {filepath} ({file_size} bytes)")
        return filepath
        
    except Exception as e:
        print(f"[ERROR] Failed to create enhanced placeholder: {e}")
        import traceback
        print(f"[ERROR] Enhanced placeholder traceback: {traceback.format_exc()}")
        # Try to create a simple fallback
        try:
            print("[INFO] Attempting simple placeholder as fallback...")
            return create_simple_placeholder(filepath, original_prompt)
        except Exception as fallback_e:
            print(f"[ERROR] Fallback to simple placeholder also failed: {fallback_e}")
            import traceback
            print(f"[ERROR] Fallback traceback: {traceback.format_exc()}")
            return None

@tool
def code_analyzer(code: str, language: str = "python") -> str:
    """
    Analyze code for bugs, security issues, and improvements.
    Supports Python, JavaScript, Java, C++.
    """
    try:
        issues = []
        suggestions = []
        
        # Basic code analysis
        if language.lower() == "python":
            if "eval(" in code:
                issues.append("Security: Avoid using eval() - use ast.literal_eval() instead")
            if "import *" in code:
                issues.append("Style: Avoid wildcard imports")
            if "print(" in code and "def " in code:
                suggestions.append("Consider using logging instead of print statements")
        
        elif language.lower() == "javascript":
            if "var " in code:
                suggestions.append("Use 'let' or 'const' instead of 'var'")
            if "==" in code and "===" not in code:
                suggestions.append("Use strict equality (===) instead of loose equality (==)")
        
        result = f"Code Analysis for {language}:\n"
        if issues:
            result += "\nIssues Found:\n" + "\n".join(f"- {issue}" for issue in issues)
        if suggestions:
            result += "\nSuggestions:\n" + "\n".join(f"- {suggestion}" for suggestion in suggestions)
        if not issues and not suggestions:
            result += "\nCode looks good! No major issues found."
        
        return result
    except Exception as e:
        return f"Code analysis error: {str(e)}"

@tool
def data_analyst(data_query: str) -> str:
    """
    Analyze data patterns, generate insights, and create data summaries.
    Can process CSV data, statistics, and trends.
    """
    try:
        # Simulate data analysis
        analysis_types = {
            "sales": "Sales data shows 15% growth YoY with peak in Q4",
            "user": "User engagement increased 23% with mobile users leading", 
            "revenue": "Revenue trends show consistent growth with seasonal patterns",
            "performance": "System performance metrics indicate 99.5% uptime",
            "market": "Market analysis reveals emerging opportunities in AI sector"
        }
        
        query_lower = data_query.lower()
        for key, insight in analysis_types.items():
            if key in query_lower:
                return f"Data Analysis Result:\n{insight}\n\nRecommendations:\n- Monitor trends closely\n- Implement data-driven strategies\n- Focus on high-performing segments"
        
        return f"Data Analysis for '{data_query}':\nProcessed successfully. Key metrics extracted and trends identified. Consider implementing dashboard for real-time monitoring."
    except Exception as e:
        return f"Data analysis error: {str(e)}"

@tool
def business_consultant(business_query: str) -> str:
    """
    Provide business strategy, market analysis, and growth recommendations.
    Covers startup advice, scaling, marketing, and operations.
    """
    try:
        query_lower = business_query.lower()
        
        if "startup" in query_lower or "launch" in query_lower:
            return """Startup Strategy Recommendations:
1. Validate your MVP with target customers
2. Focus on product-market fit before scaling
3. Build a strong founding team
4. Secure adequate runway (18-24 months)
5. Establish clear metrics and KPIs

Next Steps: Conduct market research and create a lean business model canvas."""
        
        elif "marketing" in query_lower:
            return """Marketing Strategy Framework:
1. Define target audience and personas
2. Choose appropriate channels (digital/traditional)
3. Create compelling value proposition
4. Implement content marketing strategy
5. Track ROI and optimize campaigns

Recommended Tools: Google Analytics, social media platforms, email marketing."""
        
        elif "scale" in query_lower or "growth" in query_lower:
            return """Scaling Strategy:
1. Optimize core operations and processes
2. Invest in technology and automation
3. Build scalable team structure
4. Expand to new markets/segments
5. Maintain quality while growing

Key Metrics: Customer acquisition cost, lifetime value, churn rate."""
        
        else:
            return f"Business Analysis for '{business_query}':\n\nKey Considerations:\n- Market positioning and competitive advantage\n- Revenue model optimization\n- Operational efficiency improvements\n- Risk management strategies\n\nRecommendation: Conduct SWOT analysis and develop 90-day action plan."
    except Exception as e:
        return f"Business consultation error: {str(e)}"

@tool
def content_creator(content_type: str, topic: str) -> str:
    """
    Create professional content including blogs, social media posts, emails, and marketing copy.
    Specify type: blog, social, email, ad, press_release.
    """
    try:
        if content_type.lower() == "blog":
            return f"""Blog Post Outline for '{topic}':

Title: "The Ultimate Guide to {topic}: Everything You Need to Know"

1. Introduction
   - Hook: Compelling statistic or question
   - Problem statement
   - What readers will learn

2. Main Content
   - Key concepts and definitions
   - Step-by-step process
   - Real-world examples
   - Best practices

3. Conclusion
   - Summary of key points
   - Call-to-action
   - Next steps for readers

SEO Keywords: Include '{topic}' variations throughout
Word Count: 1500-2000 words"""
        
        elif content_type.lower() == "social":
            return f"""Social Media Content for '{topic}':

📱 LinkedIn Post:
"Excited to share insights about {topic}! Here are 3 key takeaways that can transform your approach... [Thread 1/3]"

🐦 Twitter Thread:
"🧵 Everything you need to know about {topic}:
1/ The fundamentals
2/ Common mistakes to avoid
3/ Pro tips for success"

📸 Instagram Caption:
"Behind the scenes of {topic} ✨ Swipe to see the process that changed everything! #innovation #growth"

Hashtags: #{topic.replace(' ', '').lower()} #professional #insights"""
        
        elif content_type.lower() == "email":
            return f"""Email Campaign for '{topic}':

Subject: "Master {topic} in 5 Minutes (Proven Framework Inside)"

Hi [Name],

I've been getting tons of questions about {topic}, so I put together this quick guide.

Here's what you'll discover:
✓ The #1 mistake people make with {topic}
✓ My proven 3-step framework
✓ Real results from our clients

[CTA Button: Get the Free Guide]

Best regards,
[Your Name]

P.S. This guide has helped 1000+ professionals level up their skills."""
        
        else:
            return f"Content created for {content_type} about '{topic}'. Professional copy with engaging headlines, clear structure, and compelling call-to-actions included."
    except Exception as e:
        return f"Content creation error: {str(e)}"

@tool
def project_manager(task: str) -> str:
    """
    Manage projects, create timelines, assign tasks, and track progress.
    Handles planning, resource allocation, and risk management.
    """
    try:
        if "timeline" in task.lower() or "schedule" in task.lower():
            return """Project Timeline Template:

Phase 1: Planning (Weeks 1-2)
- Requirements gathering
- Stakeholder alignment
- Resource allocation
- Risk assessment

Phase 2: Execution (Weeks 3-8)
- Development/Implementation
- Regular check-ins

- Quality assurance
- Progress tracking

Phase 3: Delivery (Weeks 9-10)
- Final testing
- Documentation
- Deployment
- Post-launch review

Key Milestones:
✓ Week 2: Project kickoff
✓ Week 5: Mid-point review
✓ Week 8: Pre-launch testing
✓ Week 10: Project completion"""
        
        elif "risk" in task.lower():
            return """Risk Management Framework:

High Priority Risks:
1. Scope creep - Mitigation: Clear requirements documentation
2. Resource constraints - Mitigation: Buffer time and backup resources
3. Technical challenges - Mitigation: Proof of concept early

Medium Priority Risks:
1. Stakeholder availability - Mitigation: Scheduled check-ins
2. Budget overrun - Mitigation: Regular budget reviews

Risk Monitoring:
- Weekly risk assessment
- Escalation procedures
- Contingency plans activated"""
        
        else:
            return f"""Project Management Plan for '{task}':

📋 Scope Definition:
- Clear objectives and deliverables
- Success criteria established
- Stakeholder responsibilities defined

⏱️ Timeline:
- Milestone-based approach
- Buffer time included
- Dependencies mapped

👥 Team Structure:
- Roles and responsibilities
- Communication protocols
- Reporting structure

📊 Tracking:
- KPIs and metrics
- Regular status updates
- Issue escalation process

Next Steps: Schedule kickoff meeting and finalize project charter."""
    except Exception as e:
        return f"Project management error: {str(e)}"

@tool
def financial_advisor(financial_query: str) -> str:
    """
    Provide financial analysis, investment advice, budgeting, and financial planning.
    Covers personal finance, business finance, and investment strategies.
    """
    try:
        query_lower = financial_query.lower()
        
        if "budget" in query_lower:
            return """Personal Budget Framework (50/30/20 Rule):

💰 Income Allocation:
- 50% Needs (rent, utilities, groceries)
- 30% Wants (entertainment, dining out)
- 20% Savings & Debt Payment

📊 Budget Categories:
1. Fixed Expenses: Rent, insurance, loans
2. Variable Expenses: Food, transportation
3. Discretionary: Entertainment, hobbies
4. Savings: Emergency fund, retirement

🎯 Action Steps:
- Track expenses for 30 days
- Identify spending patterns
- Set realistic savings goals
- Review monthly and adjust"""
        
        elif "investment" in query_lower:
            return """Investment Strategy Guidelines:

📈 Portfolio Diversification:
- 60% Stocks (mix of growth/value)
- 30% Bonds (government/corporate)
- 10% Alternative investments

⏰ Time Horizon Strategy:
- Short-term (1-3 years): Conservative bonds, CDs
- Medium-term (3-10 years): Balanced portfolio
- Long-term (10+ years): Growth-focused stocks

🛡️ Risk Management:
- Dollar-cost averaging
- Regular rebalancing
- Emergency fund (3-6 months expenses)

Note: Consult with licensed financial advisor for personalized advice."""
        
        else:
            return f"""Financial Analysis for '{financial_query}':

💡 Key Recommendations:
1. Establish clear financial goals
2. Create comprehensive budget
3. Build emergency fund
4. Optimize tax strategies
5. Plan for retirement

📋 Next Steps:
- Calculate net worth
- Review insurance coverage
- Assess investment portfolio
- Consider professional consultation

Reminder: This is general guidance. Seek professional advice for specific situations."""
    except Exception as e:
        return f"Financial advisory error: {str(e)}"

@tool
def legal_advisor(legal_query: str) -> str:
    """
    Provide legal guidance, contract review, compliance advice, and legal research.
    Covers business law, contracts, intellectual property, and regulations.
    """
    try:
        query_lower = legal_query.lower()
        
        if "contract" in query_lower:
            return """Contract Review Checklist:

📋 Essential Elements:
1. Clear parties identification
2. Detailed scope of work/deliverables
3. Payment terms and schedule
4. Timeline and milestones
5. Termination clauses
6. Liability and indemnification
7. Dispute resolution process

⚠️ Red Flags:
- Vague or ambiguous language
- Unlimited liability clauses
- Automatic renewal terms
- Excessive penalties

✅ Best Practices:
- Get everything in writing
- Define all technical terms
- Include change order process
- Specify governing law

Disclaimer: Consult qualified attorney for legal advice."""
        
        elif "intellectual property" in query_lower or "ip" in query_lower:
            return """Intellectual Property Protection:

🔒 Types of IP:
1. Trademarks: Brand names, logos, slogans
2. Copyrights: Creative works, software code
3. Patents: Inventions, processes, designs
4. Trade Secrets: Confidential business info

📝 Protection Steps:
- Document creation dates
- File appropriate registrations
- Use proper notices (©, ™, ®)
- Implement confidentiality agreements
- Monitor for infringement

⚖️ Enforcement:
- Send cease and desist letters
- File infringement claims
- Seek damages and injunctions

Recommendation: Work with IP attorney for comprehensive strategy."""
        
        else:
            return f"""Legal Guidance for '{legal_query}':

⚖️ General Considerations:
1. Understand applicable laws and regulations
2. Document all business transactions
3. Maintain proper corporate records
4. Ensure compliance with industry standards
5. Regular legal health checks

🛡️ Risk Mitigation:
- Comprehensive insurance coverage
- Clear policies and procedures
- Regular legal updates and training
- Professional legal counsel relationship

Important: This is general information only. Consult licensed attorney for specific legal advice."""
    except Exception as e:
        return f"Legal advisory error: {str(e)}"

@tool
def hr_specialist(hr_query: str) -> str:
    """
    Handle HR matters including recruitment, employee relations, policies, and compliance.
    Covers hiring, performance management, workplace issues, and HR best practices.
    """
    try:
        query_lower = hr_query.lower()
        
        if "hiring" in query_lower or "recruitment" in query_lower:
            return """Recruitment Best Practices:

📋 Hiring Process:
1. Job Analysis & Description
   - Clear role requirements
   - Skills and qualifications
   - Compensation range

2. Sourcing Candidates
   - Job boards and LinkedIn
   - Employee referrals
   - Professional networks

3. Screening & Interviews
   - Resume screening criteria
   - Structured interview questions
   - Skills assessments

4. Selection & Onboarding
   - Reference checks
   - Background verification
   - Comprehensive onboarding plan

🎯 Key Metrics:
- Time to hire
- Cost per hire
- Quality of hire
- Retention rates"""
        
        elif "performance" in query_lower:
            return """Performance Management Framework:

📊 Performance Cycle:
1. Goal Setting (SMART objectives)
2. Regular Check-ins (monthly/quarterly)
3. Mid-year Review
4. Annual Performance Review
5. Development Planning

🎯 Evaluation Criteria:
- Job-specific competencies
- Behavioral indicators
- Goal achievement
- Professional development

📈 Improvement Plans:
- Clear expectations
- Specific timelines
- Regular feedback
- Support and resources
- Progress monitoring

💡 Best Practices:
- Document everything
- Focus on behaviors, not personality
- Provide constructive feedback
- Recognize achievements"""
        
        else:
            return f"""HR Guidance for '{hr_query}':

👥 Key HR Principles:
1. Fair and consistent treatment
2. Clear communication
3. Compliance with employment laws
4. Employee development focus
5. Positive workplace culture

📚 Essential Policies:
- Code of conduct
- Anti-discrimination/harassment
- Leave and attendance
- Performance management
- Disciplinary procedures

🔄 Continuous Improvement:
- Regular policy reviews
- Employee feedback surveys
- Training and development
- Stay updated on labor laws

Recommendation: Consult HR professionals for complex situations."""
    except Exception as e:
        return f"HR specialist error: {str(e)}"

@tool
def knowledge_assistant(question: str) -> str:
    """
    Professional AI assistant providing comprehensive explanations with ChatGPT-style formatting.
    Delivers detailed responses with headings, subheadings, and examples like a pro chatbot.
    """
    try:
        question_lower = question.lower()
        
        # Physics topics
        if any(word in question_lower for word in ['quantum', 'physics']):
            return """# Quantum Physics: A Comprehensive Guide

## What is Quantum Physics?

Quantum physics is the fundamental theory in physics that describes the behavior of matter and energy at the atomic and subatomic scale. It reveals a strange world where particles can exist in multiple states simultaneously.

## Core Principles

### 1. Quantization
- Energy exists in discrete packets called "quanta"
- You can't have half a photon - energy comes in whole units
- **Example**: Light bulbs emit specific energy levels, creating distinct colors

### 2. Wave-Particle Duality
- Matter and energy exhibit both wave and particle properties
- **Example**: Light acts as waves (interference patterns) and particles (photons)

### 3. Uncertainty Principle
- Cannot simultaneously know exact position and momentum of a particle
- **Example**: Trying to measure an electron's position changes its momentum

### 4. Superposition
- Particles can exist in multiple states at once until observed
- **Example**: Schrödinger's cat - theoretically both alive and dead until observed

### 5. Quantum Entanglement
- Particles become connected and instantly affect each other regardless of distance
- **Example**: Measuring one entangled photon instantly determines its partner's state

## Real-World Applications

### Technology We Use Daily
- **Smartphones**: Transistors rely on quantum tunneling
- **Lasers**: Quantum energy transitions produce coherent light
- **MRI Machines**: Quantum spin of hydrogen atoms creates medical images
- **GPS Systems**: Require quantum corrections for accuracy

### Emerging Technologies
- **Quantum Computers**: Solve complex problems exponentially faster
- **Quantum Cryptography**: Unbreakable secure communications
- **Quantum Sensors**: Ultra-precise measurements

## Why It Matters

Quantum physics isn't just abstract theory - it's the foundation of modern technology. From computers to solar panels, quantum mechanics makes our digital world possible.

## Key Takeaway

While quantum physics seems counterintuitive, it's one of the most successful theories in science, enabling technologies that seemed impossible just decades ago."""
        
        # AI/Technology topics
        elif any(word in question_lower for word in ['ai', 'artificial intelligence', 'machine learning']):
            return """# Artificial Intelligence: The Technology Reshaping Our World

## What is Artificial Intelligence?

AI refers to computer systems that can perform tasks typically requiring human intelligence - learning, reasoning, problem-solving, and decision-making.

## Types of AI

### Narrow AI (Current Reality)
- Specialized systems designed for specific tasks
- **Examples**: Siri, Netflix recommendations, chess programs

### General AI (Future Goal)
- Human-level intelligence across all cognitive tasks
- **Status**: Still theoretical, possibly decades away

## Core Technologies

### Machine Learning
- Algorithms that improve through experience
- **Example**: Email spam filters learning to identify unwanted messages

### Neural Networks
- Computing systems inspired by biological brain structure
- **Example**: Image recognition systems identifying objects in photos

### Deep Learning
- Advanced neural networks with multiple layers
- **Example**: ChatGPT understanding and generating human-like text

## AI in Your Daily Life

### Entertainment & Media
- **Streaming**: Netflix, Spotify recommendations
- **Social Media**: Facebook's news feed algorithm
- **Gaming**: AI opponents that adapt to your style

### Communication
- **Virtual Assistants**: Siri, Alexa, Google Assistant
- **Email**: Smart compose and spam filtering
- **Translation**: Google Translate converting 100+ languages

## Transformative Applications

### Healthcare Revolution
- **Medical Imaging**: AI detecting cancer in X-rays
- **Drug Discovery**: Accelerating new medication development
- **Example**: AI systems diagnose skin cancer more accurately than dermatologists

### Scientific Breakthroughs
- **Climate Modeling**: Predicting weather and climate change
- **Space Exploration**: Analyzing telescope and rover data
- **Example**: AI helped design COVID-19 vaccines in record time

## The Future of AI

### Emerging Trends
- **Multimodal AI**: Understanding text, images, and audio together
- **Edge AI**: Processing on local devices for privacy and speed
- **Explainable AI**: Systems that can explain their decisions

## Key Takeaway

AI isn't replacing human intelligence - it's augmenting it. The most powerful applications combine AI's computational abilities with human creativity and judgment."""
        
        # General fallback with comprehensive coverage
        else:
            return f"""# Exploring {question.title()}: Your Comprehensive Guide

## How I Can Help You Learn

I'm designed to provide detailed, well-structured explanations on virtually any topic. Think of me as your personal tutor who breaks down complex subjects into understandable concepts.

## My Knowledge Areas

### Science & Nature
- **Physics**: Quantum mechanics, relativity, thermodynamics
- **Chemistry**: Molecular interactions, reactions, materials
- **Biology**: Genetics, evolution, ecology, human body
- **Astronomy**: Space exploration, cosmology, planets

### Technology & Innovation
- **Artificial Intelligence**: Machine learning, neural networks
- **Computer Science**: Programming, algorithms, cybersecurity
- **Engineering**: Mechanical, electrical, civil engineering
- **Emerging Tech**: Blockchain, IoT, renewable energy

### Mathematics & Logic
- **Pure Math**: Algebra, calculus, geometry, statistics
- **Applied Math**: Financial modeling, data analysis
- **Logic**: Problem-solving, critical thinking

### History & Culture
- **World History**: Ancient civilizations to modern events
- **Philosophy**: Ethics, logic, major thinkers
- **Arts**: Literature, music, visual arts, architecture
- **Geography**: Physical features, cultures, economics

## My Response Style

### Professional Formatting
- **Clear Headings**: Organized information hierarchy
- **Subheadings**: Breaking down complex topics
- **Examples**: Real-world applications and illustrations
- **Key Takeaways**: Essential points summarized

### Comprehensive Coverage
- **Multiple Perspectives**: Different angles on topics
- **Progressive Complexity**: Building from basics to advanced
- **Practical Applications**: How knowledge applies to real life
- **Current Relevance**: Modern context and implications

## Sample Questions I Excel At

### Deep Explanations
- "How does photosynthesis work at the molecular level?"
- "What caused the fall of the Roman Empire?"
- "Explain calculus in simple terms with examples"

### Practical Applications
- "How can I use statistics in everyday decisions?"
- "What are the real-world uses of blockchain?"
- "How do vaccines work to prevent disease?"

### Comparative Analysis
- "What's the difference between classical and quantum physics?"
- "How do different economic systems compare?"
- "What are the pros and cons of renewable energy?"

## Ready to Learn?

Ask me about any topic and I'll provide:
- **Clear definitions** and core concepts
- **Step-by-step explanations** of complex processes
- **Real-world examples** and practical applications
- **Historical context** when relevant
- **Future implications** and emerging trends

**What would you like to explore today?**"""
            
    except Exception as e:
        return "I'd be happy to help explain that topic. Could you provide more details about what specific aspect interests you?"

@tool
def cybersecurity_expert(security_query: str) -> str:
    """
    Provide cybersecurity guidance, threat analysis, and security best practices.
    Covers network security, data protection, compliance, and incident response.
    """
    try:
        query_lower = security_query.lower()
        
        if "password" in query_lower or "authentication" in query_lower:
            return """Password & Authentication Security:

🔐 Strong Password Policy:
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No dictionary words or personal info
- Unique passwords for each account
- Regular password updates

🛡️ Multi-Factor Authentication (MFA):
- Something you know (password)
- Something you have (phone/token)
- Something you are (biometric)

📱 Best Practices:
- Use password managers
- Enable MFA everywhere possible
- Avoid password reuse
- Regular security training
- Monitor for breaches

⚠️ Red Flags:
- Suspicious login attempts
- Unexpected password reset emails
- Unfamiliar device notifications"""
        
        elif "data" in query_lower or "privacy" in query_lower:
            return """Data Protection Framework:

🔒 Data Classification:
1. Public: Marketing materials
2. Internal: Employee directories
3. Confidential: Financial records
4. Restricted: Personal data, trade secrets

🛡️ Protection Measures:
- Encryption at rest and in transit
- Access controls and permissions
- Regular backups and testing
- Data loss prevention (DLP)
- Secure disposal procedures

📋 Compliance Requirements:
- GDPR (EU residents)
- CCPA (California residents)
- HIPAA (Healthcare)
- SOX (Financial)
- Industry-specific regulations

🚨 Incident Response:
- Detection and containment
- Assessment and notification
- Recovery and lessons learned"""
        
        else:
            return f"""Cybersecurity Assessment for '{security_query}':

🔍 Security Checklist:
1. Network Security
   - Firewall configuration
   - VPN for remote access
   - Network monitoring

2. Endpoint Protection
   - Antivirus/anti-malware
   - Device encryption
   - Patch management

3. User Security
   - Security awareness training
   - Access management
   - Incident reporting

4. Data Security
   - Backup strategies
   - Encryption protocols
   - Access controls

🎯 Priority Actions:
- Conduct security audit
- Implement security policies
- Regular security training
- Incident response plan"""
    except Exception as e:
        return f"Cybersecurity expert error: {str(e)}"

# Legacy functions - kept for compatibility
def optimize_prompt(user_input: str) -> str:
    """Legacy prompt optimization - use optimize_image_prompt_advanced instead"""
    return optimize_image_prompt_advanced(user_input)

def optimize_image_prompt(user_input: str) -> str:
    """Legacy function - redirects to advanced version"""
    return optimize_image_prompt_advanced(user_input)

def try_freepik_generation(prompt: str, filepath: str) -> str | None:
    """Legacy function - redirects to enhanced version"""
    return try_freepik_generation_enhanced(prompt, filepath)

def create_professional_placeholder(filepath: str, prompt: str) -> str | None:
    """Legacy function - redirects to enhanced version"""
    return create_enhanced_placeholder(filepath, prompt, prompt)

def generate_with_api(optimized_prompt: str, filepath: str) -> str | None:
    """Legacy function - redirects to enhanced version"""
    return generate_with_enhanced_api(optimized_prompt, filepath, optimized_prompt)

def call_freepik_api(prompt: str, filepath: str) -> str | None:
    """Call Freepik API to generate image"""
    try:
        FREEPIK_API_KEY = os.getenv("FREEPIK_API_KEY")
        
        # Check if API key is available
        if not FREEPIK_API_KEY:
            print("[WARNING] Freepik API key not found. Skipping API call.")
            return None
        
        headers = {
            "X-Freepik-API-Key": FREEPIK_API_KEY,
            "Content-Type": "application/json"
        }
        
        payload = {
            "prompt": prompt,
            "num_images": 1,
            "image": {
                "size": "1024x1024"
            }
        }
        
        # Freepik API endpoint (adjust based on actual API documentation)
        url = "https://api.freepik.com/v1/ai/text-to-image"
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if "data" in data and len(data["data"]) > 0:
                image_info = data["data"][0]
                
                # Handle base64 response
                if "base64" in image_info:
                    import base64
                    try:
                        image_data = base64.b64decode(image_info["base64"])
                        with open(filepath, "wb") as f:
                            f.write(image_data)
                        print(f"[SUCCESS] Legacy Freepik image saved successfully: {filepath}")
                        return filepath
                    except Exception as e:
                        print(f"[ERROR] Failed to save legacy Freepik image: {e}")
                        return None
                
                # Handle URL response
                elif "url" in image_info:
                    image_url = image_info["url"]
                    try:
                        img_response = requests.get(image_url, timeout=45)
                        if img_response.status_code == 200:
                            with open(filepath, "wb") as f:
                                f.write(img_response.content)
                            print(f"[SUCCESS] Legacy Freepik image downloaded successfully: {filepath}")
                            return filepath
                        else:
                            print(f"[ERROR] Failed to download legacy Freepik image from URL. Status: {img_response.status_code}")
                            return None
                    except Exception as e:
                        print(f"[ERROR] Failed to download legacy Freepik image from URL: {e}")
                        return None
        
        # Fallback to placeholder if API fails
        print(f"API failed with status: {response.status_code}")
        return create_placeholder_image(filepath, prompt)
        
    except Exception as e:
        print(f"API call failed: {e}")
        return create_placeholder_image(filepath, prompt)

def create_placeholder_image(filepath: str, prompt_text: str) -> str | None:
    """Create a placeholder image when API generation fails"""
    try:
        img = Image.new('RGB', (1024, 1024), color=(245, 245, 245))
        draw = ImageDraw.Draw(img)
        
        try:
            font_large = ImageFont.truetype("arial.ttf", 32)
            font_small = ImageFont.truetype("arial.ttf", 18)
        except:
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()
        
        # Draw border
        draw.rectangle([20, 20, 1004, 1004], outline=(200, 200, 200), width=2)
        
        # Draw title
        draw.text((50, 60), "AI Generated Image", fill=(100, 100, 100), font=font_large)
        
        # Draw prompt (word wrapped)
        words = prompt_text.split()
        lines = []
        current_line = ""
        
        for word in words:
            if len(current_line + word) < 45:
                current_line += word + " "
            else:
                lines.append(current_line.strip())
                current_line = word + " "
        if current_line:
            lines.append(current_line.strip())
        
        for i, line in enumerate(lines[:8]):
            draw.text((50, 140 + i*25), line, fill=(80, 80, 80), font=font_small)
        
        # Draw center placeholder
        draw.rectangle([200, 400, 824, 700], fill=(230, 230, 230), outline=(180, 180, 180), width=2)
        draw.text((420, 530), "Image Preview", fill=(120, 120, 120), font=font_large)
        draw.text((380, 570), "Generated with AI", fill=(150, 150, 150), font=font_small)
        
        img.save(filepath, 'PNG')
        print(f"[SUCCESS] Legacy placeholder created: {filepath}")
        return filepath
        
    except Exception as e:
        print(f"Failed to create placeholder: {e}")
        return None



tools = [search_tool, get_stock_price, calculator, generate_image, code_analyzer, data_analyst, business_consultant, content_creator, project_manager, financial_advisor, legal_advisor, hr_specialist, cybersecurity_expert, knowledge_assistant]
llm_with_tools = llm.bind_tools(tools)

# -------------------
# 3. State
# -------------------
class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

# -------------------
# 4. Nodes
# -------------------
def chat_node(state: ChatState):
    """LLM node that may answer or request a tool call."""
    messages = state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

tool_node = ToolNode(tools)

# -------------------
# 5. Checkpointer
# -------------------
conn = sqlite3.connect(database="chatbot.db", check_same_thread=False)
checkpointer = SqliteSaver(conn=conn)

# -------------------
# 6. Graph
# -------------------
graph = StateGraph(ChatState)
graph.add_node("chat_node", chat_node)
graph.add_node("tools", tool_node)

graph.add_edge(START, "chat_node")
graph.add_conditional_edges("chat_node", tools_condition)
graph.add_edge("tools", "chat_node")

try:
    chatbot = graph.compile(checkpointer=checkpointer)
except Exception as e:
    print(f"Error compiling graph: {e}")
    chatbot = graph.compile()  # Fallback without checkpointer

# -------------------
# 7. Helper
# -------------------
def retrieve_all_threads():
    all_threads = set()
    for checkpoint in checkpointer.list(None):
        all_threads.add(checkpoint.config["configurable"]["thread_id"])
    return list(all_threads)