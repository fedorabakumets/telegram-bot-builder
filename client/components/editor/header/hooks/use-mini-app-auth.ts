/**
 * @fileoverview Хук автоматической авторизации через Telegram Mini App
 * @module components/editor/header/hooks/use-mini-app-auth
 */

import { useEffect } from 'react';
import { useTelegramAuth } from './use-telegram-auth';

/**
 * Показывает временный debug-баннер в правом нижнем углу
 * @param msg - сообщение для отображения
 */
function showDebug(msg: string) {
  let el = document.getElementById('__miniapp_debug');
  if (!el) {
    el = document.createElement('div');
    el.id = '__miniapp_debug';
    el.style.cssText =
      'position:fixed;bottom:8px;right:8px;z-index:99999;background:rgba(0,0,0,0.8);color:#0f0;font-size:11px;padding:6px 10px;border-radius:6px;max-width:280px;word-break:break-all;pointer-events:none';
    document.body.appendChild(el);
  }
  el.textContent = `[MiniApp] ${msg}`;
  setTimeout(() => {
    if (el) el.remove();
  }, 10000);
}

/**
 * Хук автоматической авторизации через Telegram Mini App.
 * Разворачивает приложение на весь экран и логинит пользователя автоматически.
 */
export function useMiniAppAuth(): void {
  const { acceptSession, isLoading } = useTelegramAuth();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready?.();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const tg = window.Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user || !tg.initData) return;

    fetch('/api/auth/telegram/miniapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then((res) => {
        const status = res.status;
        return res.json().then((data) => ({ ...data, _status: status }));
      })
      .then((data) => {
        if (data.success && data.user) {
          acceptSession(data.user, Boolean(data.switched));
        } else {
          showDebug(`❌ HTTP ${data._status}: ${data.error}`);
        }
      })
      .catch((err) => showDebug(`❌ fetch error: ${err.message}`));
  }, [isLoading, acceptSession]);
}
