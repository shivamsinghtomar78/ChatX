from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import uuid
import os

app = Flask(__name__)
CORS(app)

# Lazy load chatbot to prevent startup crashes
chatbot = None
def get_chatbot():
    global chatbot
    if chatbot is None:
        from langgraph_tool_backend import chatbot as cb
        chatbot = cb
    return chatbot

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json or {}
        message = data.get('message', '')
        thread_id = data.get('thread_id', str(uuid.uuid4()))
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        CONFIG = {
            "configurable": {"thread_id": thread_id},
            "run_name": "chat_turn",
        }
        
        from langchain_core.messages import HumanMessage
        cb = get_chatbot()
        final_state = cb.invoke(
            {"messages": [HumanMessage(content=message)]},
            config=CONFIG  # type: ignore
        )
        
        response = "I'm sorry, I couldn't process your request."
        if "messages" in final_state:
            for msg in reversed(final_state["messages"]):
                if hasattr(msg, 'type') and msg.type == 'ai' and hasattr(msg, 'content'):
                    response = msg.content
                    break
        
        return jsonify({
            'response': response,
            'thread_id': thread_id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

@app.route('/static/js/<path:filename>')
def serve_js(filename):
    js_folder = os.path.join(os.path.dirname(__file__), 'frontend', 'build', 'static', 'js')
    file_path = os.path.join(js_folder, filename)
    if os.path.exists(file_path):
        return send_file(file_path, mimetype='application/javascript')
    return '', 404

@app.route('/static/css/<path:filename>')
def serve_css(filename):
    css_folder = os.path.join(os.path.dirname(__file__), 'frontend', 'build', 'static', 'css')
    file_path = os.path.join(css_folder, filename)
    if os.path.exists(file_path):
        return send_file(file_path, mimetype='text/css')
    return '', 404

@app.route('/')
def home():
    index_path = os.path.join(os.path.dirname(__file__), 'frontend', 'build', 'index.html')
    if os.path.exists(index_path):
        return send_file(index_path)
    return '<h1>ChatX API Running</h1><p>Frontend build not found</p>'

@app.route('/test')
def test():
    test_path = os.path.join(os.path.dirname(__file__), 'test_image_display.html')
    if os.path.exists(test_path):
        return send_file(test_path)
    return '<h1>Test file not found</h1>'

@app.route('/test-image')
def test_image():
    test_path = os.path.join(os.path.dirname(__file__), 'test_image_simple.html')
    if os.path.exists(test_path):
        return send_file(test_path)
    return '<h1>Test image file not found</h1>'

@app.route('/test-frontend')
def test_frontend():
    test_path = os.path.join(os.path.dirname(__file__), 'test_frontend_logic.html')
    if os.path.exists(test_path):
        return send_file(test_path)
    return '<h1>Test frontend file not found</h1>'

@app.route('/api/image/<filename>')
def serve_image(filename):
    # Additional security validation to prevent path traversal
    # Check for forbidden path traversal patterns
    if '..' in filename or filename.startswith('.') or '/' in filename or '\\' in filename:
        return '', 400  # Bad Request
    
    # Ensure filename is safe and doesn't contain any directory separators
    filename = os.path.basename(filename)
    
    # Additional validation: ensure filename is not empty and doesn't start with a dot
    if not filename or filename.startswith('.'):
        return '', 400  # Bad Request
    
    # Construct the full file path
    static_dir = os.path.join(os.path.dirname(__file__), 'static')
    filepath = os.path.join(static_dir, filename)
    
    # Ensure the filepath is within the static directory (additional security check)
    try:
        # Resolve both paths to their absolute forms
        abs_static_dir = os.path.abspath(static_dir)
        abs_filepath = os.path.abspath(filepath)
        
        # Check if the file path is within the static directory
        if not abs_filepath.startswith(abs_static_dir + os.sep) and not abs_filepath == abs_static_dir:
            return '', 400  # Bad Request
    except Exception:
        return '', 400  # Bad Request
    
    # Check if file exists
    if os.path.exists(filepath):
        # Verify it's actually a file (not a directory)
        if not os.path.isfile(filepath):
            return '', 400  # Bad Request
        
        # Determine MIME type based on file extension
        import mimetypes
        mime_type, _ = mimetypes.guess_type(filepath)
        
        # Ensure only valid image files are served
        allowed_mime_types = [
            'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 
            'image/webp', 'image/svg+xml'
        ]
        
        # If MIME type is not detected or not in allowed list, reject
        if mime_type is None or mime_type not in allowed_mime_types:
            # Allow PNG as default for files with no extension
            if not '.' in filename:
                mime_type = 'image/png'
            else:
                return '', 400  # Bad Request
        
        # Create response with cache control headers
        response = send_file(filepath, mimetype=mime_type)
        
        # Add cache control headers to prevent aggressive caching
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        
        return response
    
    return '', 404

if __name__ == '__main__':
    app.run(debug=False, port=5000)