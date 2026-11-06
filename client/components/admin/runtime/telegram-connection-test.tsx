/**
 * @fileoverview Проверка текущих настроек подключения панели к Telegram.
 */
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/queryClient';

/**
 * Показывает результат проверки возле адреса прокси.
 * @param props - Текущие настройки и состояние сохранения
 * @returns Кнопка и состояние проверки
 */
export function TelegramConnectionTest({ disabled, mode, proxy, apiMode, apiUrl }: {
  /** Выбранный сервер Bot API */
  apiMode: string;
  /** Адрес локального Bot API */
  apiUrl: string;
  /** Выполняется сохранение формы */
  disabled: boolean;
  /** Выбранный режим подключения */
  mode: string;
  /** Введённый адрес прокси */
  proxy: string;
}) {
  const test = useMutation<{ ok: boolean; method: string; message: string }, Error, { mode: string; proxy: string; apiMode: string; apiUrl: string }>({
    mutationFn: (values: { mode: string; proxy: string; apiMode: string; apiUrl: string }) => apiRequest('POST', '/admin/api/runtime-settings/platform/telegram/test', { values }),
  });
  useEffect(() => {
    test.reset();
  }, [mode, proxy, apiMode, apiUrl]);
  return <div className="space-y-2 sm:col-span-2">
    <Button type="button" variant="outline" disabled={disabled || test.isPending} onClick={() => test.mutate({ mode, proxy, apiMode, apiUrl })}>
      {test.isPending ? 'Проверка подключения…' : 'Проверить подключение'}
    </Button>
    <p className="text-xs text-muted-foreground">Проверяются текущие значения без сохранения.</p>
    {test.data && !disabled ? <p role="status" className={test.data.ok ? 'text-sm' : 'text-sm text-destructive'}>
      {test.data.method}: {test.data.message}
    </p> : null}
    {test.isError && !disabled ? <p role="alert" className="text-sm text-destructive">
      Не удалось выполнить проверку: {test.error instanceof Error ? test.error.message : 'ошибка панели'}
    </p> : null}
  </div>;
}
