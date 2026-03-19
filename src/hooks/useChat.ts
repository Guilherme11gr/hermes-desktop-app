import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Conversation } from '../types';
import { generateId, getCurrentTimestamp } from '../utils';
import { config } from '../config';

const STORAGE_KEY = 'hermes-chat-conversations';
const CURRENT_SESSION_KEY = 'hermes-current-session';

export interface UseChatReturn {
  messages: Message[];
  conversations: Conversation[];
  currentConversationId: string;
  isLoading: boolean;
  isStreaming: boolean;
  currentStreamText: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  handleSendMessage: (content: string) => Promise<void>;
  handleCancel: () => void;
  handleNewConversation: () => void;
  handleSelectConversation: (id: string) => void;
  handleDeleteConversation: (id: string) => void;
}

export function useChat(): UseChatReturn {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const conversation = conversations.find(c => c.id === currentConversationId);
    if (conversation) {
      setMessages(conversation.messages);
    } else {
      setMessages([]);
    }
    localStorage.setItem(CURRENT_SESSION_KEY, currentConversationId);
  }, [currentConversationId, conversations]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  // Sync across windows (main <-> float) via storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setConversations(parsed);
        } catch {}
      }
      if (e.key === CURRENT_SESSION_KEY && e.newValue) {
        setCurrentConversationId(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
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
              } catch {
                // Ignore parsing errors
              }
            }
          }
        }
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

  return {
    messages,
    conversations,
    currentConversationId,
    isLoading,
    isStreaming,
    currentStreamText,
    messagesEndRef,
    handleSendMessage,
    handleCancel,
    handleNewConversation,
    handleSelectConversation,
    handleDeleteConversation,
  };
}
