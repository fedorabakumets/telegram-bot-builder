/** @fileoverview Явное отображение и копирование секрета вебхука без изменения настроек бота. */
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

/** Параметры доступа к секрету конкретного бота. */
interface Props {
  /** Проект бота. */
  projectId: number;
  /** Идентификатор токена. */
  tokenId: number;
  /** Сервер подтвердил наличие секрета. */
  available: boolean;
}

/** Загружает секрет только по нажатию и забывает его при переключении бота. */
export function WebhookSecretReveal({ projectId, tokenId, available }: Props) {
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    setValue(''); setMessage(''); setPending(false);
    return () => { request.current?.abort(); };
  }, [projectId, tokenId, available]);
  /** Запрашивает значение с серверной проверкой прав; не передаёт его общей форме сохранения. */
  async function reveal() {
    const controller = new AbortController();
    request.current?.abort(); request.current = controller;
    setPending(true); setMessage('');
    try {
      const response = await fetch(`/api/projects/${projectId}/tokens/${tokenId}/webhook-secret/reveal`, {
        cache: 'no-store', signal: controller.signal,
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (typeof result.value !== 'string') throw new Error();
      if (!controller.signal.aborted) setValue(result.value);
    } catch {
      if (!controller.signal.aborted) setMessage('Не удалось получить токен. Проверьте доступ к боту.');
    } finally { if (!controller.signal.aborted) setPending(false); }
  }
  /** Копирует только явно загруженное значение в буфер обмена. */
  async function copy() {
    try { await navigator.clipboard.writeText(value); setMessage('Токен скопирован'); }
    catch { setMessage('Не удалось скопировать токен'); }
  }
  return <div className="space-y-1.5">
    <div className="flex gap-2">
      <Button type="button" size="sm" variant="outline" disabled={!available || pending}
        onClick={() => value ? setValue('') : void reveal()}>{pending ? 'Загрузка…' : value ? 'Скрыть токен' : 'Показать токен'}</Button>
      {value && <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>Скопировать</Button>}
    </div>
    {value && <code className="block break-all text-xs">{value}</code>}
    {message && <p role="status" className="text-xs text-muted-foreground">{message}</p>}
  </div>;
}
