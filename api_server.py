from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from langgraph_tool_backend import chatbot
from langchain_core.messages import HumanMessage
import uuid
import os

app = Flask(__name__)
CORS(app)

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
        
        final_state = chatbot.invoke(
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

@app.route('/static/<path:filename>')
def serve_static(filename):
    try:
        return send_from_directory('frontend/build/static', filename)
    except:
        return '', 404

@app.route('/')
def home():
    try:
        return send_file('frontend/build/index.html')
    except:
        return '<h1>ChatX API Running</h1>'

if __name__ == '__main__':
    app.run(debug=False, port=5000)