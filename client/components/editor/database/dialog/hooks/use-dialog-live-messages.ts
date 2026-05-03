/**
 * @fileoverview Хук подписки на живые сообщения диалога через WebSocket
 * @module client/components/editor/database/dialog/hooks/use-dialog-live-messages
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { BotMessageWithMedia } from '../types';

/**
 * Структура события new-message из WebSocket
 */
interface NewMessageEvent {
  /** Тип события */
  type: 'new-message';
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена */
  tokenId?: number;
  /** Данные сообщения */
  data: {
    /** Идентификатор пользователя */
    userId: string;
    /** Тип сообщения */
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
  };
  /** Временная метка события */
  timestamp: string;
}

/**
 * Преобразует событие new-message в формат BotMessageWithMedia
 * @param event - Событие из WebSocket
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @returns Объект сообщения
 */
function eventToMessage(
  event: NewMessageEvent,
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
 * Хук подписки на живые сообщения диалога через WebSocket.
 * Подключается к общему WS-каналу и фильтрует события new-message
 * по projectId, tokenId и userId.
 *
 * @param projectId - Идентификатор проекта
 * @param selectedTokenId - Идентификатор выбранного токена
 * @param userId - Идентификатор пользователя (строка или число)
 * @returns Объект с массивом живых сообщений и функцией сброса
 */
export function useDialogLiveMessages(
  projectId: number,
  selectedTokenId?: number | null,
  userId?: string | number | null,
) {
  const [liveMessages, setLiveMessages] = useState<BotMessageWithMedia[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstConnectRef = useRef(true);

  /** Сбрасывает накопленные live-сообщения (при смене пользователя) */
  const resetLiveMessages = useCallback(() => {
    setLiveMessages([]);
  }, []);

  useEffect(() => {
    if (!userId) {
      setLiveMessages([]);
      return;
    }

    let destroyed = false;
    const userIdStr = String(userId);

    const connect = () => {
      if (destroyed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/api/terminal?projectId=0&tokenId=0`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isFirstConnectRef.current) {
          isFirstConnectRef.current = false;
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type !== 'new-message') return;
          if (msg.projectId !== projectId) return;
          if (selectedTokenId && msg.tokenId && msg.tokenId !== selectedTokenId) return;
          if (String(msg.data?.userId) !== userIdStr) return;

          const newMsg = eventToMessage(msg as NewMessageEvent, projectId, selectedTokenId);
          setLiveMessages((prev) => {
            // Дедупликация по id
            if (prev.some((m) => m.id === newMsg.id)) return prev;
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
      isFirstConnectRef.current = true;
    };
  }, [projectId, selectedTokenId, userId]);

  return { liveMessages, resetLiveMessages };
}
