import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ConnectionStatus } from './ConnectionStatus';
import { SessionSidebar } from './SessionSidebar';
import { SessionInfo } from './SessionInfo';
import { Message, Conversation } from '../types';
import { generateId, getCurrentTimestamp } from '../utils';
import { config } from '../config';
import { useFloatWindow } from '../hooks/useFloatWindow';

const STORAGE_KEY = 'hermes-chat-conversations';
const CURRENT_SESSION_KEY = 'hermes-current-session';

export const ChatContainer: React.FC = () => {
  // Hook para controlar janela float
  const { toggleFloat, isLoading: isFloatLoading } = useFloatWindow();
  
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [currentConversationId, setCurrentConversationId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CURRENT_SESSION_KEY) || generateId();
    }
    return generateId();
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamText, setCurrentStreamText] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hermes-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  
  // Session info state - REAL DATA ONLY
  const [isConnected, setIsConnected] = useState(false);
  const [usedTokens, setUsedTokens] = useState(0);
  
  // Track cumulative tokens from API responses
  const cumulativeTokensRef = useRef(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load current conversation messages
  useEffect(() => {
    const conversation = conversations.find(c => c.id === currentConversationId);
    if (conversation) {
      setMessages(conversation.messages);
    } else {
      setMessages([]);
    }
    localStorage.setItem(CURRENT_SESSION_KEY, currentConversationId);
  }, [currentConversationId, conversations]);

  // Save conversations to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  // Dark mode detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Health check for connection status
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        });
        setIsConnected(response.ok);
      } catch {
        setIsConnected(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleNewConversation();
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        toggleFloat();
      }
      if (e.key === 'Escape' && isStreaming) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStreaming, toggleFloat]);

  const saveCurrentConversation = useCallback((msgs: Message[]) => {
    setConversations(prev => {
      const existing = prev.find(c => c.id === currentConversationId);
      const updatedConversation: Conversation = {
        id: currentConversationId,
        title: msgs[0]?.content.slice(0, 50) || 'Nova conversa',
        messages: msgs,
        timestamp: getCurrentTimestamp(),
      };
      
      if (existing) {
        return prev.map(c => c.id === currentConversationId ? updatedConversation : c);
      } else {
        return [updatedConversation, ...prev];
      }
    });
  }, [currentConversationId]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: getCurrentTimestamp(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveCurrentConversation(updatedMessages);
    setIsLoading(true);
    setIsStreaming(true);
    setCurrentStreamText('');

    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(`${config.apiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: config.defaultModel,
          messages: updatedMessages,
          stream: true 
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamText = '';
      let buffer = '';  // Buffer para chunks incompletos
      let lastUsage = null;  // Capturar usage do último chunk

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Manter a última linha no buffer (pode estar incompleta)
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                buffer = '';
                break;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  streamText += content;
                  setCurrentStreamText(streamText);
                }
                // Capturar usage do último chunk (vem junto com finish_reason)
                if (parsed.usage) {
                  lastUsage = parsed.usage;
                }
              } catch {
                // Ignore parsing errors
              }
            }
          }
        }
      }

      // Atualizar tokens acumulados com dados REAIS da API
      if (lastUsage) {
        cumulativeTokensRef.current += lastUsage.total_tokens || 0;
        setUsedTokens(cumulativeTokensRef.current);
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: streamText,
        timestamp: getCurrentTimestamp(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveCurrentConversation(finalMessages);

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
          timestamp: getCurrentTimestamp(),
        };
        const finalMessages = [...updatedMessages, errorMessage];
        setMessages(finalMessages);
        saveCurrentConversation(finalMessages);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentStreamText('');
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
    setCurrentStreamText('');
  };

  const handleNewConversation = () => {
    const newId = generateId();
    setCurrentConversationId(newId);
    setMessages([]);
    setIsLoading(false);
    setIsStreaming(false);
    setCurrentStreamText('');
    // Reset cumulative tokens for new session
    cumulativeTokensRef.current = 0;
    setUsedTokens(0);
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (id === currentConversationId) {
      handleNewConversation();
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('hermes-theme', newValue ? 'dark' : 'light');
      return newValue;
    });
  };

  return (
    <div className={`flex h-screen w-full ${isDarkMode ? 'dark' : ''}`}>
      <SessionSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewConversation={handleNewConversation}
        isDarkMode={isDarkMode}
      />
      
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Hermes Chat
            </h1>
            <ConnectionStatus />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFloat}
              disabled={isFloatLoading}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              title="Abrir janela flutuante (Ctrl+Shift+F)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Session Info Bar */}
        <SessionInfo
          usedTokens={usedTokens}
          isConnected={isConnected}
        />

        <div className="flex-1 overflow-hidden">
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            currentStreamText={currentStreamText}
            messagesEndRef={messagesEndRef}
          />
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          onCancel={handleCancel}
          isLoading={isLoading}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
};
