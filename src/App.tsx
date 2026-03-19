import React, { useEffect, useState } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { FloatContainer } from './components/float/FloatContainer';
import { getCurrentWindow } from '@tauri-apps/api/window';

const App: React.FC = () => {
  const [windowType, setWindowType] = useState<'main' | 'float'>('main');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectWindow = async () => {
      try {
        const currentWindow = getCurrentWindow();
        const label = currentWindow.label;
        setWindowType(label === 'float' ? 'float' : 'main');
      } catch {
        // Se não estiver no Tauri, usa URL params
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        setWindowType(mode === 'float' ? 'float' : 'main');
      } finally {
        setIsLoading(false);
      }
    };
    
    detectWindow();
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: 'transparent'
      }}>
        <div style={{ color: '#6b7280' }}>...</div>
      </div>
    );
  }

  if (windowType === 'float') {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        overflow: 'visible',
      }}>
        <FloatContainer />
      </div>
    );
  }

  return <ChatContainer />;
};

export default App;
