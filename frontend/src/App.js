import React, { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import { Search, SearchIcon, Sun, Moon, Monitor, Contrast, Palette } from 'lucide-react';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import './App.css';
import './App.responsive.css';
import './responsive.css';
import './components/AdvancedSearch.css';
import ImprovedVirtualizedMessages from './components/ImprovedVirtualizedMessages';
import AdvancedSearch from './components/AdvancedSearch';
import SuggestionCard from './components/SuggestionCard';
import ConversationItem from './components/ConversationItem';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load modals that are not immediately needed
const TemplatesModal = lazy(() => import('./components/TemplatesModal'));
const ShortcutsModal = lazy(() => import('./components/ShortcutsModal'));
const ActionsModal = lazy(() => import('./components/ActionsModal'));

const App = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1); // New state for highlighted suggestion
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
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false); // New state for advanced search modal
  const [showThemeSelector, setShowThemeSelector] = useState(false); // New state for theme selector
  const [isMobile, setIsMobile] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const sidebarRef = useRef(null);
  const conversationRefs = useRef({});
  const messagesContainerRef = useRef(null);
  const messageHeightCache = useRef({}); // Cache for message heights
  const speechRecognitionRef = useRef(null); // Ref for speech recognition instance
  const skipLinkRef = useRef(null); // Ref for skip-to-content link

  // Performance optimization: Memoize expensive calculations
  const windowHeight = useMemo(() => {
    return typeof window !== 'undefined' ? window.innerHeight : 600;
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkIsMobile, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
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

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      // Clean up speech recognition if it's still active
      if (speechRecognitionRef.current && speechRecognitionRef.current.abort) {
        speechRecognitionRef.current.abort();
      }
      
      // Cancel any ongoing speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Cleanup speech synthesis when component unmounts or when speaking stops
  useEffect(() => {
    const handleBeforeUnload = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Memoized filtered conversations for performance - enhanced search
  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    
    const term = searchTerm.toLowerCase();
    return conversations.filter(conv => {
      switch (searchFilter) {
        case 'title':
          // Search only in conversation title
          return conv.title.toLowerCase().includes(term);
          
        case 'content':
          // Search only in message content
          return conv.messages.some(msg => 
            msg.content.toLowerCase().includes(term)
          );
          
        case 'metadata':
          // Search only in message metadata (role)
          return conv.messages.some(msg => 
            msg.role.toLowerCase().includes(term)
          );
          
        case 'timestamps':
          // Search only in timestamps (formatted dates)
          return conv.createdAt.toLocaleDateString().toLowerCase().includes(term) ||
                 conv.createdAt.toLocaleTimeString().toLowerCase().includes(term) ||
                 conv.messages.some(msg => 
                   new Date(msg.timestamp).toLocaleDateString().toLowerCase().includes(term) ||
                   new Date(msg.timestamp).toLocaleTimeString().toLowerCase().includes(term)
                 );
          
        default: // 'all'
          // Search in all fields
          if (conv.title.toLowerCase().includes(term)) return true;
          
          if (conv.messages.some(msg => 
            msg.content.toLowerCase().includes(term)
          )) return true;
          
          if (conv.messages.some(msg => 
            msg.role.toLowerCase().includes(term)
          )) return true;
          
          if (conv.createdAt.toLocaleDateString().toLowerCase().includes(term) ||
              conv.createdAt.toLocaleTimeString().toLowerCase().includes(term)) return true;
          
          if (conv.messages.some(msg => 
            new Date(msg.timestamp).toLocaleDateString().toLowerCase().includes(term) ||
            new Date(msg.timestamp).toLocaleTimeString().toLowerCase().includes(term)
          )) return true;
          
          return false;
      }
    });
  }, [conversations, searchTerm, searchFilter]);

  // Toast notification function
  const showToastMessage = useCallback((message, type = 'info') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => {
      setShowToast({ show: false, message: '', type: '' });
    }, 3000);
  }, []);

  // Theme effect with system preference detection
  useEffect(() => {
    // Check for system preference
    const getSystemTheme = () => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    };
    
    // Check for saved theme or use system preference
    const savedTheme = localStorage.getItem('chatx-theme');
    const systemTheme = getSystemTheme();
    
    // If no saved theme, use system preference
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    document.body.className = initialTheme;
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      // Only update if user hasn't set a specific theme
      if (!localStorage.getItem('chatx-theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        document.body.className = newTheme;
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // Enhanced theme switching with preview
  const setThemeWithPreview = (newTheme) => {
    // Apply theme immediately for preview
    document.body.className = newTheme;
  };

  const confirmTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('chatx-theme', newTheme);
    document.body.className = newTheme;
    setShowThemeSelector(false);
    showToastMessage(`Switched to ${newTheme} mode`, 'success');
  };

  const resetToSystemTheme = () => {
    localStorage.removeItem('chatx-theme');
    // Trigger a re-render to pick up system theme
    const event = new Event('resize');
    window.dispatchEvent(event);
    setShowThemeSelector(false);
    showToastMessage('Reset to system preference', 'success');
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

  // Scroll to bottom effect with optimization
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } catch (err) {
        messagesEndRef.current.scrollIntoView(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [activeConversation?.messages, scrollToBottom]);

  // Focus management for accessibility
  const handleSkipToContent = () => {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.focus();
    }
  };

  // Keyboard navigation enhancements
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip to content with Ctrl+Alt+S
      if (e.ctrlKey && e.altKey && e.key === 'S') {
        e.preventDefault();
        handleSkipToContent();
      }
      
      // Close modals with Escape key
      if (e.key === 'Escape') {
        if (showAdvancedSearch) {
          setShowAdvancedSearch(false);
        } else if (showTemplates) {
          setShowTemplates(false);
        } else if (showShortcuts) {
          setShowShortcuts(false);
        } else if (showMoreActions) {
          setShowMoreActions(false);
        } else if (showSearch) {
          setShowSearch(false);
        } else if (sidebarOpen && isMobile) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAdvancedSearch, showTemplates, showShortcuts, showMoreActions, showSearch, sidebarOpen, isMobile]);

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

  // Call API with error handling
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

  // Send message with performance optimizations
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

    // Optimized state update
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

    // Optimized state update
    const finalConv = {
      ...updatedConv,
      messages: [...updatedConv.messages, aiMsg]
    };

    setConversations(prev => prev.map(conv => 
      conv.id === finalConv.id ? finalConv : conv
    ));
    setActiveConversation(finalConv);
  }, [message, activeConversation, generateTitle, callAPI]);

  // Handle key press with optimization
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
    if (e.target) {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    }
    if (activeConversation) {
      try {
        localStorage.setItem(`draft-${activeConversation.id}`, value);
      } catch (err) {
        console.warn('Failed to save draft:', err);
      }
    }
  }, [activeConversation]);

  // Load draft
  useEffect(() => {
    if (activeConversation) {
      try {
        const savedDraft = localStorage.getItem(`draft-${activeConversation.id}`);
        if (savedDraft) setMessage(savedDraft);
      } catch (err) {
        console.warn('Failed to load draft:', err);
      }
    }
  }, [activeConversation?.id]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => showToastMessage('Copied to clipboard', 'success'))
        .catch(() => showToastMessage('Failed to copy', 'error'));
    } else {
      showToastMessage('Clipboard not supported', 'error');
    }
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
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToastMessage('Voice input not supported in this browser', 'error');
      return;
    }
    
    // Clean up any existing recognition
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    speechRecognitionRef.current = recognition; // Store reference for cleanup
    
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
      speechRecognitionRef.current = null; // Clear reference on error
    };
    recognition.onend = () => {
      setIsListening(false);
      speechRecognitionRef.current = null; // Clear reference on end
    };
    recognition.start();
  }, [showToastMessage]);

  // Speak text
  const speakText = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => {
        setIsSpeaking(true);
        showToastMessage('Reading aloud...', 'info');
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        showToastMessage('Finished reading', 'success');
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        showToastMessage('Error reading text', 'error');
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

  // Helper function to highlight search terms
  const highlightText = useCallback((text, searchTerm) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="search-highlight">{part}</mark> : 
        part
    );
  }, []);

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
      navigator.share(shareData)
        .then(() => showToastMessage('Conversation shared', 'success'))
        .catch(() => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href)
              .then(() => showToastMessage('Link copied to clipboard', 'success'))
              .catch(() => showToastMessage('Failed to share', 'error'));
          }
        });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
        .then(() => showToastMessage('Link copied to clipboard', 'success'))
        .catch(() => showToastMessage('Failed to copy link', 'error'));
    } else {
      showToastMessage('Sharing not supported', 'error');
    }
  }, [activeConversation, showToastMessage]);

  // Handle search result selection
  const handleSearchResultSelect = useCallback((result) => {
    // If it's a conversation result, switch to that conversation
    if (result.type === 'conversation') {
      const conversation = conversations.find(conv => conv.id === result.conversationId);
      if (conversation) {
        setActiveConversation(conversation);
        if (isMobile) {
          setSidebarOpen(false);
        }
        setShowAdvancedSearch(false);
        setSearchInChat(''); // Clear chat search
        setShowSearch(false); // Hide chat search bar
        return;
      }
    }
    
    // If it's a message result, switch to that conversation and scroll to the message
    if (result.conversationId) {
      const conversation = conversations.find(conv => conv.id === result.conversationId);
      if (conversation) {
        setActiveConversation(conversation);
        if (isMobile) {
          setSidebarOpen(false);
        }
        setShowAdvancedSearch(false);
        
        // Set up search in chat to highlight the term
        setSearchInChat(searchTerm);
        setShowSearch(true);
        
        // Scroll to the message after a short delay to allow UI to update
        setTimeout(() => {
          const messageElement = document.querySelector(`[data-message-id="${result.messageId}"]`);
          if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a temporary highlight effect
            messageElement.classList.add('search-result-highlight');
            setTimeout(() => {
              messageElement.classList.remove('search-result-highlight');
            }, 2000);
          }
        }, 300);
      }
    }
  }, [conversations, isMobile, searchTerm]);

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
      navigator.serviceWorker.register('/service-worker.js')
        .catch(error => console.log('Service worker registration failed:', error));
    }
    
    // Cleanup service worker registration on unmount
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister();
          });
        }).catch(error => {
          console.log('Service worker unregistration failed:', error);
        });
      }
    };
  }, [requestNotificationPermission]);

  // Virtual scrolling effect with height calculation
  useEffect(() => {
    if (!activeConversation) return;
    
    const filteredMessages = activeConversation.messages.filter(msg => 
      !searchInChat || msg.content.toLowerCase().includes(searchInChat.toLowerCase())
    );
    
    // Update visible messages based on current indices
    // This useEffect is no longer needed with react-window implementation
  }, [activeConversation, searchInChat]);

  // Memoized filtered messages for the current conversation
  const filteredMessages = useMemo(() => {
    if (!activeConversation) return [];
    
    return activeConversation.messages.filter(msg => 
      !searchInChat || msg.content.toLowerCase().includes(searchInChat.toLowerCase())
    );
  }, [activeConversation, searchInChat]);

  // Memoized search suggestions
  const searchSuggestionsMemo = useMemo(() => {
    if (!searchTerm) return [];
    
    const suggestions = new Set();
    const lowerTerm = searchTerm.toLowerCase();
    
    // Add suggestions from conversation titles
    conversations.forEach(conv => {
      if (conv.title.toLowerCase().includes(lowerTerm)) {
        suggestions.add(conv.title);
      }
    });
    
    // Add suggestions from message content
    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.content.toLowerCase().includes(lowerTerm)) {
          // Extract words around the search term
          const words = msg.content.split(/\s+/);
          const termIndex = words.findIndex(word => word.toLowerCase().includes(lowerTerm));
          if (termIndex !== -1) {
            const start = Math.max(0, termIndex - 2);
            const end = Math.min(words.length, termIndex + 3);
            const suggestion = words.slice(start, end).join(' ');
            suggestions.add(suggestion);
          }
        }
      });
    });
    
    // Convert to array and limit to 5 suggestions
    return Array.from(suggestions).slice(0, 5);
  }, [conversations, searchTerm]);

  // Generate search suggestions based on conversation data
  const generateSearchSuggestions = useCallback((term) => {
    if (!term) {
      setSearchSuggestions([]);
      return;
    }
    
    setSearchSuggestions(searchSuggestionsMemo);
  }, [searchSuggestionsMemo]);

  // Missing handlers - Bug fixes
  const handleTemplateSelect = useCallback((templateId) => {
    const template = templates.find(t => t.title.toLowerCase().replace(/\s+/g, '_') === templateId);
    if (template) {
      setMessage(template.prompt);
      setShowTemplates(false);
      if (!activeConversation) {
        createNewConversation();
      }
    }
  }, [templates, activeConversation, createNewConversation]);

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    } else {
      startVoiceInput();
    }
  }, [isListening, startVoiceInput]);

  const handleClearConversation = useCallback(() => {
    clearChat();
  }, [clearChat]);

  const handleExportChat = useCallback(() => {
    exportChat();
  }, [exportChat]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleSend = useCallback(() => {
    sendMessage();
  }, [sendMessage]);

  const handleRegenerate = useCallback(() => {
    regenerateResponse();
  }, [regenerateResponse]);

  const handleGenerateSummary = useCallback(() => {
    generateSummary();
  }, [generateSummary]);

  const handleShareConversation = useCallback(() => {
    shareConversation();
  }, [shareConversation]);

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedSuggestion(prev => 
        prev < searchSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedSuggestion(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && highlightedSuggestion >= 0) {
      e.preventDefault();
      setSearchTerm(searchSuggestions[highlightedSuggestion]);
      setShowSuggestions(false);
      setHighlightedSuggestion(-1);
    }
  }, [searchSuggestions, highlightedSuggestion]);

  return (
    <ErrorBoundary>
    <div className={`app ${theme}`} role="main">
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="skip-to-content"
        onClick={handleSkipToContent}
        ref={skipLinkRef}
      >
        Skip to main content
      </a>
      
      {/* Overlay for mobile sidebar */}
      {isMobile && (
        <div 
          className={`overlay ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      
      {/* Sidebar - Hidden by default on mobile */}
      <div 
        ref={sidebarRef}
        className={`sidebar ${sidebarOpen ? 'open' : ''} ${theme}`}
        role="navigation"
        aria-label="Conversation navigation"
      >
        <div className={`sidebar-header ${theme}`}>
          <button
            onClick={createNewConversation}
            className={`new-chat-btn ${theme}`}
            aria-label="Create new conversation"
          >
            <span aria-hidden="true">+</span> New Chat
          </button>
        </div>
        
        <div className={`search-container ${theme}`}>
          <div className="search-wrapper">
            <SearchIcon className="search-icon" size={16} aria-hidden="true" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Delay hiding suggestions to allow clicking on them
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              onKeyDown={handleSearchKeyDown}
              className={`search-input ${theme}`}
              aria-label="Search conversations"
              aria-autocomplete="list"
              aria-expanded={showSuggestions && searchSuggestions.length > 0}
            />
          </div>
          
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className={`search-suggestions ${theme}`} role="listbox">
              {searchSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`search-suggestion-item ${theme} ${index === highlightedSuggestion ? 'highlighted' : ''}`}
                  onClick={() => {
                    setSearchTerm(suggestion);
                    setShowSuggestions(false);
                    setHighlightedSuggestion(-1);
                  }}
                  onMouseEnter={() => setHighlightedSuggestion(index)}
                  role="option"
                  aria-selected={index === highlightedSuggestion}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
          
          <select
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className={`search-filter-select ${theme}`}
            aria-label="Search filter"
          >
            <option value="all">All</option>
            <option value="title">Title</option>
            <option value="content">Content</option>
            <option value="metadata">Metadata</option>
            <option value="timestamps">Timestamps</option>
          </select>
        </div>
        
        <div className="conversations-list-header">
          <span>Recent Chats</span>
        </div>
        
        <div 
          className="conversations-list"
          aria-label="Conversation list"
        >
          {filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={activeConversation?.id === conversation.id}
              onClick={() => {
                setActiveConversation(conversation);
                if (isMobile) {
                  setSidebarOpen(false);
                }
              }}
              onDelete={() => deleteConversation(conversation.id)}
              theme={theme}
              ref={el => conversationRefs.current[conversation.id] = el}
            />
          ))}
          
          {filteredConversations.length === 0 && searchTerm && (
            <div className="conversation-empty-state">
              <div className="conversation-empty-state-icon">🔍</div>
              <p>No conversations found</p>
            </div>
          )}
        </div>
        
        <div className={`user-profile ${theme}`}>
          <div className="user-info">
            <div className="user-avatar">{userAvatar}</div>
            <div className="user-details">
              <div className="user-name">You</div>
              <div className="user-status">Online</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main chat area */}
      <div 
        id="main-content"
        className="chat-area"
        tabIndex="-1"
      >
        {/* Header */}
        <header className={`header ${theme}`} role="banner">
          <div className="header-left">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="menu-btn"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-expanded={sidebarOpen}
            >
              ☰
            </button>
            <div className="app-title">
              <span className={`sparkle ${theme}`} aria-hidden="true">✨</span>
              <h1>ChatX</h1>
            </div>
          </div>
          
          <div className="header-right">
            {/* Theme Selector Button */}
            <div className="theme-selector-container">
              <button
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className={`theme-toggle ${theme}`}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                aria-haspopup="true"
                aria-expanded={showThemeSelector}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              {/* Theme Selector Dropdown */}
              {showThemeSelector && (
                <div className={`theme-selector-dropdown ${theme}`}>
                  <div className="theme-selector-header">
                    <h3>Theme</h3>
                    <button 
                      className="close-theme-selector"
                      onClick={() => setShowThemeSelector(false)}
                      aria-label="Close theme selector"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="theme-options">
                    <button
                      className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => setThemeWithPreview('light')}
                      onMouseEnter={() => setThemeWithPreview('light')}
                      onMouseLeave={() => setThemeWithPreview(theme)}
                      onDoubleClick={() => confirmTheme('light')}
                    >
                      <Sun size={16} />
                      <span>Light</span>
                    </button>
                    
                    <button
                      className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => setThemeWithPreview('dark')}
                      onMouseEnter={() => setThemeWithPreview('dark')}
                      onMouseLeave={() => setThemeWithPreview(theme)}
                      onDoubleClick={() => confirmTheme('dark')}
                    >
                      <Moon size={16} />
                      <span>Dark</span>
                    </button>
                    
                    <button
                      className={`theme-option ${theme === 'high-contrast' ? 'active' : ''}`}
                      onClick={() => setThemeWithPreview('high-contrast')}
                      onMouseEnter={() => setThemeWithPreview('high-contrast')}
                      onMouseLeave={() => setThemeWithPreview(theme)}
                      onDoubleClick={() => confirmTheme('high-contrast')}
                    >
                      <Contrast size={16} />
                      <span>High Contrast</span>
                    </button>
                    
                    <button
                      className={`theme-option ${theme === 'sepia' ? 'active' : ''}`}
                      onClick={() => setThemeWithPreview('sepia')}
                      onMouseEnter={() => setThemeWithPreview('sepia')}
                      onMouseLeave={() => setThemeWithPreview(theme)}
                      onDoubleClick={() => confirmTheme('sepia')}
                    >
                      <Palette size={16} />
                      <span>Sepia</span>
                    </button>
                    
                    <button
                      className="theme-option system"
                      onClick={resetToSystemTheme}
                    >
                      <Monitor size={16} />
                      <span>System Default</span>
                    </button>
                  </div>
                  
                  <div className="theme-selector-footer">
                    <button
                      className="confirm-theme-btn"
                      onClick={() => confirmTheme(theme)}
                    >
                      Apply Theme
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowAdvancedSearch(true)}
              className="header-btn"
              aria-label="Advanced search"
            >
              <Search size={20} />
            </button>
            
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`header-btn ${showSearch ? 'active' : ''}`}
              aria-label="Search in chat"
              aria-expanded={showSearch}
            >
              🔍
            </button>
            
            <button
              onClick={() => setShowMoreActions(true)}
              className="header-btn"
              aria-label="More actions"
            >
              ⋮
            </button>
          </div>
        </header>
        
        {/* Error Banner */}
        {error && (
          <div className={`error-banner ${theme}`} role="alert" aria-live="assertive">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)} 
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        )}
        
        {/* Search in Chat */}
        {showSearch && (
          <div className={`search-in-chat ${theme}`}>
            <SearchIcon size={16} aria-hidden="true" />
            <Input
              type="text"
              placeholder="Search in current chat..."
              value={searchInChat}
              onChange={(e) => setSearchInChat(e.target.value)}
              className={`search-input ${theme}`}
              aria-label="Search in current chat"
            />
            <button 
              onClick={() => setShowSearch(false)}
              aria-label="Close search"
            >
              ×
            </button>
          </div>
        )}
        
        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="messages-container"
          aria-label="Chat messages"
          tabIndex="0"
        >
          {activeConversation ? (
            <div className="messages">
              <ImprovedVirtualizedMessages
                messages={activeConversation.messages}
                theme={theme}
                reactions={reactions}
                pinnedMessages={pinnedMessages}
                isSpeaking={isSpeaking}
                getRelativeTime={getRelativeTime}
                speakText={speakText}
                copyToClipboard={copyToClipboard}
                togglePin={togglePin}
                toggleReaction={toggleReaction}
                showToastMessage={showToastMessage}
                windowHeight={windowHeight - 200}
              />
              {isTyping && (
                <div className={`message assistant ${theme}`}>
                  <div className={`message-avatar ${theme}`} aria-label="AI Assistant">
                    🤖
                  </div>
                  <div className={`message-content ${theme}`}>
                    <div className={`message-card assistant ${theme}`}>
                      <div className="message-card-content">
                        <div className={`message-text ${theme}`}>
                          <div className={`typing-indicator ${theme}`} aria-label="AI is typing">
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-text">AI is typing...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="welcome-screen">
              <div className="welcome-screen-content">
                <h2>Welcome to ChatX</h2>
                <p>Start a new conversation or select an existing one to continue</p>
                <div className="welcome-suggestions">
                  <SuggestionCard 
                    title="Code Review" 
                    description="Get feedback on your code" 
                    onClick={() => handleTemplateSelect('code_review')}
                    theme={theme}
                  />
                  <SuggestionCard 
                    title="Business Plan" 
                    description="Create a comprehensive business plan" 
                    onClick={() => handleTemplateSelect('business_plan')}
                    theme={theme}
                  />
                  <SuggestionCard 
                    title="Content Creator" 
                    description="Generate engaging content" 
                    onClick={() => handleTemplateSelect('content_creator')}
                    theme={theme}
                  />
                  <SuggestionCard 
                    title="Data Analysis" 
                    description="Analyze data and provide insights" 
                    onClick={() => handleTemplateSelect('data_analysis')}
                    theme={theme}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className={`input-area ${theme}`}>
          <div className={`input-actions ${theme}`}>
            <Button
              onClick={handleVoiceInput}
              className={`voice-btn ${isListening ? 'recording' : ''} ${theme}`}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
            >
              {isListening ? '⏹' : '🎤'}
            </Button>
            
            <Button
              onClick={handleClearConversation}
              className={`clear-btn ${theme}`}
              aria-label="Clear conversation"
            >
              🗑
            </Button>
            
            <Button
              onClick={handleExportChat}
              className={`export-btn ${theme}`}
              aria-label="Export chat"
            >
              ⬇
            </Button>
            
            <Button
              onClick={() => setShowTemplates(true)}
              className={`template-btn ${theme}`}
              aria-label="Conversation templates"
            >
              📋
            </Button>
          </div>
          
          <div className={`input-container ${isFocused ? 'focused' : ''} ${theme}`}>
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type your message..."
              className={theme}
              aria-label="Message input"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isTyping}
              className={`send-btn ${theme}`}
              aria-label="Send message"
            >
              ↑
            </Button>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {showToast.show && (
        <div className={`toast toast-${showToast.type} ${theme}`}>
          <span>{showToast.message}</span>
          <button 
            onClick={() => setShowToast({ show: false, message: '', type: '' })}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Modals */}
      {showAdvancedSearch && (
        <AdvancedSearch
          conversations={conversations}
          activeConversation={activeConversation}
          theme={theme}
          pinnedMessages={pinnedMessages}
          reactions={reactions}
          onClose={() => setShowAdvancedSearch(false)}
          onResultSelect={handleSearchResultSelect}
        />
      )}
      
      <Suspense fallback={<div className="loading">Loading...</div>}>
        {showTemplates && (
          <TemplatesModal
            isOpen={showTemplates}
            onClose={() => setShowTemplates(false)}
            onSelectTemplate={handleTemplateSelect}
            theme={theme}
          />
        )}
      </Suspense>
      
      <Suspense fallback={<div className="loading">Loading...</div>}>
        {showShortcuts && (
          <ShortcutsModal
            isOpen={showShortcuts}
            onClose={() => setShowShortcuts(false)}
            theme={theme}
          />
        )}
      </Suspense>
      
      <Suspense fallback={<div className="loading">Loading...</div>}>
        {showMoreActions && (
          <ActionsModal
            isOpen={showMoreActions}
            onClose={() => setShowMoreActions(false)}
            onRegenerate={handleRegenerate}
            onSummary={handleGenerateSummary}
            onShare={handleShareConversation}
            theme={theme}
          />
        )}
      </Suspense>
    </div>
    </ErrorBoundary>
  );
};

export default App;