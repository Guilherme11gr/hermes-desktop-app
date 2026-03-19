import React, { useState, useEffect, useRef } from 'react';
import { ChatMessages } from '../ChatMessages';
import { ChatInput } from '../ChatInput';
import { Message } from '../../types';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow, PhysicalPosition } from '@tauri-apps/api/window';

const DRAG_THRESHOLD = 5;

interface FloatChatProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  currentStreamText: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onSendMessage: (content: string) => void;
  onCancel: () => void;
  onCollapse: () => void;
}

export const FloatChat: React.FC<FloatChatProps> = ({
  messages,
  isLoading,
  isStreaming,
  currentStreamText,
  messagesEndRef,
  onSendMessage,
  onCancel,
  onCollapse
}) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hermes-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const headerDragStartMouse = useRef({ x: 0, y: 0 });
  const headerDragStartWindow = useRef({ x: 0, y: 0 });
  const isHeaderDraggingRef = useRef(false);

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

  const handleHeaderMouseDown = async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    headerDragStartMouse.current = { x: e.clientX, y: e.clientY };
    
    try {
      const window = getCurrentWindow();
      const pos = await window.outerPosition();
      headerDragStartWindow.current = { x: pos.x, y: pos.y };
    } catch {
      return;
    }
    
    isHeaderDraggingRef.current = false;

    const handleMouseMove = async (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - headerDragStartMouse.current.x;
      const dy = moveEvent.clientY - headerDragStartMouse.current.y;
      
      if (!isHeaderDraggingRef.current && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        isHeaderDraggingRef.current = true;
      }
      
      if (isHeaderDraggingRef.current) {
        try {
          const newX = headerDragStartWindow.current.x + dx;
          const newY = headerDragStartWindow.current.y + dy;
          await getCurrentWindow().setPosition(new PhysicalPosition(newX, newY));
        } catch {}
      }
    };

    const handleMouseUp = () => {
      isHeaderDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleOpenMainWindow = async () => {
    try {
      await invoke('open_main_window');
      onCollapse();
    } catch (e) {
      console.error('[FloatChat] Erro ao abrir janela principal:', e);
    }
  };

  const bgColor = isDarkMode ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)';
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
      <div
        onMouseDown={handleHeaderMouseDown}
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
            onMouseDown={(e) => e.stopPropagation()}
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
            onMouseDown={(e) => e.stopPropagation()}
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

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          currentStreamText={currentStreamText}
          messagesEndRef={messagesEndRef}
        />
      </div>

      <div style={{ padding: 8, borderTop: `1px solid ${borderColor}` }}>
        <ChatInput
          onSendMessage={onSendMessage}
          onCancel={onCancel}
          isLoading={isLoading}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
};
