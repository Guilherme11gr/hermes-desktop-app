import React, { useState } from 'react';
import { Conversation } from '../types';

interface SessionSidebarProps {
  conversations: Conversation[];
  currentConversationId: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  isDarkMode: boolean;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  isDarkMode,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const groupedConversations = conversations.reduce((groups, conv) => {
    const date = new Date(conv.timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
    const isThisWeek = date.getTime() > now.getTime() - 7 * 86400000;
    const isThisMonth = date.getTime() > now.getTime() - 30 * 86400000;
    
    let group = 'Mais antigas';
    if (isToday) group = 'Hoje';
    else if (isYesterday) group = 'Ontem';
    else if (isThisWeek) group = 'Esta semana';
    else if (isThisMonth) group = 'Este mês';
    
    if (!groups[group]) groups[group] = [];
    groups[group].push(conv);
    return groups;
  }, {} as Record<string, Conversation[]>);

  const groupOrder = ['Hoje', 'Ontem', 'Esta semana', 'Este mês', 'Mais antigas'];

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-80'
        } fixed lg:relative z-50 h-full bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
          {!isCollapsed && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Hermes</span>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="lg:flex hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                title="Recolher sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setIsCollapsed(true)}
                className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors mx-auto"
              title="Expandir sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {!isCollapsed && (
          <>
            {/* New Chat Button */}
            <div className="p-3">
              <button
                onClick={onNewConversation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nova conversa
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
              {conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma conversa ainda
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Clique em "Nova conversa" para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupOrder.map((group) => {
                    const groupConvs = groupedConversations[group];
                    if (!groupConvs || groupConvs.length === 0) return null;

                    return (
                      <div key={group}>
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 mb-2">
                          {group}
                        </h3>
                        <div className="space-y-0.5">
                          {groupConvs.map((conv) => {
                            const isActive = conv.id === currentConversationId;
                            const isHovered = conv.id === hoveredId;

                            return (
                              <div
                                key={conv.id}
                                onClick={() => onSelectConversation(conv.id)}
                                onMouseEnter={() => setHoveredId(conv.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                                  isActive
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                                    : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <svg
                                  className={`w-5 h-5 flex-shrink-0 ${
                                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                  />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {conv.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {conv.messages.length} mensagens
                                  </p>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                                  {formatDate(conv.timestamp)}
                                </span>

                                {/* Delete button */}
                                {(isHovered || isActive) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteConversation(conv.id);
                                    }}
                                    className={`p-1 rounded-lg transition-colors ${
                                      isActive
                                        ? 'hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300'
                                        : 'hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-500'
                                    }`}
                                    title="Excluir conversa"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded font-mono">
                  Ctrl+N
                </kbd>
                <span>nova conversa</span>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Toggle button for collapsed state (visible on desktop) */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed lg:absolute left-4 top-4 z-30 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Expandir sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </>
  );
};
