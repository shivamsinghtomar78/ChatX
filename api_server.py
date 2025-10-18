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
        data = request.json
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
            config=CONFIG
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

@app.route('/api/image/<filename>')
def serve_image(filename):
    filename = os.path.basename(filename)
    filepath = os.path.join(os.path.dirname(__file__), 'static', filename)
    if os.path.exists(filepath):
        return send_file(filepath)
    return '', 404

if __name__ == '__main__':
    app.run(debug=False, port=5000)