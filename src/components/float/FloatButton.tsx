import React, { useState, useEffect, useRef } from 'react';
import { getCurrentWindow, PhysicalPosition } from '@tauri-apps/api/window';

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

  useEffect(() => {
    const faces = isThinking ? ASCII_FACES.thinking : ASCII_FACES.idle;
    const interval = window.setInterval(() => {
      setFace(faces[Math.floor(Math.random() * faces.length)]);
    }, 2000);
    setFace(faces[0]);
    return () => clearInterval(interval);
  }, [isThinking]);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;

    const onMouseDown = async (e: MouseEvent) => {
      if (e.button !== 0) return;

      const startClientX = e.clientX;
      const startClientY = e.clientY;
      let moved = false;

      let winX = 0, winY = 0;
      try {
        const pos = await getCurrentWindow().innerPosition();
        winX = pos.x;
        winY = pos.y;
      } catch { return; }

      const onMouseMove = async (ev: MouseEvent) => {
        const dx = ev.clientX - startClientX;
        const dy = ev.clientY - startClientY;
        if (!moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) moved = true;
        if (moved) {
          try {
            await getCurrentWindow().setPosition(new PhysicalPosition(winX + dx, winY + dy));
          } catch {}
        }
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (!moved) onExpandRef.current();
      };

      document.addEventListener('mousemove', onMouseMove);
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
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        outline: 'none',
      }}
    >
      <span
        style={{
          fontSize: 20,
          fontFamily: 'monospace',
          color: 'white',
          pointerEvents: 'none',
        }}
      >
        {face}
      </span>
    </div>
  );
};
