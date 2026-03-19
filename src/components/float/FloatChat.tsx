import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessages } from '../ChatMessages';
import { ChatInput } from '../ChatInput';
import { Message } from '../../types';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface FloatChatProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  currentStreamText: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onSendMessage: (content: string) => void;
  onCancel: () => void;
  onCollapse: () => void;
  onRetry?: (content: string) => void;
}

const FLOAT_CHAT_STYLES = `
.scroll-to-bottom-btn {
  position: absolute;
  bottom: 72px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  animation: scrollBtnIn 0.2s ease-out;
}
.scroll-to-bottom-btn.light {
  background: white;
  color: #374151;
}
.scroll-to-bottom-btn.dark {
  background: #1f2937;
  color: #d1d5db;
}
.scroll-to-bottom-btn:hover {
  transform: translateX(-50%) scale(1.1);
}
@keyframes scrollBtnIn {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
`;

let floatStylesInjected = false;
function injectFloatStyles() {
  if (floatStylesInjected || typeof document === 'undefined') return;
  floatStylesInjected = true;
  const s = document.createElement('style');
  s.textContent = FLOAT_CHAT_STYLES;
  document.head.appendChild(s);
}

export const FloatChat: React.FC<FloatChatProps> = ({
  messages,
  isLoading,
  isStreaming,
  currentStreamText,
  messagesEndRef,
  onSendMessage,
  onCancel,
  onCollapse,
  onRetry,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hermes-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  injectFloatStyles();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('hermes-theme');
      if (!saved) setIsDarkMode(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const checkTheme = () => {
      const saved = localStorage.getItem('hermes-theme');
      if (saved) setIsDarkMode(saved === 'dark');
    };
    const interval = setInterval(checkTheme, 500);
    return () => clearInterval(interval);
  }, []);

  // Global ESC handler — collapse chat even when input is not focused
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCollapse();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCollapse]);

  // Native DOM drag for header — same approach as FloatButton
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      // Don't drag if clicking buttons
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;

      try {
        getCurrentWindow().startDragging();
      } catch {
        // Not in Tauri
      }
    };

    el.addEventListener('mousedown', onMouseDown);
    return () => el.removeEventListener('mousedown', onMouseDown);
  }, []);

  const handleOpenMainWindow = async () => {
    try {
      await invoke('open_main_window');
      onCollapse();
    } catch (e) {
      console.error('[FloatChat] Erro ao abrir janela principal:', e);
    }
  };

  const bgColor = isDarkMode ? '#111827' : '#ffffff';
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const headerBg = isDarkMode 
    ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%)'
    : 'linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)';
  const textColor = isDarkMode ? '#f3f4f6' : '#1f2937';
  const mutedColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const btnBg = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 16,
        background: bgColor,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header — native drag via addEventListener */}
      <div
        ref={headerRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: `1px solid ${borderColor}`,
          background: headerBg,
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>(◕‿◕)</span>
          <span style={{ fontWeight: 600, color: textColor, fontSize: 13 }}>
            Hermes
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenMainWindow();
            }}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: 'none',
              background: btnBg,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: mutedColor,
            }}
            title="Abrir em tela cheia"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCollapse();
            }}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: 'none',
              background: btnBg,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: mutedColor,
            }}
            title="Minimizar (ESC)"
          >
            ×
          </button>
        </div>
      </div>

      <div
        ref={scrollAreaRef}
        style={{ flex: 1, overflow: 'auto', padding: '8px 12px', position: 'relative' }}
      >
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          currentStreamText={currentStreamText}
          messagesEndRef={messagesEndRef}
          onSuggestionClick={onSendMessage}
          onRetry={onRetry}
          onScrollStateChange={(nearBottom) => setShowScrollBtn(!nearBottom)}
        />

        {showScrollBtn && (
          <button
            className={`scroll-to-bottom-btn ${isDarkMode ? 'dark' : 'light'}`}
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            title="Voltar ao final"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7" />
            </svg>
          </button>
        )}
      </div>

      <div style={{ padding: 8, borderTop: `1px solid ${borderColor}` }}>
        <ChatInput
          onSendMessage={onSendMessage}
          onCancel={onCancel}
          isLoading={isLoading}
          isStreaming={isStreaming}
          autoFocus
          onEscape={onCollapse}
        />
      </div>
    </div>
  );
};
