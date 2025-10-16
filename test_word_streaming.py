#!/usr/bin/env python3
"""Test word-by-word streaming"""

import time
from langgraph_tool_backend import chatbot
from langchain_core.messages import HumanMessage

def test_word_streaming():
    """Test word-by-word streaming like Streamlit"""
    
    user_input = "Tell me about Python programming"
    
    # Get complete response
    config = {'configurable': {'thread_id': 'test-word-stream'}}
    final_state = chatbot.invoke(
        {"messages": [HumanMessage(content=user_input)]},
        config=config
    )
    
    # Extract response
    response = ""
    if "messages" in final_state:
        for msg in reversed(final_state["messages"]):
            if hasattr(msg, 'type') and msg.type == 'ai' and hasattr(msg, 'content'):
                response = msg.content
                break
    
    print(f"User: {user_input}")
    print("Assistant: ", end="", flush=True)
    
    # Stream word by word
    words = response.split()
    for word in words:
        print(word, end=" ", flush=True)
        time.sleep(0.1)  # Delay between words
    
    print("\n\nWord streaming complete!")

if __name__ == "__main__":
    test_word_streaming()