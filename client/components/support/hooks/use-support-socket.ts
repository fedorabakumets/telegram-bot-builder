/**
 * @fileoverview Общий WebSocket чата поддержки: ping, реконнект, инвалидация кеша
 * @module components/support/hooks/use-support-socket
 */

import { useEffect, useState } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

/** Пауза перед повторным подключением */
const RECONNECT_MS = 3_000;

/** Интервал ping, чтобы прокси не закрыл простаивающий сокет */
const PING_MS = 25_000;

/**
 * Держит сокет поддержки и обновляет React Query на событиях support:*
 * @param path - Путь сокета на том же хосте
 * @param queryKey - Ключ, который инвалидируется при событии
 * @param enabled - Подключаться ли (есть авторизация)
 * @returns true, пока сокет открыт
 */
export function useSupportSocket(path: string, queryKey: QueryKey, enabled = true): boolean {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }

    let destroyed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;

    const clearPing = () => {
      if (pingTimer) clearInterval(pingTimer);
      pingTimer = null;
    };

    const connect = () => {
      if (destroyed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${window.location.host}${path}`);

      socket.onopen = () => {
        if (destroyed) return;
        setConnected(true);
        pingTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_MS);
      };

      socket.onmessage = (event) => {
        try {
          const frame = JSON.parse(String(event.data)) as { type?: string };
          if (frame.type?.startsWith('support:')) {
            void queryClient.invalidateQueries({ queryKey });
          }
        } catch {
          // Служебный или битый кадр
        }
      };

      socket.onclose = () => {
        clearPing();
        if (destroyed) return;
        setConnected(false);
        reconnectTimer = setTimeout(connect, RECONNECT_MS);
      };

      socket.onerror = () => socket?.close();
    };

    connect();

    return () => {
      destroyed = true;
      clearPing();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
      setConnected(false);
    };
  }, [enabled, path, queryKey, queryClient]);

  return connected;
}
