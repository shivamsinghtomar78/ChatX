#!/usr/bin/env python3
"""
Test script to verify API key validation functionality
"""

import os
import sys
from unittest.mock import patch

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_api_key_validation():
    """Test the API key validation functionality"""
    
    print("Testing API key validation...")
    
    try:
        from langgraph_tool_backend import validate_api_keys, print_api_key_validation_results
        print("✓ Successfully imported API key validation functions")
    except Exception as e:
        print(f"✗ Failed to import API key validation functions: {e}")
        return
    
    # Test 1: Valid API keys (using the actual keys from .env)
    print("\n1. Testing with valid API keys from .env...")
    results = validate_api_keys()
    
    google_result = results['GOOGLE_API_KEY']
    freepik_result = results['FREEPIK_API_KEY']
    
    print(f"Google API Key - Valid: {google_result['valid']}, Error: {google_result['error']}")
    print(f"Freepik API Key - Valid: {freepik_result['valid']}, Error: {freepik_result['error']}")
    
    if google_result['valid'] and freepik_result['valid']:
        print("✓ All API keys are valid")
    else:
        print("⚠️  Some API keys are invalid or missing")
    
    # Test 2: Missing Google API key
    print("\n2. Testing with missing Google API key...")
    with patch.dict(os.environ, {"GOOGLE_API_KEY": ""}, clear=False):
        results = validate_api_keys()
        google_result = results['GOOGLE_API_KEY']
        if not google_result['valid'] and "empty" in google_result['error']:
            print("✓ Correctly detected empty Google API key")
        else:
            print(f"✗ Expected empty key error but got: {google_result['error']}")
    
    # Test 3: Missing Freepik API key
    print("\n3. Testing with missing Freepik API key...")
    with patch.dict(os.environ, {"FREEPIK_API_KEY": ""}, clear=False):
        results = validate_api_keys()
        freepik_result = results['FREEPIK_API_KEY']
        if not freepik_result['valid'] and "empty" in freepik_result['error']:
            print("✓ Correctly detected empty Freepik API key")
        else:
            print(f"✗ Expected empty key error but got: {freepik_result['error']}")
    
    print("\nAPI key validation tests completed!")

if __name__ == "__main__":
    test_api_key_validation()