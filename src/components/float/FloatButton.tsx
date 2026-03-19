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
  onExpandRef.current = onExpand;

  // Face animation
  useEffect(() => {
    const faces = isThinking ? ASCII_FACES.thinking : ASCII_FACES.idle;
    const interval = window.setInterval(() => {
      setFace(faces[Math.floor(Math.random() * faces.length)]);
    }, 2000);
    setFace(faces[0]);
    return () => clearInterval(interval);
  }, [isThinking]);

  // Native DOM: handle drag AND click detection
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;

      const startTime = Date.now();
      let moved = false;

      const onMouseMove = () => {
        moved = true;
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const elapsed = Date.now() - startTime;
        // Click = mouseup within 300ms and no movement
        if (!moved && elapsed < 300) {
          onExpandRef.current();
        }
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      // Start OS-level drag
      try {
        getCurrentWindow().startDragging();
      } catch {}
    };

    el.addEventListener('mousedown', onMouseDown);
    return () => el.removeEventListener('mousedown', onMouseDown);
  }, []);

  return (
    <div
      ref={divRef}
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
      }}
      title="Hermes - Clique para conversar, arraste para mover"
    >
      <span
        style={{
          fontSize: 20,
          fontFamily: 'monospace',
          color: 'white',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          whiteSpace: 'pre',
          pointerEvents: 'none',
        }}
      >
        {face}
      </span>
    </div>
  );
};
