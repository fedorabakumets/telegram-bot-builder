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

import { Switch } from '@/components/ui/switch';
import { RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SettingCard } from './SettingCard';

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
  // По умолчанию выключено: null/undefined/0 → false
  const [localEnabled, setLocalEnabled] = useState(contentCache === 1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    setLocalEnabled(contentCache === 1);
  }, [contentCache]);

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
      setLocalEnabled(contentCache === 1);
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
    <SettingCard
      icon={RefreshCw}
      title="Живое обновление контента"
      description={
        localEnabled
          ? 'Тексты сообщений, кнопок и т.д. обновляются без перезапуска — расход памяти выше'
          : 'Тексты и кнопки меняются только после перезапуска — меньше памяти'
      }
      active={localEnabled}
      className={className}
      action={
        <Switch
          id={`content-cache-${tokenId}`}
          aria-label="Живое обновление контента"
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
      }
    />
  );
}
