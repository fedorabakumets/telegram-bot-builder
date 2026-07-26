/**
 * @fileoverview Переключатель защиты контента от копирования/пересылки
 * @module BotProtectContentToggle
 */

import { Switch } from '@/components/ui/switch';
import { ShieldCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SettingCard } from './SettingCard';

interface BotProtectContentToggleProps {
  projectId: number;
  tokenId: number;
  protectContent: number | null;
  className?: string;
  /** Колбэк для pending (если передан — не сохраняет мгновенно) */
  onPendingChange?: (key: string, value: string) => void;
}

async function updateProtectContent(
  projectId: number,
  tokenId: number,
  protectContent: number,
): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/tokens/${tokenId}/protect-content`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ protectContent }),
  });

  if (!res.ok) {
    throw new Error('Ошибка обновления защиты контента');
  }
}

export function BotProtectContentToggle({
  projectId,
  tokenId,
  protectContent,
  className = '',
  onPendingChange,
}: BotProtectContentToggleProps) {
  const [localEnabled, setLocalEnabled] = useState(protectContent === 1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (enabled: boolean) =>
      updateProtectContent(projectId, tokenId, enabled ? 1 : 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      toast({
        title: 'Настройка сохранена',
        description: 'Перезапустите бота, чтобы применить защиту контента',
      });
    },
    onError: () => {
      setLocalEnabled(protectContent === 1);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить защиту контента',
        variant: 'destructive',
      });
    },
  });

  return (
    <SettingCard
      icon={ShieldCheck}
      title="Защита от копирования"
      description={
        localEnabled
          ? 'Telegram запретит пересылку и сохранение сообщений этого бота'
          : 'Сообщения этого бота можно пересылать и сохранять'
      }
      active={localEnabled}
      className={className}
      action={
        <Switch
          id={`protect-content-${tokenId}`}
          aria-label="Защита от копирования"
          checked={localEnabled}
          onCheckedChange={(checked) => {
            setLocalEnabled(checked);
            if (onPendingChange) {
              onPendingChange('PROTECT_CONTENT', checked ? 'true' : 'false');
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
