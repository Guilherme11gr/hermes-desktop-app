import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HermesClient, HermesError, HermesTimeoutError, HermesNetworkError } from '../src/lib/hermes-client';

describe('HermesClient', () => {
  const mockBaseUrl = 'http://localhost:5001';
  let client: HermesClient;

  beforeEach(() => {
    client = new HermesClient(mockBaseUrl);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('health()', () => {
    it('deve retornar true quando o servidor está saudável', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'ok' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await client.health();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(`${mockBaseUrl}/health`, expect.any(Object));
    });

    it('deve retornar false quando o servidor retorna erro', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await client.health();

      expect(result).toBe(false);
    });

    it('deve retornar false em caso de erro de rede', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await client.health();

      expect(result).toBe(false);
    });
  });

  describe('getModels()', () => {
    it('deve retornar lista de modelos disponíveis', async () => {
      const mockModels = {
        data: [
          { id: 'gpt-4', object: 'model', owned_by: 'openai' },
          { id: 'gpt-3.5-turbo', object: 'model', owned_by: 'openai' },
        ],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockModels),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await client.getModels();

      expect(result).toEqual(mockModels.data);
      expect(mockFetch).toHaveBeenCalledWith(`${mockBaseUrl}/v1/models`, expect.any(Object));
    });

    it('deve lançar HermesError quando a API retorna erro', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(client.getModels()).rejects.toThrow(HermesError);
      await expect(client.getModels()).rejects.toThrow('Invalid API key');
    });

    it('deve lançar HermesNetworkError em caso de erro de rede', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(client.getModels()).rejects.toThrow(HermesNetworkError);
    });
  });

  describe('chat()', () => {
    const mockMessages = [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello' },
    ];

    it('deve fazer request de chat com parâmetros corretos', async () => {
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'),
          })
          .mockResolvedValueOnce({ done: true }),
        cancel: vi.fn(),
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      });
      vi.stubGlobal('fetch', mockFetch);

      const generator = client.chat(mockMessages, { model: 'gpt-4', stream: true });
      const chunks = [];

      for await (const chunk of generator) {
        chunks.push(chunk);
      }

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/v1/chat/completions`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            model: 'gpt-4',
            messages: mockMessages,
            stream: true,
          }),
        })
      );
    });

    it('deve fazer parse correto de stream SSE', async () => {
      const sseData = [
        'data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        'data: [DONE]\n\n',
      ];

      let callCount = 0;
      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          if (callCount < sseData.length) {
            const chunk = {
              done: false,
              value: new TextEncoder().encode(sseData[callCount]),
            };
            callCount++;
            return Promise.resolve(chunk);
          }
          return Promise.resolve({ done: true });
        }),
        cancel: vi.fn(),
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      });
      vi.stubGlobal('fetch', mockFetch);

      const generator = client.chat(mockMessages, { stream: true });
      const chunks = [];

      for await (const chunk of generator) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toHaveProperty('choices');
    });

    it('deve lidar com erro de timeout', async () => {
      const mockFetch = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        })
      );
      vi.stubGlobal('fetch', mockFetch);

      const generator = client.chat(mockMessages, { timeout: 50 });
      
      await expect(async () => {
        for await (const _ of generator) {
          // consume generator
        }
      }).rejects.toThrow(HermesTimeoutError);
    });

    it('deve permitir abort de request em andamento', async () => {
      const abortController = new AbortController();
      
      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            setTimeout(() => resolve({ done: false, value: new Uint8Array() }), 1000);
          });
        }),
        cancel: vi.fn(),
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      });
      vi.stubGlobal('fetch', mockFetch);

      const generator = client.chat(mockMessages, { signal: abortController.signal });

      // Abort after 50ms
      setTimeout(() => abortController.abort(), 50);

      await expect(async () => {
        for await (const _ of generator) {
          // consume generator
        }
      }).rejects.toThrow('AbortError');
    });

    it('deve lançar erro quando a API retorna erro em stream', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: { message: 'Invalid model' } }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const generator = client.chat(mockMessages);
      
      await expect(async () => {
        for await (const _ of generator) {
          // consume generator
        }
      }).rejects.toThrow(HermesError);
    });

    it('deve lidar com múltiplas linhas de dados no mesmo chunk', async () => {
      const multiLineData = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: {"choices":[{"delta":{"content":" world"}}]}\n\n';
      
      let readCount = 0;
      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          if (readCount === 0) {
            readCount++;
            return Promise.resolve({
              done: false,
              value: new TextEncoder().encode(multiLineData),
            });
          }
          return Promise.resolve({ done: true });
        }),
        cancel: vi.fn(),
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      });
      vi.stubGlobal('fetch', mockFetch);

      const generator = client.chat(mockMessages, { stream: true });
      const chunks = [];

      for await (const chunk of generator) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(2);
    });
  });

  describe('configuração de headers', () => {
    it('deve incluir API key quando configurada', async () => {
      const clientWithKey = new HermesClient(mockBaseUrl, { apiKey: 'test-key-123' });
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await clientWithKey.getModels();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key-123',
          }),
        })
      );
    });

    it('deve permitir headers customizados', async () => {
      const clientWithHeaders = new HermesClient(mockBaseUrl, {
        headers: { 'X-Custom-Header': 'custom-value' },
      });
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await clientWithHeaders.getModels();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });
  });
});
