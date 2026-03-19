import React, { useState, useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

const ASCII_FACES = {
  idle: ['(◕‿◕)', '(◠‿◠)', '(◕ᴗ◕)'],
  thinking: ['(✧ω✧)', '(・_・)', '(•ᴗ•)', '(◠ω◠)'],
};

interface FloatButtonProps {
  isThinking?: boolean;
  onExpand: () => void;
}

export const FloatButton: React.FC<FloatButtonProps> = ({ 
  isThinking = false, 
  onExpand 
}) => {
  const [face, setFace] = useState('(◕‿◕)');
  const divRef = useRef<HTMLDivElement>(null);
  const onExpandRef = useRef(onExpand);
  const dragActiveRef = useRef(false);
  onExpandRef.current = onExpand;

  useEffect(() => {
    const faces = isThinking ? ASCII_FACES.thinking : ASCII_FACES.idle;
    const interval = window.setInterval(() => {
      setFace(faces[Math.floor(Math.random() * faces.length)]);
    }, 2000);
    setFace(faces[0]);
    return () => clearInterval(interval);
  }, [isThinking]);

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
    <div
      ref={divRef}
      tabIndex={-1}
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'rgba(99, 102, 241, 0.95)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.1)',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        outline: 'none',
      }}
      title="Hermes - Clique para conversar, arraste para mover"
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
    </div>
  );
};
