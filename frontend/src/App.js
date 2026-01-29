import React, { useState, Suspense, lazy } from 'react';
import {
  useToast,
  useTheme,
  useConversations,
  useChat,
  useVoice,
  useMobile,
  useClipboard,
  useMessageActions
} from './hooks';

// Components
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load modals
const TemplatesModal = lazy(() => import('./components/TemplatesModal'));
const ShortcutsModal = lazy(() => import('./components/ShortcutsModal'));
const ActionsModal = lazy(() => import('./components/ActionsModal'));

const App = () => {
  // Custom Hooks
  const { toast, showToast, hideToast } = useToast();
  const { theme, setTheme } = useTheme();
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
    sendMessage,
    regenerateResponse
  } = useChat(
    activeConversation,
    updateConversation,
    createConversation,
    showToast
  );

  const {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak
  } = useVoice(showToast);

  // Local UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  return (
    <ErrorBoundary>
      <div
        className={`app-container ${theme}`}
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))'
        }}
      >
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
          theme={theme}
        />

        <ChatArea
          activeConversation={activeConversation}
          message={message}
          onMessageChange={setMessage}
          onSend={sendMessage}
          isTyping={isTyping}
          isListening={isListening}
          isSpeaking={isSpeaking}
          onStartListening={startListening}
          onStopListening={stopListening}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          reactions={reactions}
          pinnedMessages={pinnedMessages}
          onSpeak={speak}
          onCopy={copy}
          onTogglePin={togglePin}
          onToggleReaction={toggleReaction}
          showToast={showToast}
          windowHeight={windowHeight}
          theme={theme}
          isMobile={isMobile}
        />

        {/* Modals */}
        <Suspense fallback={null}>
          {showTemplates && (
            <TemplatesModal
              onClose={() => setShowTemplates(false)}
              onSelect={(prompt) => setMessage(prompt)}
            />
          )}
          {showShortcuts && (
            <ShortcutsModal onClose={() => setShowShortcuts(false)} />
          )}
          {showMoreActions && (
            <ActionsModal
              onClose={() => setShowMoreActions(false)}
              onExport={() => {/* TODO: Implement export */ }}
              onClearChat={() => {/* TODO: Implement clear */ }}
            />
          )}
        </Suspense>

        <Toast toast={toast} onClose={hideToast} />
      </div>
    </ErrorBoundary>
  );
};

export default App;