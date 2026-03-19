import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface UseFloatWindowReturn {
  isFloatMode: boolean;
  isLoading: boolean;
  openFloat: () => Promise<void>;
  closeFloat: () => Promise<void>;
  toggleFloat: () => Promise<void>;
}

export function useFloatWindow(): UseFloatWindowReturn {
  const [isFloatMode, setIsFloatMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verifica estado inicial
  useEffect(() => {
    const checkFloatMode = async () => {
      try {
        const result = await invoke<boolean>('is_float_mode');
        setIsFloatMode(result);
      } catch (error) {
        console.error('[useFloatWindow] Erro ao verificar modo float:', error);
      }
    };
    
    checkFloatMode();
  }, []);

  const openFloat = useCallback(async () => {
    setIsLoading(true);
    try {
      await invoke('open_float_window');
      setIsFloatMode(true);
      console.log('[useFloatWindow] Janela float aberta');
    } catch (error) {
      console.error('[useFloatWindow] Erro ao abrir janela float:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeFloat = useCallback(async () => {
    setIsLoading(true);
    try {
      await invoke('close_float_window');
      setIsFloatMode(false);
      console.log('[useFloatWindow] Janela float fechada');
    } catch (error) {
      console.error('[useFloatWindow] Erro ao fechar janela float:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleFloat = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await invoke<boolean>('toggle_float_mode');
      setIsFloatMode(result);
      console.log('[useFloatWindow] Modo float alternado:', result);
    } catch (error) {
      console.error('[useFloatWindow] Erro ao alternar modo float:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isFloatMode,
    isLoading,
    openFloat,
    closeFloat,
    toggleFloat,
  };
}
