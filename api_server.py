from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from langgraph_tool_backend import chatbot
from langchain_core.messages import HumanMessage, AIMessage
import uuid
import os

app = Flask(__name__)
CORS(app, origins=['*'])  # Allow all origins for production

# Ensure directories exist
os.makedirs('static', exist_ok=True)
os.makedirs('uploads', exist_ok=True)

# API routes FIRST
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message', '')
        thread_id = data.get('thread_id', str(uuid.uuid4()))
        
        print(f"Received message: {message}")
        print(f"Thread ID: {thread_id}")
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        CONFIG = {
            "configurable": {"thread_id": thread_id},
            "metadata": {"thread_id": thread_id},
            "run_name": "chat_turn",
        }
        
        # Get response from chatbot
        final_state = chatbot.invoke(
            {"messages": [HumanMessage(content=message)]},
            config=CONFIG
        )
        
        # Get the last AI message from final state
        response = "I'm sorry, I couldn't process your request."
        if "messages" in final_state:
            for msg in reversed(final_state["messages"]):
                if hasattr(msg, 'type') and msg.type == 'ai' and hasattr(msg, 'content'):
                    response = msg.content
                    break
        
        print(f"Final response: {response}")
        
        return jsonify({
            'response': response,
            'thread_id': thread_id
        })
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Chat error: {str(e)}")
        print(f"Full traceback: {error_details}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

@app.route('/api/image/<filename>', methods=['GET'])
def serve_image(filename):
    try:
        # Sanitize filename to prevent path traversal
        filename = os.path.basename(filename)
        filepath = os.path.join(os.getcwd(), 'static', filename)
        if os.path.exists(filepath) and filename.endswith(('.png', '.jpg', '.jpeg')):
            return send_file(filepath, mimetype='image/png')
        else:
            return jsonify({'error': 'Image not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Static files
@app.route('/static/<path:path>')
def serve_static(path):
    try:
        return send_from_directory('frontend/build/static', path)
    except Exception as e:
        print(f"Static file error: {e}")
        return jsonify({'error': 'Static file not found'}), 404

# Catch-all route for React app (MUST BE LAST)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # Skip API routes that should have been handled above
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # Always serve index.html for React routing
    try:
        if os.path.exists('frontend/build/index.html'):
            return send_from_directory('frontend/build', 'index.html')
        else:
            return '<h1>ChatX Backend Running</h1><p>Frontend build not found</p>', 200
    except Exception as e:
        print(f"Frontend serve error: {e}")
        return '<h1>ChatX API</h1><p>Backend is running</p>', 200

if __name__ == '__main__':
    app.run(debug=False, port=5000)