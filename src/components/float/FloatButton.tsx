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
  const didDragRef = useRef(false);
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

    const onMouseDown = async () => {
      didDragRef.current = false;

      // Record position before drag
      let posBefore = { x: 0, y: 0 };
      try {
        posBefore = await getCurrentWindow().outerPosition();
      } catch { return; }

      // Start OS-level drag (smooth!)
      try {
        await getCurrentWindow().startDragging();
      } catch {}

      // After drag completes, check if window moved
      try {
        const posAfter = await getCurrentWindow().outerPosition();
        if (posAfter.x !== posBefore.x || posAfter.y !== posBefore.y) {
          didDragRef.current = true;
        }
      } catch {}
    };

    // Native click: only expand if we didn't drag
    const onClick = () => {
      if (!didDragRef.current) {
        onExpandRef.current();
      }
      didDragRef.current = false;
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('click', onClick);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('click', onClick);
    };
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
