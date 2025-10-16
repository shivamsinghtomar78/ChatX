#!/usr/bin/env python3
"""
Streaming Example for ChatX - Similar to Streamlit's st.write_stream

This example shows how to use the streaming functionality in ChatX,
similar to the Streamlit example you provided.
"""

from langgraph_tool_backend import chatbot
from langchain_core.messages import HumanMessage

def stream_chat_example():
    """
    Example of streaming chat similar to Streamlit's st.write_stream
    """
    
    # Configuration for the chat
    config = {
        'configurable': {'thread_id': 'example-thread-1'}
    }
    
    # User input
    user_input = "Explain quantum physics in simple terms"
    
    print(f"User: {user_input}")
    print("Assistant: ", end="", flush=True)
    
    # Stream the response
    accumulated_response = ""
    
    for message_chunk, metadata in chatbot.stream(
        {'messages': [HumanMessage(content=user_input)]},
        config=config,
        stream_mode='messages'
    ):
        # Only process AI message chunks
        if hasattr(message_chunk, 'type') and message_chunk.type == 'ai':
            if hasattr(message_chunk, 'content') and message_chunk.content:
                # Print each chunk as it arrives (like st.write_stream)
                print(message_chunk.content, end="", flush=True)
                accumulated_response += message_chunk.content
    
    print("\n\n" + "="*50)
    print("Streaming complete!")
    print(f"Total response length: {len(accumulated_response)} characters")

def stream_with_callback_example():
    """
    Example using a callback function to handle streamed content
    """
    
    def on_stream_chunk(content):
        """Callback function called for each chunk"""
        print(f"[CHUNK] {content}", end="", flush=True)
    
    config = {'configurable': {'thread_id': 'example-thread-2'}}
    user_input = "Write a short story about AI"
    
    print(f"User: {user_input}")
    print("Assistant: ")
    
    # Stream with callback
    for message_chunk, metadata in chatbot.stream(
        {'messages': [HumanMessage(content=user_input)]},
        config=config,
        stream_mode='messages'
    ):
        if hasattr(message_chunk, 'type') and message_chunk.type == 'ai':
            if hasattr(message_chunk, 'content') and message_chunk.content:
                on_stream_chunk(message_chunk.content)
    
    print("\n\nStreaming with callback complete!")

if __name__ == "__main__":
    print("ChatX Streaming Examples")
    print("=" * 50)
    
    print("\n1. Basic Streaming Example:")
    stream_chat_example()
    
    print("\n2. Streaming with Callback Example:")
    stream_with_callback_example()
    
    print("\nTo use streaming in your web app:")
    print("1. Start the backend: python api_server.py")
    print("2. Start the frontend: cd frontend && npm start")
    print("3. Enable streaming toggle in the chat interface")
    print("4. Send a message and watch it stream in real-time!")