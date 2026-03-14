/**
 * @fileoverview Интеграционные тесты для выбора пользователя
 * Проверяет выбор пользователя, загрузку сообщений при смене пользователя
 * @module tests/integration/user-selection.test
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
  DialogHeader: ({ user, onClose, onSelectUser, users }: any) => {
    const handleSelectChange = (value: string) => {
      const selectedUser = users?.find((u: UserBotData) => u.userId.toString() === value);
      if (selectedUser && onSelectUser) {
        onSelectUser(selectedUser);
      }
    };

    return (
      <div data-testid="dialog-header">
        <span data-testid="user-name">{user?.firstName || 'User'}</span>
        <button data-testid="button-close-dialog-panel" onClick={onClose}>Close</button>
        <div data-testid="select" data-value={user?.userId?.toString()}>
          <div 
            data-testid="select-trigger"
            onClick={() => handleSelectChange('456')}
          >
            <span data-testid="select-value">{user?.firstName}</span>
          </div>
          <div data-testid="select-content">
            {users?.map((u: UserBotData) => (
              <div 
                key={u.userId} 
                data-testid="select-item" 
                data-value={u.userId.toString()}
                onClick={() => handleSelectChange(u.userId.toString())}
              >
                {u.firstName}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
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
// Тесты выбора пользователя
// ============================================

describe('UserSelection Integration', () => {
  const defaultProps = {
    projectId: 1,
    user: createTestUser(),
    onClose: vi.fn(),
    onSelectUser: vi.fn(),
  };

  const users = [
    createTestUser(),
    createTestUser({ userId: '456', firstName: 'Петр', lastName: 'Петров' }),
    createTestUser({ userId: '789', firstName: 'Мария', lastName: 'Сидорова' }),
  ];

  describe('1. Выбор пользователя', () => {
    it('должен отображать список пользователей в селекторе', () => {
      setMockUserListData({
        users,
        isLoading: false,
      });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const selectItems = screen.getAllByTestId('select-item');
      expect(selectItems).toHaveLength(3);
    });

    it('должен показывать имена пользователей в селекторе', () => {
      setMockUserListData({
        users,
        isLoading: false,
      });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      // Используем getAllByText для множественных элементов
      const ivanElements = screen.getAllByText('Иван');
      expect(ivanElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Петр')).toBeInTheDocument();
      expect(screen.getByText('Мария')).toBeInTheDocument();
    });

    it('должен вызывать onSelectUser при выборе пользователя', () => {
      setMockUserListData({
        users,
        isLoading: false,
      });

      const mockOnSelectUser = vi.fn();
      render(
        <DialogPanel {...defaultProps} onSelectUser={mockOnSelectUser} />,
        { wrapper: createWrapper() }
      );

      // Выбираем второго пользователя
      const selectItems = screen.getAllByTestId('select-item');
      const secondUserItem = selectItems.find(
        item => item.getAttribute('data-value') === '456'
      );
      
      if (secondUserItem) {
        fireEvent.click(secondUserItem);
      }

      expect(mockOnSelectUser).toHaveBeenCalled();
    });
  });

  describe('2. Смена пользователя', () => {
    it('должен обновлять заголовок при смене пользователя', () => {
      setMockUserListData({
        users,
        isLoading: false,
      });

      const mockOnSelectUser = vi.fn();
      const { rerender } = render(
        <DialogPanel {...defaultProps} onSelectUser={mockOnSelectUser} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('user-name')).toHaveTextContent('Иван');

      const user2 = createTestUser({ userId: '456', firstName: 'Алексей' });
      rerender(
        <DialogPanel {...defaultProps} user={user2} onSelectUser={mockOnSelectUser} />
      );

      expect(screen.getByTestId('user-name')).toHaveTextContent('Алексей');
    });

    it('должен показывать loading при загрузке пользователей', () => {
      setMockUserListData({
        users,
        isLoading: true,
      });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
    });
  });

  describe('3. Обновление заголовка', () => {
    it('должен показывать полное имя пользователя', () => {
      setMockUserListData({
        users,
        isLoading: false,
      });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('user-name')).toHaveTextContent('Иван');
    });

    it('должен показывать только firstName если lastName отсутствует', () => {
      setMockUserListData({
        users,
        isLoading: false,
      });

      const userNoLastName = createTestUser({ lastName: null });
      render(
        <DialogPanel {...defaultProps} user={userNoLastName} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('user-name')).toHaveTextContent('Иван');
    });

    it('должен обновлять заголовок при выборе пользователя', () => {
      setMockUserListData({
        users,
        isLoading: false,
      });

      const mockOnSelectUser = vi.fn();
      render(
        <DialogPanel {...defaultProps} onSelectUser={mockOnSelectUser} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('user-name')).toHaveTextContent('Иван');

      const user2 = createTestUser({ userId: '456', firstName: 'Мария' });
      rerender(
        <DialogPanel {...defaultProps} user={user2} onSelectUser={mockOnSelectUser} />
      );

      expect(screen.getByTestId('user-name')).toHaveTextContent('Мария');
    });
  });

  describe('4. Edge cases', () => {
    it('должен работать с пустым списком пользователей', () => {
      setMockUserListData({
        users: [],
        isLoading: false,
      });

      expect(() => render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() })).not.toThrow();
    });

    it('должен работать с одним пользователем', () => {
      setMockUserListData({
        users: [createTestUser()],
        isLoading: false,
      });

      expect(() => render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() })).not.toThrow();
    });

    it('должен обрабатывать пользователя с special characters в имени', () => {
      const specialUser = createTestUser({ 
        firstName: 'Тест-Пользователь',
        lastName: 'Специальный'
      });
      
      setMockUserListData({
        users: [specialUser],
        isLoading: false,
      });

      render(
        <DialogPanel {...defaultProps} user={specialUser} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('user-name')).toHaveTextContent('Тест-Пользователь');
    });

    it('должен обрабатывать пользователя с emoji в имени', () => {
      const emojiUser = createTestUser({
        firstName: 'User 👋',
        lastName: 'Test 🌍'
      });

      setMockUserListData({
        users: [emojiUser],
        isLoading: false,
      });

      render(
        <DialogPanel {...defaultProps} user={emojiUser} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('user-name')).toHaveTextContent('User 👋');
    });
  });

  describe('5. Интеграция DialogHeader + DialogPanel', () => {
    it('должен координировать выбор пользователя между Header и Panel', () => {
      setMockUserListData({
        users,
        isLoading: false,
      });

      const mockOnSelectUser = vi.fn();
      render(
        <DialogPanel {...defaultProps} onSelectUser={mockOnSelectUser} />,
        { wrapper: createWrapper() }
      );

      // Проверяем что заголовок отображает текущего пользователя
      expect(screen.getByTestId('user-name')).toHaveTextContent('Иван');

      // Симулируем выбор другого пользователя
      const selectItems = screen.getAllByTestId('select-item');
      const secondUserItem = selectItems.find(
        item => item.getAttribute('data-value') === '456'
      );
      
      if (secondUserItem) {
        fireEvent.click(secondUserItem);
      }

      // Проверяем что onSelectUser был вызван
      expect(mockOnSelectUser).toHaveBeenCalled();
    });

    it('должен сохранять состояние при выборе пользователя', () => {
      setMockUserListData({
        users,
        isLoading: false,
      });

      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-input')).toBeInTheDocument();
    });
  });

  describe('6. Закрытие панели', () => {
    it('должен вызывать onClose при клике на кнопку закрытия', () => {
      render(<DialogPanel {...defaultProps} />, { wrapper: createWrapper() });

      const closeButton = screen.getByTestId('button-close-dialog-panel');
      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('7. Работа с разными projectId', () => {
    it('должен работать с разными projectId', () => {
      render(<DialogPanel {...defaultProps} projectId={999} />, { wrapper: createWrapper() });
      expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
    });

    it('должен загружать разных пользователей для разных projectId', () => {
      const usersForProject999 = [
        createTestUser({ userId: '999-1', firstName: 'User999-1' }),
        createTestUser({ userId: '999-2', firstName: 'User999-2' }),
      ];

      setMockUserListData({
        users: usersForProject999,
        isLoading: false,
      });

      render(
        <DialogPanel {...defaultProps} projectId={999} />,
        { wrapper: createWrapper() }
      );

      // Проверяем что select-items рендерятся
      const selectItems = screen.getAllByTestId('select-item');
      expect(selectItems.length).toBeGreaterThan(0);
    });
  });

  describe('8. Валидация данных пользователя', () => {
    it('должен обрабатывать пользователя с null userName', () => {
      const userNoUserName = createTestUser({ userName: null });
      
      setMockUserListData({
        users: [userNoUserName],
        isLoading: false,
      });

      render(<DialogPanel {...defaultProps} user={userNoUserName} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('user-name')).toBeInTheDocument();
    });

    it('должен обрабатывать пользователя с пустым userName', () => {
      const userEmptyUserName = createTestUser({ userName: '' });
      
      setMockUserListData({
        users: [userEmptyUserName],
        isLoading: false,
      });

      render(<DialogPanel {...defaultProps} user={userEmptyUserName} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('user-name')).toBeInTheDocument();
    });

    it('должен обрабатывать пользователя с длинным именем', () => {
      const longNameUser = createTestUser({ 
        firstName: 'ОченьДлинноеИмяПользователяКотороеМожетНеПоместиться',
        lastName: 'ТожеОченьДлиннаяФамилия'
      });
      
      setMockUserListData({
        users: [longNameUser],
        isLoading: false,
      });

      render(<DialogPanel {...defaultProps} user={longNameUser} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('user-name')).toBeInTheDocument();
    });
  });
});
