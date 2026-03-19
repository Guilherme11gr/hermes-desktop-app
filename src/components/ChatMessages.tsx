import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { HermesMiniAvatar } from './HermesAvatar';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  currentStreamText: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

// Simple markdown parser for basic formatting
const parseMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm font-mono">$1</code>')
    .replace(/```([\s\S]*?)```/g, '<pre class="p-3 bg-gray-800 text-gray-100 rounded-lg overflow-x-auto my-2"><code>$1</code></pre>')
    .replace(/\n/g, '<br />');
};

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  isStreaming,
  currentStreamText,
  messagesEndRef,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentStreamText, messagesEndRef]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      ref={scrollContainerRef}
      className="h-full overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Bem-vindo ao Hermes Chat
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Comece uma conversa digitando sua mensagem abaixo.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            } animate-fadeIn`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div
              className={`max-w-[80%] sm:max-w-[75%] lg:max-w-[70%] group ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* Avatar */}
              <div className="flex items-center gap-2 mb-1">
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <HermesMiniAvatar state="idle" />
                  </div>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {message.role === 'user' ? 'Você' : 'Hermes'}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatTime(message.timestamp)}
                </span>
              </div>

              {/* Message Bubble */}
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed break-words ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                }`}
                dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
              />

              {/* Copy button for assistant messages */}
              {message.role === 'assistant' && (
                <button
                  onClick={() => navigator.clipboard.writeText(message.content)}
                  className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
                  title="Copiar mensagem"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Streaming message - shows immediately when streaming starts */}
        {isStreaming && (
          <div className="flex justify-start animate-fadeIn">
            <div className="max-w-[80%] sm:max-w-[75%] lg:max-w-[70%]">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-shrink-0">
                  <HermesMiniAvatar state={currentStreamText ? 'streaming' : 'thinking'} />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Hermes</span>
                <span className="text-xs text-green-500 animate-pulse">
                  {!currentStreamText ? 'pensando...' : 'respondendo...'}
                </span>
              </div>
              {/* Show loading dots while waiting for first chunk, then show text */}
              {!currentStreamText ? (
                <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 rounded-bl-md">
                  <div className="flex items-center gap-1 h-5">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed break-words bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md">
                  <span 
                    className="streaming-text"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(currentStreamText) }} 
                  />
                  <span className="streaming-cursor" aria-hidden="true"></span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading indicator - kept for edge cases where isLoading but not streaming */}
        {isLoading && !isStreaming && (
          <div className="flex justify-start animate-fadeIn">
            <div className="max-w-[80%] sm:max-w-[75%] lg:max-w-[70%]">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-shrink-0">
                  <HermesMiniAvatar state="thinking" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Hermes</span>
                <span className="text-xs text-blue-400 animate-pulse">pensando...</span>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 rounded-bl-md">
                <div className="flex items-center gap-1 h-5">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
