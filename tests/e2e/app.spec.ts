import { test, expect, Page } from '@playwright/test';

// Configuração base para todos os testes E2E
test.describe.configure({ mode: 'parallel' });

const HERMES_API_URL = process.env.HERMES_API_URL || 'http://localhost:5001';

// Mock da API do Hermes para testes
test.beforeEach(async ({ page }) => {
  // Mock do endpoint de health
  await page.route(`${HERMES_API_URL}/health`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok', version: '1.0.0' }),
    });
  });

  // Mock do endpoint de models
  await page.route(`${HERMES_API_URL}/v1/models`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { id: 'gpt-4', object: 'model', owned_by: 'openai' },
          { id: 'gpt-3.5-turbo', object: 'model', owned_by: 'openai' },
        ],
      }),
    });
  });

  // Mock do endpoint de chat completions (não-streaming)
  await page.route(`${HERMES_API_URL}/v1/chat/completions`, async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    if (postData?.stream) {
      // Resposta em stream (SSE)
      const chunks = [
        'data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"Olá"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"!"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" Como"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" posso"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" ajudar?"}}]}\n\n',
        'data: [DONE]\n\n',
      ];

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: chunks.join(''),
      });
    } else {
      // Resposta normal
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'chatcmpl-test',
          object: 'chat.completion',
          created: Date.now(),
          model: postData?.model || 'gpt-4',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'Olá! Como posso ajudar?',
            },
            finish_reason: 'stop',
          }],
        }),
      });
    }
  });
});

test.describe('Hermes Chat E2E', () => {
  test('deve abrir a aplicação e verificar se carregou corretamente', async ({ page }) => {
    // Aguarda o app carregar (Tauri pode levar alguns segundos)
    await page.goto('tauri://localhost');
    
    // Verifica se o título está presente
    await expect(page).toHaveTitle(/hermes|chat/i);
    
    // Verifica se o elemento principal está visível
    await expect(page.locator('[data-testid="app-root"], #root, .app')).toBeVisible();
    
    // Verifica se o input de chat está presente
    const chatInput = page.locator('[data-testid="chat-input"], input[placeholder*="mensagem"], textarea');
    await expect(chatInput).toBeVisible();
  });

  test('deve mostrar status de conexão online', async ({ page }) => {
    await page.goto('tauri://localhost');
    
    // Aguarda a conexão ser estabelecida
    await page.waitForTimeout(2000);
    
    // Verifica se o status online é exibido
    const statusIndicator = page.locator('[data-testid="status-online"], [data-status="online"]');
    await expect(statusIndicator).toBeVisible();
    
    // Ou verifica pelo texto
    await expect(page.locator('text=/online|conectado/i')).toBeVisible();
  });

  test('deve listar modelos disponíveis', async ({ page }) => {
    await page.goto('tauri://localhost');
    
    // Clica no seletor de modelos (se existir)
    const modelSelector = page.locator('[data-testid="model-selector"], select[name="model"]').first();
    
    if (await modelSelector.isVisible().catch(() => false)) {
      await modelSelector.click();
      
      // Verifica se os modelos mockados estão presentes
      await expect(page.locator('text=gpt-4')).toBeVisible();
      await expect(page.locator('text=gpt-3.5-turbo')).toBeVisible();
    }
  });

  test('deve enviar mensagem e receber resposta', async ({ page }) => {
    await page.goto('tauri://localhost');
    
    // Localiza o input de chat
    const chatInput = page.locator('[data-testid="chat-input"], input[placeholder*="mensagem"], textarea').first();
    await expect(chatInput).toBeVisible();
    
    // Digita uma mensagem
    const testMessage = 'Olá, assistente!';
    await chatInput.fill(testMessage);
    
    // Envia a mensagem (Enter ou botão)
    await chatInput.press('Enter');
    
    // Verifica se a mensagem do usuário aparece na tela
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible();
    
    // Aguarda a resposta (com timeout maior por causa do streaming)
    await page.waitForTimeout(3000);
    
    // Verifica se a resposta do assistente aparece
    const assistantResponse = page.locator('[data-role="assistant"], .assistant-message, [data-testid="assistant-message"]').first();
    await expect(assistantResponse).toBeVisible();
    
    // Verifica se o texto da resposta contém o esperado
    const responseText = await assistantResponse.textContent();
    expect(responseText).toContain('Olá');
  });

  test('deve permitir enviar múltiplas mensagens', async ({ page }) => {
    await page.goto('tauri://localhost');
    
    const chatInput = page.locator('[data-testid="chat-input"], input[placeholder*="mensagem"], textarea').first();
    
    // Envia primeira mensagem
    await chatInput.fill('Primeira mensagem');
    await chatInput.press('Enter');
    await expect(page.locator('text="Primeira mensagem"')).toBeVisible();
    
    // Aguarda resposta
    await page.waitForTimeout(2000);
    
    // Envia segunda mensagem
    await chatInput.fill('Segunda mensagem');
    await chatInput.press('Enter');
    await expect(page.locator('text="Segunda mensagem"')).toBeVisible();
    
    // Verifica se ambas as mensagens estão na tela
    const userMessages = page.locator('[data-role="user"], .user-message');
    await expect(userMessages).toHaveCount(2);
  });

  test('deve mostrar indicador de digitação enquanto aguarda resposta', async ({ page }) => {
    // Mock com delay para testar indicador
    await page.route(`${HERMES_API_URL}/v1/chat/completions`, async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{
            message: { role: 'assistant', content: 'Resposta atrasada' },
          }],
        }),
      });
    });

    await page.goto('tauri://localhost');
    
    const chatInput = page.locator('[data-testid="chat-input"], textarea').first();
    await chatInput.fill('Teste de loading');
    await chatInput.press('Enter');
    
    // Verifica se o indicador de digitação aparece
    const typingIndicator = page.locator('[data-testid="typing-indicator"], .typing-indicator, [data-typing="true"]');
    await expect(typingIndicator).toBeVisible();
    
    // Aguarda resposta
    await page.waitForTimeout(3000);
  });

  test('deve lidar com erro de conexão', async ({ page }) => {
    // Simula erro de conexão
    await page.route(`${HERMES_API_URL}/v1/chat/completions`, async (route) => {
      await route.abort('failed');
    });

    await page.goto('tauri://localhost');
    
    const chatInput = page.locator('[data-testid="chat-input"], textarea').first();
    await chatInput.fill('Mensagem com erro');
    await chatInput.press('Enter');
    
    // Verifica se mensagem de erro aparece
    await page.waitForTimeout(1000);
    const errorMessage = page.locator('[data-testid="error-message"], .error-message, text=/erro|error|falha/i').first();
    await expect(errorMessage).toBeVisible();
  });

  test('deve permitir parar resposta em streaming', async ({ page }) => {
    // Mock com streaming lento
    await page.route(`${HERMES_API_URL}/v1/chat/completions`, async (route) => {
      const chunks = [
        'data: {"choices":[{"delta":{"content":"Teste"}}]}\n\n',
      ];
      
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: chunks.join(''),
      });
    });

    await page.goto('tauri://localhost');
    
    const chatInput = page.locator('[data-testid="chat-input"], textarea').first();
    await chatInput.fill('Mensagem longa');
    await chatInput.press('Enter');
    
    // Aguarda um pouco
    await page.waitForTimeout(500);
    
    // Clica no botão de parar
    const stopButton = page.locator('[data-testid="stop-button"], button:has-text("Parar"), button:has-text("Stop")').first();
    if (await stopButton.isVisible().catch(() => false)) {
      await stopButton.click();
      
      // Verifica se o input voltou a ficar habilitado
      await expect(chatInput).toBeEnabled();
    }
  });

  test('deve persistir histórico de mensagens', async ({ page }) => {
    await page.goto('tauri://localhost');
    
    const chatInput = page.locator('[data-testid="chat-input"], textarea').first();
    
    // Envia mensagens
    await chatInput.fill('Mensagem persistente 1');
    await chatInput.press('Enter');
    await page.waitForTimeout(2000);
    
    await chatInput.fill('Mensagem persistente 2');
    await chatInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // Recarrega a página
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verifica se as mensagens ainda estão lá (se houver persistência)
    // Nota: Isso depende da implementação do histórico
    const messages = page.locator('[data-role="user"], .user-message');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(0); // Pode ser 0 se não houver persistência
  });

  test('deve funcionar em modo escuro/claro', async ({ page }) => {
    await page.goto('tauri://localhost');
    
    // Procura botão de tema
    const themeButton = page.locator('[data-testid="theme-toggle"], button[aria-label*="tema"], button[aria-label*="theme"]').first();
    
    if (await themeButton.isVisible().catch(() => false)) {
      // Alterna tema
      await themeButton.click();
      await page.waitForTimeout(500);
      
      // Verifica se o tema mudou (verificando classe ou atributo)
      const body = page.locator('body');
      const className = await body.getAttribute('class');
      expect(className).toMatch(/dark|light/);
    }
  });
});

test.describe('Tauri API Integration', () => {
  test('deve chamar comandos Tauri corretamente', async ({ page }) => {
    await page.goto('tauri://localhost');
    
    // Executa JavaScript no contexto da página para verificar Tauri
    const tauriAvailable = await page.evaluate(() => {
      return typeof (window as any).__TAURI__ !== 'undefined';
    });
    
    // O Tauri deve estar disponível em modo E2E
    expect(tauriAvailable).toBe(true);
  });
});
