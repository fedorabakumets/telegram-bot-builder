/**
 * @fileoverview Переключатель генерации catch-all обработчиков
 *
 * Управляет генерацией обработчиков необработанных сообщений/фото/callback
 * (`handle_unhandled_message`, `handle_unhandled_photo`, `fallback_callback_handler`).
 * При наличии incoming-триггеров или динамических кнопок генератор включает
 * их принудительно независимо от этого флага (предохранитель от поломки).
 *
 * @module BotCatchAllToggle
 */

import { Switch } from '@/components/ui/switch';
import { Inbox } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SettingCard } from './SettingCard';

/** Пропсы переключателя catch-all обработчиков */
interface BotCatchAllToggleProps {
  /** ID проекта */
  projectId: number;
  /** ID токена бота */
  tokenId: number;
  /** Текущее значение флага (0 = выключено, 1 = включено) */
  catchAllHandlers: number | null;
  /** Дополнительный CSS класс */
  className?: string;
  /** Колбэк для pending (если передан — не сохраняет мгновенно) */
  onPendingChange?: (key: string, value: string) => void;
}

/**
 * Отправляет запрос на обновление флага catch-all обработчиков
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param catchAllHandlers - Новое значение флага (0 или 1)
 */
async function updateCatchAllHandlers(
  projectId: number,
  tokenId: number,
  catchAllHandlers: number,
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/tokens/${tokenId}/catch-all-handlers`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catchAllHandlers }),
    },
  );

  if (!res.ok) {
    throw new Error('Ошибка обновления настройки catch-all обработчиков');
  }
}

/**
 * Переключатель генерации catch-all обработчиков необработанных апдейтов.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotCatchAllToggle({
  projectId,
  tokenId,
  catchAllHandlers,
  className = '',
  onPendingChange,
}: BotCatchAllToggleProps) {
  // По умолчанию включено (1): null/undefined трактуем как включённое
  const [localEnabled, setLocalEnabled] = useState(catchAllHandlers !== 0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    setLocalEnabled(catchAllHandlers !== 0);
  }, [catchAllHandlers]);

  const mutation = useMutation({
    mutationFn: (enabled: boolean) =>
      updateCatchAllHandlers(projectId, tokenId, enabled ? 1 : 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      toast({
        title: 'Настройка сохранена',
        description: 'Перезапустите бота, чтобы применить изменения',
      });
    },
    onError: () => {
      setLocalEnabled(catchAllHandlers !== 0);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить настройку catch-all обработчиков',
        variant: 'destructive',
      });
    },
  });

  return (
    <SettingCard
      icon={Inbox}
      title="Catch-all обработчики"
      description={
        localEnabled
          ? 'Бот ловит и логирует необработанные сообщения и нажатия'
          : 'Необработанные сообщения игнорируются (меньше кода)'
      }
      active={localEnabled}
      className={className}
      action={
        <Switch
          id={`catch-all-${tokenId}`}
          aria-label="Catch-all обработчики"
          checked={localEnabled}
          onCheckedChange={(checked) => {
            setLocalEnabled(checked);
            if (onPendingChange) {
              onPendingChange('CATCH_ALL_HANDLERS', checked ? '1' : '0');
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
