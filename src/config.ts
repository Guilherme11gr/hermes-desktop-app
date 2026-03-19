// Configuração da API
export const config = {
  apiUrl: import.meta.env.VITE_HERMES_API_URL || 'http://localhost:5001',
  apiKey: import.meta.env.VITE_HERMES_API_KEY || '',
  timeout: Number(import.meta.env.VITE_HERMES_TIMEOUT) || 30000,
  defaultModel: import.meta.env.VITE_DEFAULT_MODEL || 'gpt-4',
  debug: import.meta.env.VITE_DEBUG === 'true',
  appName: import.meta.env.VITE_APP_NAME || 'Hermes Chat',
};
