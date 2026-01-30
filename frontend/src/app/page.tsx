"use client";

import React, { useState } from 'react';
import {
  useToast,
  useConversations,
  useChat,
  useVoice,
  useMobile,
  useClipboard,
  useMessageActions
} from '@/hooks';

// Components
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import Toast from '@/components/Toast';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Home() {
  // Custom Hooks
  const { toast, showToast, hideToast } = useToast();
  const { isMobile, windowHeight } = useMobile();
  const { copy } = useClipboard(showToast);
  const {
    reactions,
    pinnedMessages,
    toggleReaction,
    togglePin
  } = useMessageActions();

  const {
    activeConversation,
    setActiveConversation,
    filteredConversations,
    searchTerm,
    setSearchTerm,
    createConversation,
    deleteConversation,
    updateConversation
  } = useConversations(showToast);

  const {
    message,
    setMessage,
    isTyping,
    sendMessage
  } = useChat(
    activeConversation,
    updateConversation,
    createConversation,
    showToast
  );

  const {
    isListening,
    startListening,
    stopListening,
    speak
  } = useVoice(showToast);

  // Local UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/20">
        <Sidebar
          isOpen={sidebarOpen || !isMobile}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
          conversations={filteredConversations}
          activeConversation={activeConversation}
          onSelectConversation={setActiveConversation}
          onCreateConversation={createConversation}
          onDeleteConversation={deleteConversation}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <ChatArea
          activeConversation={activeConversation}
          message={message}
          onMessageChange={setMessage}
          onSend={sendMessage}
          isTyping={isTyping}
          isListening={isListening}
          onStartListening={startListening}
          onStopListening={stopListening}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          reactions={reactions}
          pinnedMessages={pinnedMessages}
          onSpeak={speak}
          onCopy={copy}
          onTogglePin={togglePin}
          onToggleReaction={toggleReaction}
          windowHeight={windowHeight}
        />

        <Toast toast={toast} onClose={hideToast} />
      </div>
    </ProtectedRoute>
  );
}
