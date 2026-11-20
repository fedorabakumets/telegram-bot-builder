/**
 * @fileoverview Live-синхронизация холста: BroadcastChannel (вкладки) + WebSocket (устройства, коллабораторы)
 * @module client/hooks/use-canvas-sync
 */

import { useEffect, useRef } from 'react';
import type { BotDataWithSheets } from '@shared/schema';
import type { CanvasActor } from '@shared/canvas-sync/canvas-actor';
import { isCanvasSyncMessage, type CanvasSyncMessage } from '@shared/canvas-sync/canvas-sync-message';
import { isCanvasResetMessage, type CanvasResetMessage, type CanvasResetKind } from '@shared/canvas-sync/canvas-reset-message';
import { isCanvasVersionsChangedMessage, type CanvasVersionsChangedMessage } from '@shared/canvas-sync/canvas-versions-changed-message';
import type { AppUser } from '@/types/telegram-user';
import { buildLocalCanvasActor } from './canvas-sync/build-local-canvas-actor';
import { acceptsCanvasOrder, type CanvasOrder } from '@shared/canvas-sync/revision-order';

/** Параметры хука синхронизации холста */
export interface UseCanvasSyncOptions {
  /** ID активного проекта */
  projectId?: number;
  /** Ревизия последнего подтверждённого состояния активного проекта. */
  savedRevision?: number;
  /** Несохранённый черновик нельзя заменять входящим снимком. */
  hasLocalChanges?: boolean;
  /** ID проекта локально созданного черновика, готового к отправке. */
  localDraftProjectId?: number;
  /** Уведомляет о сохранённом удалённом изменении, отложенном до разрешения конфликта. */
  onRemoteConflict?: (msg: CanvasSyncMessage) => void;
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
  /** Callback при получении сигнала сброса/сохранения изменений от другого клиента */
  onRemoteReset?: (kind: CanvasResetKind) => void;
  /** Callback при сигнале об изменении истории версий */
  onVersionsChanged?: (projectId: number) => void;
  /** Включена ли синхронизация */
  enabled?: boolean;
  /** Debounce рассылки (мс) */
  debounceMs?: number;
}

/** Результат хука синхронизации холста */
export interface UseCanvasSyncResult {
  /** Рассылает сигнал сброса/сохранения локальных изменений другим вкладкам/устройствам */
  broadcastReset: (kind: CanvasResetKind) => void;
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
 * @returns Объект с функцией broadcastReset для рассылки сигнала сброса
 */
export function useCanvasSync(options: UseCanvasSyncOptions): UseCanvasSyncResult {
  const {
    projectId,
    localDraftProjectId,
    botDataWithSheets,
    localUser,
    agentActor,
    onRemoteUpdate,
    onRemoteSync,
    onRemoteReset,
    onVersionsChanged,
    enabled = true,
    debounceMs = DEFAULT_DEBOUNCE_MS,
  } = options;

  const tabIdRef = useRef(createTabId());
  /** Отдельный порядок серверных ревизий не зависит от задержки побочных эффектов. */
  const lastOrderRef = useRef<CanvasOrder>();
  /** Отложенный снимок хранится отдельно от исходной ревизии локального черновика. */
  const deferredRemoteRef = useRef<CanvasSyncMessage>();
  const dirtyRef = useRef(options.hasLocalChanges === true);
  const conflictRef = useRef(options.onRemoteConflict);
  /** Последнее известное содержимое, включая чистый или полученный снимок. */
  const lastPayloadRef = useRef<{ projectId: number; payload: string }>();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  const onRemoteSyncRef = useRef(onRemoteSync);
  const onRemoteResetRef = useRef(onRemoteReset);
  const onVersionsChangedRef = useRef(onVersionsChanged);
  const localUserRef = useRef(localUser);
  const agentActorRef = useRef(agentActor);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const projectIdRef = useRef(projectId);
  const localDraftProjectIdRef = useRef(localDraftProjectId);

  onRemoteUpdateRef.current = onRemoteUpdate;
  onRemoteSyncRef.current = onRemoteSync;
  onRemoteResetRef.current = onRemoteReset;
  onVersionsChangedRef.current = onVersionsChanged;
  localUserRef.current = localUser;
  agentActorRef.current = agentActor;
  projectIdRef.current = enabled ? projectId : undefined;
  localDraftProjectIdRef.current = localDraftProjectId;
  dirtyRef.current = options.hasLocalChanges === true;
  conflictRef.current = options.onRemoteConflict;
  /** Локальное сохранение также повышает водораздел запоздавших серверных снимков. */
  if (projectId !== undefined && Number.isSafeInteger(options.savedRevision)
    && (lastOrderRef.current?.projectId !== projectId || (lastOrderRef.current.revision ?? -1) < options.savedRevision!)) {
    lastOrderRef.current = { projectId, revision: options.savedRevision!, timestamp: lastOrderRef.current?.projectId === projectId ? lastOrderRef.current.timestamp : 0 };
  }

  /**
   * Обрабатывает входящее сообщение сброса/сохранения от другого клиента.
   * Игнорирует собственное эхо и чужие проекты, иначе вызывает onRemoteReset с видом.
   */
  const applyResetRef = useRef((msg: CanvasResetMessage) => {
    if (msg.tabId === tabIdRef.current) return;
    if (msg.projectId !== projectIdRef.current) return;
    /** Чужое сохранение или сброс не разрешают удалить локальный черновик. */
    if (dirtyRef.current) return;
    onRemoteResetRef.current?.(msg.kind);
  });

  /**
   * Обрабатывает входящий сигнал об изменении истории версий.
   * Игнорирует чужие проекты, иначе вызывает onVersionsChanged с ID проекта.
   */
  const applyVersionsChangedRef = useRef((msg: CanvasVersionsChangedMessage) => {
    if (msg.projectId !== projectIdRef.current) return;
    onVersionsChangedRef.current?.(msg.projectId);
  });

  const applyRemoteRef = useRef((msg: CanvasSyncMessage) => {
    if (msg.tabId === tabIdRef.current) return;
    if (msg.projectId !== projectIdRef.current) return;
    if (!acceptsCanvasOrder(lastOrderRef.current, msg)) return;
    if (dirtyRef.current) {
      /** Неподтверждённый черновик другого окна не заменяет локальные правки. */
      if (msg.revision === undefined) return;
      const previous = deferredRemoteRef.current;
      if (!previous || acceptsCanvasOrder(previous, msg)) {
        deferredRemoteRef.current = msg;
        conflictRef.current?.(msg);
      }
      return;
    }
    const payload = JSON.stringify(msg.data);
    const unchanged = lastPayloadRef.current?.projectId === msg.projectId && lastPayloadRef.current.payload === payload;
    /** Повтор черновика не должен сдвигать порядок приёма других сообщений. */
    if (unchanged && msg.revision === undefined) return;
    lastOrderRef.current = { projectId: msg.projectId, timestamp: msg.timestamp,
      revision: msg.revision ?? (lastOrderRef.current?.projectId === msg.projectId ? lastOrderRef.current.revision : undefined) };
    if (unchanged) {
      /** При равных данных серверная ревизия всё равно обновляет базу сохранения. */
      onRemoteSyncRef.current?.(msg);
      return;
    }

    lastPayloadRef.current = { projectId: msg.projectId, payload };
    onRemoteUpdateRef.current(msg.data);
    onRemoteSyncRef.current?.(msg);
  });

  useEffect(() => {
    if (!enabled || options.hasLocalChanges || !deferredRemoteRef.current) return;
    const deferred = deferredRemoteRef.current;
    deferredRemoteRef.current = undefined;
    if (deferred.projectId === projectId) applyRemoteRef.current(deferred);
  }, [enabled, options.hasLocalChanges, projectId]);

  useEffect(() => {
    if (!enabled || !projectId || typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(`${CHANNEL_PREFIX}${projectId}`);
    bcRef.current = channel;

    channel.onmessage = (event: MessageEvent<CanvasSyncMessage>) => {
      if (bcRef.current !== channel) return;
      if (isCanvasResetMessage(event.data)) {
        applyResetRef.current(event.data);
        return;
      }
      if (isCanvasVersionsChangedMessage(event.data)) {
        applyVersionsChangedRef.current(event.data);
        return;
      }
      if (!isCanvasSyncMessage(event.data)) return;
      applyRemoteRef.current(event.data);
    };

    return () => {
      channel.close();
      if (bcRef.current === channel) bcRef.current = null;
    };
  }, [enabled, projectId]);

  useEffect(() => {
    if (!enabled || !projectId) return;

    let destroyed = false;
    let socket: WebSocket | undefined;
    let pingTimer: ReturnType<typeof setInterval> | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (destroyed || projectIdRef.current !== projectId) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/api/canvas?projectId=${projectId}`;
      const ws = new WebSocket(url);
      socket = ws;
      wsRef.current = ws;

      ws.onopen = () => {
        if (destroyed || wsRef.current !== ws) return;
        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        if (destroyed || wsRef.current !== ws) return;
        try {
          const parsed = JSON.parse(event.data as string) as unknown;
          if (isCanvasResetMessage(parsed)) {
            applyResetRef.current(parsed);
            return;
          }
          if (isCanvasVersionsChangedMessage(parsed)) {
            applyVersionsChangedRef.current(parsed);
            return;
          }
          if (!isCanvasSyncMessage(parsed)) return;
          applyRemoteRef.current(parsed);
        } catch {
          // Игнорируем некорректные сообщения
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
        if (pingTimer) clearInterval(pingTimer);
        if (!destroyed) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingTimer) clearInterval(pingTimer);
      if (wsRef.current === socket) wsRef.current = null;
      socket?.close();
    };
  }, [enabled, projectId]);

  // Ref для throttle: время последней отправки
  const lastSentAtRef = useRef(0);

  useEffect(() => {
    if (!projectId || !botDataWithSheets) return;

    const payload = JSON.stringify(botDataWithSheets);
    if (localDraftProjectId !== projectId) {
      /** Открытие и получение снимка задают базу, не создавая черновик. */
      lastPayloadRef.current = { projectId, payload };
      return;
    }
    if (!enabled || (lastPayloadRef.current?.projectId === projectId && lastPayloadRef.current.payload === payload)) return;

    /**
     * Отправляет текущее состояние холста в BroadcastChannel и WebSocket.
     * Вызывается либо сразу (leading edge), либо по таймеру (trailing edge).
     */
    const send = () => {
      if (projectIdRef.current !== projectId || localDraftProjectIdRef.current !== projectId) return;

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
        lastPayloadRef.current = { projectId, payload };
        lastSentAtRef.current = Date.now();
      } catch {
        // Игнорируем ошибки сериализации
      }
    };

    const elapsed = Date.now() - lastSentAtRef.current;

    // Throttle: если прошло достаточно времени с последней отправки — шлём сразу
    if (elapsed >= debounceMs) {
      send();
    } else {
      // Иначе ставим trailing таймер на остаток интервала
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(send, debounceMs - elapsed);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [botDataWithSheets, enabled, projectId, localDraftProjectId, debounceMs]);

  /**
   * Рассылает сигнал сброса/сохранения локальных изменений другим вкладкам/устройствам.
   * Использует ref-зеркала каналов, поэтому стабильна и не зависит от ререндеров.
   * @param kind - Вид сигнала: 'reset' (откат) или 'saved' (сохранено)
   */
  const broadcastResetRef = useRef((kind: CanvasResetKind) => {
    const pid = projectIdRef.current;
    if (pid == null) return;
    const message: CanvasResetMessage = {
      type: 'canvas-reset',
      kind,
      projectId: pid,
      tabId: tabIdRef.current,
      timestamp: Date.now(),
    };
    try {
      bcRef.current?.postMessage(message);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      }
    } catch {
      // Игнорируем ошибки отправки
    }
  });

  return { broadcastReset: broadcastResetRef.current };
}

/** @deprecated Используйте useCanvasSync */
export const useCrossTabCanvasSync = useCanvasSync;

/** ID вкладки для внешнего использования (agent bridge) */
export { createTabId as createCanvasClientTabId };
