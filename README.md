# ChatX - AI Chat Interface

Modern ChatGPT-style interface with React frontend and LangGraph backend.

## Features

### 🎨 User Interface
- Modern dark/light theme with smooth animations
- Markdown rendering with syntax highlighting
- Responsive design for mobile & desktop
- PWA support - install as native app

### 💬 Chat Experience
- Real-time AI chat with typing indicators
- Conversation management (create, delete, search)
- Auto-save drafts & conversations
- Message reactions & pinning
- Edit sent messages
- Relative timestamps

### 🎤 Voice & Audio
- Voice input (speech-to-text)
- Text-to-speech for AI responses
- Voice command support

### 🛠️ Productivity Tools
- Export chat to file
- Search within conversations
- Conversation templates
- Generate chat summaries
- Share conversations
- Keyboard shortcuts (Ctrl+K)

### 🤖 AI Capabilities
- Calculator, web search, image generation
- Code review & analysis
- Business consulting
- Content creation
- Data analysis
- Financial advice
- Legal guidance
- HR assistance
- Cybersecurity expertise

### 📱 Mobile Features
- Touch-optimized interface
- Swipe gestures
- Install as mobile app
- Offline support

**See [FEATURES.md](FEATURES.md) for complete list of 37+ features!**

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