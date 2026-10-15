/**
 * @fileoverview Переключатель слежения за добавлением бота в группы.
 * @module BotGroupMembershipToggle
 */
import { Switch } from '@/components/ui/switch';
import { Users } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SettingCard } from './SettingCard';

/** Свойства переключателя групп. */
interface Props {
  /** Проект. */
  projectId: number;
  /** Бот. */
  tokenId: number;
  /** Текущее значение 0/1. */
  trackGroupMembership: number | null;
  /** Отложенное сохранение из очереди настроек. */
  onPendingChange?: (key: string, value: string) => void;
}

/**
 * Включает запись в ленту группы, когда бота добавляют или исключают.
 * @param props - Свойства
 * @returns Карточка настройки
 */
export function BotGroupMembershipToggle({ projectId, tokenId, trackGroupMembership, onPendingChange }: Props) {
  const [enabled, setEnabled] = useState(trackGroupMembership !== 0);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  useEffect(() => setEnabled(trackGroupMembership !== 0), [trackGroupMembership]);
  const mutation = useMutation({
    mutationFn: async (value: boolean) => {
      const response = await fetch(`/api/projects/${projectId}/tokens/${tokenId}/track-group-membership`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackGroupMembership: value ? 1 : 0 }),
      });
      if (!response.ok) throw new Error('Не удалось сохранить настройку');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      toast({ title: 'Настройка сохранена', description: 'Перезапустите бота, чтобы применить изменения' });
    },
    onError: () => {
      setEnabled(trackGroupMembership !== 0);
      toast({ title: 'Ошибка', description: 'Не удалось обновить отслеживание групп', variant: 'destructive' });
    },
  });
  return (
    <SettingCard icon={Users} title="Отслеживать группы"
      description="Показывает в диалоге группы, когда бота добавляют или исключают"
      active={enabled} action={<Switch aria-label="Отслеживать группы" checked={enabled}
        disabled={mutation.isPending} onCheckedChange={(value) => {
          setEnabled(value);
          if (onPendingChange) onPendingChange('TRACK_GROUP_MEMBERSHIP', value ? '1' : '0');
          else mutation.mutate(value);
        }} />} />
  );
}
