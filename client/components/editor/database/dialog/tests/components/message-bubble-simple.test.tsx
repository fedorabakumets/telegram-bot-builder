/**
 * @fileoverview Тесты для компонента MessageBubble
 * Проверяет отображение сообщений разных типов
 * @module tests/components/message-bubble.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MessageBubble } from '../../components/message-bubble';
import type { BotMessageWithMedia } from '../../types';
import type { UserBotData } from '@shared/schema';

// Мокируем fetch
global.fetch = vi.fn();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

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
  } as UserBotData;
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
        />,
        { wrapper }
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
        />,
        { wrapper }
      );
      
      expect(screen.getByTestId('dialog-message-user-0')).toBeInTheDocument();
      expect(screen.getByText('User message')).toBeInTheDocument();
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
          projectId={1}
        />,
        { wrapper }
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
          projectId={1}
        />,
        { wrapper }
      );
      
      expect(screen.queryByText('Button')).not.toBeInTheDocument();
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
          projectId={1}
        />,
        { wrapper }
      );
      
      expect(screen.getByText(/Нажата:/)).toBeInTheDocument();
    });
  });
});
