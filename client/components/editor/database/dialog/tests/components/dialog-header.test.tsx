/**
 * @fileoverview Тесты для компонента DialogHeader
 * Проверяет отображение заголовка диалога, селектора пользователей и кнопки закрытия
 * @module tests/components/dialog-header.test
 *
 * @description
 * Для тестирования React-компонентов используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/components/dialog-header.test.tsx
 */

/// <reference types="vitest/globals" />

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DialogHeader } from '../../components/dialog-header';
import type { UserBotData } from '@shared/schema';

// Мокируем UI компоненты
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, 'data-testid': dataTestId }: any) => (
    <button
      data-testid={dataTestId || 'button'}
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      className={className}
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

// Мокируем lucide-react иконки
vi.mock('lucide-react', () => ({
  X: ({ className }: any) => <svg data-testid="x-icon" className={className} />,
  MessageSquare: ({ className }: any) => <svg data-testid="message-square-icon" className={className} />,
  AlertTriangle: ({ className }: any) => <svg data-testid="alert-triangle-icon" className={className} />,
}));

/**
 * Создаёт тестового пользователя
 */
function createTestUser(overrides: Partial<UserBotData> = {}): UserBotData {
  return {
    userId: '123',
    firstName: 'Иван',
    lastName: 'Иванов',
    userName: 'ivanov',
    ...overrides,
  } as UserBotData;
}

/**
 * Функция форматирования имени для тестов
 */
function formatUserName(user: UserBotData): string {
  return `${user.firstName} ${user.lastName}`;
}

/**
 * Создаёт тестовый QueryClient
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

/**
 * Обёртка для тестирования с провайдерами
 */
function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}

describe('DialogHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    user: createTestUser(),
    users: [createTestUser(), createTestUser({ userId: '456', firstName: 'Петр', lastName: 'Петров' })],
    formatUserName,
    onSelectUser: vi.fn(),
    onClose: vi.fn(),
  };

  describe('Рендеринг заголовка', () => {
    it('должен рендерить иконку сообщения', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('message-square-icon')).toBeInTheDocument();
    });

    it('должен рендерить заголовок "Диалог"', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Диалог')).toBeInTheDocument();
    });

    it('должен рендерить WarningTooltip', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('должен применять стили к контейнеру', () => {
      const { container } = render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('flex');
      expect(outerDiv).toHaveClass('items-center');
      expect(outerDiv).toHaveClass('justify-between');
      expect(outerDiv).toHaveClass('gap-2');
      expect(outerDiv).toHaveClass('border-b');
    });

    it('должен применять стили к иконке', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      const icon = screen.getByTestId('message-square-icon');
      expect(icon).toHaveClass('w-3.5');
      expect(icon).toHaveClass('h-3.5');
      expect(icon).toHaveClass('text-white');
    });

    it('должен применять градиент к контейнеру иконки', () => {
      const { container } = render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toHaveClass('bg-gradient-to-br');
      expect(iconContainer).toHaveClass('from-blue-500');
      expect(iconContainer).toHaveClass('to-purple-500');
    });
  });

  describe('Селектор пользователей', () => {
    it('должен рендерить Select компонент', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('select')).toBeInTheDocument();
    });

    it('должен устанавливать значение текущего пользователя', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('select')).toHaveAttribute('data-value', '123');
    });

    it('должен рендерить SelectTrigger', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('select-trigger')).toBeInTheDocument();
    });

    it('должен рендерить SelectValue', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('select-value')).toBeInTheDocument();
    });

    it('должен рендерить SelectContent', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('select-content')).toBeInTheDocument();
    });

    it('должен рендерить SelectItem для каждого пользователя', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      const items = screen.getAllByTestId('select-item');
      expect(items).toHaveLength(2);
    });

    it('должен отображать имена пользователей в SelectItem', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
      expect(screen.getByText('Петр Петров')).toBeInTheDocument();
    });
  });

  describe('Кнопка закрытия', () => {
    it('должен рендерить кнопку закрытия', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('button-close-dialog-panel')).toBeInTheDocument();
    });

    it('должен рендерить иконку X в кнопке', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      const button = screen.getByTestId('button-close-dialog-panel');
      expect(button.querySelector('[data-testid="x-icon"]')).toBeInTheDocument();
    });

    it('должен вызывать onClose при клике', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      const button = screen.getByTestId('button-close-dialog-panel');
      fireEvent.click(button);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('должен применять стили к кнопке', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      const button = screen.getByTestId('button-close-dialog-panel');
      expect(button).toHaveAttribute('data-variant', 'ghost');
      expect(button).toHaveAttribute('data-size', 'icon');
    });

    it('должен иметь правильные размеры кнопки', () => {
      render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      const button = screen.getByTestId('button-close-dialog-panel');
      expect(button).toHaveClass('h-7');
      expect(button).toHaveClass('w-7');
      expect(button).toHaveClass('flex-shrink-0');
    });
  });

  describe('Обработка невалидных данных', () => {
    it('должен обрабатывать users не массив', () => {
      const props = {
        ...defaultProps,
        users: 'invalid' as any,
      };

      expect(() => render(<DialogHeader {...props} />, { wrapper: createWrapper() })).not.toThrow();
    });

    it('должен обрабатывать users null', () => {
      const props = {
        ...defaultProps,
        users: null as any,
      };

      expect(() => render(<DialogHeader {...props} />, { wrapper: createWrapper() })).not.toThrow();
    });

    it('должен обрабатывать users undefined', () => {
      const props = {
        ...defaultProps,
        users: undefined as any,
      };

      expect(() => render(<DialogHeader {...props} />, { wrapper: createWrapper() })).not.toThrow();
    });
  });

  describe('Flex контейнер для иконки и заголовка', () => {
    it('должен иметь flex контейнер для иконки и заголовка', () => {
      const { container } = render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      const flexContainer = container.querySelector('.min-w-0');
      expect(flexContainer).toBeInTheDocument();
    });

    it('должен иметь flex-1 для контейнера заголовка', () => {
      const { container } = render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      const headerContainer = container.querySelector('.flex-1');
      expect(headerContainer).toBeInTheDocument();
    });
  });

  describe('Заголовок h3', () => {
    it('должен рендерить h3 с классом font-medium', () => {
      const { container } = render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      const h3 = container.querySelector('h3');
      expect(h3).toHaveClass('font-medium');
    });

    it('должен иметь gap между заголовком и tooltip', () => {
      const { container } = render(<DialogHeader {...defaultProps} />, { wrapper: createWrapper() });

      const headerDiv = container.querySelector('.flex.items-center.gap-1\\.5');
      expect(headerDiv).toBeInTheDocument();
    });
  });
});
