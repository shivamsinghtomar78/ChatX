import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const App = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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
    try {
      const response = await fetch('http://localhost:5000/api/chat', {
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
      
      const data = await response.json();
      setIsTyping(false);
      return data.response || 'Sorry, I could not process your request.';
    } catch (error) {
      setIsTyping(false);
      return 'Error: Could not connect to server.';
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

  const renderMessageContent = (content) => {
    // Check if message contains image marker
    if (content.includes('[IMAGE_GENERATED:')) {
      const parts = content.split('[IMAGE_GENERATED:');
      const beforeImage = parts[0];
      const afterParts = parts[1].split(']');
      const filename = afterParts[0];
      const afterImage = afterParts[1] || '';
      const imageUrl = `http://localhost:5000/api/image/${filename}`;
      
      return (
        <div>
          <div>{beforeImage}</div>
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
          <div>{afterImage}</div>
        </div>
      );
    }
    
    return content;
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

  return (
    <div className="app">
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
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="menu-btn">
            ☰
          </button>
          <div className="app-title">
            <span className="sparkle">✨</span>
            <h1>ChatX</h1>
          </div>
          {activeConversation && (
            <div className="message-count">
              {activeConversation.messages.length} messages
            </div>
          )}
        </div>

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
              {activeConversation.messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <div className="message-text">
                      {renderMessageContent(msg.content)}
                    </div>
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
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
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-container">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message ChatX..."
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