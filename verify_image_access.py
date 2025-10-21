"""
Script to verify that the generated image can be accessed
"""
import requests
import os

def verify_image_access():
    """Verify that the generated image can be accessed"""
    # Check if the image file exists
    image_path = os.path.join("static", "generated_3532.png")
    if os.path.exists(image_path):
        print(f"✓ Image file exists at: {image_path}")
        print(f"  File size: {os.path.getsize(image_path)} bytes")
    else:
        print(f"✗ Image file does not exist at: {image_path}")
        return
    
    # Try to access the image through the API
    try:
        response = requests.get("http://localhost:5000/api/image/generated_3532.png")
        if response.status_code == 200:
            print("✓ Image can be accessed through the API")
            print(f"  Content-Type: {response.headers.get('Content-Type')}")
            print(f"  Content-Length: {len(response.content)} bytes")
        else:
            print(f"✗ Failed to access image through API. Status code: {response.status_code}")
            print(f"  Response: {response.text}")
    except Exception as e:
        print(f"✗ Error accessing image through API: {e}")

if __name__ == "__main__":
    verify_image_access()