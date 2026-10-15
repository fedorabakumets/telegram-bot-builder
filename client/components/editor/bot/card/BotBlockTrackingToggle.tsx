/**
 * @fileoverview Переключатель автоматического отслеживания блокировок бота
 * @module BotBlockTrackingToggle
 */

import { Switch } from '@/components/ui/switch';
import { UserRoundCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SettingCard } from './SettingCard';

/** Свойства переключателя отслеживания блокировок */
interface Props {
  /** ID проекта */ projectId: number;
  /** ID токена */ tokenId: number;
  /** Текущее значение 0/1 */ trackUserBlocks: number | null;
  /** Колбэк отложенного изменения */ onPendingChange?: (key: string, value: string) => void;
}

/**
 * Переключатель событий блокировки и разблокировки в Telegram.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotBlockTrackingToggle({ projectId, tokenId, trackUserBlocks, onPendingChange }: Props) {
  const [enabled, setEnabled] = useState(trackUserBlocks !== 0);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  useEffect(() => setEnabled(trackUserBlocks !== 0), [trackUserBlocks]);
  const mutation = useMutation({
    mutationFn: async (value: boolean) => {
      const response = await fetch(`/api/projects/${projectId}/tokens/${tokenId}/track-user-blocks`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackUserBlocks: value ? 1 : 0 }),
      });
      if (!response.ok) throw new Error('Не удалось сохранить настройку');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      toast({ title: 'Настройка сохранена', description: 'Перезапустите бота, чтобы применить изменения' });
    },
    onError: () => {
      setEnabled(trackUserBlocks !== 0);
      toast({ title: 'Ошибка', description: 'Не удалось обновить отслеживание блокировок', variant: 'destructive' });
    },
  });
  return <SettingCard icon={UserRoundCheck} title="Отслеживать блокировки"
    description="Показывает в диалоге, когда пользователь блокирует или разблокирует бота"
    active={enabled} action={<Switch aria-label="Отслеживать блокировки" checked={enabled}
      disabled={mutation.isPending} onCheckedChange={(value) => {
        setEnabled(value);
        if (onPendingChange) onPendingChange('TRACK_USER_BLOCKS', value ? '1' : '0');
        else mutation.mutate(value);
      }} />} />;
}
