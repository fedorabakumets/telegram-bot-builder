/**
 * @fileoverview Хук подписки на живые сообщения диалога.
 * Использует контекст UserMessagesLiveProvider если доступен,
 * иначе открывает собственное WS-соединение (fallback).
 * @module client/components/editor/database/dialog/hooks/use-dialog-live-messages
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { BotMessageWithMedia } from '../types';
import {
  useUserMessagesLiveContext,
  NewMessageLiveEvent,
  MessageDeletedLiveEvent,
} from '@/components/editor/database/user-database/contexts/user-messages-live-context';

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
 * @returns Объект с live-сообщениями и функциями управления
 */
export function useDialogLiveMessages(
  projectId: number,
  selectedTokenId?: number | null,
  userId?: string | number | null,
): UseDialogLiveMessagesResult {
  const [liveMessages, setLiveMessages] = useState<BotMessageWithMedia[]>([]);
  /** ID сообщений удалённых через WS другим оператором */
  const [wsDeletedIds, setWsDeletedIds] = useState<Set<number>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Контекст провайдера — null если диалог рендерится вне UserMessagesLiveProvider */
  const liveContext = useUserMessagesLiveContext();

  /** Сбрасывает накопленные live-сообщения */
  const resetLiveMessages = useCallback(() => {
    setLiveMessages([]);
    setWsDeletedIds(new Set());
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
      // Обрабатываем только события new-message, new-user игнорируем
      if (msg.type !== 'new-message') return;
      if (selectedTokenId && msg.tokenId && msg.tokenId !== selectedTokenId) return;
      if (String(msg.data?.userId) !== userIdStr) return;

      const newMsg = eventToMessage(msg, projectId, selectedTokenId);
      setLiveMessages((prev) => {
        // Уже есть — пропускаем дубль
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        // Есть оптимистичное сообщение (отрицательный id) того же типа —
        // заменяем его реальным (сравниваем по тексту или просто берём первое оптимистичное того же типа)
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
  }, [projectId, selectedTokenId, userId, liveContext]);

  // Режим fallback: собственное WS-соединение если контекст недоступен
  useEffect(() => {
    if (!userId || liveContext !== null) return;

    let destroyed = false;
    const userIdStr = String(userId);

    const connect = () => {
      if (destroyed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/api/terminal?projectId=0&tokenId=0`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; projectId: number; tokenId?: number; data?: unknown; timestamp: string };
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

          if (msg.type !== 'new-message') return;
          if (selectedTokenId && msg.tokenId && msg.tokenId !== selectedTokenId) return;
          if (String(msg.data?.userId) !== userIdStr) return;

          const newMsg = eventToMessage(msg as NewMessageLiveEvent, projectId, selectedTokenId);
          setLiveMessages((prev) => {
            // Уже есть — пропускаем дубль
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            // Есть оптимистичное сообщение (отрицательный id) того же типа —
            // заменяем его реальным
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
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!destroyed) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [projectId, selectedTokenId, userId, liveContext]);

  return { liveMessages, resetLiveMessages, addOptimisticMessage, removeOptimisticMessage, wsDeletedIds };
}
