import React, { useState, useEffect, useRef } from 'react';

interface ConnectionStatusProps {
  pollInterval?: number;
}

type Status = 'online' | 'offline' | 'checking';

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  pollInterval = 5000,
}) => {
  const [status, setStatus] = useState<Status>('checking');
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [showTooltip, setShowTooltip] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkHealth = async () => {
    setStatus('checking');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('/health', {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setStatus('online');
      } else {
        setStatus('offline');
      }
    } catch {
      setStatus('offline');
    }
    setLastChecked(new Date());
  };

  useEffect(() => {
    // Initial check
    checkHealth();

    // Set up polling
    intervalRef.current = setInterval(checkHealth, pollInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pollInterval]);

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ),
          text: 'Conectado',
          colorClass: 'text-green-500 bg-green-50 dark:bg-green-900/20',
          dotClass: 'bg-green-500',
        };
      case 'offline':
        return {
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
          text: 'Desconectado',
          colorClass: 'text-red-500 bg-red-50 dark:bg-red-900/20',
          dotClass: 'bg-red-500',
        };
      case 'checking':
        return {
          icon: (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ),
          text: 'Verificando...',
          colorClass: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
          dotClass: 'bg-yellow-500',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${config.colorClass}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotClass} ${status === 'checking' ? 'animate-pulse' : ''}`} />
        <span className="hidden sm:inline">{config.text}</span>
        <span className="sm:hidden">{config.icon}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 animate-fadeIn">
          <div className="font-medium">Status da conexão</div>
          <div className="text-gray-300">
            {status === 'online' && 'Hermes gateway está online'}
            {status === 'offline' && 'Hermes gateway está offline'}
            {status === 'checking' && 'Verificando conexão...'}
          </div>
          <div className="text-gray-400 text-[10px] mt-1">
            Última verificação: {lastChecked.toLocaleTimeString('pt-BR')}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      )}
    </div>
  );
};
