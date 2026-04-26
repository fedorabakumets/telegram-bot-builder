/**
 * @fileoverview Переключатель защиты контента от копирования/пересылки
 * @module BotProtectContentToggle
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ShieldCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface BotProtectContentToggleProps {
  projectId: number;
  tokenId: number;
  protectContent: number | null;
  className?: string;
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
    <div
      className={`flex flex-col gap-2 p-2.5 sm:p-3 rounded-lg border transition-all ${className} ${
        localEnabled
          ? 'bg-emerald-500/8 border-emerald-500/30 dark:bg-emerald-500/10 dark:border-emerald-500/40'
          : 'bg-muted/40 border-border/50'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <ShieldCheck
          className={`w-4 h-4 flex-shrink-0 ${
            localEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
          }`}
        />
        <div className="flex-1 min-w-0">
          <Label
            htmlFor={`protect-content-${tokenId}`}
            className={`text-xs sm:text-sm font-semibold cursor-pointer block ${
              localEnabled ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'
            }`}
          >
            Защита от копирования
          </Label>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {localEnabled
              ? 'Telegram запретит пересылку и сохранение сообщений этого бота'
              : 'Сообщения этого бота можно пересылать и сохранять'}
          </p>
        </div>
        <Switch
          id={`protect-content-${tokenId}`}
          checked={localEnabled}
          onCheckedChange={(checked) => {
            setLocalEnabled(checked);
            mutation.mutate(checked);
          }}
          disabled={mutation.isPending}
        />
      </div>
    </div>
  );
}
