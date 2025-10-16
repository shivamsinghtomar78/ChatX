# ChatX Streaming Guide

## Overview

ChatX now supports real-time streaming responses similar to Streamlit's `st.write_stream()` functionality. This provides a more interactive and engaging user experience with responses appearing as they're generated.

## Features

- **Real-time Streaming**: Messages appear character by character as the AI generates them
- **Visual Indicators**: Streaming cursor and status indicators
- **Toggle Control**: Users can switch between streaming and standard modes
- **Seamless Integration**: Works with all existing ChatX tools and features

## How to Use

### 1. Start the Application

```bash
# Backend
python api_server.py

# Frontend (in new terminal)
cd frontend
npm start
```

### 2. Enable Streaming

In the chat interface:
- Look for the streaming toggle at the bottom: "⚡ Streaming enabled"
- Toggle on/off to switch between streaming and standard response modes

### 3. Send Messages

- Type your message and press Enter or click Send
- Watch as the AI response streams in real-time
- Streaming messages show a blinking cursor (▋) and "Streaming..." indicator

## API Endpoints

### Streaming Endpoint
```
POST /api/chat/stream
```

**Request:**
```json
{
  "message": "Your question here",
  "thread_id": "optional-thread-id"
}
```

**Response:** Server-Sent Events (SSE)
```
data: {"content": "chunk", "type": "chunk"}
data: {"type": "done", "thread_id": "thread-123"}
```

### Standard Endpoint (with streaming support)
```
POST /api/chat
```

**Request:**
```json
{
  "message": "Your question here", 
  "thread_id": "optional-thread-id",
  "stream": true
}
```

## Code Examples

### Frontend Streaming Implementation

```javascript
const callStreamingAPI = async (message, threadId, onStreamChunk) => {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, thread_id: threadId })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulatedContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'chunk' && data.content) {
          accumulatedContent += data.content;
          onStreamChunk(accumulatedContent);
        }
      }
    }
  }
};
```

### Backend Streaming (Similar to Streamlit)

```python
# Similar to Streamlit's st.write_stream
def stream_chat_response(message, config):
    for chunk, metadata in chatbot.stream(
        {"messages": [HumanMessage(content=message)]},
        config=config,
        stream_mode="messages"
    ):
        if hasattr(chunk, 'type') and chunk.type == 'ai':
            if chunk.content:
                yield f"data: {json.dumps({'content': chunk.content, 'type': 'chunk'})}\\n\\n"
    
    yield f"data: {json.dumps({'type': 'done'})}\\n\\n"
```

### Python Console Example

```python
from langgraph_tool_backend import chatbot
from langchain_core.messages import HumanMessage

# Stream like Streamlit's st.write_stream
user_input = "Explain quantum physics"
print("Assistant: ", end="", flush=True)

for message_chunk, metadata in chatbot.stream(
    {'messages': [HumanMessage(content=user_input)]},
    config={'configurable': {'thread_id': 'thread-1'}},
    stream_mode='messages'
):
    if hasattr(message_chunk, 'type') and message_chunk.type == 'ai':
        if message_chunk.content:
            print(message_chunk.content, end="", flush=True)
```

## Visual Features

### Streaming Indicators
- **Blinking Cursor**: `▋` appears at the end of streaming text
- **Status Text**: "• Streaming..." shows in message timestamp
- **Border Highlight**: Streaming messages have blue border glow
- **Toggle Icon**: ⚡ for streaming enabled, 📝 for standard mode

### CSS Classes
```css
.message.streaming .message-text {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
}

.streaming-cursor {
  animation: blink 1s infinite;
}

.streaming-indicator {
  color: #3b82f6;
  animation: pulse 2s infinite;
}
```

## Benefits

1. **Better UX**: Users see responses immediately instead of waiting
2. **Engagement**: Real-time feedback keeps users engaged
3. **Transparency**: Users can see the AI "thinking" process
4. **Flexibility**: Can toggle between streaming and standard modes
5. **Performance**: Perceived faster response times

## Technical Details

### Stream Modes
- **messages**: Streams individual message chunks (recommended)
- **updates**: Streams state updates
- **values**: Streams complete state values

### Error Handling
- Network errors automatically fall back to standard mode
- Malformed chunks are skipped gracefully
- Connection timeouts trigger error messages

### Browser Compatibility
- Uses Fetch API with ReadableStream (modern browsers)
- Falls back to standard AJAX for older browsers
- Server-Sent Events for real-time communication

## Troubleshooting

### Common Issues

1. **No streaming response**
   - Check if streaming toggle is enabled
   - Verify API endpoint is accessible
   - Check browser console for errors

2. **Choppy streaming**
   - Network latency may cause irregular chunks
   - This is normal behavior, not an error

3. **Streaming stops mid-response**
   - Check network connection
   - Server may have timed out
   - Response will show as complete

### Debug Mode
Enable debug logging in browser console:
```javascript
localStorage.setItem('chatx-debug', 'true');
```

## Performance Tips

1. **Chunk Size**: Optimal chunk size is 10-50 characters
2. **Network**: Stable connection improves streaming quality
3. **Browser**: Modern browsers handle streaming better
4. **Server**: Ensure adequate server resources for concurrent streams

## Future Enhancements

- **Typing Speed Control**: Adjust streaming speed
- **Pause/Resume**: Control streaming playback
- **Stream History**: Replay streaming responses
- **Multi-stream**: Handle multiple concurrent streams
- **Voice Streaming**: Audio response streaming

---

**Note**: Streaming requires a stable internet connection and modern browser support. The feature gracefully degrades to standard responses when streaming is unavailable.