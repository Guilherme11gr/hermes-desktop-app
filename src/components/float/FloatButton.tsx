import React, { useState, useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

const ASCII_FACES = {
  idle: ['(◕‿◕)', '(◠‿◠)', '(◕ᴗ◕)'],
  thinking: ['(✧ω✧)', '(・_・)', '(•ᴗ•)', '(◠ω◠)'],
  excited: ['(✧ω✧)', '(★ω★)', '(☆ω☆)', '(✧◡✧)'],
};

interface FloatButtonProps {
  isThinking?: boolean;
  onExpand: () => void;
  unreadCount?: number;
}

export const FloatButton: React.FC<FloatButtonProps> = ({ 
  isThinking = false, 
  onExpand,
  unreadCount = 0
}) => {
  const [face, setFace] = useState('(◕‿◕)');
  const divRef = useRef<HTMLDivElement>(null);
  const onExpandRef = useRef(onExpand);
  const dragActiveRef = useRef(false);
  onExpandRef.current = onExpand;

  useEffect(() => {
    const faces = isThinking
      ? ASCII_FACES.thinking
      : unreadCount > 0
        ? ASCII_FACES.excited
        : ASCII_FACES.idle;
    const interval = window.setInterval(() => {
      setFace(faces[Math.floor(Math.random() * faces.length)]);
    }, 2000);
    setFace(faces[0]);
    return () => clearInterval(interval);
  }, [isThinking, unreadCount]);

  // Expose method to disable drag after expand
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    (el as any).__disableDrag = () => { dragActiveRef.current = true; };
  }, []);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;

    const onMouseDown = () => {
      if (dragActiveRef.current) return;

      // Start a timer — if mouseup fires before 200ms, it's a click
      let isClick = true;
      const clickTimer = setTimeout(() => {
        isClick = false;
        // After 200ms, start drag
        try { getCurrentWindow().startDragging(); } catch {}
      }, 150);

      const onMouseUp = () => {
        clearTimeout(clickTimer);
        document.removeEventListener('mouseup', onMouseUp);
        if (isClick) {
          // It was a quick click — expand
          onExpandRef.current();
        }
      };

      document.addEventListener('mouseup', onMouseUp);
    };

    el.addEventListener('mousedown', onMouseDown);
    return () => el.removeEventListener('mousedown', onMouseDown);
  }, []);

  return (
    <>
      {unreadCount > 0 && (
        <style>
          {`@keyframes pulse-badge {
            0%, 100% { transform: scale(1.0); }
            50% { transform: scale(1.08); }
          }
          @keyframes glow-pulse {
            0%, 100% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.1), 0 0 15px rgba(129, 140, 248, 0.4), 0 0 30px rgba(129, 140, 248, 0.2); }
            50% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.1), 0 0 25px rgba(129, 140, 248, 0.6), 0 0 50px rgba(129, 140, 248, 0.3); }
          }
          @keyframes bounce-badge {
            0% { transform: scale(0.5); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1.0); opacity: 1; }
          }`}
        </style>
      )}
      <div
        ref={divRef}
        tabIndex={-1}
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.95)',
          boxShadow: unreadCount > 0
            ? undefined // will be controlled by glow-pulse animation
            : '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.1)',
          animation: unreadCount > 0 ? 'glow-pulse 2s ease-in-out infinite' : undefined,
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          outline: 'none',
          position: 'relative',
        }}
        title={unreadCount > 0
          ? `Hermes - ${unreadCount} mensagem${unreadCount > 1 ? 'ns' : ''} nova${unreadCount > 1 ? 's' : ''}! Clique para ver`
          : "Hermes - Clique para conversar, arraste para mover"}
      >
        <span
          style={{
            fontSize: 20,
            fontFamily: 'monospace',
            color: 'white',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
          }}
        >
          {face}
        </span>
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              minWidth: 20,
              height: 20,
              background: '#ef4444',
              color: 'white',
              fontWeight: 'bold',
              fontSize: 11,
              fontFamily: 'monospace',
              borderRadius: '50%',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'bounce-badge 0.4s ease-out, pulse-badge 2s ease-in-out 0.4s infinite',
              padding: '0 4px',
            }}
          >
            {unreadCount >= 10 ? '9+' : unreadCount}
          </div>
        )}
      </div>
    </>
  );
};
