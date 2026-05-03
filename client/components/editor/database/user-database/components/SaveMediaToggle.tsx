/**
 * @fileoverview Компактный переключатель сохранения медиафайлов для вкладки пользователей
 * @module SaveMediaToggle
 */

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ImageIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

/** Пропсы компактного переключателя сохранения медиафайлов */
interface SaveMediaToggleProps {
  /** ID проекта */
  projectId: number;
  /** ID токена бота (если null — компонент не рендерится) */
  tokenId: number | null;
  /** Текущее значение флага (0 = выключено, 1 = включено, null = выключено) */
  saveIncomingMedia: number | null;
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
 * Компактный горизонтальный переключатель сохранения входящих медиафайлов.
 * Используется на вкладке пользователей базы данных.
 * Не рендерится если tokenId равен null.
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function SaveMediaToggle({ projectId, tokenId, saveIncomingMedia }: SaveMediaToggleProps) {
  const [localEnabled, setLocalEnabled] = useState(saveIncomingMedia === 1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (tokenId === null) {
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
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50">
      <ImageIcon
        className={`w-4 h-4 flex-shrink-0 ${
          localEnabled ? 'text-blue-500' : 'text-muted-foreground'
        }`}
      />
      <div className="flex-1 min-w-0">
        <Label
          htmlFor={`save-media-db-${tokenId}`}
          className="text-sm font-medium cursor-pointer"
        >
          {localEnabled ? 'Сохранять входящие фото' : 'Фото не сохраняются'}
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          {localEnabled
            ? 'Фото от пользователей будут скачиваться и храниться на сервере'
            : 'Фото от пользователей не сохраняются на сервере'}
        </p>
      </div>
      <Switch
        id={`save-media-db-${tokenId}`}
        checked={localEnabled}
        onCheckedChange={(checked) => {
          setLocalEnabled(checked);
          mutation.mutate(checked);
        }}
        disabled={mutation.isPending}
      />
    </div>
  );
}
