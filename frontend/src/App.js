import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

const App = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [searchInChat, setSearchInChat] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [draft, setDraft] = useState('');
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [reactions, setReactions] = useState({});
  const [tags, setTags] = useState({});
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [typingEffect, setTypingEffect] = useState(true);
  const [userAvatar, setUserAvatar] = useState('👤');
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showMoreActions, setShowMoreActions] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('chatx-theme') || 'dark';
    setTheme(savedTheme);
    document.body.className = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('chatx-theme', newTheme);
    document.body.className = newTheme;
  };
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    try {
      const savedConvs = localStorage.getItem('chatx-conversations');
      const savedActive = localStorage.getItem('chatx-active-conversation');
      if (savedConvs) {
        const parsedConvs = JSON.parse(savedConvs);
        const restoredConvs = parsedConvs.map(conv => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          messages: conv.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(restoredConvs);
      }
      if (savedActive) {
        const parsedActive = JSON.parse(savedActive);
        const restoredActive = {
          ...parsedActive,
          createdAt: new Date(parsedActive.createdAt),
          messages: parsedActive.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        };
        setActiveConversation(restoredActive);
      }
    } catch (e) {
      console.log('Error loading saved data');
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      try {
        localStorage.setItem('chatx-conversations', JSON.stringify(conversations));
      } catch (e) {}
    }
  }, [conversations]);

  useEffect(() => {
    if (activeConversation) {
      try {
        localStorage.setItem('chatx-active-conversation', JSON.stringify(activeConversation));
      } catch (e) {}
    }
  }, [activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const createNewConversation = () => {
    const newConv = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversation(newConv);
  };

  const deleteConversation = (id) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (activeConversation?.id === id) {
      setActiveConversation(null);
    }
  };

  const generateTitle = (firstMessage) => {
    return firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;
  };

  const callAPI = async (message, threadId) => {
    setIsTyping(true);
    setError(null);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          message: message,
          thread_id: threadId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      setIsTyping(false);
      return data.response || 'Sorry, I could not process your request.';
    } catch (error) {
      setIsTyping(false);
      setError('Connection failed. Check if backend is running on port 5000.');
      return 'Error: Could not connect to server. Please check backend.';
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    let currentConv = activeConversation;
    
    if (!currentConv) {
      currentConv = {
        id: Date.now().toString(),
        title: generateTitle(message),
        messages: [],
        createdAt: new Date()
      };
      setConversations(prev => [currentConv, ...prev]);
      setActiveConversation(currentConv);
    }

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    const updatedConv = {
      ...currentConv,
      messages: [...currentConv.messages, userMsg],
      title: currentConv.messages.length === 0 ? generateTitle(message) : currentConv.title
    };

    setConversations(prev => prev.map(conv => 
      conv.id === updatedConv.id ? updatedConv : conv
    ));
    setActiveConversation(updatedConv);
    setMessage('');

    const aiResponse = await callAPI(message, updatedConv.id);
    
    const aiMsg = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };

    const finalConv = {
      ...updatedConv,
      messages: [...updatedConv.messages, aiMsg]
    };

    setConversations(prev => prev.map(conv => 
      conv.id === finalConv.id ? finalConv : conv
    ));
    setActiveConversation(finalConv);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    if (activeConversation) {
      localStorage.setItem(`draft-${activeConversation.id}`, value);
    }
  };

  useEffect(() => {
    if (activeConversation) {
      const savedDraft = localStorage.getItem(`draft-${activeConversation.id}`);
      if (savedDraft) setMessage(savedDraft);
    }
  }, [activeConversation?.id]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const exportChat = () => {
    if (!activeConversation) return;
    const chatText = activeConversation.messages.map(msg => 
      `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`
    ).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${activeConversation.title}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearChat = () => {
    if (!activeConversation || !window.confirm('Clear this conversation?')) return;
    const clearedConv = { ...activeConversation, messages: [] };
    setConversations(prev => prev.map(conv => 
      conv.id === clearedConv.id ? clearedConv : conv
    ));
    setActiveConversation(clearedConv);
  };

  const regenerateResponse = async () => {
    if (!activeConversation || activeConversation.messages.length < 2) return;
    const messages = activeConversation.messages;
    const lastUserMsg = messages[messages.length - 2];
    if (lastUserMsg.role !== 'user') return;
    
    const updatedMessages = messages.slice(0, -1);
    const updatedConv = { ...activeConversation, messages: updatedMessages };
    setActiveConversation(updatedConv);
    setConversations(prev => prev.map(conv => 
      conv.id === updatedConv.id ? updatedConv : conv
    ));

    const aiResponse = await callAPI(lastUserMsg.content, updatedConv.id);
    const aiMsg = {
      id: Date.now().toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };
    const finalConv = { ...updatedConv, messages: [...updatedMessages, aiMsg] };
    setConversations(prev => prev.map(conv => 
      conv.id === finalConv.id ? finalConv : conv
    ));
    setActiveConversation(finalConv);
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input not supported in this browser');
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleReaction = (msgId, reaction) => {
    setReactions(prev => ({
      ...prev,
      [msgId]: prev[msgId] === reaction ? null : reaction
    }));
  };

  const togglePin = (msgId) => {
    setPinnedMessages(prev => 
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
  };

  const editMessage = (msgId, newContent) => {
    if (!activeConversation) return;
    const updatedMessages = activeConversation.messages.map(msg =>
      msg.id === msgId ? { ...msg, content: newContent, edited: true } : msg
    );
    const updatedConv = { ...activeConversation, messages: updatedMessages };
    setActiveConversation(updatedConv);
    setConversations(prev => prev.map(conv => 
      conv.id === updatedConv.id ? updatedConv : conv
    ));
    setEditingMessage(null);
  };

  const addTag = (convId, tag) => {
    setTags(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), tag]
    }));
  };

  const removeTag = (convId, tag) => {
    setTags(prev => ({
      ...prev,
      [convId]: (prev[convId] || []).filter(t => t !== tag)
    }));
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const generateSummary = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;
    const summary = `Chat Summary: ${activeConversation.messages.length} messages exchanged about ${activeConversation.title}`;
    alert(summary);
  };

  const shareConversation = () => {
    if (!activeConversation) return;
    const shareData = {
      title: activeConversation.title,
      text: `Check out this conversation: ${activeConversation.title}`,
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        setShowTemplates(false);
        setShowMoreActions(false);
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  const renderMessageContent = (content) => {
    if (content.includes('[IMAGE_GENERATED:')) {
      const parts = content.split('[IMAGE_GENERATED:');
      const beforeImage = parts[0];
      const afterParts = parts[1].split(']');
      const filename = afterParts[0];
      const afterImage = afterParts[1] || '';
      const imageUrl = `/api/image/${filename}`;
      
      return (
        <div>
          {beforeImage && <div style={{ marginBottom: '12px' }}><ReactMarkdown>{beforeImage}</ReactMarkdown></div>}
          <div className="generated-image" style={{ marginTop: '15px', marginBottom: '15px' }}>
            <img 
              src={imageUrl}
              alt="Generated AI Image"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '12px',
                border: '2px solid #3b82f6',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                cursor: 'pointer'
              }}
              onClick={() => window.open(imageUrl, '_blank')}
            />
            <div style={{ 
              marginTop: '8px', 
              display: 'flex', 
              gap: '8px', 
              alignItems: 'center' 
            }}>
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = imageUrl;
                  link.download = filename;
                  link.click();
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Download
              </button>
              <button 
                onClick={() => window.open(imageUrl, '_blank')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                View Full Size
              </button>
            </div>
          </div>
          {afterImage && <div style={{ marginTop: '12px' }}><ReactMarkdown>{afterImage}</ReactMarkdown></div>}
        </div>
      );
    }
    
    return (
      <ReactMarkdown
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const suggestions = [
    "Analyze my Python code for bugs",
    "Create a business plan for my startup", 
    "Review this contract for red flags",
    "Design a cybersecurity policy",
    "Generate a marketing blog post",
    "Create a project timeline",
    "Analyze sales data trends",
    "Provide investment advice"
  ];

  const templates = [
    { title: 'Code Review', prompt: 'Review this code for bugs, security issues, and improvements:\n\n[Paste your code here]' },
    { title: 'Email Writer', prompt: 'Write a professional email about: [topic]' },
    { title: 'Business Plan', prompt: 'Create a comprehensive business plan for: [business idea]' },
    { title: 'Content Creator', prompt: 'Write engaging content about: [topic] for [platform]' },
    { title: 'Data Analysis', prompt: 'Analyze this data and provide insights:\n\n[Paste data here]' },
    { title: 'Problem Solver', prompt: 'Help me solve this problem: [describe problem]' }
  ];

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  }, []);

  return (
    <div className={`app ${theme}`}>
      {/* Templates Modal */}
      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Conversation Templates</h2>
            <div className="templates-grid">
              {templates.map((template, idx) => (
                <div key={idx} className="template-card" onClick={() => {
                  setMessage(template.prompt);
                  setShowTemplates(false);
                  textareaRef.current?.focus();
                }}>
                  <h3>{template.title}</h3>
                  <p>{template.prompt.substring(0, 60)}...</p>
                </div>
              ))}
            </div>
            <button className="modal-close" onClick={() => setShowTemplates(false)}>×</button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="modal-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Keyboard Shortcuts</h2>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>K</kbd>
                <span>Show shortcuts</span>
              </div>
              <div className="shortcut-item">
                <kbd>Enter</kbd>
                <span>Send message</span>
              </div>
              <div className="shortcut-item">
                <kbd>Shift</kbd> + <kbd>Enter</kbd>
                <span>New line</span>
              </div>
              <div className="shortcut-item">
                <kbd>Esc</kbd>
                <span>Close modals</span>
              </div>
            </div>
            <button className="modal-close" onClick={() => setShowShortcuts(false)}>×</button>
          </div>
        </div>
      )}

      {/* More Actions Modal */}
      {showMoreActions && activeConversation && (
        <div className="modal-overlay" onClick={() => setShowMoreActions(false)}>
          <div className="modal actions-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Chat Actions</h2>
            <div className="actions-list">
              <button className="action-item" onClick={() => { exportChat(); setShowMoreActions(false); }}>
                <span className="action-icon">⬇️</span>
                <div className="action-content">
                  <span className="action-title">Export Chat</span>
                  <span className="action-desc">Download conversation as text file</span>
                </div>
              </button>
              <button className="action-item" onClick={() => { clearChat(); setShowMoreActions(false); }}>
                <span className="action-icon">🗑️</span>
                <div className="action-content">
                  <span className="action-title">Clear Chat</span>
                  <span className="action-desc">Remove all messages from this conversation</span>
                </div>
              </button>
              <button className="action-item" onClick={() => { regenerateResponse(); setShowMoreActions(false); }}>
                <span className="action-icon">🔄</span>
                <div className="action-content">
                  <span className="action-title">Regenerate Response</span>
                  <span className="action-desc">Get a new response for the last message</span>
                </div>
              </button>
              <button className="action-item" onClick={() => { generateSummary(); setShowMoreActions(false); }}>
                <span className="action-icon">📊</span>
                <div className="action-content">
                  <span className="action-title">Generate Summary</span>
                  <span className="action-desc">Create a summary of this conversation</span>
                </div>
              </button>
              <button className="action-item" onClick={() => { shareConversation(); setShowMoreActions(false); }}>
                <span className="action-icon">🔗</span>
                <div className="action-content">
                  <span className="action-title">Share Conversation</span>
                  <span className="action-desc">Share this conversation with others</span>
                </div>
              </button>
            </div>
            <button className="modal-close" onClick={() => setShowMoreActions(false)}>×</button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button onClick={createNewConversation} className="new-chat-btn">
            + New Chat
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="conversations-list">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${activeConversation?.id === conv.id ? 'active' : ''}`}
              onClick={() => setActiveConversation(conv)}
            >
              <span className="conversation-title">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="delete-btn"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="user-profile">
          <div className="user-avatar">👤</div>
          <div className="user-info">
            <div className="user-name">User</div>
            <div className="user-email">user@example.com</div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-area">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="menu-btn">
              ☰
            </button>
            <div className="app-title">
              <span className="sparkle">✨</span>
              <h1>ChatX</h1>
            </div>
          </div>
          {activeConversation && (
            <div className="header-right">
              <button onClick={toggleTheme} className="theme-btn" title="Toggle theme">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button onClick={() => setShowSearch(!showSearch)} className="search-chat-btn" title="Search in chat">
                🔍
              </button>
              <button onClick={() => setShowMoreActions(true)} className="more-actions-btn" title="More actions">
                ⋮
              </button>
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Search Bar */}
        {showSearch && activeConversation && (
          <div className="search-in-chat">
            <input
              type="text"
              placeholder="Search in this chat..."
              value={searchInChat}
              onChange={(e) => setSearchInChat(e.target.value)}
              className="search-chat-input"
            />
            <button onClick={() => { setSearchInChat(''); setShowSearch(false); }}>×</button>
          </div>
        )}

        {/* Messages */}
        <div className="messages-container">
          {!activeConversation ? (
            <div className="welcome-screen">
              <div className="welcome-content">
                <h2>Welcome to ChatX</h2>
                <p>Start a conversation to begin</p>
              </div>
              <div className="suggestions-grid">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setMessage(suggestion);
                      textareaRef.current?.focus();
                    }}
                    className="suggestion-card"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages">
              {activeConversation.messages
                .filter(msg => !searchInChat || msg.content.toLowerCase().includes(searchInChat.toLowerCase()))
                .map((msg) => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <div className="message-text">
                      {renderMessageContent(msg.content)}
                    </div>
                    <div className="message-footer">
                      <div className="message-time">
                        {getRelativeTime(msg.timestamp)} {msg.edited && '(edited)'}
                      </div>
                      <div className="message-actions">
                        {msg.role === 'assistant' && (
                          <>
                            <button className="msg-action-btn" onClick={() => speakText(msg.content)} title="Read aloud">
                              {isSpeaking ? '🔊' : '🔈'}
                            </button>
                            <button className="msg-action-btn" onClick={() => copyToClipboard(msg.content)} title="Copy">
                              📋
                            </button>
                          </>
                        )}
                        <button className="msg-action-btn" onClick={() => togglePin(msg.id)} title="Pin">
                          {pinnedMessages.includes(msg.id) ? '📌' : '📍'}
                        </button>
                        <button className="msg-action-btn" onClick={() => toggleReaction(msg.id, 'like')} title="Like">
                          {reactions[msg.id] === 'like' ? '👍' : '👎'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <div className="typing-text">AI is thinking...</div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-actions">
            <button onClick={() => setShowTemplates(!showTemplates)} className="action-btn" title="Templates">
              📝
            </button>
            <button onClick={startVoiceInput} className={`action-btn ${isListening ? 'active' : ''}`} title="Voice input">
              {isListening ? '🔴' : '🎤'}
            </button>
          </div>
          <div className="input-container">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="Message ChatX... (Shift+Enter for new line)"
              className="message-input"
              rows="1"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || isTyping}
              className={`send-btn ${message.trim() && !isTyping ? 'active' : ''}`}
            >
              {isTyping ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;