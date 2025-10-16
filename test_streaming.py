#!/usr/bin/env python3
"""
Simple streaming test for ChatX
"""

import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

load_dotenv()

def test_basic_streaming():
    """Test basic LLM streaming"""
    try:
        # Initialize LLM
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.5
        )
        
        print("Testing basic LLM streaming...")
        print("User: Hello, tell me about AI")
        print("Assistant: ", end="", flush=True)
        
        # Stream response
        for chunk in llm.stream([HumanMessage(content="Hello, tell me about AI in 2 sentences")]):
            if hasattr(chunk, 'content') and chunk.content:
                print(chunk.content, end="", flush=True)
        
        print("\n\nBasic streaming test complete!")
        return True
        
    except Exception as e:
        print(f"Error in basic streaming: {e}")
        return False

def test_langgraph_streaming():
    """Test LangGraph streaming"""
    try:
        from langgraph_tool_backend import chatbot
        
        print("\nTesting LangGraph streaming...")
        print("User: What is 2+2?")
        print("Assistant: ", end="", flush=True)
        
        config = {'configurable': {'thread_id': 'test-thread'}}
        
        for chunk, metadata in chatbot.stream(
            {'messages': [HumanMessage(content="What is 2+2?")]},
            config=config,
            stream_mode='messages'
        ):
            if hasattr(chunk, 'type') and chunk.type == 'ai':
                if hasattr(chunk, 'content') and chunk.content:
                    print(chunk.content, end="", flush=True)
        
        print("\n\nLangGraph streaming test complete!")
        return True
        
    except Exception as e:
        print(f"Error in LangGraph streaming: {e}")
        return False

if __name__ == "__main__":
    print("ChatX Streaming Tests")
    print("=" * 40)
    
    # Test basic streaming
    basic_success = test_basic_streaming()
    
    # Test LangGraph streaming
    langgraph_success = test_langgraph_streaming()
    
    print("\n" + "=" * 40)
    print("Test Results:")
    print(f"Basic LLM Streaming: {'PASS' if basic_success else 'FAIL'}")
    print(f"LangGraph Streaming: {'PASS' if langgraph_success else 'FAIL'}")
    
    if basic_success and langgraph_success:
        print("\nAll streaming tests passed!")
        print("Your ChatX app is ready for streaming!")
    else:
        print("\nSome tests failed. Check your API keys and configuration.")