/**
 * @fileoverview Live-синхронизация холста: BroadcastChannel (вкладки) + WebSocket (устройства, коллабораторы)
 * @module client/hooks/use-canvas-sync
 */

import { useEffect, useRef } from 'react';
import type { BotDataWithSheets } from '@shared/schema';
import type { CanvasActor } from '@shared/canvas-sync/canvas-actor';
import { isCanvasSyncMessage, type CanvasSyncMessage } from '@shared/canvas-sync/canvas-sync-message';
import type { AppUser } from '@/types/telegram-user';
import { buildLocalCanvasActor } from './canvas-sync/build-local-canvas-actor';

/** Параметры хука синхронизации холста */
export interface UseCanvasSyncOptions {
  /** ID активного проекта */
  projectId?: number;
  /** Текущие данные холста */
  botDataWithSheets: BotDataWithSheets | null | undefined;
  /** Текущий пользователь (для actor.kind=user) */
  localUser?: AppUser | null;
  /** Явный актор агента (MCP / вкладка агента), иначе user/guest из localUser */
  agentActor?: CanvasActor;
  /** Callback при получении данных от другого клиента */
  onRemoteUpdate: (data: BotDataWithSheets) => void;
  /** Callback с полным сообщением (actor, timestamp) после удалённого обновления */
  onRemoteSync?: (msg: CanvasSyncMessage) => void;
  /** Включена ли синхронизация */
  enabled?: boolean;
  /** Debounce рассылки (мс) */
  debounceMs?: number;
}

/** Префикс BroadcastChannel */
const CHANNEL_PREFIX = 'botcraft-canvas-sync-';

/** Debounce по умолчанию (мс) */
const DEFAULT_DEBOUNCE_MS = 120;

/** Интервал keepalive ping (мс) */
const PING_INTERVAL_MS = 20_000;

/**
 * Генерирует уникальный ID вкладки
 * @returns UUID вкладки
 */
function createTabId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `tab-${Date.now()}-${Math.random()}`;
}

/**
 * Синхронизирует холст между вкладками, устройствами и коллабораторами одного проекта
 * @param options - Параметры синхронизации
 */
export function useCanvasSync(options: UseCanvasSyncOptions): void {
  const {
    projectId,
    botDataWithSheets,
    localUser,
    agentActor,
    onRemoteUpdate,
    onRemoteSync,
    enabled = true,
    debounceMs = DEFAULT_DEBOUNCE_MS,
  } = options;

  const tabIdRef = useRef(createTabId());
  const isApplyingRemoteRef = useRef(false);
  const lastAppliedTimestampRef = useRef(0);
  const lastSentPayloadRef = useRef('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  const onRemoteSyncRef = useRef(onRemoteSync);
  const localUserRef = useRef(localUser);
  const agentActorRef = useRef(agentActor);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const projectIdRef = useRef(projectId);

  onRemoteUpdateRef.current = onRemoteUpdate;
  onRemoteSyncRef.current = onRemoteSync;
  localUserRef.current = localUser;
  agentActorRef.current = agentActor;
  projectIdRef.current = projectId;

  const applyRemoteRef = useRef((msg: CanvasSyncMessage) => {
    if (msg.tabId === tabIdRef.current) return;
    const pid = projectIdRef.current;
    if (pid != null && msg.projectId !== pid) return;
    if (msg.timestamp <= lastAppliedTimestampRef.current) return;

    const payload = JSON.stringify(msg.data);
    if (payload === lastSentPayloadRef.current) return;

    lastAppliedTimestampRef.current = msg.timestamp;
    lastSentPayloadRef.current = payload;
    isApplyingRemoteRef.current = true;
    onRemoteUpdateRef.current(msg.data);
    onRemoteSyncRef.current?.(msg);

    setTimeout(() => {
      isApplyingRemoteRef.current = false;
    }, 0);
  });

  useEffect(() => {
    if (!enabled || !projectId || typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(`${CHANNEL_PREFIX}${projectId}`);
    bcRef.current = channel;

    channel.onmessage = (event: MessageEvent<CanvasSyncMessage>) => {
      if (!isCanvasSyncMessage(event.data)) return;
      applyRemoteRef.current(event.data);
    };

    return () => {
      channel.close();
      bcRef.current = null;
    };
  }, [enabled, projectId]);

  useEffect(() => {
    if (!enabled || !projectId) return;

    let destroyed = false;

    const connect = () => {
      if (destroyed) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/api/canvas?projectId=${projectId}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data as string) as unknown;
          if (!isCanvasSyncMessage(parsed)) return;
          applyRemoteRef.current(parsed);
        } catch {
          // Игнорируем некорректные сообщения
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (pingTimerRef.current) {
          clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }
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
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, projectId]);

  useEffect(() => {
    if (!enabled || !projectId || !botDataWithSheets || isApplyingRemoteRef.current) return;

    const payload = JSON.stringify(botDataWithSheets);
    if (payload === lastSentPayloadRef.current) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      if (isApplyingRemoteRef.current) return;

      const actor = buildLocalCanvasActor(
        localUserRef.current,
        tabIdRef.current,
        agentActorRef.current,
      );

      const message: CanvasSyncMessage = {
        type: 'canvas-sync',
        projectId,
        tabId: tabIdRef.current,
        actor,
        userId: actor.userId,
        timestamp: Date.now(),
        data: botDataWithSheets,
      };

      try {
        bcRef.current?.postMessage(message);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(message));
        }
        lastSentPayloadRef.current = payload;
      } catch {
        // Игнорируем ошибки сериализации
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [botDataWithSheets, enabled, projectId, debounceMs, localUser, agentActor]);
}

/** @deprecated Используйте useCanvasSync */
export const useCrossTabCanvasSync = useCanvasSync;

/** ID вкладки для внешнего использования (agent bridge) */
export { createTabId as createCanvasClientTabId };
