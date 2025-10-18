import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

const App = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [searchInChat, setSearchInChat] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [reactions, setReactions] = useState({});
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userAvatar, setUserAvatar] = useState('👤');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: '' });
  const [virtualizedConversations, setVirtualizedConversations] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const sidebarRef = useRef(null);
  const conversationRefs = useRef({});

  // Check if device is mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && 
          sidebarOpen && isMobile) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, isMobile]);

  // Memoized filtered conversations for performance
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv =>
      conv.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  // Virtualized conversation list for performance
  useEffect(() => {
    const startIndex = 0;
    const endIndex = Math.min(startIndex + 50, filteredConversations.length);
    setVirtualizedConversations(filteredConversations.slice(startIndex, endIndex));
  }, [filteredConversations]);

  // Toast notification function
  const showToastMessage = useCallback((message, type = 'info') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => {
      setShowToast({ show: false, message: '', type: '' });
    }, 3000);
  }, []);

  // Theme effect
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
    showToastMessage(`Switched to ${newTheme} mode`, 'success');
  };

  // Load saved data
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
      showToastMessage('Error loading saved conversations', 'error');
    }
  }, [showToastMessage]);

  // Save conversations
  useEffect(() => {
    if (conversations.length > 0) {
      try {
        localStorage.setItem('chatx-conversations', JSON.stringify(conversations));
      } catch (e) {
        showToastMessage('Error saving conversations', 'error');
      }
    }
  }, [conversations, showToastMessage]);

  // Save active conversation
  useEffect(() => {
    if (activeConversation) {
      try {
        localStorage.setItem('chatx-active-conversation', JSON.stringify(activeConversation));
      } catch (e) {
        showToastMessage('Error saving active conversation', 'error');
      }
    }
  }, [activeConversation, showToastMessage]);

  // Scroll to bottom effect
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, scrollToBottom]);

  // Create new conversation
  const createNewConversation = useCallback(() => {
    const newConv = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversation(newConv);
    if (isMobile) {
      setSidebarOpen(false);
    }
    showToastMessage('New conversation created', 'success');
  }, [isMobile, showToastMessage]);

  // Delete conversation
  const deleteConversation = useCallback((id) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (activeConversation?.id === id) {
      setActiveConversation(null);
      showToastMessage('Conversation deleted', 'info');
    }
  }, [activeConversation?.id, showToastMessage]);

  // Generate title
  const generateTitle = useCallback((firstMessage) => {
    return firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;
  }, []);

  // Call API
  const callAPI = useCallback(async (message, threadId) => {
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
      showToastMessage('Connection failed. Please check backend.', 'error');
      return 'Error: Could not connect to server. Please check backend.';
    }
  }, [showToastMessage]);

  // Send message
  const sendMessage = useCallback(async () => {
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
  }, [message, activeConversation, generateTitle, callAPI]);

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Handle textarea change
  const handleTextareaChange = useCallback((e) => {
    const value = e.target.value;
    setMessage(value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    if (activeConversation) {
      localStorage.setItem(`draft-${activeConversation.id}`, value);
    }
  }, [activeConversation]);

  // Load draft
  useEffect(() => {
    if (activeConversation) {
      const savedDraft = localStorage.getItem(`draft-${activeConversation.id}`);
      if (savedDraft) setMessage(savedDraft);
    }
  }, [activeConversation?.id]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
    showToastMessage('Copied to clipboard', 'success');
  }, [showToastMessage]);

  // Export chat
  const exportChat = useCallback(() => {
    if (!activeConversation) return;
    const chatText = activeConversation.messages.map(msg => 
      `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`
    ).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${activeConversation.title}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToastMessage('Chat exported successfully', 'success');
  }, [activeConversation, showToastMessage]);

  // Clear chat
  const clearChat = useCallback(() => {
    if (!activeConversation || !window.confirm('Clear this conversation?')) return;
    const clearedConv = { ...activeConversation, messages: [] };
    setConversations(prev => prev.map(conv => 
      conv.id === clearedConv.id ? clearedConv : conv
    ));
    setActiveConversation(clearedConv);
    showToastMessage('Chat cleared', 'info');
  }, [activeConversation, showToastMessage]);

  // Regenerate response
  const regenerateResponse = useCallback(async () => {
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
    showToastMessage('Response regenerated', 'success');
  }, [activeConversation, callAPI, showToastMessage]);

  // Voice input
  const startVoiceInput = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input not supported in this browser');
      showToastMessage('Voice input not supported in this browser', 'error');
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => {
      setIsListening(true);
      showToastMessage('Listening...', 'info');
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
      setIsListening(false);
      showToastMessage('Voice input received', 'success');
    };
    recognition.onerror = () => {
      setIsListening(false);
      showToastMessage('Voice input error', 'error');
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.start();
  }, [showToastMessage]);

  // Speak text
  const speakText = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => {
        setIsSpeaking(true);
        showToastMessage('Reading aloud...', 'info');
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        showToastMessage('Finished reading', 'success');
      };
      window.speechSynthesis.speak(utterance);
    }
  }, [showToastMessage]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Toggle reaction
  const toggleReaction = useCallback((msgId, reaction) => {
    setReactions(prev => ({
      ...prev,
      [msgId]: prev[msgId] === reaction ? null : reaction
    }));
  }, []);

  // Toggle pin
  const togglePin = useCallback((msgId) => {
    setPinnedMessages(prev => {
      const newPinned = prev.includes(msgId) 
        ? prev.filter(id => id !== msgId) 
        : [...prev, msgId];
      showToastMessage(
        prev.includes(msgId) ? 'Message unpinned' : 'Message pinned', 
        'success'
      );
      return newPinned;
    });
  }, [showToastMessage]);

  // Get relative time
  const getRelativeTime = useCallback((timestamp) => {
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
  }, []);

  // Generate summary
  const generateSummary = useCallback(() => {
    if (!activeConversation || activeConversation.messages.length === 0) return;
    const summary = `Chat Summary: ${activeConversation.messages.length} messages exchanged about ${activeConversation.title}`;
    alert(summary);
    showToastMessage('Summary generated', 'success');
  }, [activeConversation, showToastMessage]);

  // Share conversation
  const shareConversation = useCallback(() => {
    if (!activeConversation) return;
    const shareData = {
      title: activeConversation.title,
      text: `Check out this conversation: ${activeConversation.title}`,
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData);
      showToastMessage('Conversation shared', 'success');
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToastMessage('Link copied to clipboard', 'success');
    }
  }, [activeConversation, showToastMessage]);

  // Keyboard shortcuts
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
        setShowSearch(false);
        if (isMobile) {
          setSidebarOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [isMobile]);

  // Render message content
  const renderMessageContent = useCallback((content) => {
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
              loading="lazy"
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
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
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
                  background: 'linear-gradient(135deg, #10b981, #3b82f6)',
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
  }, []);

  // Suggestions and templates
  const suggestions = useMemo(() => [
    "Analyze my Python code for bugs",
    "Create a business plan for my startup", 
    "Review this contract for red flags",
    "Design a cybersecurity policy",
    "Generate a marketing blog post",
    "Create a project timeline",
    "Analyze sales data trends",
    "Provide investment advice"
  ], []);

  const templates = useMemo(() => [
    { title: 'Code Review', prompt: 'Review this code for bugs, security issues, and improvements:\n\n[Paste your code here]' },
    { title: 'Email Writer', prompt: 'Write a professional email about: [topic]' },
    { title: 'Business Plan', prompt: 'Create a comprehensive business plan for: [business idea]' },
    { title: 'Content Creator', prompt: 'Write engaging content about: [topic] for [platform]' },
    { title: 'Data Analysis', prompt: 'Analyze this data and provide insights:\n\n[Paste data here]' },
    { title: 'Problem Solver', prompt: 'Help me solve this problem: [describe problem]' }
  ], []);

  // Request notification permission
  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show notification
  const showNotification = useCallback((title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, []);

  // Initialize notifications
  useEffect(() => {
    requestNotificationPermission();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }
  }, [requestNotificationPermission]);

  return (
    <div className={`app ${theme}`} role="main">
      {/* Toast Notification */}
      {showToast.show && (
        <div 
          className={`toast toast-${showToast.type}`}
          role="alert"
          aria-live="polite"
        >
          <span>{showToast.message}</span>
          <button 
            onClick={() => setShowToast({ show: false, message: '', type: '' })}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Overlay for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div 
          className="overlay active"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <div className="main-content">
        {/* Sidebar - Hidden by default on mobile */}
        <div 
          className={`sidebar ${sidebarOpen ? 'open' : ''} ${theme}`}
          ref={sidebarRef}
          role="complementary"
        >
          <div className="sidebar-header">
            <button 
              onClick={createNewConversation} 
              className={`new-chat-btn ${theme}`}
              aria-label="Create new conversation"
            >
              <span aria-hidden="true">+</span> New Chat
            </button>
          </div>

          <div className="search-container">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`search-input ${theme}`}
              aria-label="Search conversations"
            />
          </div>

          <div 
            className="conversations-list"
            role="list"
          >
            {virtualizedConversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${activeConversation?.id === conv.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveConversation(conv);
                  if (isMobile) {
                    setSidebarOpen(false);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Select conversation: ${conv.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveConversation(conv);
                    if (isMobile) {
                      setSidebarOpen(false);
                    }
                  }
                }}
              >
                <span className="conversation-title">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="delete-btn"
                  aria-label={`Delete conversation: ${conv.title}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="user-profile">
            <div className="user-avatar" aria-hidden="true">👤</div>
            <div className="user-info">
              <div className="user-name">User</div>
              <div className="user-email">user@example.com</div>
            </div>
          </div>
        </div>

        {/* Chat Area - This is the main chat panel */}
        <div className="chat-area">
          {/* Header */}
          <div className={`header ${theme}`}>
            <div className="header-left">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className={`menu-btn ${theme}`}
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                aria-expanded={sidebarOpen}
              >
                ☰
              </button>
              <div className="app-title">
                <span className="sparkle" aria-hidden="true">✨</span>
                <h1>ChatX</h1>
              </div>
            </div>
            {activeConversation && (
              <div className="header-right">
                <button 
                  onClick={toggleTheme} 
                  className={`theme-btn ${theme}`} 
                  title="Toggle theme"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>
                <button 
                  onClick={() => setShowSearch(!showSearch)} 
                  className={`search-chat-btn ${theme}`} 
                  title="Search in chat"
                  aria-label="Search in chat"
                  aria-expanded={showSearch}
                >
                  🔍
                </button>
                <button 
                  onClick={() => setShowMoreActions(true)} 
                  className={`more-actions-btn ${theme}`} 
                  title="More actions"
                  aria-label="More actions"
                >
                  ⋮
                </button>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div 
              className="error-banner"
              role="alert"
              aria-live="assertive"
            >
              <span>⚠️ {error}</span>
              <button 
                onClick={() => setError(null)}
                aria-label="Close error message"
              >
                ×
              </button>
            </div>
          )}

          {/* Search Bar */}
          {showSearch && activeConversation && (
            <div className={`search-in-chat ${theme}`}>
              <input
                type="text"
                placeholder="Search in this chat..."
                value={searchInChat}
                onChange={(e) => setSearchInChat(e.target.value)}
                className={`search-chat-input ${theme}`}
                aria-label="Search in current chat"
              />
              <button 
                onClick={() => { setSearchInChat(''); setShowSearch(false); }}
                aria-label="Close search"
              >
                ×
              </button>
            </div>
          )}

          {/* Messages */}
          <div 
            className={`messages-container ${theme}`}
            role="feed"
            aria-label="Chat messages"
          >
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
                      className={`suggestion-card ${theme}`}
                      aria-label={`Use suggestion: ${suggestion}`}
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
                  <div 
                    key={msg.id} 
                    className={`message ${msg.role}`}
                    ref={el => conversationRefs.current[msg.id] = el}
                  >
                    <div 
                      className="message-avatar"
                      aria-label={msg.role === 'user' ? "You" : "AI Assistant"}
                    >
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="message-content">
                      <div className={`message-text ${theme}`}>
                        {renderMessageContent(msg.content)}
                      </div>
                      <div className="message-footer">
                        <div className="message-time">
                          {getRelativeTime(msg.timestamp)} {msg.edited && '(edited)'}
                        </div>
                        <div className="message-actions">
                          {msg.role === 'assistant' && (
                            <>
                              <button 
                                className={`msg-action-btn ${theme}`} 
                                onClick={() => speakText(msg.content)} 
                                title="Read aloud"
                                aria-label="Read message aloud"
                              >
                                {isSpeaking ? '🔊' : '🔈'}
                              </button>
                              <button 
                                className={`msg-action-btn ${theme}`} 
                                onClick={() => copyToClipboard(msg.content)} 
                                title="Copy"
                                aria-label="Copy message to clipboard"
                              >
                                📋
                              </button>
                            </>
                          )}
                          <button 
                            className={`msg-action-btn ${theme}`} 
                            onClick={() => togglePin(msg.id)} 
                            title="Pin"
                            aria-label={pinnedMessages.includes(msg.id) ? "Unpin message" : "Pin message"}
                          >
                            {pinnedMessages.includes(msg.id) ? '📌' : '📍'}
                          </button>
                          <button 
                            className={`msg-action-btn ${theme}`} 
                            onClick={() => toggleReaction(msg.id, 'like')} 
                            title="Like"
                            aria-label={reactions[msg.id] === 'like' ? "Unlike message" : "Like message"}
                          >
                            {reactions[msg.id] === 'like' ? '👍' : '👎'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="message assistant">
                    <div 
                      className="message-avatar"
                      aria-label="AI Assistant"
                    >
                      🤖
                    </div>
                    <div className="message-content">
                      <div className={`typing-indicator ${theme}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <div 
                        className="typing-text"
                        aria-label="AI is typing"
                      >
                        AI is thinking...
                      </div>
                    </div>
                  </div>
                )}
                <div 
                  ref={messagesEndRef} 
                  aria-hidden="true"
                />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className={`input-area ${theme}`}>
            <div className="input-actions">
              <button 
                onClick={() => setShowTemplates(!showTemplates)} 
                className={`action-btn ${theme}`} 
                title="Templates"
                aria-label="Open templates"
              >
                📝
              </button>
              <button 
                onClick={startVoiceInput} 
                className={`action-btn ${theme} ${isListening ? 'active' : ''}`} 
                title="Voice input"
                aria-label={isListening ? "Stop listening" : "Start voice input"}
                aria-pressed={isListening}
              >
                {isListening ? '🔴' : '🎤'}
              </button>
            </div>
            <div 
              className={`input-container ${theme} ${isFocused ? 'focused' : ''}`}
            >
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Message ChatX... (Shift+Enter for new line)"
                className={`message-input ${theme}`}
                rows="1"
                aria-label="Type your message"
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim() || isTyping}
                className={`send-btn ${message.trim() && !isTyping ? 'active' : ''}`}
                aria-label="Send message"
                aria-disabled={!message.trim() || isTyping}
              >
                {isTyping ? '⏳' : '➤'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowTemplates(false)}
          role="dialog"
          aria-labelledby="templates-modal-title"
          aria-modal="true"
        >
          <div 
            className={`modal ${theme}`} 
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <h2 id="templates-modal-title">Conversation Templates</h2>
            <div className="templates-grid">
              {templates.map((template, idx) => (
                <div 
                  key={idx} 
                  className={`template-card ${theme}`}
                  onClick={() => {
                    setMessage(template.prompt);
                    setShowTemplates(false);
                    textareaRef.current?.focus();
                    showToastMessage('Template applied', 'success');
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setMessage(template.prompt);
                      setShowTemplates(false);
                      textareaRef.current?.focus();
                      showToastMessage('Template applied', 'success');
                    }
                  }}
                >
                  <h3>{template.title}</h3>
                  <p>{template.prompt.substring(0, 60)}...</p>
                </div>
              ))}
            </div>
            <button 
              className={`modal-close ${theme}`} 
              onClick={() => setShowTemplates(false)}
              aria-label="Close templates modal"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowShortcuts(false)}
          role="dialog"
          aria-labelledby="shortcuts-modal-title"
          aria-modal="true"
        >
          <div 
            className={`modal ${theme}`} 
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <h2 id="shortcuts-modal-title">Keyboard Shortcuts</h2>
            <div className={`shortcuts-list ${theme}`}>
              <div className={`shortcut-item ${theme}`}>
                <kbd>Ctrl</kbd> + <kbd>K</kbd>
                <span>Show shortcuts</span>
              </div>
              <div className={`shortcut-item ${theme}`}>
                <kbd>Enter</kbd>
                <span>Send message</span>
              </div>
              <div className={`shortcut-item ${theme}`}>
                <kbd>Shift</kbd> + <kbd>Enter</kbd>
                <span>New line</span>
              </div>
              <div className={`shortcut-item ${theme}`}>
                <kbd>Esc</kbd>
                <span>Close modals</span>
              </div>
            </div>
            <button 
              className={`modal-close ${theme}`} 
              onClick={() => setShowShortcuts(false)}
              aria-label="Close shortcuts modal"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* More Actions Modal */}
      {showMoreActions && activeConversation && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowMoreActions(false)}
          role="dialog"
          aria-labelledby="actions-modal-title"
          aria-modal="true"
        >
          <div 
            className={`modal actions-modal ${theme}`} 
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <h2 id="actions-modal-title">Chat Actions</h2>
            <div className="actions-list">
              <button 
                className={`action-item ${theme}`} 
                onClick={() => { exportChat(); setShowMoreActions(false); }}
                aria-label="Export chat"
              >
                <span className="action-icon">⬇️</span>
                <div className="action-content">
                  <span className="action-title">Export Chat</span>
                  <span className="action-desc">Download conversation as text file</span>
                </div>
              </button>
              <button 
                className={`action-item ${theme}`} 
                onClick={() => { clearChat(); setShowMoreActions(false); }}
                aria-label="Clear chat"
              >
                <span className="action-icon">🗑️</span>
                <div className="action-content">
                  <span className="action-title">Clear Chat</span>
                  <span className="action-desc">Remove all messages from this conversation</span>
                </div>
              </button>
              <button 
                className={`action-item ${theme}`} 
                onClick={() => { regenerateResponse(); setShowMoreActions(false); }}
                aria-label="Regenerate response"
              >
                <span className="action-icon">🔄</span>
                <div className="action-content">
                  <span className="action-title">Regenerate Response</span>
                  <span className="action-desc">Get a new response for the last message</span>
                </div>
              </button>
              <button 
                className={`action-item ${theme}`} 
                onClick={() => { generateSummary(); setShowMoreActions(false); }}
                aria-label="Generate summary"
              >
                <span className="action-icon">📊</span>
                <div className="action-content">
                  <span className="action-title">Generate Summary</span>
                  <span className="action-desc">Create a summary of this conversation</span>
                </div>
              </button>
              <button 
                className={`action-item ${theme}`} 
                onClick={() => { shareConversation(); setShowMoreActions(false); }}
                aria-label="Share conversation"
              >
                <span className="action-icon">🔗</span>
                <div className="action-content">
                  <span className="action-title">Share Conversation</span>
                  <span className="action-desc">Share this conversation with others</span>
                </div>
              </button>
            </div>
            <button 
              className={`modal-close ${theme}`} 
              onClick={() => setShowMoreActions(false)}
              aria-label="Close actions modal"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;