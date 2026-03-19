import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../src/components/ChatInput';
import { ChatMessages } from '../src/components/ChatMessages';
import { ConnectionStatus } from '../src/components/ConnectionStatus';

// Mock do Tauri API
vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn(),
}));

describe('ChatInput', () => {
  const mockOnSend = vi.fn();
  const mockOnStop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar input e botão de enviar', () => {
    render(<ChatInput onSend={mockOnSend} isLoading={false} />);

    expect(screen.getByPlaceholderText(/digite sua mensagem/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  it('deve permitir digitar mensagem', async () => {
    render(<ChatInput onSend={mockOnSend} isLoading={false} />);

    const input = screen.getByPlaceholderText(/digite sua mensagem/i);
    await userEvent.type(input, 'Olá, mundo!');

    expect(input).toHaveValue('Olá, mundo!');
  });

  it('deve chamar onSend quando o formulário é submetido', async () => {
    render(<ChatInput onSend={mockOnSend} isLoading={false} />);

    const input = screen.getByPlaceholderText(/digite sua mensagem/i);
    await userEvent.type(input, 'Test message');

    const form = screen.getByRole('form') || input.closest('form');
    if (form) {
      fireEvent.submit(form);
    } else {
      const button = screen.getByRole('button', { name: /enviar/i });
      fireEvent.click(button);
    }

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });
  });

  it('deve limpar input após enviar mensagem', async () => {
    render(<ChatInput onSend={mockOnSend} isLoading={false} />);

    const input = screen.getByPlaceholderText(/digite sua mensagem/i);
    await userEvent.type(input, 'Message to clear');

    const button = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('deve desabilitar input quando isLoading é true', () => {
    render(<ChatInput onSend={mockOnSend} isLoading={true} />);

    const input = screen.getByPlaceholderText(/digite sua mensagem/i);
    expect(input).toBeDisabled();
  });

  it('deve mostrar botão de parar quando isLoading é true', () => {
    render(<ChatInput onSend={mockOnSend} onStop={mockOnStop} isLoading={true} />);

    expect(screen.getByRole('button', { name: /parar/i })).toBeInTheDocument();
  });

  it('deve chamar onStop quando botão de parar é clicado', () => {
    render(<ChatInput onSend={mockOnSend} onStop={mockOnStop} isLoading={true} />);

    const stopButton = screen.getByRole('button', { name: /parar/i });
    fireEvent.click(stopButton);

    expect(mockOnStop).toHaveBeenCalled();
  });

  it('deve enviar mensagem ao pressionar Enter', async () => {
    render(<ChatInput onSend={mockOnSend} isLoading={false} />);

    const input = screen.getByPlaceholderText(/digite sua mensagem/i);
    await userEvent.type(input, 'Enter message{Enter}');

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Enter message');
    });
  });

  it('não deve enviar mensagem vazia', async () => {
    render(<ChatInput onSend={mockOnSend} isLoading={false} />);

    const button = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(button);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('deve fazer trim da mensagem antes de enviar', async () => {
    render(<ChatInput onSend={mockOnSend} isLoading={false} />);

    const input = screen.getByPlaceholderText(/digite sua mensagem/i);
    await userEvent.type(input, '   spaced message   ');

    const button = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('spaced message');
    });
  });
});

describe('ChatMessages', () => {
  const mockMessages = [
    { id: '1', role: 'user', content: 'Olá', timestamp: new Date().toISOString() },
    { id: '2', role: 'assistant', content: 'Como posso ajudar?', timestamp: new Date().toISOString() },
  ];

  it('deve renderizar lista de mensagens', () => {
    render(<ChatMessages messages={mockMessages} />);

    expect(screen.getByText('Olá')).toBeInTheDocument();
    expect(screen.getByText('Como posso ajudar?')).toBeInTheDocument();
  });

  it('deve renderizar mensagem do usuário com estilo correto', () => {
    render(<ChatMessages messages={[mockMessages[0]]} />);

    const userMessage = screen.getByText('Olá');
    expect(userMessage.closest('[data-role="user"]')).toBeInTheDocument();
  });

  it('deve renderizar mensagem do assistant com estilo correto', () => {
    render(<ChatMessages messages={[mockMessages[1]]} />);

    const assistantMessage = screen.getByText('Como posso ajudar?');
    expect(assistantMessage.closest('[data-role="assistant"]')).toBeInTheDocument();
  });

  it('deve renderizar estado vazio quando não há mensagens', () => {
    render(<ChatMessages messages={[]} />);

    expect(screen.getByText(/nenhuma mensagem/i) || screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('deve renderizar indicador de digitação quando isTyping é true', () => {
    render(<ChatMessages messages={mockMessages} isTyping={true} />);

    expect(screen.getByTestId('typing-indicator') || screen.getByText(/digitando/i)).toBeInTheDocument();
  });

  it('deve fazer scroll automático para a última mensagem', () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const { rerender } = render(<ChatMessages messages={mockMessages} />);

    const newMessages = [...mockMessages, { id: '3', role: 'assistant', content: 'Nova mensagem', timestamp: new Date().toISOString() }];
    rerender(<ChatMessages messages={newMessages} />);

    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it('deve formatar código em mensagens markdown', () => {
    const messageWithCode = {
      id: '1',
      role: 'assistant',
      content: '```javascript\nconst x = 1;\n```',
      timestamp: new Date().toISOString(),
    };

    render(<ChatMessages messages={[messageWithCode]} />);

    expect(screen.getByText(/const x = 1;/)).toBeInTheDocument();
  });

  it('deve lidar com mensagens muito longas', () => {
    const longMessage = {
      id: '1',
      role: 'assistant',
      content: 'a'.repeat(10000),
      timestamp: new Date().toISOString(),
    };

    const { container } = render(<ChatMessages messages={[longMessage]} />);

    expect(container.querySelector('[data-message-id="1"]')).toBeInTheDocument();
  });
});

describe('ConnectionStatus', () => {
  it('deve mostrar status online quando connected é true', () => {
    render(<ConnectionStatus connected={true} />);

    expect(screen.getByText(/online/i) || screen.getByTestId('status-online')).toBeInTheDocument();
  });

  it('deve mostrar status offline quando connected é false', () => {
    render(<ConnectionStatus connected={false} />);

    expect(screen.getByText(/offline/i) || screen.getByTestId('status-offline')).toBeInTheDocument();
  });

  it('deve mostrar indicador visual de conexão', () => {
    const { container } = render(<ConnectionStatus connected={true} />);

    const indicator = container.querySelector('[data-status-indicator]');
    expect(indicator).toHaveClass('online') || expect(indicator).toHaveStyle({ color: 'green' });
  });

  it('deve mostrar indicador visual de desconexão', () => {
    const { container } = render(<ConnectionStatus connected={false} />);

    const indicator = container.querySelector('[data-status-indicator]');
    expect(indicator).toHaveClass('offline') || expect(indicator).toHaveStyle({ color: 'red' });
  });

  it('deve exibir mensagem de erro quando error é fornecido', () => {
    render(<ConnectionStatus connected={false} error="Failed to connect" />);

    expect(screen.getByText(/failed to connect/i)).toBeInTheDocument();
  });

  it('deve chamar onRetry quando botão de retry é clicado', () => {
    const mockRetry = vi.fn();
    render(<ConnectionStatus connected={false} onRetry={mockRetry} />);

    const retryButton = screen.getByRole('button', { name: /reconectar|retry/i });
    fireEvent.click(retryButton);

    expect(mockRetry).toHaveBeenCalled();
  });

  it('deve mostrar estado de reconectando quando isReconnecting é true', () => {
    render(<ConnectionStatus connected={false} isReconnecting={true} />);

    expect(screen.getByText(/reconectando/i) || screen.getByTestId('reconnecting-spinner')).toBeInTheDocument();
  });

  it('deve atualizar quando o status muda', () => {
    const { rerender } = render(<ConnectionStatus connected={false} />);

    expect(screen.getByText(/offline/i) || screen.getByTestId('status-offline')).toBeInTheDocument();

    rerender(<ConnectionStatus connected={true} />);

    expect(screen.getByText(/online/i) || screen.getByTestId('status-online')).toBeInTheDocument();
  });
});
