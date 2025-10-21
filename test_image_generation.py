"""
Test script for image generation functionality
"""
import os
import sys
import time
from dotenv import load_dotenv

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

from langgraph_tool_backend import generate_image, create_simple_placeholder, create_enhanced_placeholder

def test_image_generation():
    """Test the image generation functionality"""
    print("Testing image generation functionality...")
    
    # Test 1: Basic image generation
    print("\n1. Testing basic image generation...")
    prompt = "A beautiful sunset over the mountains"
    result = generate_image(prompt)
    print(f"Result: {result}")
    
    # Check if the result contains the expected format
    if "[IMAGE_GENERATED:" in result:
        print("✓ Basic image generation test passed")
    else:
        print("✗ Basic image generation test failed")
    
    # Test 2: Test different prompt styles
    print("\n2. Testing different prompt styles...")
    prompts = [
        "A cartoon character with big eyes",
        "Professional portrait of a businesswoman",
        "Abstract art with vibrant colors",
        "Landscape of a forest with deer"
    ]
    
    for i, prompt in enumerate(prompts, 3):
        print(f"\n{i}. Testing prompt: {prompt}")
        result = generate_image(prompt)
        print(f"Result: {result}")
        
        if "[IMAGE_GENERATED:" in result:
            print(f"✓ Prompt test {i-2} passed")
        else:
            print(f"✗ Prompt test {i-2} failed")
    
    # Test 3: Test placeholder creation
    print("\n3. Testing placeholder creation...")
    os.makedirs("static", exist_ok=True)
    filepath = os.path.join("static", "test_simple_placeholder.png")
    
    result = create_simple_placeholder(filepath, "Test simple placeholder")
    if result and os.path.exists(filepath):
        print("✓ Simple placeholder creation test passed")
        # Clean up
        os.remove(filepath)
    else:
        print("✗ Simple placeholder creation test failed")
    
    # Test 4: Test enhanced placeholder creation
    print("\n4. Testing enhanced placeholder creation...")
    filepath = os.path.join("static", "test_enhanced_placeholder.png")
    
    result = create_enhanced_placeholder(filepath, "Test enhanced placeholder", "Test enhanced placeholder")
    if result and os.path.exists(filepath):
        print("✓ Enhanced placeholder creation test passed")
        # Clean up
        os.remove(filepath)
    else:
        print("✗ Enhanced placeholder creation test failed")
    
    print("\nImage generation testing completed!")

if __name__ == "__main__":
    test_image_generation()