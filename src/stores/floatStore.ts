// Float Mode State Store
// Gerencia o estado do modo float (bolinha + chat mini)

import { useState, useEffect, useCallback } from 'react';

export interface FloatPosition {
  x: number;
  y: number;
}

export interface FloatState {
  isEnabled: boolean;
  isExpanded: boolean;
  position: FloatPosition;
}

const STORAGE_KEY = 'hermes-float-state';

const getDefaultState = (): FloatState => ({
  isEnabled: false,
  isExpanded: false,
  position: { 
    x: 20, 
    y: typeof window !== 'undefined' ? window.innerHeight - 100 : 600 
  }
});

const loadState = (): FloatState => {
  if (typeof window === 'undefined') return getDefaultState();
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...getDefaultState(), ...parsed };
    }
  } catch (e) {
    console.error('[floatStore] Erro ao carregar estado:', e);
  }
  
  return getDefaultState();
};

const saveState = (state: FloatState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
};

// Estado global - ÚNICA instância
let globalState: FloatState = loadState();

// Listeners - ÚNICA instância
const listeners = new Set<(state: FloatState) => void>();

const notifyListeners = () => {
  console.log('[floatStore] notifyListeners, total:', listeners.size);
  listeners.forEach(listener => listener(globalState));
};

// Função global de toggle (usada pelo botão e hotkey)
const toggleFloatModeGlobal = () => {
  console.log('[floatStore] toggleFloatModeGlobal ANTES:', globalState.isEnabled, 'listeners:', listeners.size);
  globalState = { ...globalState, isEnabled: !globalState.isEnabled, isExpanded: false };
  saveState(globalState);
  console.log('[floatStore] toggleFloatModeGlobal DEPOIS:', globalState.isEnabled);
  notifyListeners();
};

// Hook React para usar o store
export const useFloatStore = () => {
  const [state, setState] = useState<FloatState>(globalState);

  useEffect(() => {
    console.log('[useFloatStore] Registrando listener, total antes:', listeners.size);
    listeners.add(setState);
    console.log('[useFloatStore] Listener registrado, total depois:', listeners.size);
    
    return () => {
      console.log('[useFloatStore] Removendo listener');
      listeners.delete(setState);
    };
  }, []);

  const toggleFloatMode = useCallback(() => {
    toggleFloatModeGlobal();
  }, []);

  const toggleExpanded = useCallback(() => {
    globalState = { ...globalState, isExpanded: !globalState.isExpanded };
    saveState(globalState);
    notifyListeners();
  }, []);

  const setPosition = useCallback((position: FloatPosition) => {
    globalState = { ...globalState, position };
    saveState(globalState);
    notifyListeners();
  }, []);

  const expand = useCallback(() => {
    globalState = { ...globalState, isExpanded: true };
    saveState(globalState);
    notifyListeners();
  }, []);

  const collapse = useCallback(() => {
    globalState = { ...globalState, isExpanded: false };
    saveState(globalState);
    notifyListeners();
  }, []);

  return {
    state,
    toggleFloatMode,
    toggleExpanded,
    setPosition,
    expand,
    collapse
  };
};

// Export direto pra uso sem hook (compatibilidade)
export const floatStore = {
  getState: () => globalState,
  toggleFloatMode: toggleFloatModeGlobal,
  expand: () => {
    globalState = { ...globalState, isExpanded: true };
    saveState(globalState);
    notifyListeners();
  },
  collapse: () => {
    globalState = { ...globalState, isExpanded: false };
    saveState(globalState);
    notifyListeners();
  },
  setPosition: (position: FloatPosition) => {
    globalState = { ...globalState, position };
    saveState(globalState);
    notifyListeners();
  }
};
