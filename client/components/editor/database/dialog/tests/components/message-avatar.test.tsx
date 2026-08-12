/**
 * @fileoverview Тесты для компонента MessageAvatar
 * Проверяет делегирование UserAvatar
 * @module tests/components/message-avatar.test
 */

/// <reference types="vitest/globals" />

import { render, screen } from '@testing-library/react';
import { MessageAvatar } from '../../components/message-avatar';

describe('MessageAvatar', () => {
  describe('Рендеринг аватара', () => {
    it('должен рендерить img бота через /users/bot/avatar', () => {
      const bot = {
        userId: 'bot123',
        firstName: 'Bot',
        lastName: null,
        userName: null,
      };

      render(
        <MessageAvatar
          messageType="bot"
          bot={bot}
          user={null}
          projectId={1}
          tokenId={7}
        />,
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/api/projects/1/users/bot/avatar?tokenId=7');
      expect(img).toHaveAttribute('alt', 'Bot avatar');
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
        />,
      );

      // Без успешной загрузки img — fallback User (в jsdom img не грузится, но src есть)
      expect(container.querySelector('img') || container.querySelector('.lucide-user')).toBeTruthy();
    });
  });

  describe('Выбор данных для аватара', () => {
    it('должен показывать аватар бота даже если передан user', () => {
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

      render(
        <MessageAvatar
          messageType="bot"
          bot={bot}
          user={user}
          projectId={1}
        />,
      );

      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Bot avatar');
    });

    it('должен использовать зелёный контейнер для пользователя без projectId', () => {
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
        />,
      );

      expect(container.querySelector('.bg-green-100')).toBeInTheDocument();
    });
  });

  describe('Обработка отсутствующих данных', () => {
    it('должен рендерить img бота без bot-данных (достаточно projectId)', () => {
      render(
        <MessageAvatar
          messageType="bot"
          bot={null}
          user={null}
          projectId={1}
        />,
      );

      expect(screen.getByRole('img')).toHaveAttribute('src', '/api/projects/1/users/bot/avatar');
    });

    it('должен рендерить аватар пользователя с null bot', () => {
      const { container } = render(
        <MessageAvatar
          messageType="user"
          user={{ userId: 'user123', firstName: 'User', lastName: null, userName: null }}
          bot={null}
        />,
      );

      expect(container.querySelector('.lucide-user')).toBeInTheDocument();
    });
  });

  describe('Стили и размеры', () => {
    it('должен применять классы к img бота', () => {
      render(
        <MessageAvatar
          messageType="bot"
          bot={{ userId: 'bot123', firstName: 'Bot', lastName: null, userName: null }}
          user={null}
          projectId={1}
        />,
      );

      const img = screen.getByRole('img');
      expect(img).toHaveClass('flex-shrink-0');
      expect(img).toHaveClass('rounded-full');
      expect(img).toHaveClass('object-cover');
    });

    it('должен использовать размер по умолчанию 28px', () => {
      render(
        <MessageAvatar
          messageType="bot"
          bot={{ userId: 'bot123', firstName: 'Bot', lastName: null, userName: null }}
          user={null}
          projectId={1}
        />,
      );

      const img = screen.getByRole('img');
      expect(img).toHaveStyle('width: 28px');
      expect(img).toHaveStyle('height: 28px');
    });

    it('должен показывать иконку бота без projectId', () => {
      const { container } = render(
        <MessageAvatar
          messageType="bot"
          bot={{ userId: 'bot123', firstName: 'Bot', lastName: null, userName: null }}
          user={null}
        />,
      );

      const icon = container.querySelector('.lucide-bot');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveStyle('width: 14px');
      expect(icon).toHaveStyle('height: 14px');
    });
  });
});
