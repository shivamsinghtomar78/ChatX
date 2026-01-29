import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Filter, Calendar, User, Image, Code, Link, FileText, MessageSquare, Users, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const AdvancedSearch = ({ 
  conversations, 
  activeConversation, 
  theme, 
  pinnedMessages, 
  reactions,
  onClose,
  onResultSelect
}) => {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  
  // Filter state
  const [dateFilter, setDateFilter] = useState('all');
  const [senderFilter, setSenderFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [contextFilter, setContextFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  
  // Suggestions state
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  
  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chatx-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, []);
  
  // Save recent searches to localStorage
  useEffect(() => {
    if (searchTerm && !recentSearches.includes(searchTerm)) {
      const updated = [searchTerm, ...recentSearches.slice(0, 9)];
      setRecentSearches(updated);
      localStorage.setItem('chatx-recent-searches', JSON.stringify(updated));
    }
  }, [searchTerm, recentSearches]);
  
  // Generate search suggestions
  const generateSuggestions = useCallback((term) => {
    if (!term) {
      setSearchSuggestions([]);
      return;
    }
    
    const suggestions = new Set();
    const lowerTerm = term.toLowerCase();
    
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
    
    // Add recent searches
    recentSearches.forEach(search => {
      if (search.toLowerCase().includes(lowerTerm)) {
        suggestions.add(search);
      }
    });
    
    // Convert to array and limit to 5 suggestions
    setSearchSuggestions(Array.from(suggestions).slice(0, 5));
  }, [conversations, recentSearches]);
  
  // Debounced search term handler
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        generateSuggestions(searchTerm);
      } else {
        setSearchSuggestions([]);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, generateSuggestions]);
  
  // Highlight search terms in text
  const highlightText = useCallback((text, term) => {
    if (!term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className={`search-highlight ${theme}`}>{part}</mark> : 
        part
    );
  }, [theme]);
  
  // Categorize search results
  const categorizeResults = useCallback((results) => {
    const categorized = {
      all: results,
      messages: results.filter(item => item.type === 'message'),
      conversations: results.filter(item => item.type === 'conversation'),
      media: results.filter(item => item.type === 'media'),
      files: results.filter(item => item.type === 'file')
    };
    
    return categorized;
  }, []);
  
  // Perform search
  const performSearch = useCallback(() => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    // Simulate search delay for better UX
    setTimeout(() => {
      const results = [];
      
      // Search in all conversations if no active conversation
      const searchConversations = activeConversation ? [activeConversation] : conversations;
      
      searchConversations.forEach(conv => {
        // Add conversation matches
        if (conv.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({
            id: `conv-${conv.id}`,
            type: 'conversation',
            title: conv.title,
            content: conv.title,
            conversationId: conv.id,
            timestamp: conv.createdAt,
            matchCount: conv.title.toLowerCase().split(searchTerm.toLowerCase()).length - 1
          });
        }
        
        // Search in messages
        conv.messages.forEach(msg => {
          // Apply filters
          if (shouldIncludeMessage(msg, conv)) {
            // Check for content match
            if (msg.content.toLowerCase().includes(searchTerm.toLowerCase())) {
              // Determine message type
              let messageType = 'text';
              if (msg.content.includes('[IMAGE_GENERATED:')) {
                messageType = 'image';
              } else if (msg.content.includes('```')) {
                messageType = 'code';
              } else if (msg.content.includes('http')) {
                messageType = 'link';
              }
              
              // Extract context snippet
              const contentLower = msg.content.toLowerCase();
              const searchTermLower = searchTerm.toLowerCase();
              const index = contentLower.indexOf(searchTermLower);
              const start = Math.max(0, index - 50);
              const end = Math.min(msg.content.length, index + searchTerm.length + 50);
              const snippet = msg.content.substring(start, end);
              
              results.push({
                id: `msg-${msg.id}`,
                type: 'message',
                title: conv.title,
                content: msg.content,
                snippet: snippet,
                conversationId: conv.id,
                messageId: msg.id,
                timestamp: msg.timestamp,
                sender: msg.role,
                messageType: messageType,
                isPinned: pinnedMessages.includes(msg.id),
                hasReaction: !!reactions[msg.id],
                matchCount: msg.content.toLowerCase().split(searchTerm.toLowerCase()).length - 1
              });
              
              // Add media results
              if (messageType === 'image') {
                results.push({
                  id: `media-${msg.id}`,
                  type: 'media',
                  title: conv.title,
                  content: msg.content,
                  conversationId: conv.id,
                  messageId: msg.id,
                  timestamp: msg.timestamp,
                  sender: msg.role,
                  matchCount: msg.content.toLowerCase().split(searchTerm.toLowerCase()).length - 1
                });
              }
            }
          }
        });
      });
      
      // Sort by relevance (match count and recency)
      results.sort((a, b) => {
        // First sort by match count (higher is better)
        if (b.matchCount !== a.matchCount) {
          return b.matchCount - a.matchCount;
        }
        // Then sort by timestamp (newer is better)
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      const categorized = categorizeResults(results);
      setSearchResults(categorized);
      setIsSearching(false);
    }, 300);
  }, [searchTerm, conversations, activeConversation, pinnedMessages, reactions, categorizeResults]);
  
  // Check if message should be included based on filters
  const shouldIncludeMessage = useCallback((message, conversation) => {
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const messageDate = new Date(message.timestamp);
      
      switch (dateFilter) {
        case 'today':
          if (messageDate.toDateString() !== now.toDateString()) return false;
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          if (messageDate.toDateString() !== yesterday.toDateString()) return false;
          break;
        case 'last7days':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (messageDate < weekAgo) return false;
          break;
        case 'custom':
          if (customDateRange.start && new Date(message.timestamp) < new Date(customDateRange.start)) return false;
          if (customDateRange.end && new Date(message.timestamp) > new Date(customDateRange.end)) return false;
          break;
      }
    }
    
    // Sender filter
    if (senderFilter !== 'all' && senderFilter !== message.role) {
      return false;
    }
    
    // Content type filter
    if (contentTypeFilter !== 'all') {
      switch (contentTypeFilter) {
        case 'text':
          if (message.content.includes('[IMAGE_GENERATED:') || message.content.includes('```')) return false;
          break;
        case 'image':
          if (!message.content.includes('[IMAGE_GENERATED:')) return false;
          break;
        case 'code':
          if (!message.content.includes('```')) return false;
          break;
        case 'link':
          if (!message.content.includes('http')) return false;
          break;
      }
    }
    
    // Context filter
    if (contextFilter !== 'all') {
      switch (contextFilter) {
        case 'pinned':
          if (!pinnedMessages.includes(message.id)) return false;
          break;
        case 'reacted':
          if (!reactions[message.id]) return false;
          break;
      }
    }
    
    return true;
  }, [dateFilter, senderFilter, contentTypeFilter, contextFilter, customDateRange, pinnedMessages, reactions]);
  
  // Trigger search when search term or filters change
  useEffect(() => {
    performSearch();
  }, [searchTerm, dateFilter, senderFilter, contentTypeFilter, contextFilter, customDateRange, performSearch]);
  
  // Get category count
  const getCategoryCount = (category) => {
    if (!searchResults[category]) return 0;
    return searchResults[category].length;
  };
  
  // Handle result selection
  const handleResultSelect = (result) => {
    onResultSelect?.(result);
    onClose?.();
  };
  
  // Clear all filters
  const clearFilters = () => {
    setDateFilter('all');
    setSenderFilter('all');
    setContentTypeFilter('all');
    setContextFilter('all');
    setCustomDateRange({ start: '', end: '' });
  };
  
  return (
    <div className={`advanced-search-modal ${theme}`}>
      <div className={`advanced-search-overlay ${theme}`} onClick={onClose}></div>
      <div className={`advanced-search-container ${theme}`}>
        {/* Header */}
        <div className={`advanced-search-header ${theme}`}>
          <div className="advanced-search-title">
            <Search className="w-5 h-5" />
            <h2>Advanced Search</h2>
          </div>
          <button className={`close-button ${theme}`} onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search Input */}
        <div className={`search-input-container ${theme}`}>
          <div className="search-input-wrapper">
            <Search className="search-icon w-4 h-4" />
            <Input
              type="text"
              placeholder="Search conversations and messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`search-input-field ${theme}`}
              autoFocus
            />
            {searchTerm && (
              <button 
                className={`clear-search ${theme}`}
                onClick={() => setSearchTerm('')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Search Suggestions */}
          {searchSuggestions.length > 0 && (
            <div className={`search-suggestions-dropdown ${theme}`}>
              {searchSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`suggestion-item ${theme}`}
                  onClick={() => setSearchTerm(suggestion)}
                >
                  {highlightText(suggestion, searchTerm)}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Filters */}
        <div className={`search-filters-container ${theme}`}>
          <div className="filters-header">
            <h3>
              <Filter className="w-4 h-4" />
              Filters
            </h3>
            <button 
              className={`clear-filters-button ${theme}`}
              onClick={clearFilters}
            >
              Clear All
            </button>
          </div>
          
          <div className="filters-grid">
            {/* Date Filter */}
            <div className={`filter-group ${theme}`}>
              <label className={`filter-label ${theme}`}>
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`filter-select ${theme}`}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="custom">Custom Range</option>
              </select>
              
              {dateFilter === 'custom' && (
                <div className="date-range-inputs">
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className={`date-input ${theme}`}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className={`date-input ${theme}`}
                  />
                </div>
              )}
            </div>
            
            {/* Sender Filter */}
            <div className={`filter-group ${theme}`}>
              <label className={`filter-label ${theme}`}>
                <User className="w-4 h-4" />
                Sender
              </label>
              <select
                value={senderFilter}
                onChange={(e) => setSenderFilter(e.target.value)}
                className={`filter-select ${theme}`}
              >
                <option value="all">All Senders</option>
                <option value="user">You</option>
                <option value="assistant">AI Assistant</option>
              </select>
            </div>
            
            {/* Content Type Filter */}
            <div className={`filter-group ${theme}`}>
              <label className={`filter-label ${theme}`}>
                <FileText className="w-4 h-4" />
                Content Type
              </label>
              <select
                value={contentTypeFilter}
                onChange={(e) => setContentTypeFilter(e.target.value)}
                className={`filter-select ${theme}`}
              >
                <option value="all">All Types</option>
                <option value="text">Text</option>
                <option value="image">Images</option>
                <option value="code">Code Blocks</option>
                <option value="link">Links</option>
              </select>
            </div>
            
            {/* Context Filter */}
            <div className={`filter-group ${theme}`}>
              <label className={`filter-label ${theme}`}>
                <Star className="w-4 h-4" />
                Context
              </label>
              <select
                value={contextFilter}
                onChange={(e) => setContextFilter(e.target.value)}
                className={`filter-select ${theme}`}
              >
                <option value="all">All Contexts</option>
                <option value="pinned">Pinned Messages</option>
                <option value="reacted">Reacted Messages</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Recent Searches */}
        {recentSearches.length > 0 && !searchTerm && (
          <div className={`recent-searches-container ${theme}`}>
            <h3>Recent Searches</h3>
            <div className="recent-searches-list">
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  className={`recent-search-item ${theme}`}
                  onClick={() => setSearchTerm(search)}
                >
                  <Search className="w-4 h-4" />
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Search Results */}
        <div className={`search-results-container ${theme}`}>
          {isSearching ? (
            <div className={`search-loading ${theme}`}>
              <div className="spinner"></div>
              <p>Searching...</p>
            </div>
          ) : searchTerm ? (
            <>
              {/* Category Tabs */}
              <div className={`category-tabs ${theme}`}>
                <button
                  className={`tab-button ${theme} ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                >
                  <MessageSquare className="w-4 h-4" />
                  All
                  <span className="tab-count">{getCategoryCount('all')}</span>
                </button>
                <button
                  className={`tab-button ${theme} ${activeCategory === 'messages' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('messages')}
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                  <span className="tab-count">{getCategoryCount('messages')}</span>
                </button>
                <button
                  className={`tab-button ${theme} ${activeCategory === 'conversations' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('conversations')}
                >
                  <Users className="w-4 h-4" />
                  Conversations
                  <span className="tab-count">{getCategoryCount('conversations')}</span>
                </button>
                <button
                  className={`tab-button ${theme} ${activeCategory === 'media' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('media')}
                >
                  <Image className="w-4 h-4" />
                  Media
                  <span className="tab-count">{getCategoryCount('media')}</span>
                </button>
                <button
                  className={`tab-button ${theme} ${activeCategory === 'files' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('files')}
                >
                  <FileText className="w-4 h-4" />
                  Files
                  <span className="tab-count">{getCategoryCount('files')}</span>
                </button>
              </div>
              
              {/* Results List */}
              <div className={`results-list ${theme}`}>
                {searchResults[activeCategory] && searchResults[activeCategory].length > 0 ? (
                  searchResults[activeCategory].map((result) => (
                    <Card 
                      key={result.id} 
                      className={`result-card ${theme} ${result.isPinned ? 'pinned' : ''}`}
                      onClick={() => handleResultSelect(result)}
                    >
                      <CardHeader className={`result-header ${theme}`}>
                        <CardTitle className={`result-title ${theme}`}>
                          {highlightText(result.title || 'Untitled Conversation', searchTerm)}
                        </CardTitle>
                        <div className="result-meta">
                          <span className={`result-type ${theme} ${result.messageType || result.type}`}>
                            {result.messageType === 'image' && <Image className="w-3 h-3" />}
                            {result.messageType === 'code' && <Code className="w-3 h-3" />}
                            {result.messageType === 'link' && <Link className="w-3 h-3" />}
                            {result.type === 'conversation' && <Users className="w-3 h-3" />}
                            {result.type === 'media' && <Image className="w-3 h-3" />}
                            {result.messageType || result.type}
                          </span>
                          {result.isPinned && (
                            <span className={`pinned-badge ${theme}`}>
                              <Star className="w-3 h-3" />
                              Pinned
                            </span>
                          )}
                          {result.hasReaction && (
                            <span className={`reaction-badge ${theme}`}>
                              👍
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className={`result-content ${theme}`}>
                        <p className={`result-snippet ${theme}`}>
                          {result.snippet 
                            ? highlightText(result.snippet, searchTerm)
                            : highlightText(result.content.substring(0, 150) + '...', searchTerm)
                          }
                        </p>
                        <div className={`result-footer ${theme}`}>
                          <span className={`result-timestamp ${theme}`}>
                            {new Date(result.timestamp).toLocaleDateString()}
                          </span>
                          <span className={`result-sender ${theme} ${result.sender}`}>
                            {result.sender === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className={`no-results ${theme}`}>
                    <MessageSquare className="w-12 h-12" />
                    <h3>No results found</h3>
                    <p>Try adjusting your search terms or filters</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={`search-placeholder ${theme}`}>
              <Search className="w-16 h-16" />
              <h3>Search ChatX</h3>
              <p>Enter a term to search across your conversations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;