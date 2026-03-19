import React from 'react';

interface SessionInfoProps {
  usedTokens?: number;
  isConnected?: boolean;
}

export const SessionInfo: React.FC<SessionInfoProps> = ({
  usedTokens = 0,
  isConnected = false,
}) => {
  const formatTokens = (n: number) => {
    if (n >= 1000) {
      return `${(n / 1000).toFixed(1)}k`;
    }
    return n.toString();
  };

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
      {/* Status de conexão */}
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`} />
        <span className="font-medium">{isConnected ? 'Online' : 'Offline'}</span>
      </div>

      {usedTokens > 0 && (
        <>
          <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />

          {/* Tokens usados (REAL da API) */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Contexto:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatTokens(usedTokens)}</span>
          </div>
        </>
      )}
    </div>
  );
};
