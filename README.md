# ChatX - AI Chat Interface

Modern ChatGPT-style interface with React frontend and LangGraph backend.

## Features
- Modern dark UI with animations
- Real-time chat with typing indicators
- Conversation management
- AI tools: calculator, web search, image generation
- Responsive design

## Quick Start

### 1. Backend
```bash
pip install -r requirements.txt
python api_server.py
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
```

### 3. Access
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Environment
Create `.env` file:
```
GOOGLE_API_KEY=your_key
FREEPIK_API_KEY=your_key
```

## Structure
```
ChatX/
├── api_server.py           # Flask API
├── langgraph_tool_backend.py # AI backend
├── frontend/               # React app
├── requirements.txt        # Dependencies
└── .env                   # Config
```