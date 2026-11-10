/** @fileoverview Подгрузка предыдущих страниц переписки с сохранением положения прокрутки. */
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { BotMessageWithMedia } from '../types';

/**
 * Загружает предыдущую страницу при достижении начала истории.
 * @param url - Адрес текущего диалога
 * @param messages - Последняя страница сообщений
 * @param scrollRef - Контейнер истории
 * @param enabled - Разрешена ли загрузка предыдущих страниц
 * @returns Ранее загруженные сообщения, состояние и повтор загрузки
 */
export function useOlderDialogMessages(url: string, messages: BotMessageWithMedia[], scrollRef: RefObject<HTMLDivElement>, enabled: boolean) {
  const [older, setOlder] = useState<BotMessageWithMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pending = useRef(false);
  const generation = useRef(0);
  const restore = useRef<{ height: number; top: number } | null>(null);

  useEffect(() => {
    generation.current += 1;
    pending.current = false;
    restore.current = null;
    setOlder([]); setLoading(false); setFailed(false); setHasMore(true);
  }, [url]);

  /** Запрашивает страницу перед первым известным сообщением. */
  const loadOlder = async () => {
    const first = older[0] ?? messages[0];
    const viewport = scrollRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (!enabled || !first || first.id <= 0 || !viewport || pending.current || !hasMore) return;
    const version = generation.current;
    pending.current = true; setLoading(true); setFailed(false);
    try {
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}beforeId=${first.id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Не удалось загрузить историю');
      const page: BotMessageWithMedia[] = await response.json();
      if (version !== generation.current) return;
      restore.current = { height: viewport.scrollHeight, top: viewport.scrollTop };
      setHasMore(page.length >= 100);
      setOlder((previous) => [...page.filter((item) => !previous.some((existing) => existing.id === item.id)), ...previous]);
    } catch {
      if (version === generation.current) setFailed(true);
    } finally {
      if (version === generation.current) { pending.current = false; setLoading(false); }
    }
  };

  useLayoutEffect(() => {
    const viewport = scrollRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    /** Сохраняет точку чтения после добавления сообщений сверху. */
    if (restore.current) {
      viewport.scrollTop = restore.current.top + viewport.scrollHeight - restore.current.height;
      restore.current = null;
    }
    /** Загружает историю при прокрутке к верхнему краю. */
    const onScroll = () => { if (viewport.scrollTop < 80 && !failed) void loadOlder(); };
    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onScroll);
  });

  return { older, loading, failed, hasMore, loadOlder };
}
