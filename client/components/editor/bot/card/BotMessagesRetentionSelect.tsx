/**
 * @fileoverview Селект срока хранения сообщений диалога
 * @module BotMessagesRetentionSelect
 */

import { History } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MessagesRetentionDays } from '@shared/messages-retention';
import {
  normalizeRetentionDays,
  RETENTION_OPTIONS,
} from './messages-retention-options';
import { SettingCard } from './SettingCard';

/** Пропсы селекта срока хранения сообщений */
interface BotMessagesRetentionSelectProps {
  /** ID проекта */
  projectId: number;
  /** ID токена */
  tokenId: number;
  /** Текущий срок в днях (0 = безлимит) */
  messagesRetentionDays: number | null;
  /** Показывать только при включённой БД пользователей */
  userDatabaseEnabled: number | null;
  /** Колбэк отложенного сохранения */
  onPendingChange?: (key: string, value: string) => void;
}

/**
 * Отправляет PUT messages-retention
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param messagesRetentionDays - Новый срок в днях
 */
async function updateMessagesRetention(
  projectId: number,
  tokenId: number,
  messagesRetentionDays: number,
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/tokens/${tokenId}/messages-retention`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messagesRetentionDays }),
    },
  );
  if (!res.ok) throw new Error('Ошибка обновления срока хранения сообщений');
}

/**
 * Селект «Хранить сообщения» в карточке бота
 * @param props - Свойства компонента
 * @returns JSX элемент или null если БД выключена
 */
export function BotMessagesRetentionSelect({
  projectId,
  tokenId,
  messagesRetentionDays,
  userDatabaseEnabled,
  onPendingChange,
}: BotMessagesRetentionSelectProps) {
  const [localDays, setLocalDays] = useState<MessagesRetentionDays>(
    normalizeRetentionDays(messagesRetentionDays),
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (days: number) => updateMessagesRetention(projectId, tokenId, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      toast({ title: 'Срок хранения сообщений обновлён' });
    },
    onError: () => {
      setLocalDays(normalizeRetentionDays(messagesRetentionDays));
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить срок хранения',
        variant: 'destructive',
      });
    },
  });

  if (userDatabaseEnabled !== 1) return null;

  return (
    <SettingCard
      icon={History}
      title="Хранить сообщения"
      description="Старые диалоги чистятся автоматически; длинный график активности не пострадает"
    >
      <Select
        value={String(localDays)}
        onValueChange={(val) => {
          const days = normalizeRetentionDays(parseInt(val, 10));
          setLocalDays(days);
          if (onPendingChange) {
            onPendingChange('MESSAGES_RETENTION_DAYS', String(days));
          } else {
            mutation.mutate(days);
          }
        }}
        disabled={mutation.isPending}
      >
        <SelectTrigger className="h-7 w-full text-xs">
          <SelectValue placeholder="Срок" />
        </SelectTrigger>
        <SelectContent>
          {RETENTION_OPTIONS.map(({ value, label }) => (
            <SelectItem key={value} value={String(value)} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingCard>
  );
}
