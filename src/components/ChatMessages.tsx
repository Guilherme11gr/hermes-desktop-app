import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from '../types';
import { HermesMiniAvatar, RandomStatusText } from './HermesAvatar';
import { SimpleMarkdown, MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  currentStreamText: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onSuggestionClick?: (text: string) => void;
  onRetry?: (messageContent: string) => void;
  onScrollStateChange?: (isNearBottom: boolean) => void;
  /** Compact mode for float chat */
  compact?: boolean;
}

const SUGGESTIONS = [
  { label: 'Me explica async/await', emoji: '🔄' },
  { label: 'Gera um código Python', emoji: '🐍' },
  { label: 'Review esse código', emoji: '👀' },
  { label: 'Dicas de TypeScript', emoji: '💎' },
  { label: 'Debuga esse erro', emoji: '🐛' },
  { label: 'O que é Rust?', emoji: '🦀' },
];

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  isStreaming,
  currentStreamText,
  messagesEndRef,
  onSuggestionClick,
  onRetry,
  onScrollStateChange,
  compact = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [tokenRate, setTokenRate] = useState<number | null>(null);
  const streamStartTimeRef = useRef<number | null>(null);
  const streamCharCountRef = useRef(0);

  // Track scroll position
  const checkScrollPosition = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setIsNearBottom(nearBottom);
    onScrollStateChange?.(nearBottom);
  }, [onScrollStateChange]);

  // Smart auto-scroll: only if near bottom
  useEffect(() => {
    if (isNearBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentStreamText, isNearBottom, messagesEndRef]);

  // Track streaming rate (chars/s as a proxy for tokens/s)
  useEffect(() => {
    if (isStreaming && currentStreamText) {
      if (!streamStartTimeRef.current) {
        streamStartTimeRef.current = Date.now();
        streamCharCountRef.current = 0;
      }
      streamCharCountRef.current = currentStreamText.length;
      const elapsed = (Date.now() - streamStartTimeRef.current) / 1000;
      if (elapsed > 0.5) {
        // Approximate: ~4 chars per token
        setTokenRate(Math.round((streamCharCountRef.current / 4) / elapsed));
      }
    } else if (!isStreaming) {
      streamStartTimeRef.current = null;
      streamCharCountRef.current = 0;
      setTokenRate(null);
    }
  }, [isStreaming, currentStreamText]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      ref={scrollContainerRef}
      className={`h-full overflow-y-auto ${compact ? 'px-2 py-2' : 'px-4 py-6'} scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent relative`}
      onScroll={checkScrollPosition}
    >
      <div className={`max-w-3xl mx-auto ${compact ? 'space-y-3' : 'space-y-6'}`}>
        {messages.length === 0 && !isLoading && (
          <div className={`flex flex-col items-center justify-center ${compact ? 'h-40' : 'h-64'} text-center`}>
            <div className={`${compact ? 'w-10 h-10 mb-2' : 'w-16 h-16 mb-4'} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-float`}>
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
                <h2 className={`${compact ? 'text-base' : 'text-xl'} font-semibold text-gray-900 dark:text-white mb-2`}>
              Fala aí! 👋
            </h2>
            <p className={`${compact ? 'text-xs text-gray-500 dark:text-gray-400 mb-3' : 'text-gray-500 dark:text-gray-400 max-w-md mb-6'}`}>
              Como posso te ajudar hoje?
            </p>
            {/* Quick suggestions — agora clicáveis! */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTIONS.map(({ label, emoji }) => (
                <button
                  key={label}
                  className={`${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-700 border border-transparent transition-all duration-200 cursor-pointer`}
                  onClick={() => onSuggestionClick?.(label)}
                >
                  {emoji} {label}
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
              className={`${compact ? 'max-w-[95%]' : 'max-w-[80%] sm:max-w-[75%] lg:max-w-[70%]'} group ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* Avatar */}
              <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'} mb-1`}>
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
                className={`${compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'} rounded-2xl leading-relaxed break-words ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : message.content.startsWith('Desculpe, ocorreu um erro')
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-bl-md border border-red-200 dark:border-red-800/50'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                }`}
              >
                {message.role === 'user' ? (
                  <SimpleMarkdown content={message.content} />
                ) : (
                  <MarkdownRenderer content={message.content} />
                )}
              </div>

              {/* Action buttons for assistant messages */}
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => navigator.clipboard.writeText(message.content)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
                    title="Copiar mensagem"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar
                  </button>
                  {/* Retry button for error messages */}
                  {message.content.startsWith('Desculpe, ocorreu um erro') && onRetry && index > 0 && (
                    <button
                      onClick={() => {
                        // Find the last user message before this error
                        const lastUserMsg = [...messages].reverse().find(
                          (m, i) => i > messages.length - 1 - index && m.role === 'user'
                        );
                        if (lastUserMsg) onRetry(lastUserMsg.content);
                      }}
                      className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Tentar novamente
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming message - shows immediately when streaming starts */}
        {isStreaming && (
          <div className="flex justify-start animate-fadeIn">
            <div className={`${compact ? 'max-w-[95%]' : 'max-w-[80%] sm:max-w-[75%] lg:max-w-[70%]'}`}>
              <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'} mb-1`}>
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
                      {/* Token rate indicator */}
                      {tokenRate !== null && avatarState === 'streaming' && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                          ~{tokenRate} tok/s
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
              {/* Show loading dots while waiting for first chunk, then show text */}
              {!currentStreamText ? (
                <div className={`${compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'} rounded-2xl bg-gray-100 dark:bg-gray-800 rounded-bl-md`}>
                  <div className={`flex items-center gap-1 ${compact ? 'h-4' : 'h-5'}`}>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              ) : (
                <div className={`${compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'} rounded-2xl leading-relaxed break-words bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md`}>
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
            <div className={`${compact ? 'max-w-[95%]' : 'max-w-[80%] sm:max-w-[75%] lg:max-w-[70%]'}`}>
              <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'} mb-1`}>
                <div className="flex-shrink-0">
                  <HermesMiniAvatar state="thinking" />
                </div>
                <span className="text-xs font-mono animate-pulse text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.3)]">
                  <RandomStatusText state="thinking" />
                </span>
              </div>
              <div className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} rounded-2xl bg-gray-100 dark:bg-gray-800 rounded-bl-md`}>
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

      {/* Scroll-to-bottom button — aparece quando user tá scrollado pra cima */}
      {!isNearBottom && messages.length > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium z-10 animate-fadeIn"
          title="Voltar ao final"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7" />
          </svg>
          Novas mensagens
        </button>
      )}
    </div>
  );
};
