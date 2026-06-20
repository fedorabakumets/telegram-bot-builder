/**
 * @fileoverview Переключатель живого обновления контента
 *
 * Управляет «горячим обновлением» текстов из таблицы `_content`: когда включён —
 * бот подхватывает правки таблицы без перезапуска (фоновая перезагрузка +
 * Redis-событие). Когда выключен — тексты статичны до перезапуска, фоновых
 * задач нет (меньше кода). Управляет генерацией `load_content`/`reload_content`/
 * `_content_reload_loop`/`_content_subscribe_redis`.
 *
 * @module BotContentCacheToggle
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

/** Пропсы переключателя живого обновления контента */
interface BotContentCacheToggleProps {
  /** ID проекта */
  projectId: number;
  /** ID токена бота */
  tokenId: number;
  /** Текущее значение флага (0 = выключено, 1 = включено) */
  contentCache: number | null;
  /** Флаг включения базы данных пользователей — компонент показывается только если === 1 */
  userDatabaseEnabled: number | null;
  /** Дополнительный CSS класс */
  className?: string;
  /** Колбэк для pending (если передан — не сохраняет мгновенно) */
  onPendingChange?: (key: string, value: string) => void;
}

/**
 * Отправляет запрос на обновление флага живого обновления контента
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param contentCache - Новое значение флага (0 или 1)
 */
async function updateContentCache(
  projectId: number,
  tokenId: number,
  contentCache: number,
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/tokens/${tokenId}/content-cache`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentCache }),
    },
  );

  if (!res.ok) {
    throw new Error('Ошибка обновления настройки живого обновления контента');
  }
}

/**
 * Переключатель живого обновления контента из таблицы _content.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotContentCacheToggle({
  projectId,
  tokenId,
  contentCache,
  userDatabaseEnabled,
  className = '',
  onPendingChange,
}: BotContentCacheToggleProps) {
  // По умолчанию включено (1): null/undefined трактуем как включённое
  const [localEnabled, setLocalEnabled] = useState(contentCache !== 0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (enabled: boolean) =>
      updateContentCache(projectId, tokenId, enabled ? 1 : 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      toast({
        title: 'Настройка сохранена',
        description: 'Перезапустите бота, чтобы применить изменения',
      });
    },
    onError: () => {
      setLocalEnabled(contentCache !== 0);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить настройку живого обновления контента',
        variant: 'destructive',
      });
    },
  });

  // Живое обновление контента работает только при включённой БД
  // (таблица _content читается через db_pool). Без БД тумблер не показываем.
  if (userDatabaseEnabled !== 1) {
    return null;
  }

  return (
    <div
      className={`flex flex-col gap-2 p-2.5 sm:p-3 rounded-lg border transition-all ${className} ${
        localEnabled
          ? 'bg-sky-500/8 border-sky-500/30 dark:bg-sky-500/10 dark:border-sky-500/40'
          : 'bg-muted/40 border-border/50'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <RefreshCw
          className={`w-4 h-4 flex-shrink-0 ${
            localEnabled ? 'text-sky-600 dark:text-sky-400' : 'text-muted-foreground'
          }`}
        />
        <div className="flex-1 min-w-0">
          <Label
            htmlFor={`content-cache-${tokenId}`}
            className={`text-xs sm:text-sm font-semibold cursor-pointer block ${
              localEnabled ? 'text-sky-700 dark:text-sky-300' : 'text-muted-foreground'
            }`}
          >
            {localEnabled ? 'Живое обновление контента' : 'Контент статичный'}
          </Label>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {localEnabled
              ? 'Бот подхватывает правки таблицы _content без перезапуска'
              : 'Тексты обновляются только после перезапуска (меньше кода)'}
          </p>
        </div>
        <Switch
          id={`content-cache-${tokenId}`}
          checked={localEnabled}
          onCheckedChange={(checked) => {
            setLocalEnabled(checked);
            if (onPendingChange) {
              onPendingChange('CONTENT_CACHE', checked ? '1' : '0');
            } else {
              mutation.mutate(checked);
            }
          }}
          disabled={mutation.isPending}
        />
      </div>
    </div>
  );
}
