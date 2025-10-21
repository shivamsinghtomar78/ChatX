"""
Debug script to check the image generation response format
"""
import os
import sys

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from langgraph_tool_backend import generate_image

def debug_image_response():
    """Debug the image generation response format"""
    print("Debugging image generation response format...")
    
    # Test with the same prompt that was used
    prompt = "sitting in the snow with polar bear"
    result = generate_image(prompt)
    print(f"Prompt: {prompt}")
    print(f"Response: {result}")
    print(f"Response length: {len(result)}")
    print(f"Contains [IMAGE_GENERATED: { '[IMAGE_GENERATED:' in result}")
    
    # Check the exact format
    if '[IMAGE_GENERATED:' in result:
        parts = result.split('[IMAGE_GENERATED:')
        print(f"Parts count: {len(parts)}")
        if len(parts) > 1:
            after_parts = parts[1].split(']')
            filename = after_parts[0]
            print(f"Extracted filename: {filename}")
            print(f"Full image URL would be: /api/image/{filename}")

if __name__ == "__main__":
    debug_image_response()