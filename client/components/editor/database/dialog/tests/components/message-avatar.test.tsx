/**
 * @fileoverview Тесты для компонента MessageAvatar
 * Проверяет делегирование UserAvatar
 * @module tests/components/message-avatar.test
 */

/// <reference types="vitest/globals" />

import { render } from '@testing-library/react';
import { MessageAvatar } from '../../components/message-avatar';

describe('MessageAvatar', () => {
  describe('Рендеринг аватара', () => {
    it('должен рендерить контейнер с иконкой бота', () => {
      const bot = {
        userId: 'bot123',
        firstName: 'Bot',
        lastName: null,
        userName: null,
      };

      const { container } = render(
        <MessageAvatar
          messageType="bot"
          bot={bot}
          user={null}
          projectId={1}
        />
      );

      // MessageAvatar делегирует UserAvatar, который рендерит иконку Bot
      expect(container.querySelector('.lucide-bot')).toBeInTheDocument();
    });

    it('должен рендерить контейнер с иконкой пользователя', () => {
      const user = {
        userId: 'user123',
        firstName: 'User',
        lastName: null,
        userName: null,
      };

      const { container } = render(
        <MessageAvatar
          messageType="user"
          user={user}
          bot={null}
          projectId={1}
        />
      );

      // MessageAvatar делегирует UserAvatar, который рендерит иконку User
      expect(container.querySelector('.lucide-user')).toBeInTheDocument();
    });
  });

  describe('Выбор данных для аватара', () => {
    it('должен использовать синий контейнер для бота', () => {
      const bot = {
        userId: 'bot123',
        firstName: 'Bot',
        lastName: null,
        userName: null,
      };
      const user = {
        userId: 'user123',
        firstName: 'User',
        lastName: null,
        userName: null,
      };

      const { container } = render(
        <MessageAvatar
          messageType="bot"
          bot={bot}
          user={user}
          projectId={1}
        />
      );

      // Должен использовать bot (синий контейнер)
      expect(container.querySelector('.bg-blue-100')).toBeInTheDocument();
    });

    it('должен использовать зелёный контейнер для пользователя', () => {
      const bot = {
        userId: 'bot123',
        firstName: 'Bot',
        lastName: null,
        userName: null,
      };
      const user = {
        userId: 'user123',
        firstName: 'User',
        lastName: null,
        userName: null,
      };

      const { container } = render(
        <MessageAvatar
          messageType="user"
          user={user}
          bot={bot}
          projectId={1}
        />
      );

      // Должен использовать user (зелёный контейнер)
      expect(container.querySelector('.bg-green-100')).toBeInTheDocument();
    });
  });

  describe('Обработка отсутствующих данных', () => {
    it('должен рендерить аватар бота с null user', () => {
      const { container } = render(
        <MessageAvatar
          messageType="bot"
          bot={{ userId: 'bot123', firstName: 'Bot', lastName: null, userName: null }}
          user={null}
          projectId={1}
        />
      );

      expect(container.querySelector('.lucide-bot')).toBeInTheDocument();
    });

    it('должен рендерить аватар пользователя с null bot', () => {
      const { container } = render(
        <MessageAvatar
          messageType="user"
          user={{ userId: 'user123', firstName: 'User', lastName: null, userName: null }}
          bot={null}
          projectId={1}
        />
      );

      expect(container.querySelector('.lucide-user')).toBeInTheDocument();
    });
  });

  describe('Стили и размеры', () => {
    it('должен применять классы для контейнера', () => {
      const { container } = render(
        <MessageAvatar
          messageType="bot"
          bot={{ userId: 'bot123', firstName: 'Bot', lastName: null, userName: null }}
          user={null}
          projectId={1}
        />
      );

      const avatarContainer = container.querySelector('.rounded-full');
      expect(avatarContainer).toHaveClass('flex-shrink-0');
      expect(avatarContainer).toHaveClass('rounded-full');
      expect(avatarContainer).toHaveClass('bg-blue-100');
      expect(avatarContainer).toHaveClass('flex');
      expect(avatarContainer).toHaveClass('items-center');
      expect(avatarContainer).toHaveClass('justify-center');
    });

    it('должен использовать размер по умолчанию 28px', () => {
      const { container } = render(
        <MessageAvatar
          messageType="bot"
          bot={{ userId: 'bot123', firstName: 'Bot', lastName: null, userName: null }}
          user={null}
          projectId={1}
        />
      );

      const avatarContainer = container.querySelector('.rounded-full');
      expect(avatarContainer).toHaveStyle('width: 28px');
      expect(avatarContainer).toHaveStyle('height: 28px');
    });

    it('должен использовать размер иконки 14px (50% от размера контейнера)', () => {
      const { container } = render(
        <MessageAvatar
          messageType="bot"
          bot={{ userId: 'bot123', firstName: 'Bot', lastName: null, userName: null }}
          user={null}
          projectId={1}
        />
      );

      const icon = container.querySelector('.lucide-bot');
      expect(icon).toHaveStyle('width: 14px');
      expect(icon).toHaveStyle('height: 14px');
    });
  });
});
