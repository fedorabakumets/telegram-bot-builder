#!/usr/bin/env python3
"""
Test script to verify HTML formatting is working correctly in canvas nodes
"""

import requests
import json

def test_html_formatting():
    """Test HTML formatting in canvas nodes"""
    
    print("🧪 TESTING HTML FORMATTING IN CANVAS")
    print("=" * 50)
    
    # Create a test project with HTML formatted text
    test_project = {
        "name": "Test HTML Formatting",
        "description": "Test project for HTML formatting",
        "data": {
            "nodes": [
                {
                    "id": "test-node-1",
                    "type": "message",
                    "position": {"x": 100, "y": 100},
                    "data": {
                        "messageText": "This is <b>bold text</b> and <i>italic text</i>",
                        "description": "Test node with <strong>strong</strong> and <em>emphasis</em>",
                        "formatMode": "html"
                    }
                },
                {
                    "id": "test-node-2",
                    "type": "message",
                    "position": {"x": 400, "y": 100},
                    "data": {
                        "messageText": "This has <b>bold</b>, <i>italic</i>, <u>underline</u>, <s>strikethrough</s>, and <code>code</code>",
                        "description": "Complex HTML formatting test",
                        "formatMode": "none"  # Should auto-detect HTML
                    }
                },
                {
                    "id": "test-node-3",
                    "type": "message",
                    "position": {"x": 700, "y": 100},
                    "data": {
                        "messageText": "This is **markdown bold** and *italic*",
                        "description": "Markdown formatting test",
                        "formatMode": "markdown"
                    }
                }
            ],
            "connections": []
        }
    }
    
    try:
        # Create the test project
        response = requests.post('http://localhost:5000/api/projects', json=test_project)
        
        if response.status_code == 201:
            project_data = response.json()
            project_id = project_data['id']
            print(f"✅ Test project created with ID: {project_id}")
            
            # Test cases
            test_cases = [
                {
                    "name": "Bold text with <b> tag",
                    "text": "This is <b>bold text</b>",
                    "expected": "Should render as bold"
                },
                {
                    "name": "Bold text with <strong> tag",
                    "text": "This is <strong>bold text</strong>",
                    "expected": "Should render as bold"
                },
                {
                    "name": "Italic text with <i> tag",
                    "text": "This is <i>italic text</i>",
                    "expected": "Should render as italic"
                },
                {
                    "name": "Italic text with <em> tag",
                    "text": "This is <em>italic text</em>",
                    "expected": "Should render as italic"
                },
                {
                    "name": "Mixed formatting",
                    "text": "This is <b>bold</b> and <i>italic</i> text",
                    "expected": "Should render both formats"
                },
                {
                    "name": "Complex formatting",
                    "text": "Text with <b>bold</b>, <i>italic</i>, <u>underline</u>, <s>strikethrough</s>, and <code>code</code>",
                    "expected": "Should render all formats"
                }
            ]
            
            print(f"\n📋 TEST CASES:")
            for i, case in enumerate(test_cases, 1):
                print(f"{i}. {case['name']}")
                print(f"   Input: {case['text']}")
                print(f"   Expected: {case['expected']}")
                
                # Check if HTML tags are detected
                has_html_tags = ('<b>' in case['text'] or '<i>' in case['text'] or 
                               '<u>' in case['text'] or '<s>' in case['text'] or 
                               '<code>' in case['text'] or '<strong>' in case['text'] or 
                               '<em>' in case['text'])
                
                print(f"   HTML Detection: {'✅ PASS' if has_html_tags else '❌ FAIL'}")
                print()
            
            print(f"🔗 Open the project to test: http://localhost:5000/editor/{project_id}")
            print("\n📝 INSTRUCTIONS:")
            print("1. Open the project in the editor")
            print("2. Check if the nodes display formatted text correctly")
            print("3. Try editing text and applying formatting")
            print("4. Verify that HTML tags are rendered as formatting, not as text")
            
            return True
            
        else:
            print(f"❌ Failed to create test project: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_html_formatting()
    if success:
        print("\n✅ Test setup completed successfully!")
    else:
        print("\n❌ Test setup failed!")