"""
Comprehensive test for media upload functionality
This script tests that the bot generator properly handles local uploaded files
"""

import os
import json
import requests

def test_media_file_exists():
    """Test if local media files exist"""
    print("=== Testing Media File Existence ===")
    
    # Check if uploads directory exists
    uploads_dir = "uploads"
    if not os.path.exists(uploads_dir):
        print("❌ Uploads directory does not exist")
        return False
    
    # List all files in uploads directory
    files = []
    for root, dirs, filenames in os.walk(uploads_dir):
        for filename in filenames:
            file_path = os.path.join(root, filename)
            files.append(file_path)
    
    print(f"✅ Found {len(files)} uploaded files:")
    for file in files:
        print(f"  - {file}")
    
    return len(files) > 0

def test_bot_generator_api():
    """Test that bot generator correctly handles local files"""
    print("\n=== Testing Bot Generator API ===")
    
    # Create a test bot with local media
    test_bot_data = {
        "name": "Test Media Bot",
        "description": "Test bot with local media files",
        "data": {
            "nodes": [
                {
                    "id": "start-1",
                    "type": "start",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "messageText": "Welcome! Test local media bot",
                        "keyboardType": "inline",
                        "buttons": [
                            {
                                "id": "btn-1",
                                "text": "📸 Show Local Photo",
                                "action": "goto",
                                "target": "photo-1"
                            }
                        ]
                    }
                },
                {
                    "id": "photo-1",
                    "type": "photo",
                    "position": {"x": 300, "y": 100},
                    "data": {
                        "imageUrl": "/uploads/1751919935977-360494373.jpg",
                        "mediaCaption": "This is a local uploaded photo!"
                    }
                }
            ],
            "connections": [
                {
                    "id": "conn-1",
                    "from": "start-1",
                    "to": "photo-1"
                }
            ]
        }
    }
    
    try:
        # First create the project
        create_response = requests.post("http://localhost:5000/api/projects", 
                                      json=test_bot_data,
                                      headers={"Content-Type": "application/json"})
        
        if create_response.status_code != 201:
            print(f"❌ Failed to create test project: {create_response.status_code}")
            return False
            
        project_id = create_response.json().get("id")
        print(f"✅ Created test project with ID: {project_id}")
        
        # Test code generation using the export endpoint
        response = requests.post(f"http://localhost:5000/api/projects/{project_id}/export", 
                               headers={"Content-Type": "application/json"})
        
        if response.status_code == 200:
            generated_code = response.json().get("code", "")
            
            # Check if code contains local file handling
            if "is_local_file" in generated_code:
                print("✅ Bot generator includes local file handling")
            else:
                print("❌ Bot generator missing local file handling")
                return False
                
            if "FSInputFile" in generated_code:
                print("✅ Bot generator includes FSInputFile import")
            else:
                print("❌ Bot generator missing FSInputFile import")
                return False
                
            if "get_local_file_path" in generated_code:
                print("✅ Bot generator includes path resolution")
            else:
                print("❌ Bot generator missing path resolution")
                return False
                
            # Save generated code for inspection
            with open("generated_local_media_test.py", "w", encoding="utf-8") as f:
                f.write(generated_code)
            print("✅ Generated code saved to generated_local_media_test.py")
            
            return True
        else:
            print(f"❌ API request failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing bot generator: {e}")
        return False

def test_generated_code_syntax():
    """Test that generated code has valid Python syntax"""
    print("\n=== Testing Generated Code Syntax ===")
    
    try:
        import ast
        
        if not os.path.exists("generated_local_media_test.py"):
            print("❌ Generated code file not found")
            return False
            
        with open("generated_local_media_test.py", "r", encoding="utf-8") as f:
            code = f.read()
            
        # Try to parse the code
        ast.parse(code)
        print("✅ Generated code has valid Python syntax")
        
        # Check for required functions
        required_functions = ["is_local_file", "get_local_file_path"]
        for func in required_functions:
            if func in code:
                print(f"✅ Found required function: {func}")
            else:
                print(f"❌ Missing required function: {func}")
                return False
                
        return True
        
    except SyntaxError as e:
        print(f"❌ Syntax error in generated code: {e}")
        return False
    except Exception as e:
        print(f"❌ Error checking generated code: {e}")
        return False

def main():
    """Main test function"""
    print("Starting comprehensive media upload tests...\n")
    
    tests = [
        ("Media File Existence", test_media_file_exists),
        ("Bot Generator API", test_bot_generator_api),
        ("Generated Code Syntax", test_generated_code_syntax)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"Running {test_name}...")
        if test_func():
            passed += 1
            print(f"✅ {test_name} PASSED")
        else:
            print(f"❌ {test_name} FAILED")
        print()
    
    print(f"=== TEST RESULTS ===")
    print(f"Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("🎉 All tests passed! Local media upload functionality is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")

if __name__ == "__main__":
    main()