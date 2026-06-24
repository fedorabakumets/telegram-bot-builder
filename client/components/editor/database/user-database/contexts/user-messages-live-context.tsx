/**
 * @fileoverview Контекст единого WebSocket-соединения для live-событий панели пользователей.
 * Одно соединение на всю панель — все подписчики получают события new-message и new-user.
 * @module client/components/editor/database/user-database/contexts/user-messages-live-context
 */

import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { subscribeSharedTerminalWs } from '@/lib/shared-terminal-ws';

/**
 * Структура события new-message из WebSocket
 */
export interface NewMessageLiveEvent {
  /** Тип события */
  type: 'new-message';
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена */
  tokenId?: number;
  /** Данные сообщения */
  data: {
    /** Идентификатор пользователя (строка) */
    userId: string;
    /** Тип сообщения: 'user' | 'bot' */
    messageType: string;
    /** Текст сообщения */
    messageText: string | null;
    /** Дополнительные данные */
    messageData: Record<string, unknown>;
    /** Идентификатор узла */
    nodeId?: string | null;
    /** Идентификатор записи в БД */
    id: number;
    /** Время создания в ISO-формате */
    createdAt: string;
    /** Telegram chat_id группового чата (null для личных сообщений) */
    chatId?: string | null;
    /** Тип чата: 'private', 'group', 'supergroup', 'channel' */
    chatType?: string | null;
  };
  /** Временная метка события */
  timestamp: string;
}

/**
 * Структура события new-user из WebSocket.
 * Публикуется Python-ботом при первом визите пользователя (INSERT, не UPDATE).
 */
export interface NewUserLiveEvent {
  /** Тип события */
  type: 'new-user';
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена */
  tokenId?: number;
  /** Данные нового пользователя */
  data: {
    /** Идентификатор пользователя в Telegram */
    userId: string;
    /** Username пользователя */
    username: string | null;
    /** Имя пользователя */
    firstName: string | null;
    /** Фамилия пользователя */
    lastName: string | null;
    /** URL аватарки */
    avatarUrl: string | null;
    /** Флаг бота */
    isBot: number;
    /** Флаг Premium */
    isPremium: number;
    /** Дата регистрации в ISO-формате */
    registeredAt: string;
    /** Параметр deep link при первом визите */
    deepLinkParam?: string | null;
    /** ID пользователя-реферера */
    referrerId?: string | null;
  };
  /** Временная метка события */
  timestamp: string;
}

/** Все типы live-событий */
export type LiveEvent = NewMessageLiveEvent | NewUserLiveEvent | BroadcastProgressLiveEvent | MessageDeletedLiveEvent | MessageEditedLiveEvent;

/**
 * Структура WS-события редактирования сообщения в диалоге
 */
export interface MessageEditedLiveEvent {
  /** Тип события */
  type: 'message-edited';
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена */
  tokenId?: number;
  /** Данные отредактированного сообщения */
  data: {
    /** Внутренний ID сообщения */
    messageId: number;
    /** Идентификатор пользователя (строка) */
    userId: string;
    /** Новый текст сообщения */
    messageText: string;
    /** Инлайн-кнопки сообщения (для live-обновления раскладки у всех клиентов) */
    buttons?: unknown[];
    /** Количество кнопок в одном ряду */
    buttonsPerRow?: number;
  };
  /** Временная метка события */
  timestamp: string;
}

/**
 * Структура WS-события удаления сообщения из диалога
 */
export interface MessageDeletedLiveEvent {
  /** Тип события */
  type: 'message-deleted';
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена */
  tokenId?: number;
  /** Данные удалённого сообщения */
  data: {
    /** Внутренний ID удалённого сообщения */
    messageId: number;
    /** Идентификатор пользователя (строка) */
    userId: string;
  };
  /** Временная метка события */
  timestamp: string;
}

/**
 * Структура WS-события прогресса рассылки
 */
export interface BroadcastProgressLiveEvent {
  /** Тип события */
  type: 'broadcast-progress';
  /** Идентификатор проекта */
  projectId: number;
  /** Данные прогресса */
  data: {
    /** Идентификатор рассылки */
    broadcastId: number;
    /** Отправлено сообщений */
    sentCount: number;
    /** Доставлено успешно */
    deliveredCount: number;
    /** Ошибок при отправке */
    failedCount: number;
    /** Всего получателей */
    totalCount: number;
    /** Текущий статус */
    status: 'running' | 'stopped' | 'done';
  };
  /** Временная метка события */
  timestamp: string;
}

/** Тип колбэка-подписчика на все live-события */
type LiveEventListener = (event: LiveEvent) => void;

/**
 * Значение контекста live-событий
 */
interface UserMessagesLiveContextValue {
  /**
   * Подписаться на входящие live-события (new-message и new-user).
   * @param listener - Функция-обработчик события
   * @returns Функция отписки
   */
  subscribe: (listener: LiveEventListener) => () => void;
}

const UserMessagesLiveContext = createContext<UserMessagesLiveContextValue | null>(null);

/**
 * Пропсы провайдера контекста live-событий
 */
interface UserMessagesLiveProviderProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Дочерние элементы */
  children: React.ReactNode;
}

/**
 * Провайдер единого WebSocket-соединения для live-событий.
 * Открывает одно WS-соединение и рассылает события new-message и new-user подписчикам.
 * @param props - Пропсы провайдера
 * @returns JSX провайдер контекста
 */
export function UserMessagesLiveProvider({ projectId, children }: UserMessagesLiveProviderProps) {
  const listenersRef = useRef<Set<LiveEventListener>>(new Set());

  useEffect(() => {
    const unsubscribe = subscribeSharedTerminalWs((raw) => {
      try {
        const msg = raw as LiveEvent;
        if (
          msg.type !== 'new-message' &&
          msg.type !== 'new-user' &&
          msg.type !== 'broadcast-progress' &&
          msg.type !== 'message-deleted' &&
          msg.type !== 'message-edited'
        ) {
          return;
        }
        if (msg.projectId !== projectId) return;
        listenersRef.current.forEach((fn) => fn(msg));
      } catch {
        // Игнорируем некорректные сообщения
      }
    });

    return unsubscribe;
  }, [projectId]);

  const subscribe = useCallback((listener: LiveEventListener): (() => void) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  return (
    <UserMessagesLiveContext.Provider value={{ subscribe }}>
      {children}
    </UserMessagesLiveContext.Provider>
  );
}

/**
 * Хук доступа к контексту live-событий.
 * Должен использоваться внутри UserMessagesLiveProvider.
 * @returns Значение контекста или null если провайдер не найден
 */
export function useUserMessagesLiveContext(): UserMessagesLiveContextValue | null {
  return useContext(UserMessagesLiveContext);
}
