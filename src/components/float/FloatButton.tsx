import React, { useState, useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

const ASCII_FACES = {
  idle: ['(◕‿◕)', '(◠‿◠)', '(◕ᴗ◕)'],
  thinking: ['(✧ω✧)', '(・_・)', '(•ᴗ•)', '(◠ω◠)'],
  happy: ['(◕‿◕)', '(≧◡≦)', '(⌒‿⌒)']
};

const DRAG_THRESHOLD = 5;
const LONG_PRESS_DELAY = 150;

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
  
  const startPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const isPressingRef = useRef(false);
  const longPressTimerRef = useRef<number | null>(null);
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    startPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    isPressingRef.current = true;

    longPressTimerRef.current = window.setTimeout(() => {
      if (isPressingRef.current) {
        startWindowDrag();
      }
    }, LONG_PRESS_DELAY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPressingRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > DRAG_THRESHOLD) {
      hasDraggedRef.current = true;
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      startWindowDrag();
    }
  };

  const handleMouseUp = () => {
    isPressingRef.current = false;
    setIsDragging(false);
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startWindowDrag = async () => {
    if (isDragging) return;
    setIsDragging(true);
    
    try {
      await getCurrentWindow().startDragging();
    } catch {
      // Not in Tauri environment
    }
  };

  const handleClick = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    
    onExpand();
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
