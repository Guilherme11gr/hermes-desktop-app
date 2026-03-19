import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FloatButton } from './FloatButton';
import { FloatChat } from './FloatChat';
import { useChat } from '../../hooks/useChat';
import { useTheme } from '../../hooks/useTheme';
import { invoke } from '@tauri-apps/api/core';

export const FloatContainer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const ignoreCollapseRef = useRef(false);

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

  const resizeWindow = useCallback(async (expanded: boolean) => {
    try {
      await invoke('resize_float_window', { expanded });
    } catch (e) {
      console.error('[FloatContainer] Erro ao redimensionar:', e);
    }
  }, []);

  const expand = useCallback(async () => {
    if (ignoreCollapseRef.current) return;
    ignoreCollapseRef.current = true;
    setIsExpanded(true);
    // Wait for OS to finish processing any pending drag messages from startDragging()
    await new Promise(r => setTimeout(r, 200));
    await resizeWindow(true);
    // Re-enable collapse after chat is stable
    setTimeout(() => { ignoreCollapseRef.current = false; }, 500);
  }, [resizeWindow]);

  const collapse = useCallback(async () => {
    if (ignoreCollapseRef.current) return;
    setIsExpanded(false);
    await resizeWindow(false);
  }, [resizeWindow]);

  // Outside click to collapse
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (ignoreCollapseRef.current) return;
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        collapse();
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 500);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, collapse]);

  // ESC to collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded && !ignoreCollapseRef.current) {
        collapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, collapse]);

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
