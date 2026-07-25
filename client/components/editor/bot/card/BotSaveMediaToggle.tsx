/**
 * @fileoverview Переключатель сохранения входящих медиафайлов от пользователей
 * @module BotSaveMediaToggle
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { IncomingMediaStorageHint } from '../incoming-media-storage-hint';

/** Пропсы переключателя сохранения медиафайлов */
interface BotSaveMediaToggleProps {
  /** ID проекта */
  projectId: number;
  /** ID токена бота */
  tokenId: number;
  /** Текущее значение флага сохранения медиа (0 = выключено, 1 = включено) */
  saveIncomingMedia: number | null;
  /** Флаг включения базы данных пользователей — компонент показывается только если === 1 */
  userDatabaseEnabled: number | null;
  /** Дополнительный CSS класс */
  className?: string;
  /** Колбэк для pending (если передан — не сохраняет мгновенно) */
  onPendingChange?: (key: string, value: string) => void;
}

/**
 * Отправляет запрос на обновление флага сохранения медиафайлов
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param saveIncomingMedia - Новое значение флага (0 или 1)
 */
async function updateSaveIncomingMedia(
  projectId: number,
  tokenId: number,
  saveIncomingMedia: number,
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/tokens/${tokenId}/save-incoming-media`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saveIncomingMedia }),
    },
  );

  if (!res.ok) {
    throw new Error('Ошибка обновления настройки сохранения медиа');
  }
}

/**
 * Переключатель сохранения входящих медиафайлов от пользователей.
 * Отображается только когда база данных пользователей включена.
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function BotSaveMediaToggle({
  projectId,
  tokenId,
  saveIncomingMedia,
  userDatabaseEnabled,
  className = '',
  onPendingChange,
}: BotSaveMediaToggleProps) {
  const [localEnabled, setLocalEnabled] = useState(saveIncomingMedia === 1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Показываем только если база данных пользователей включена
  if (userDatabaseEnabled !== 1) {
    return null;
  }

  const mutation = useMutation({
    mutationFn: (enabled: boolean) =>
      updateSaveIncomingMedia(projectId, tokenId, enabled ? 1 : 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      toast({
        title: 'Настройка сохранена',
        description: 'Перезапустите бота, чтобы применить изменения',
      });
    },
    onError: () => {
      setLocalEnabled(saveIncomingMedia === 1);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить настройку сохранения медиа',
        variant: 'destructive',
      });
    },
  });

  return (
    <div
      className={`flex flex-col gap-2 p-2.5 sm:p-3 rounded-lg border transition-all ${className} ${
        localEnabled
          ? 'bg-blue-500/8 border-blue-500/30 dark:bg-blue-500/10 dark:border-blue-500/40'
          : 'bg-muted/40 border-border/50'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <ImageIcon
          className={`w-4 h-4 flex-shrink-0 ${
            localEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
          }`}
        />
        <div className="flex-1 min-w-0">
          <Label
            htmlFor={`save-media-${tokenId}`}
            className={`text-xs sm:text-sm font-semibold cursor-pointer block ${
              localEnabled ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'
            }`}
          >
            {localEnabled ? 'Сохранять входящие фото' : 'Фото не сохраняются'}
          </Label>
          <IncomingMediaStorageHint projectId={projectId} enabled={localEnabled} />
        </div>
        <Switch
          id={`save-media-${tokenId}`}
          checked={localEnabled}
          onCheckedChange={(checked) => {
            setLocalEnabled(checked);
            if (onPendingChange) {
              onPendingChange('SAVE_INCOMING_MEDIA', checked ? 'true' : 'false');
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
