import React, { useState, useEffect, useRef } from 'react';
import { getCurrentWindow, PhysicalPosition } from '@tauri-apps/api/window';

const ASCII_FACES = {
  idle: ['(◕‿◕)', '(◠‿◠)', '(◕ᴗ◕)'],
  thinking: ['(✧ω✧)', '(・_・)', '(•ᴗ•)', '(◠ω◠)'],
  happy: ['(◕‿◕)', '(≧◡≦)', '(⌒‿⌒)']
};

const DRAG_THRESHOLD = 5;

interface FloatButtonProps {
  isThinking?: boolean;
  onExpand: () => void;
}

export const FloatButton: React.FC<FloatButtonProps> = ({ 
  isThinking = false, 
  onExpand 
}) => {
  const [face, setFace] = useState('(◕‿◕)');
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartMouse = useRef({ x: 0, y: 0 });
  const dragStartWindow = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const faceIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const faces = isThinking ? ASCII_FACES.thinking : ASCII_FACES.idle;
    
    faceIntervalRef.current = window.setInterval(() => {
      const randomFace = faces[Math.floor(Math.random() * faces.length)];
      setFace(randomFace);
    }, 2000);

    setFace(faces[0]);

    return () => {
      if (faceIntervalRef.current) {
        clearInterval(faceIntervalRef.current);
      }
    };
  }, [isThinking]);

  const handleMouseDown = async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    dragStartMouse.current = { x: e.clientX, y: e.clientY };
    
    try {
      const window = getCurrentWindow();
      const pos = await window.outerPosition();
      dragStartWindow.current = { x: pos.x, y: pos.y };
    } catch {
      return;
    }
    
    hasDraggedRef.current = false;
    isDraggingRef.current = false;

    const handleMouseMove = async (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStartMouse.current.x;
      const dy = moveEvent.clientY - dragStartMouse.current.y;
      
      if (!hasDraggedRef.current && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        hasDraggedRef.current = true;
        isDraggingRef.current = true;
        setIsDragging(true);
      }
      
      if (isDraggingRef.current) {
        try {
          const newX = dragStartWindow.current.x + dx;
          const newY = dragStartWindow.current.y + dy;
          await getCurrentWindow().setPosition(new PhysicalPosition(newX, newY));
        } catch {}
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = () => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    
    onExpand();
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'rgba(99, 102, 241, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.1)',
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        transition: isDragging ? 'none' : 'transform 0.2s, box-shadow 0.2s',
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
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
