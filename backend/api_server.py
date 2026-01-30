from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables FIRST for LangSmith/LangChain
load_dotenv()

import uuid
from functools import wraps
from time import time

# Resolve static folder for images
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
static_folder = os.path.join(BASE_DIR, 'static')
app = Flask(__name__, static_folder=static_folder)

# Read allowed origins from environment (comma-separated) or use defaults
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]

# Configure CORS with environment-based origins
CORS(app, resources={
    r"/api/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type", "X-Requested-With"],
        "max_age": 86400
    }
})

# Security headers
@app.after_request
def add_security_headers(response):
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    return response

# Simple rate limiting
rate_limit_store = {}

def rate_limit(max_requests=10, window=60):
    """Rate limit decorator: max_requests per window seconds"""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            client_ip = request.remote_addr
            now = time()
            
            if client_ip not in rate_limit_store:
                rate_limit_store[client_ip] = []
            
            # Clean old requests
            rate_limit_store[client_ip] = [
                req_time for req_time in rate_limit_store[client_ip]
                if now - req_time < window
            ]
            
            if len(rate_limit_store[client_ip]) >= max_requests:
                return jsonify({'error': 'Rate limit exceeded'}), 429
            
            rate_limit_store[client_ip].append(now)
            return f(*args, **kwargs)
        return wrapped
    return decorator

# Lazy load chatbot to prevent startup crashes
chatbot = None
def get_chatbot():
    global chatbot
    if chatbot is None:
        from langgraph_tool_backend import chatbot as cb
        chatbot = cb
    return chatbot

@app.route('/api/chat', methods=['POST'])
@rate_limit(max_requests=20, window=60)
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

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Ensure path doesn't start with 'api'
    if path.startswith('api/') or path == 'api':
        return jsonify({'error': 'Not found'}), 404
    
    # Check if the requested file exists in the static folder
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    
    # Otherwise, serve index.html for React routing
    index_path = os.path.join(app.static_folder, 'index.html')
    if os.path.exists(index_path):
        return send_file(index_path)
    
    return '<h1>ChatX API Running</h1><p>Frontend build not found. Please run <code>npm run build</code> in the frontend directory.</p>'

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
    
    # Additional validation: ensure filename doesn't contain multiple extensions
    if filename.count('.') > 1:
        return '', 400  # Bad Request
    
    # Additional validation: ensure filename has a valid extension
    valid_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
    if not any(filename.lower().endswith(ext) for ext in valid_extensions):
        # Allow PNG as default for files with no extension
        if not '.' in filename:
            filename += '.png'
        else:
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