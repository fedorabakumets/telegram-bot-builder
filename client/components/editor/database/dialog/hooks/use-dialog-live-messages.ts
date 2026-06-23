/**
 * @fileoverview Хук подписки на живые сообщения диалога.
 * Использует контекст UserMessagesLiveProvider если доступен,
 * иначе открывает собственное WS-соединение (fallback).
 * @module client/components/editor/database/dialog/hooks/use-dialog-live-messages
 */

import { useEffect, useState, useCallback } from 'react';
import { BotMessageWithMedia } from '../types';
import {
  useUserMessagesLiveContext,
  NewMessageLiveEvent,
  MessageDeletedLiveEvent,
  MessageEditedLiveEvent,
} from '@/components/editor/database/user-database/contexts/user-messages-live-context';
import { subscribeSharedTerminalWs } from '@/lib/shared-terminal-ws';

/**
 * Результат хука useDialogLiveMessages
 */
export interface UseDialogLiveMessagesResult {
  /** Массив живых сообщений из WebSocket и оптимистичных */
  liveMessages: BotMessageWithMedia[];
  /** Сбрасывает накопленные live-сообщения (при смене пользователя) */
  resetLiveMessages: () => void;
  /** Добавляет оптимистичное сообщение в список */
  addOptimisticMessage: (msg: BotMessageWithMedia) => void;
  /** Удаляет оптимистичное сообщение по временному id (откат при ошибке) */
  removeOptimisticMessage: (tempId: number) => void;
  /** ID сообщений удалённых через WS другим оператором */
  wsDeletedIds: Set<number>;
  /** Карта отредактированных через WS сообщений: messageId → новый текст, кнопки и раскладка */
  wsEditedMessages: Map<number, { messageText: string; buttons?: unknown[]; buttonsPerRow?: number }>;
}

/**
 * Преобразует событие new-message в формат BotMessageWithMedia
 * @param event - Событие из WebSocket
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @returns Объект сообщения в формате BotMessageWithMedia
 */
function eventToMessage(
  event: NewMessageLiveEvent,
  projectId: number,
  tokenId?: number | null,
): BotMessageWithMedia {
  return {
    id: event.data.id,
    projectId,
    tokenId: tokenId ?? event.tokenId ?? 0,
    userId: event.data.userId,
    messageType: event.data.messageType,
    messageText: event.data.messageText ?? null,
    messageData: event.data.messageData ?? {},
    nodeId: event.data.nodeId ?? null,
    primaryMediaId: null,
    createdAt: new Date(event.data.createdAt),
    media: [],
  } as BotMessageWithMedia;
}

/**
 * Хук подписки на живые сообщения диалога.
 * Если доступен UserMessagesLiveProvider — переиспользует его WS-соединение.
 * Иначе открывает собственное соединение (для диалога вне панели пользователей).
 *
 * @param projectId - Идентификатор проекта
 * @param selectedTokenId - Идентификатор выбранного токена (фильтр)
 * @param userId - Идентификатор пользователя (строка или число)
 * @param chatId - Telegram chat_id группы (для групповых диалогов)
 * @returns Объект с live-сообщениями и функциями управления
 */
export function useDialogLiveMessages(
  projectId: number,
  selectedTokenId?: number | null,
  userId?: string | number | null,
  chatId?: string | null,
): UseDialogLiveMessagesResult {
  const [liveMessages, setLiveMessages] = useState<BotMessageWithMedia[]>([]);
  /** ID сообщений удалённых через WS другим оператором */
  const [wsDeletedIds, setWsDeletedIds] = useState<Set<number>>(new Set());
  /** Карта отредактированных через WS сообщений: messageId → новый текст, кнопки и раскладка */
  const [wsEditedMessages, setWsEditedMessages] = useState<Map<number, { messageText: string; buttons?: unknown[]; buttonsPerRow?: number }>>(new Map());

  /** Контекст провайдера — null если диалог рендерится вне UserMessagesLiveProvider */
  const liveContext = useUserMessagesLiveContext();

  /** Сбрасывает накопленные live-сообщения */
  const resetLiveMessages = useCallback(() => {
    setLiveMessages([]);
    setWsDeletedIds(new Set());
    setWsEditedMessages(new Map());
  }, []);

  /**
   * Добавляет оптимистичное сообщение (отрицательный id).
   * @param msg - Оптимистичное сообщение
   */
  const addOptimisticMessage = useCallback((msg: BotMessageWithMedia) => {
    setLiveMessages((prev) => [...prev, msg]);
  }, []);

  /**
   * Удаляет оптимистичное сообщение по временному id.
   * @param tempId - Временный отрицательный id
   */
  const removeOptimisticMessage = useCallback((tempId: number) => {
    setLiveMessages((prev) => prev.filter((m) => m.id !== tempId));
  }, []);

  // Режим контекста: подписываемся через UserMessagesLiveProvider, WS не открываем
  useEffect(() => {
    if (!userId || liveContext === null) return;

    const userIdStr = String(userId);

    const unsubscribe = liveContext.subscribe((msg) => {
      // Обрабатываем событие удаления сообщения
      if (msg.type === 'message-deleted') {
        const deleted = msg as MessageDeletedLiveEvent;
        if (selectedTokenId && msg.tokenId && msg.tokenId !== selectedTokenId) return;
        if (String(deleted.data.userId) !== userIdStr) return;
        const deletedId = deleted.data.messageId;
        setLiveMessages((prev) => prev.filter((m) => m.id !== deletedId));
        setWsDeletedIds((prev) => new Set(prev).add(deletedId));
        return;
      }
      // Обрабатываем событие редактирования сообщения
      if (msg.type === 'message-edited') {
        const edited = msg as MessageEditedLiveEvent;
        if (selectedTokenId && msg.tokenId && msg.tokenId !== selectedTokenId) return;
        if (String(edited.data.userId) !== userIdStr) return;
        setWsEditedMessages((prev) => new Map(prev).set(edited.data.messageId, {
          messageText: edited.data.messageText,
          buttons: edited.data.buttons,
          buttonsPerRow: edited.data.buttonsPerRow,
        }));
        return;
      }
      // Обрабатываем только события new-message, new-user игнорируем
      if (msg.type !== 'new-message') return;
      if (selectedTokenId && msg.tokenId && msg.tokenId !== selectedTokenId) return;

      // Для группового диалога — фильтруем по chatId, для личного — по userId
      if (chatId) {
        if (msg.data?.chatId !== chatId) return;
      } else {
        if (String(msg.data?.userId) !== userIdStr) return;
      }

      const newMsg = eventToMessage(msg, projectId, selectedTokenId);
      setLiveMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        const optimisticIndex = prev.findIndex(
          (m) => m.id < 0 && m.messageType === newMsg.messageType &&
            (m.messageText === newMsg.messageText || !m.messageText || !newMsg.messageText),
        );
        if (optimisticIndex !== -1) {
          const updated = [...prev];
          updated[optimisticIndex] = newMsg;
          return updated;
        }
        return [...prev, newMsg];
      });
    });

    return unsubscribe;
  }, [projectId, selectedTokenId, userId, chatId, liveContext]);

  // Режим fallback: общее WS-соединение если контекст недоступен
  useEffect(() => {
    if (!userId || liveContext !== null) return;

    const userIdStr = String(userId);

    const unsubscribe = subscribeSharedTerminalWs((raw) => {
      try {
        const msg = raw as { type: string; projectId: number; tokenId?: number; data?: unknown; timestamp: string };
        if (msg.projectId !== projectId) return;

        // Обрабатываем событие удаления сообщения
        if (msg.type === 'message-deleted') {
          const data = msg.data as { messageId: number; userId: string } | undefined;
          if (!data) return;
          if (selectedTokenId && msg.tokenId && msg.tokenId !== selectedTokenId) return;
          if (String(data.userId) !== userIdStr) return;
          setLiveMessages((prev) => prev.filter((m) => m.id !== data.messageId));
          setWsDeletedIds((prev) => new Set(prev).add(data.messageId));
          return;
        }

        // Обрабатываем событие редактирования сообщения
        if (msg.type === 'message-edited') {
          const data = msg.data as { messageId: number; userId: string; messageText: string; buttons?: unknown[]; buttonsPerRow?: number } | undefined;
          if (!data) return;
          if (selectedTokenId && msg.tokenId && msg.tokenId !== selectedTokenId) return;
          if (String(data.userId) !== userIdStr) return;
          setWsEditedMessages((prev) => new Map(prev).set(data.messageId, {
            messageText: data.messageText,
            buttons: data.buttons,
            buttonsPerRow: data.buttonsPerRow,
          }));
          return;
        }

        if (msg.type !== 'new-message') return;
        if (selectedTokenId && msg.tokenId && msg.tokenId !== selectedTokenId) return;

        // Для группового диалога — фильтруем по chatId, для личного — по userId
        if (chatId) {
          if ((msg.data as { chatId?: string })?.chatId !== chatId) return;
        } else {
          if (String((msg.data as { userId?: string })?.userId) !== userIdStr) return;
        }

        const newMsg = eventToMessage(msg as NewMessageLiveEvent, projectId, selectedTokenId);
        setLiveMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const optimisticIndex = prev.findIndex(
            (m) => m.id < 0 && m.messageType === newMsg.messageType &&
              (m.messageText === newMsg.messageText || !m.messageText || !newMsg.messageText),
          );
          if (optimisticIndex !== -1) {
            const updated = [...prev];
            updated[optimisticIndex] = newMsg;
            return updated;
          }
          return [...prev, newMsg];
        });
      } catch {
        // Игнорируем некорректные сообщения
      }
    });

    return unsubscribe;
  }, [projectId, selectedTokenId, userId, chatId, liveContext]);

  return { liveMessages, resetLiveMessages, addOptimisticMessage, removeOptimisticMessage, wsDeletedIds, wsEditedMessages };
}
