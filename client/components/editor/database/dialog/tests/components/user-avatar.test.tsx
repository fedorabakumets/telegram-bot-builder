/**
 * @fileoverview Тесты для компонента UserAvatar
 * Проверяет отображение аватара пользователя и бота
 * @module tests/components/user-avatar.test
 *
 * @description
 * Для тестирования React-компонентов используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/components/user-avatar.test.tsx
 */

/// <reference types="vitest/globals" />

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserAvatar } from '../../components/user-avatar';
import type { UserBotData } from '@shared/schema';

// Мокируем lucide-react иконки
vi.mock('lucide-react', () => ({
  Bot: ({ className, style }: any) => (
    <svg data-testid="bot-icon" className={className} style={style} />
  ),
  User: ({ className, style }: any) => (
    <svg data-testid="user-icon" className={className} style={style} />
  ),
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
    avatarUrl: null,
    ...overrides,
  } as UserBotData;
}

describe('UserAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Аватар бота', () => {
    describe('Бот с аватаркой', () => {
      it('должен рендерить img для бота с avatarUrl', () => {
        const bot = createTestUser({ avatarUrl: '/path/to/avatar.jpg' });
        render(<UserAvatar messageType="bot" user={bot} projectId={1} />);

        const img = screen.getByRole('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', '/api/projects/1/users/123/avatar');
        expect(img).toHaveAttribute('alt', 'Bot avatar');
      });

      it('должен применять стили к img бота', () => {
        const bot = createTestUser({ avatarUrl: '/path/to/avatar.jpg' });
        render(<UserAvatar messageType="bot" user={bot} projectId={1} />);

        const img = screen.getByRole('img');
        expect(img).toHaveClass('flex-shrink-0');
        expect(img).toHaveClass('rounded-full');
        expect(img).toHaveClass('object-cover');
      });

      it('должен использовать размер по умолчанию 28px', () => {
        const bot = createTestUser({ avatarUrl: '/path/to/avatar.jpg' });
        render(<UserAvatar messageType="bot" user={bot} projectId={1} />);

        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('style', expect.stringContaining('width: 28px'));
        expect(img).toHaveAttribute('style', expect.stringContaining('height: 28px'));
      });

      it('должен использовать кастомный размер', () => {
        const bot = createTestUser({ avatarUrl: '/path/to/avatar.jpg' });
        render(<UserAvatar messageType="bot" user={bot} projectId={1} size={50} />);

        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('style', expect.stringContaining('width: 50px'));
        expect(img).toHaveAttribute('style', expect.stringContaining('height: 50px'));
      });

      it('должен обрабатывать ошибку загрузки изображения', () => {
        const bot = createTestUser({ avatarUrl: '/path/to/avatar.jpg' });
        render(<UserAvatar messageType="bot" user={bot} projectId={1} />);

        const img = screen.getByRole('img');
        fireEvent.error(img);

        // После ошибки должно показываться fallback иконка
        expect(screen.getByTestId('bot-icon')).toBeInTheDocument();
      });

      it('не должен рендерить img если нет projectId', () => {
        const bot = createTestUser({ avatarUrl: '/path/to/avatar.jpg' });
        render(<UserAvatar messageType="bot" user={bot} />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByTestId('bot-icon')).toBeInTheDocument();
      });

      it('не должен рендерить img если нет userId', () => {
        const bot = createTestUser({ avatarUrl: '/path/to/avatar.jpg', userId: undefined });
        render(<UserAvatar messageType="bot" user={bot as any} projectId={1} />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByTestId('bot-icon')).toBeInTheDocument();
      });

      it('не должен рендерить img если avatarUrl пустой', () => {
        const bot = createTestUser({ avatarUrl: '' });
        render(<UserAvatar messageType="bot" user={bot} projectId={1} />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByTestId('bot-icon')).toBeInTheDocument();
      });
    });

    describe('Бот без аватарки', () => {
      it('должен рендерить иконку бота по умолчанию', () => {
        const bot = createTestUser({ avatarUrl: null });
        render(<UserAvatar messageType="bot" user={bot} />);

        expect(screen.getByTestId('bot-icon')).toBeInTheDocument();
      });

      it('должен применять стили к контейнеру иконки бота', () => {
        const bot = createTestUser({ avatarUrl: null });
        const { container } = render(<UserAvatar messageType="bot" user={bot} />);

        const iconContainer = container.firstChild as HTMLElement;
        expect(iconContainer).toHaveClass('flex-shrink-0');
        expect(iconContainer).toHaveClass('rounded-full');
        expect(iconContainer).toHaveClass('bg-blue-100');
        expect(iconContainer).toHaveClass('dark:bg-blue-900');
        expect(iconContainer).toHaveClass('flex');
        expect(iconContainer).toHaveClass('items-center');
        expect(iconContainer).toHaveClass('justify-center');
      });

      it('должен применять стили к иконке бота', () => {
        const bot = createTestUser({ avatarUrl: null });
        render(<UserAvatar messageType="bot" user={bot} />);

        const icon = screen.getByTestId('bot-icon');
        expect(icon).toHaveClass('text-blue-600');
        expect(icon).toHaveClass('dark:text-blue-400');
      });

      it('должен вычислять размер иконки как 50% от размера контейнера', () => {
        const bot = createTestUser({ avatarUrl: null });
        render(<UserAvatar messageType="bot" user={bot} size={40} />);

        const icon = screen.getByTestId('bot-icon');
        expect(icon).toHaveAttribute('style', expect.stringContaining('width: 20px'));
        expect(icon).toHaveAttribute('style', expect.stringContaining('height: 20px'));
      });
    });
  });

  describe('Аватар пользователя', () => {
    describe('Пользователь с аватаркой', () => {
      it('должен рендерить img для пользователя с avatarUrl', () => {
        const user = createTestUser({ avatarUrl: '/path/to/user-avatar.jpg' });
        render(<UserAvatar messageType="user" user={user} projectId={1} />);

        const img = screen.getByRole('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', '/api/projects/1/users/123/avatar');
        expect(img).toHaveAttribute('alt', 'User avatar');
      });

      it('должен применять стили к img пользователя', () => {
        const user = createTestUser({ avatarUrl: '/path/to/user-avatar.jpg' });
        render(<UserAvatar messageType="user" user={user} projectId={1} />);

        const img = screen.getByRole('img');
        expect(img).toHaveClass('flex-shrink-0');
        expect(img).toHaveClass('rounded-full');
        expect(img).toHaveClass('object-cover');
      });

      it('должен обрабатывать ошибку загрузки изображения пользователя', () => {
        const user = createTestUser({ avatarUrl: '/path/to/user-avatar.jpg' });
        render(<UserAvatar messageType="user" user={user} projectId={1} />);

        const img = screen.getByRole('img');
        fireEvent.error(img);

        // После ошибки должно показываться fallback иконка
        expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      });

      it('не должен рендерить img если нет projectId', () => {
        const user = createTestUser({ avatarUrl: '/path/to/user-avatar.jpg' });
        render(<UserAvatar messageType="user" user={user} />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      });

      it('не должен рендерить img если нет userId', () => {
        const user = createTestUser({ avatarUrl: '/path/to/user-avatar.jpg', userId: undefined });
        render(<UserAvatar messageType="user" user={user as any} projectId={1} />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      });
    });

    describe('Пользователь без аватарки', () => {
      it('должен рендерить иконку пользователя по умолчанию', () => {
        const user = createTestUser({ avatarUrl: null });
        render(<UserAvatar messageType="user" user={user} />);

        expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      });

      it('должен применять стили к контейнеру иконки пользователя', () => {
        const user = createTestUser({ avatarUrl: null });
        const { container } = render(<UserAvatar messageType="user" user={user} />);

        const iconContainer = container.firstChild as HTMLElement;
        expect(iconContainer).toHaveClass('flex-shrink-0');
        expect(iconContainer).toHaveClass('rounded-full');
        expect(iconContainer).toHaveClass('bg-green-100');
        expect(iconContainer).toHaveClass('dark:bg-green-900');
        expect(iconContainer).toHaveClass('flex');
        expect(iconContainer).toHaveClass('items-center');
        expect(iconContainer).toHaveClass('justify-center');
      });

      it('должен применять стили к иконке пользователя', () => {
        const user = createTestUser({ avatarUrl: null });
        render(<UserAvatar messageType="user" user={user} />);

        const icon = screen.getByTestId('user-icon');
        expect(icon).toHaveClass('text-green-600');
        expect(icon).toHaveClass('dark:text-green-400');
      });

      it('должен вычислять размер иконки как 50% от размера контейнера', () => {
        const user = createTestUser({ avatarUrl: null });
        render(<UserAvatar messageType="user" user={user} size={40} />);

        const icon = screen.getByTestId('user-icon');
        expect(icon).toHaveAttribute('style', expect.stringContaining('width: 20px'));
        expect(icon).toHaveAttribute('style', expect.stringContaining('height: 20px'));
      });
    });
  });

  describe('Размер по умолчанию', () => {
    it('должен использовать размер 28px по умолчанию для бота', () => {
      const bot = createTestUser({ avatarUrl: null });
      const { container } = render(<UserAvatar messageType="bot" user={bot} />);

      const iconContainer = container.firstChild as HTMLElement;
      expect(iconContainer).toHaveAttribute('style', expect.stringContaining('width: 28px'));
      expect(iconContainer).toHaveAttribute('style', expect.stringContaining('height: 28px'));
    });

    it('должен использовать размер 28px по умолчанию для пользователя', () => {
      const user = createTestUser({ avatarUrl: null });
      const { container } = render(<UserAvatar messageType="user" user={user} />);

      const iconContainer = container.firstChild as HTMLElement;
      expect(iconContainer).toHaveAttribute('style', expect.stringContaining('width: 28px'));
      expect(iconContainer).toHaveAttribute('style', expect.stringContaining('height: 28px'));
    });
  });

  describe('Отсутствие пользователя', () => {
    it('должен рендерить иконку бота когда user не передан для messageType="bot"', () => {
      render(<UserAvatar messageType="bot" />);

      expect(screen.getByTestId('bot-icon')).toBeInTheDocument();
    });

    it('должен рендерить иконку пользователя когда user не передан для messageType="user"', () => {
      render(<UserAvatar messageType="user" />);

      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('должен рендерить иконку бота когда user=null для messageType="bot"', () => {
      render(<UserAvatar messageType="bot" user={null} />);

      expect(screen.getByTestId('bot-icon')).toBeInTheDocument();
    });

    it('должен рендерить иконку пользователя когда user=null для messageType="user"', () => {
      render(<UserAvatar messageType="user" user={null} />);

      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });
  });
});
