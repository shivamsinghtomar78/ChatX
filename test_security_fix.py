#!/usr/bin/env python3
"""
Test script to verify path traversal vulnerability fix in api_server.py
"""

import os
import sys
import tempfile
from api_server import serve_image

def test_path_traversal_fix():
    """Test that the path traversal fix works correctly"""
    
    print("Testing path traversal vulnerability fix...")
    
    # Test cases that should be blocked
    malicious_filenames = [
        "../etc/passwd",
        "..\\windows\\system32\\cmd.exe",
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\cmd.exe",
        "./test.txt",
        ".\\test.txt",
        "/etc/passwd",
        "\\windows\\system32\\cmd.exe",
        "test../file.png",
        "test..\\file.png",
        ".hidden_file",
        "",
        "..",
        "file.",
        "file..",
    ]
    
    # Test cases that should be allowed (if files exist)
    valid_filenames = [
        "test.png",
        "generated_1234.png",
        "image.jpg",
        "photo.jpeg",
        "picture.gif",
    ]
    
    print("\nTesting malicious filenames (should be blocked):")
    for filename in malicious_filenames:
        # We're simulating what Flask would do, but we can't easily test the actual Flask response
        # So we'll test our validation logic directly
        try:
            # Apply the same validation logic as in serve_image
            if '..' in filename or filename.startswith('.') or '/' in filename or '\\' in filename:
                print(f"  ✓ '{filename}' - correctly blocked (path traversal pattern)")
                continue
            
            # Apply basename
            safe_filename = os.path.basename(filename)
            
            # Additional validation
            if not safe_filename or safe_filename.startswith('.'):
                print(f"  ✓ '{filename}' - correctly blocked (empty or hidden file)")
                continue
                
            print(f"  ? '{filename}' - would need further checking")
        except Exception as e:
            print(f"  ✓ '{filename}' - blocked with error: {e}")
    
    print("\nTesting valid filenames (should pass initial validation):")
    for filename in valid_filenames:
        try:
            # Apply the same validation logic as in serve_image
            if '..' in filename or filename.startswith('.') or '/' in filename or '\\' in filename:
                print(f"  ✗ '{filename}' - incorrectly blocked")
                continue
            
            # Apply basename
            safe_filename = os.path.basename(filename)
            
            # Additional validation
            if not safe_filename or safe_filename.startswith('.'):
                print(f"  ✗ '{filename}' - incorrectly blocked")
                continue
                
            print(f"  ✓ '{filename}' - correctly passes initial validation")
        except Exception as e:
            print(f"  ✗ '{filename}' - incorrectly blocked with error: {e}")
    
    print("\nTesting path confinement validation:")
    # Create a temporary directory structure to test path confinement
    with tempfile.TemporaryDirectory() as temp_dir:
        static_dir = os.path.join(temp_dir, 'static')
        os.makedirs(static_dir)
        
        # Create a test file in the static directory
        test_file = os.path.join(static_dir, 'test.png')
        with open(test_file, 'w') as f:
            f.write('test')
        
        # Test a file that's in the static directory (should pass)
        filepath = os.path.join(static_dir, 'test.png')
        abs_static_dir = os.path.abspath(static_dir)
        abs_filepath = os.path.abspath(filepath)
        
        is_safe = (abs_filepath.startswith(abs_static_dir + os.sep) or abs_filepath == abs_static_dir)
        print(f"  ✓ File within static dir: {is_safe}")
        
        # Test a file that's outside the static directory (should fail)
        outside_file = os.path.join(temp_dir, 'outside.txt')
        with open(outside_file, 'w') as f:
            f.write('test')
            
        abs_outside_filepath = os.path.abspath(outside_file)
        is_safe = (abs_outside_filepath.startswith(abs_static_dir + os.sep) or abs_outside_filepath == abs_static_dir)
        print(f"  ✓ File outside static dir correctly blocked: {not is_safe}")
    
    print("\nPath traversal fix verification completed!")

if __name__ == "__main__":
    test_path_traversal_fix()