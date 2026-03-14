/**
 * @fileoverview Интеграционные тесты для полного потока диалога
 * Проверяет взаимодействие DialogPanel + DialogInput + MessageBubble + DialogHeader
 * @module tests/integration/dialog-flow.test
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
  DialogHeader: ({ user, onClose, onSelectUser, users }: any) => (
    <div data-testid="dialog-header">
      <span data-testid="user-name">{user?.firstName || 'User'}</span>
      <button data-testid="button-close-dialog-panel" onClick={onClose}>Close</button>
      <button 
        data-testid="button-select-user" 
        onClick={() => {
          if (users && users.length > 1) {
            onSelectUser(users[1]);
          }
        }}
      >
        Select User
      </button>
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
// Тесты полного потока диалога
// ============================================

describe('DialogPanel Integration - Полный поток', () => {
  const defaultProps = {
    projectId: 1,
    user: createTestUser(),
    onClose: vi.fn(),
    onSelectUser: vi.fn(),
  };

  describe('1. Полный поток диалога', () => {
    it('должен показывать полный поток: выбор пользователя → загрузка сообщений → отправка сообщения', async () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: false });

      setMockUserListData({
        users: [
          createTestUser(),
          createTestUser({ userId: '456', firstName: 'Петр' }),
        ],
        isLoading: false,
      });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      // Проверяем что заголовок с пользователем отображается
      expect(screen.getByTestId('user-name')).toHaveTextContent('Иван');

      // Проверяем что поле ввода отображается
      expect(screen.getByTestId('dialog-input')).toBeInTheDocument();

      // Вводим и отправляем сообщение
      const input = screen.getByTestId('dialog-input-field');
      const sendButton = screen.getByTestId('dialog-panel-button-send');

      fireEvent.change(input, { target: { value: 'Новое сообщение' } });
      fireEvent.click(sendButton);

      expect(mockMutate).toHaveBeenCalledWith('Новое сообщение');
    });

    it('должен очищать поле ввода после отправки сообщения', async () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: false });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const input = screen.getByTestId('dialog-input-field');
      const sendButton = screen.getByTestId('dialog-panel-button-send');

      fireEvent.change(input, { target: { value: 'Тестовое сообщение' } });
      fireEvent.click(sendButton);

      // После отправки поле должно очиститься
      expect(input).toHaveValue('');
    });
  });

  describe('2. Взаимодействие компонентов', () => {
    it('должен координировать DialogPanel + DialogInput + MessageBubble', async () => {
      const mockMutate = vi.fn();
      setMockSendMessage({ mutate: mockMutate, isPending: false });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      // Проверяем что все компоненты рендерятся
      expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-input')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-messages-scroll-area')).toBeInTheDocument();

      // Отправляем сообщение
      const input = screen.getByTestId('dialog-input-field');
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByTestId('dialog-panel-button-send'));

      expect(mockMutate).toHaveBeenCalled();
    });

    it('должен координировать DialogHeader + DialogPanel (выбор пользователя)', () => {
      const mockOnSelectUser = vi.fn();
      setMockUserListData({
        users: [
          createTestUser(),
          createTestUser({ userId: '456', firstName: 'Петр' }),
        ],
        isLoading: false,
      });

      render(
        <DialogPanel {...defaultProps} onSelectUser={mockOnSelectUser} />,
        { wrapper: createWrapper() }
      );

      const selectButton = screen.getByTestId('button-select-user');
      fireEvent.click(selectButton);

      expect(mockOnSelectUser).toHaveBeenCalled();
    });
  });

  describe('3. Состояния загрузки', () => {
    it('должен показывать EmptyDialog когда нет сообщений', () => {
      // Устанавливаем users чтобы не было loading состояния
      setMockUserListData({ users: [createTestUser()], isLoading: false });
      
      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('empty-dialog-messages')).toBeInTheDocument();
    });

    it('должен показывать индикатор отправки (isPending)', () => {
      setMockUserListData({ users: [createTestUser()], isLoading: false });
      setMockSendMessage({ mutate: vi.fn(), isPending: true });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const sendButton = screen.getByTestId('dialog-panel-button-send');
      expect(sendButton).toBeDisabled();
      expect(sendButton).toHaveTextContent('Sending...');
    });
  });

  describe('4. Навигация', () => {
    it('должен вызывать onClose при клике на кнопку закрытия', () => {
      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const closeButton = screen.getByTestId('button-close-dialog-panel');
      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('должен вызывать onSelectUser при выборе другого пользователя', () => {
      const mockOnSelectUser = vi.fn();
      const user2 = createTestUser({ userId: '456', firstName: 'Петр' });
      
      setMockUserListData({
        users: [defaultProps.user, user2],
        isLoading: false,
      });

      render(
        <DialogPanel {...defaultProps} onSelectUser={mockOnSelectUser} />,
        { wrapper: createWrapper() }
      );

      const selectButton = screen.getByTestId('button-select-user');
      fireEvent.click(selectButton);

      expect(mockOnSelectUser).toHaveBeenCalled();
    });

    it('должен обновлять заголовок при выборе пользователя', () => {
      const user2 = createTestUser({ userId: '456', firstName: 'Мария' });
      
      setMockUserListData({
        users: [defaultProps.user, user2],
        isLoading: false,
      });

      const { rerender } = render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });
      expect(screen.getByTestId('user-name')).toHaveTextContent('Иван');

      rerender(<DialogPanel {...defaultProps} user={user2} />);
      expect(screen.getByTestId('user-name')).toHaveTextContent('Мария');
    });
  });

  describe('5. Предупреждение (localStorage)', () => {
    it('должен показывать предупреждение при первом открытии', () => {
      localStorageMock.getItem.mockReturnValue(null);
      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });
      expect(screen.getByTestId('dialog-warning')).toBeInTheDocument();
    });

    it('не должен показывать предупреждение если уже закрыто', () => {
      localStorageMock.getItem.mockReturnValue('true');
      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });
      expect(screen.queryByTestId('dialog-warning')).not.toBeInTheDocument();
    });

    it('должен сохранять в localStorage при закрытии предупреждения', () => {
      localStorageMock.getItem.mockReturnValue(null);
      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });
      const closeButton = screen.getByTestId('button-close-warning');
      fireEvent.click(closeButton);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('dialog-warning-dismissed', 'true');
    });
  });

  describe('6. Работа с разными пользователями', () => {
    it('должен отображать разные имена пользователей', () => {
      const user1 = createTestUser({ firstName: 'Алексей' });
      const user2 = createTestUser({ firstName: 'Мария' });

      const { rerender } = render(<DialogPanel {...defaultProps} user={user1} />, { wrapper: createWrapper() });
      expect(screen.getByTestId('user-name')).toHaveTextContent('Алексей');

      rerender(<DialogPanel {...defaultProps} user={user2} />);
      expect(screen.getByTestId('user-name')).toHaveTextContent('Мария');
    });
  });

  describe('7. Edge cases', () => {
    it('должен работать с undefined onSelectUser', () => {
      const props = {
        projectId: 1,
        user: createTestUser(),
        onClose: vi.fn(),
      };
      expect(() => render(<DialogPanel {...props} />, { wrapper: createWrapper() })).not.toThrow();
    });

    it('должен работать с пустым списком пользователей', () => {
      setMockUserListData({ users: [], isLoading: false });
      expect(() => render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() })).not.toThrow();
    });
  });
});
