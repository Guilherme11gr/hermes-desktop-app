import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { HermesMiniAvatar, RandomStatusText } from './HermesAvatar';
import { SimpleMarkdown, MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  currentStreamText: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

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
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-float">
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
              Fala aí! 👋
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              Como posso te ajudar hoje?
            </p>
            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {[
                'Me explica async/await',
                'Gera um código Python',
                'Review esse código',
                'Dicas de TypeScript',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    // This would need to be passed as a prop to work
                    // For now just visual
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            } message-enter`}
            style={{ animationDelay: `${index * 0.03}s` }}
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
              >
                {message.role === 'user' ? (
                  <SimpleMarkdown content={message.content} />
                ) : (
                  <MarkdownRenderer content={message.content} />
                )}
              </div>

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
                {(() => {
                  const avatarState = currentStreamText ? 'streaming' : 'thinking';
                  const colorClass = avatarState === 'streaming' 
                    ? 'text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.4)]'
                    : 'text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.3)]';
                  return (
                    <>
                      <div className="flex-shrink-0">
                        <HermesMiniAvatar state={avatarState} />
                      </div>
                      <span className={`text-xs font-mono animate-pulse transition-colors duration-300 ${colorClass}`}>
                        <RandomStatusText state={avatarState} />
                      </span>
                    </>
                  );
                })()}
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
                  <span className="streaming-text">
                    <SimpleMarkdown content={currentStreamText} />
                  </span>
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
                <span className="text-xs font-mono animate-pulse text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.3)]">
                  <RandomStatusText state="thinking" />
                </span>
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
