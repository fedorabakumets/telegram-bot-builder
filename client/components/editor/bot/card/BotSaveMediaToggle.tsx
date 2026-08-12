/**
 * @fileoverview Переключатель сохранения входящих медиафайлов от пользователей
 * @module BotSaveMediaToggle
 */

import { Switch } from '@/components/ui/switch';
import { ImageIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { IncomingMediaStorageHint } from '../incoming-media-storage-hint';
import { SettingCard } from './SettingCard';

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

  useEffect(() => {
    setLocalEnabled(saveIncomingMedia === 1);
  }, [saveIncomingMedia]);

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

  // Показываем только если база данных пользователей включена
  if (userDatabaseEnabled !== 1) {
    return null;
  }

  return (
    <SettingCard
      icon={ImageIcon}
      title="Сохранять входящие фото"
      description={<IncomingMediaStorageHint projectId={projectId} enabled={localEnabled} />}
      active={localEnabled}
      className={className}
      action={
        <Switch
          id={`save-media-${tokenId}`}
          aria-label="Сохранять входящие фото"
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
      }
    />
  );
}
