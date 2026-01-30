User profile section# ChatX - AI Chat Interface

Modern ChatGPT-style interface with React frontend and LangGraph backend.

## Features

### 🎨 User Interface
- Modern dark/light theme with smooth animations
- Markdown rendering with syntax highlighting
- Responsive design for mobile & desktop
- PWA support - install as native app
- Enhanced theme system with multiple options
- Accessibility features for all users

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
- Advanced search with filtering and categorization
- Search within conversations
- Conversation templates
- Generate chat summaries
- Share conversations
- Keyboard shortcuts (Ctrl+K)
- Enhanced image gallery with slideshow and metadata

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

**See [FEATURES.md](FEATURES.md) for complete list of 42+ features!**

## Deployment (Vercel + Render)

To separate the frontend and backend:

### 1. Backend (Render)
- Connect this repo to Render.
- **Runtime**: Python.
- **Start Command**: `gunicorn app:app`.
- **Env Vars**: Set `ALLOWED_ORIGINS` to `*` or your Vercel URL.

### 2. Frontend (Vercel)
- Root directory should be `frontend`.
- **Framework**: Create React App.
- **Env Vars**: Set `REACT_APP_API_URL` to your Render URL.

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
├── backend/               # Flask API & AI Logic
│   ├── api_server.py      # Entry point
│   ├── requirements.txt   # Dependencies
│   └── .env               # Secrets
├── frontend/              # React App
│   ├── src/               # UI Logic
│   └── vercel.json        # Vercel Config
├── render.yaml            # Render Config (Points to backend/)
└── README.md
```