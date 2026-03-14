/**
 * @fileoverview Тесты для компонента MessageBubble
 * Проверяет отображение сообщений разных типов
 * @module tests/components/message-bubble.test
 *
 * @description
 * Для тестирования требуется Vitest и @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/components/message-bubble.test.tsx
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../../components/message-bubble';
import type { BotMessageWithMedia } from '../../types';
import type { UserBotData } from '@shared/schema';

/**
 * Создаёт тестовое сообщение
 */
function createTestMessage(overrides: Partial<BotMessageWithMedia> = {}): BotMessageWithMedia {
  return {
    id: 1,
    createdAt: new Date('2024-03-14T10:30:00Z'),
    projectId: 1,
    userId: '123',
    messageType: 'bot',
    messageText: 'Test message',
    messageData: null,
    nodeId: null,
    primaryMediaId: null,
    ...overrides,
  };
}

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
  };
}

describe('MessageBubble', () => {
  describe('Отображение типов сообщений', () => {
    it('должен рендерить сообщение от бота', () => {
      const message = createTestMessage({ messageType: 'bot' });
      
      render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
          projectId={1}
        />
      );
      
      expect(screen.getByTestId('dialog-message-bot-0')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('должен рендерить сообщение от пользователя', () => {
      const message = createTestMessage({ 
        messageType: 'user',
        messageText: 'User message',
      });
      
      render(
        <MessageBubble
          message={message}
          index={0}
          user={createTestUser()}
          projectId={1}
        />
      );
      
      expect(screen.getByTestId('dialog-message-user-0')).toBeInTheDocument();
      expect(screen.getByText('User message')).toBeInTheDocument();
    });

    it('должен применять класс justify-end для сообщений пользователя', () => {
      const message = createTestMessage({ messageType: 'user' });
      
      const { container } = render(
        <MessageBubble
          message={message}
          index={0}
          user={createTestUser()}
        />
      );
      
      expect(container.querySelector('.justify-end')).toBeInTheDocument();
    });

    it('должен применять класс justify-start для сообщений бота', () => {
      const message = createTestMessage({ messageType: 'bot' });
      
      const { container } = render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      expect(container.querySelector('.justify-start')).toBeInTheDocument();
    });
  });

  describe('Форматирование текста', () => {
    it('должен отображать простой текст', () => {
      const message = createTestMessage({ messageText: 'Простой текст' });
      
      render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      expect(screen.getByText('Простой текст')).toBeInTheDocument();
    });

    it('должен отображать HTML-форматирование', () => {
      const message = createTestMessage({ 
        messageText: '<b>Жирный</b> <i>текст</i>',
      });
      
      render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      expect(screen.getByText('Жирный')).toHaveClass('font-bold');
      expect(screen.getByText('текст')).toHaveClass('italic');
    });

    it('должен обрабатывать null текст', () => {
      const message = createTestMessage({ messageText: null });
      
      const { container } = render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      // Компонент должен рендериться без ошибок
      expect(container).toBeInTheDocument();
    });

    it('должен обрабатывать пустую строку', () => {
      const message = createTestMessage({ messageText: '' });
      
      render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      // Компонент должен рендериться без ошибок
      expect(screen.getByTestId('dialog-message-bot-0')).toBeInTheDocument();
    });
  });

  describe('Кнопки', () => {
    it('должен отображать кнопки для бота', () => {
      const message = createTestMessage({
        messageType: 'bot',
        messageData: {
          buttons: [
            { text: 'Button 1' },
            { text: 'Button 2' },
          ],
        },
      } as any);
      
      render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
    });

    it('не должен отображать кнопки для пользователя', () => {
      const message = createTestMessage({
        messageType: 'user',
        messageData: {
          buttons: [{ text: 'Button' }],
        },
      } as any);
      
      render(
        <MessageBubble
          message={message}
          index={0}
          user={createTestUser()}
        />
      );
      
      expect(screen.queryByText('Button')).not.toBeInTheDocument();
    });

    it('не должен отображать кнопки если их нет', () => {
      const message = createTestMessage({
        messageType: 'bot',
        messageData: {},
      });
      
      render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      // Проверяем что нет кнопок
      const buttonsContainer = screen.queryByRole('group');
      expect(buttonsContainer).not.toBeInTheDocument();
    });
  });

  describe('Нажатие кнопок', () => {
    it('должен отображать информацию о нажатой кнопке для пользователя', () => {
      const message = createTestMessage({
        messageType: 'user',
        messageData: {
          button_clicked: true,
          button_text: 'Нажата кнопка',
        },
      } as any);
      
      render(
        <MessageBubble
          message={message}
          index={0}
          user={createTestUser()}
        />
      );
      
      expect(screen.getByText(/Нажата:/)).toBeInTheDocument();
      expect(screen.getByText(/Нажата кнопка/)).toBeInTheDocument();
    });

    it('не должен отображать информацию о кнопке если не нажата', () => {
      const message = createTestMessage({
        messageType: 'user',
        messageData: {
          button_clicked: false,
          button_text: 'Кнопка',
        },
      } as any);
      
      render(
        <MessageBubble
          message={message}
          index={0}
          user={createTestUser()}
        />
      );
      
      expect(screen.queryByText(/Нажата:/)).not.toBeInTheDocument();
    });

    it('не должен отображать информацию о кнопке для бота', () => {
      const message = createTestMessage({
        messageType: 'bot',
        messageData: {
          button_clicked: true,
          button_text: 'Кнопка бота',
        },
      } as any);
      
      render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      expect(screen.queryByText(/Нажата:/)).not.toBeInTheDocument();
    });
  });

  describe('Временная метка', () => {
    it('должен отображать время сообщения', () => {
      const message = createTestMessage({
        createdAt: new Date('2024-03-14T10:30:00Z'),
      });
      
      render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      // Проверяем что timestamp присутствует
      const timestamp = screen.getByTestId('message-timestamp');
      expect(timestamp).toBeInTheDocument();
    });

    it('должен обрабатывать null дату', () => {
      const message = createTestMessage({ createdAt: null });
      
      const { container } = render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      expect(container).toBeInTheDocument();
    });
  });

  describe('Аватар', () => {
    it('должен отображать аватар бота', () => {
      const message = createTestMessage({ messageType: 'bot' });
      const bot = createTestUser();
      
      render(
        <MessageBubble
          message={message}
          index={0}
          bot={bot}
          projectId={1}
        />
      );
      
      // Проверяем что аватар присутствует
      const avatar = screen.getByTestId('message-avatar');
      expect(avatar).toBeInTheDocument();
    });

    it('должен отображать аватар пользователя', () => {
      const message = createTestMessage({ messageType: 'user' });
      const user = createTestUser();
      
      render(
        <MessageBubble
          message={message}
          index={0}
          user={user}
          projectId={1}
        />
      );
      
      const avatar = screen.getByTestId('message-avatar');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Медиа', () => {
    it('должен отображать медиа если присутствует', () => {
      const message = createTestMessage({
        media: [
          {
            id: 1,
            url: 'https://example.com/image.jpg',
            type: 'photo',
          },
        ],
      });
      
      render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('не должен отображать медиа контейнер если медиа нет', () => {
      const message = createTestMessage({ media: undefined });
      
      render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      // Проверяем что нет img элементов
      const images = screen.queryAllByRole('img');
      expect(images).toHaveLength(0);
    });
  });

  describe('Структура DOM', () => {
    it('должен иметь правильную структуру с flex-контейнером', () => {
      const message = createTestMessage();
      
      const { container } = render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      // Проверяем наличие flex-контейнера
      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toBeInTheDocument();
    });

    it('должен иметь gap между элементами', () => {
      const message = createTestMessage();
      
      const { container } = render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      expect(container.querySelector('.gap-2')).toBeInTheDocument();
    });

    it('должен ограничивать ширину сообщения', () => {
      const message = createTestMessage();
      
      const { container } = render(
        <MessageBubble
          message={message}
          index={0}
          bot={createTestUser()}
        />
      );
      
      expect(container.querySelector('.max-w-\\[85\\%\\]')).toBeInTheDocument();
    });
  });
});
