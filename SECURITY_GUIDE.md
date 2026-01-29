# ChatX Security Guide

## 🔴 Critical Issues to Fix

### 1. Environment Variables Security

**Current Issue**: `.env` file may be committed to Git

**Solution**:
```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

**Create `.env.example`** (safe to commit):
```env
# Copy this to .env and fill in your values
GOOGLE_API_KEY=your_google_api_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
FREEPIK_API_KEY=your_freepik_key_here
ALPHA_VANTAGE_API_KEY=your_alphavantage_key_here
ALLOWED_ORIGINS=http://localhost:3000
```

---

### 2. API Key Rotation

**Your Google API key was leaked!** Here's what to do:

1. **Go to**: [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Delete** the compromised key
3. **Create** a new key
4. **Update** your `.env` file
5. **Never** commit API keys to Git

---

### 3. Rate Limiting (Recommended)

Add stronger rate limiting to prevent abuse:

```python
# In api_server.py
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per hour", "20 per minute"],
    storage_uri="memory://"
)

# Apply to chat endpoint
@app.route('/api/chat', methods=['POST'])
@limiter.limit("10 per minute")  # Strict limit for AI calls
def chat():
    ...
```

---

### 4. Input Validation

Add strict input validation:

```python
from pydantic import BaseModel, validator, constr

class ChatRequest(BaseModel):
    message: constr(min_length=1, max_length=10000)
    conversation_id: str = None
    
    @validator('message')
    def sanitize_message(cls, v):
        # Remove potentially dangerous content
        if any(bad in v.lower() for bad in ['<script', 'javascript:', 'data:']):
            raise ValueError('Invalid content detected')
        return v.strip()
```

---

### 5. CORS Best Practices

**Production Configuration**:
```python
# api_server.py
import os

# NEVER use "*" in production!
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")

# Validate origins
if not allowed_origins or allowed_origins == [""]:
    print("WARNING: No allowed origins configured!")
    allowed_origins = ["http://localhost:3000"]  # Dev fallback only

CORS(app, resources={
    r"/api/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"],
        "max_age": 86400
    }
})
```

---

### 6. Secure Headers

Add security headers:

```python
from flask import Flask, make_response

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    return response
```

---

### 7. Logging & Monitoring

Add security logging:

```python
import logging
from datetime import datetime

# Setup security logger
security_logger = logging.getLogger('security')
security_logger.setLevel(logging.WARNING)
handler = logging.FileHandler('security.log')
security_logger.addHandler(handler)

# Log suspicious activity
@app.before_request
def log_request():
    if request.content_length and request.content_length > 1000000:  # 1MB
        security_logger.warning(f"Large request from {request.remote_addr}")
```

---

## ✅ Security Checklist

| Check | Status | Priority |
|-------|--------|----------|
| `.env` in `.gitignore` | ⚠️ Verify | 🔴 Critical |
| Regenerate leaked Google key | ❌ Pending | 🔴 Critical |
| Rate limiting enabled | ⚠️ Basic | 🟡 High |
| Input validation | ⚠️ Partial | 🟡 High |
| CORS configured | ✅ Done | 🟢 Medium |
| Security headers | ❌ Missing | 🟡 High |
| HTTPS enforced | ⚠️ Check deployment | 🔴 Critical |

---

## 🔧 Quick Fix Commands

```bash
# 1. Check if .env is in gitignore
grep ".env" .gitignore

# 2. Remove .env from git history (if committed)
git rm --cached .env
git commit -m "Remove .env from tracking"

# 3. Create .env.example
cp .env .env.example
# Then manually remove actual keys from .env.example
```
