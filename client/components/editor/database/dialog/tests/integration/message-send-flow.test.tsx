/**
 * @fileoverview Интеграционные тесты для потока отправки сообщений
 * Проверяет отправку сообщений, обновление списка, обработку ошибок и валидацию
 * @module tests/integration/message-send-flow.test
 */

/// <reference types="vitest/globals" />

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DialogPanel } from '../../dialog-panel';
import type { UserBotData } from '@shared/schema';
import React from 'react';

// ============================================
// Глобальные моки хуков
// ============================================

let mockBotData = { bot: null, isLoading: false };
let mockUserListData = { users: [], isLoading: false };
let mockSendMessageMutate = vi.fn();
let mockSendMessageIsPending = false;
let mockSendNodeData = { mutate: vi.fn(), isPending: false };
let mockProjectData = { project: null, isLoading: false, isError: false, refetch: vi.fn() };

function setMockBotData(data: any) { mockBotData = data; }
function setMockUserListData(data: any) { mockUserListData = data; }
function setMockSendMessage(data: { mutate: any; isPending: boolean }) { 
  mockSendMessageMutate = data.mutate;
  mockSendMessageIsPending = data.isPending;
}
function setMockSendNodeData(data: any) { mockSendNodeData = data; }
function setMockProjectData(data: any) { mockProjectData = data; }

vi.mock('../../../hooks/use-bot-data', () => ({
  useBotData: vi.fn(() => mockBotData),
}));

vi.mock('@/components/editor/database/user-details/hooks/useUserList', () => ({
  useUserList: vi.fn(() => mockUserListData),
}));

vi.mock('../../../hooks/use-send-message', () => ({
  useSendMessage: vi.fn(() => ({
    mutate: mockSendMessageMutate,
    isPending: mockSendMessageIsPending,
  })),
}));

vi.mock('../../../hooks/use-send-node', () => ({
  useSendNode: vi.fn(() => mockSendNodeData),
}));

vi.mock('../../../hooks/use-project-data', () => ({
  useProjectData: vi.fn(() => mockProjectData),
}));

vi.mock('../../../utils/node-utils', () => ({
  collectNodesFromProjectData: vi.fn(() => []),
}));

vi.mock('@/components/editor/properties/utils/node-formatters', () => ({
  formatNodeDisplay: vi.fn((node) => node?.data?.name || 'Node'),
}));

// Моки для UI компонентов
vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, ref, className, 'data-testid': dataTestId }: any) => (
    <div ref={ref} data-testid={dataTestId} className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <div data-testid="separator" className="separator" />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, 'data-testid': dataTestId, disabled }: any) => (
    <button
      data-testid={dataTestId || 'button'}
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      className={className}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} data-on-value-change={onValueChange ? 'yes' : 'no'}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, className }: any) => (
    <div data-testid="select-trigger" className={className}>{children}</div>
  ),
  SelectValue: () => <span data-testid="select-value">SelectValue</span>,
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>{children}</div>
  ),
}));

// Моки для компонентов диалога
vi.mock('../../components/dialog-header', () => ({
  DialogHeader: ({ user, onClose }: any) => (
    <div data-testid="dialog-header">
      <span data-testid="user-name">{user?.firstName || 'User'}</span>
      <button data-testid="button-close-dialog-panel" onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../../components/dialog-warning', () => ({
  DialogWarning: ({ onClose }: any) => (
    <div data-testid="dialog-warning">
      <span>Warning</span>
      <button data-testid="button-close-warning" onClick={onClose}>Close Warning</button>
    </div>
  ),
}));

vi.mock('../../components/empty-dialog', () => ({
  EmptyDialog: () => <div data-testid="empty-dialog-messages">No messages</div>,
}));

vi.mock('../../components/loading-messages', () => ({
  LoadingMessages: () => <div data-testid="loading-messages">Loading...</div>,
}));

vi.mock('../../components/dialog-input', () => ({
  DialogInput: ({ onSend, isPending }: any) => {
    const [value, setValue] = React.useState('');
    return (
      <div data-testid="dialog-input">
        <input
          data-testid="dialog-input-field"
          placeholder="Введите сообщение..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value && !isPending) {
              onSend(value);
              setValue('');
            }
          }}
        />
        <button
          data-testid="dialog-panel-button-send"
          onClick={() => {
            if (value && !isPending) {
              onSend(value);
              setValue('');
            }
          }}
          disabled={!value || isPending}
        >
          {isPending ? 'Sending...' : 'Send'}
        </button>
      </div>
    );
  },
}));

vi.mock('../../components/node-sender', () => ({
  NodeSender: () => <div data-testid="node-sender">Node Sender</div>,
}));

vi.mock('../../components/message-bubble', () => ({
  MessageBubble: ({ message, index }: any) => (
    <div 
      data-testid={`dialog-message-${message.messageType}-${index}`}
      data-message-id={message.id}
    >
      {message.messageText}
    </div>
  ),
}));

vi.mock('../../components/no-user-selected', () => ({
  NoUserSelected: () => <div data-testid="no-user-selected">No user selected</div>,
}));

vi.mock('../../utils', () => ({
  formatUserName: (user: UserBotData) => `${user.firstName} ${user.lastName || ''}`.trim(),
}));

// Моки для localStorage
interface LocalStorageMock {
  data: Record<string, string>;
  getItem: any;
  setItem: any;
  removeItem: any;
  clear: any;
}

const localStorageMock: LocalStorageMock = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.data[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.data[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.data = {};
  }),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Моки для matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ============================================
// Вспомогательные функции
// ============================================

function createTestUser(overrides: Partial<UserBotData> = {}): UserBotData {
  return {
    userId: '123',
    firstName: 'Иван',
    lastName: 'Иванов',
    userName: 'ivanov',
    ...overrides,
  } as UserBotData;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 60 * 1000,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ============================================
// Setup и teardown
// ============================================

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  localStorageMock.data = {};

  setMockBotData({ bot: null, isLoading: false });
  setMockUserListData({ users: [], isLoading: false });
  setMockSendMessage({ mutate: vi.fn(), isPending: false });
  setMockSendNodeData({ mutate: vi.fn(), isPending: false });
  setMockProjectData({ project: null, isLoading: false, isError: false, refetch: vi.fn() });
});

// ============================================
// Тесты потока отправки сообщений
// ============================================

describe('MessageSendFlow Integration', () => {
  const defaultProps = {
    projectId: 1,
    user: createTestUser(),
    onClose: vi.fn(),
    onSelectUser: vi.fn(),
  };

  describe('1. Отправка сообщения', () => {
    it('должен вызывать mutate при клике на кнопку отправки', () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: false });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByTestId('dialog-input-field');
      fireEvent.change(input, { target: { value: 'Тестовое сообщение' } });
      fireEvent.click(screen.getByTestId('dialog-panel-button-send'));

      expect(mockMutate).toHaveBeenCalledWith('Тестовое сообщение');
    });

    it('должен очищать поле после отправки', () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: false });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByTestId('dialog-input-field');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByTestId('dialog-panel-button-send'));

      expect(input).toHaveValue('');
    });
  });

  describe('2. Валидация сообщений', () => {
    it('не должен отправлять пустое сообщение', () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: false });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByTestId('dialog-panel-button-send'));

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('не должен отправлять сообщение с пробелами', () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: false });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByTestId('dialog-input-field');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(screen.getByTestId('dialog-panel-button-send'));

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('должен блокировать кнопку для пустого сообщения', () => {
      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const sendButton = screen.getByTestId('dialog-panel-button-send');
      expect(sendButton).toBeDisabled();
    });

    it('должен разблокировать кнопку при вводе текста', () => {
      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByTestId('dialog-input-field');
      const sendButton = screen.getByTestId('dialog-panel-button-send');

      fireEvent.change(input, { target: { value: 'Test' } });
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('3. Отправка с клавиши Enter', () => {
    it('должен отправлять сообщение при нажатии Enter', () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: false });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByTestId('dialog-input-field');
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockMutate).toHaveBeenCalledWith('Test message');
    });

    it('должен очищать поле после отправки Enter', () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: false });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByTestId('dialog-input-field');
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(input).toHaveValue('');
    });

    it('не должен отправлять пустое сообщение при нажатии Enter', () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: false });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByTestId('dialog-input-field');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('не должен отправлять при Enter когда isPending=true', () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: true });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByTestId('dialog-input-field');
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('4. Индикатор отправки (isPending)', () => {
    it('должен показывать индикатор отправки во время отправки', () => {
      setMockSendMessage({ mutate: vi.fn(), isPending: true });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const sendButton = screen.getByTestId('dialog-panel-button-send');
      expect(sendButton).toHaveTextContent('Sending...');
    });

    it('должен блокировать кнопку во время отправки', () => {
      setMockSendMessage({ mutate: vi.fn(), isPending: true });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const sendButton = screen.getByTestId('dialog-panel-button-send');
      expect(sendButton).toBeDisabled();
    });

    it('должен блокировать кнопку когда isPending=true даже с текстом', () => {
      setMockSendMessage({ mutate: vi.fn(), isPending: true });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByTestId('dialog-input-field');
      const sendButton = screen.getByTestId('dialog-panel-button-send');

      fireEvent.change(input, { target: { value: 'Test' } });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('5. Специальные символы и emoji', () => {
    it('должен отправлять сообщения с специальными символами', () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: false });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByTestId('dialog-input-field');
      const specialText = 'Test <>&"\' message';
      fireEvent.change(input, { target: { value: specialText } });
      fireEvent.click(screen.getByTestId('dialog-panel-button-send'));

      expect(mockMutate).toHaveBeenCalledWith(specialText);
    });

    it('должен отправлять сообщения с emoji', () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: false });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByTestId('dialog-input-field');
      const emojiText = 'Hello 👋 World 🌍!';
      fireEvent.change(input, { target: { value: emojiText } });
      fireEvent.click(screen.getByTestId('dialog-panel-button-send'));

      expect(mockMutate).toHaveBeenCalledWith(emojiText);
    });

    it('должен отправлять длинные сообщения', () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: false });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByTestId('dialog-input-field');
      const longText = 'A'.repeat(1000);
      fireEvent.change(input, { target: { value: longText } });
      fireEvent.click(screen.getByTestId('dialog-panel-button-send'));

      expect(mockMutate).toHaveBeenCalledWith(longText);
    });
  });

  describe('6. Множественные отправки', () => {
    it('должен позволять отправлять несколько сообщений подряд', () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: false });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByTestId('dialog-input-field');
      const sendButton = screen.getByTestId('dialog-panel-button-send');

      // Первое сообщение
      fireEvent.change(input, { target: { value: 'Message 1' } });
      fireEvent.click(sendButton);

      expect(mockMutate).toHaveBeenCalledWith('Message 1');

      // Второе сообщение
      fireEvent.change(input, { target: { value: 'Message 2' } });
      fireEvent.click(sendButton);

      expect(mockMutate).toHaveBeenCalledWith('Message 2');
    });
  });
});
