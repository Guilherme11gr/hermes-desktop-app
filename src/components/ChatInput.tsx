import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  isStreaming: boolean;
  /** If provided, component auto-focuses on mount */
  autoFocus?: boolean;
  /** Called when Escape is pressed and not streaming */
  onEscape?: () => void;
}

const PLACEHOLDER_SUGGESTIONS = [
  'Pergunte algo...',
  'Digite sua mensagem...',
  'O que você quer saber?',
  'Fala comigo...',
  'Manda a ver...',
  'Me conta o problema...',
  'Qual é a dúvida?',
  'Tô ouvindo...',
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onCancel,
  isLoading,
  isStreaming,
  autoFocus = false,
  onEscape,
}) => {
  const [input, setInput] = useState('');
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxRows = 5;
  const charCount = input.length;
  const maxChars = 4000;

  // Easter egg detector
  useEffect(() => {
    const easterEggs = ['voce eh lindo', 'te amo', 'obrigado', 'thanks', 'bom dia', 'boa noite'];
    const found = easterEggs.some(egg => input.toLowerCase().includes(egg));
    if (found && !showEasterEgg) {
      setShowEasterEgg(true);
      setTimeout(() => setShowEasterEgg(false), 3000);
    }
  }, [input, showEasterEgg]);

  // Auto-focus on mount (or when autoFocus prop changes)
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      // Small delay to ensure DOM is ready
      const t = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  // Rotating placeholder — only when input is empty & not focused
  useEffect(() => {
    if (input || isFocused) return;
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % PLACEHOLDER_SUGGESTIONS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [input, isFocused]);

  // Expose focus method via ref
  const focusInput = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = 24; // approximate line height
      const maxHeight = lineHeight * maxRows + 24; // padding
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [input]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter = send (without shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Escape = cancel streaming or collapse
    if (e.key === 'Escape') {
      e.preventDefault();
      if (isStreaming) {
        onCancel();
      } else if (onEscape) {
        onEscape();
      }
    }
  };

  const isDisabled = isLoading && !isStreaming;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isDisabled ? 'Aguardando resposta...' : PLACEHOLDER_SUGGESTIONS[placeholderIdx]}
            disabled={isDisabled}
            rows={1}
            className="flex-1 bg-transparent border-0 resize-none px-4 py-3.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 min-h-[52px] max-h-[140px] scrollbar-thin"
          />

          {/* Action buttons */}
          <div className="flex items-center gap-1 pr-2 pb-2">
            {/* Cancel button - shown during streaming */}
            {isStreaming && (
              <button
                onClick={onCancel}
                className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Cancelar (Esc)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isDisabled}
              className={`p-2 rounded-xl transition-all ${
                input.trim() && !isDisabled
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
              title="Enviar mensagem (Enter)"
            >
              {isLoading && !isStreaming ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Helper text */}
        <div className="flex items-center justify-between mt-2 px-2">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-mono">
                Enter
              </kbd>{' '}
              para enviar ·{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-mono">
                Shift + Enter
              </kbd>{' '}
              nova linha
              {isStreaming && (
                <>
                  {' · '}
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-mono">
                    Esc
                  </kbd>{' '}
                  parar
                </>
              )}
            </p>
            {/* Character counter */}
            {charCount > 100 && (
              <span className={`text-xs font-mono ${
                charCount > maxChars * 0.9 
                  ? 'text-red-500' 
                  : charCount > maxChars * 0.7 
                    ? 'text-yellow-500' 
                    : 'text-gray-400'
              }`}>
                {charCount}/{maxChars}
              </span>
            )}
            {/* Easter egg */}
            {showEasterEgg && (
              <span className="text-xs rainbow-text animate-pulse">
                (◕‿◕)♡
              </span>
            )}
          </div>
          {isStreaming && (
            <button
              onClick={onCancel}
              className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Parar geração
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
