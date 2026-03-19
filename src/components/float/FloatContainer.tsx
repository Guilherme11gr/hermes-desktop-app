import React, { useState, useEffect, useRef } from 'react';
import { FloatButton } from './FloatButton';
import { FloatChat } from './FloatChat';
import { useChat } from '../../hooks/useChat';
import { useTheme } from '../../hooks/useTheme';
import { invoke } from '@tauri-apps/api/core';

export const FloatContainer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    isStreaming,
    currentStreamText,
    messagesEndRef,
    handleSendMessage,
    handleCancel,
  } = useChat();

  const { isDarkMode } = useTheme();

  const resizeWindow = async (expanded: boolean) => {
    try {
      await invoke('resize_float_window', { expanded });
    } catch (e) {
      console.error('[FloatContainer] Erro ao redimensionar:', e);
    }
  };

  const expand = async () => {
    console.log('[FloatContainer] expand() chamado');
    setIsExpanded(true);
    await resizeWindow(true);
    console.log('[FloatContainer] resizeWindow(true) concluído');
  };

  const collapse = async () => {
    console.log('[FloatContainer] collapse() chamado');
    setIsExpanded(false);
    await resizeWindow(false);
    console.log('[FloatContainer] resizeWindow(false) concluído');
  };

  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        collapse();
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        collapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  if (!isExpanded) {
    return (
      <div ref={containerRef}>
        <FloatButton
          isThinking={isLoading || isStreaming}
          onExpand={expand}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <FloatChat
        messages={messages}
        isLoading={isLoading}
        isStreaming={isStreaming}
        currentStreamText={currentStreamText}
        messagesEndRef={messagesEndRef}
        onSendMessage={handleSendMessage}
        onCancel={handleCancel}
        onCollapse={collapse}
      />
    </div>
  );
};
