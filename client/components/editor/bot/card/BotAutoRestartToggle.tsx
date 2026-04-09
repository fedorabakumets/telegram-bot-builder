/**
 * @fileoverview Переключатель автоперезапуска бота при краше
 * Позволяет включить/выключить автоперезапуск и задать максимальное число попыток.
 * @module BotAutoRestartToggle
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

/** Пропсы компонента переключателя автоперезапуска */
interface BotAutoRestartToggleProps {
  /** ID проекта */
  projectId: number;
  /** ID токена */
  tokenId: number;
  /** Включён ли автоперезапуск (1 — да, 0/null — нет) */
  autoRestart: number | null;
  /** Максимальное количество попыток перезапуска */
  maxRestartAttempts: number | null;
  /** Дополнительный CSS-класс */
  className?: string;
}

/**
 * Отправляет запрос на обновление настроек автоперезапуска
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param autoRestart - Флаг включения (0/1)
 * @param maxRestartAttempts - Максимум попыток
 */
async function updateAutoRestart(
  projectId: number,
  tokenId: number,
  autoRestart: number,
  maxRestartAttempts: number,
): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/tokens/${tokenId}/auto-restart`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autoRestart, maxRestartAttempts }),
  });
  if (!res.ok) throw new Error('Ошибка обновления автоперезапуска');
}

/**
 * Переключатель автоперезапуска бота при краше
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotAutoRestartToggle({
  projectId,
  tokenId,
  autoRestart,
  maxRestartAttempts,
  className = '',
}: BotAutoRestartToggleProps) {
  const [localEnabled, setLocalEnabled] = useState(autoRestart === 1);
  const [localAttempts, setLocalAttempts] = useState(maxRestartAttempts ?? 3);
  const queryClient = useQueryClient();

  /** Мутация обновления настроек автоперезапуска */
  const mutation = useMutation({
    mutationFn: ({ ar, ma }: { ar: number; ma: number }) =>
      updateAutoRestart(projectId, tokenId, ar, ma),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
    },
    onError: () => {
      // Откатываем локальный стейт при ошибке
      setLocalEnabled(autoRestart === 1);
      setLocalAttempts(maxRestartAttempts ?? 3);
    },
  });

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all ${className} ${
        localEnabled
          ? 'bg-blue-500/8 border-blue-500/30 dark:bg-blue-500/10 dark:border-blue-500/40'
          : 'bg-muted/40 border-border/50'
      }`}
    >
      <RefreshCw
        className={`w-4 h-4 flex-shrink-0 ${localEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}
      />
      <Label
        htmlFor={`auto-restart-${tokenId}`}
        className={`text-xs sm:text-sm font-semibold cursor-pointer flex-1 ${
          localEnabled ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'
        }`}
      >
        {localEnabled ? 'Автоперезапуск' : 'Без перезапуска'}
      </Label>

      {localEnabled && (
        /** Выпадающий список выбора максимального числа попыток перезапуска */
        <Select
          value={String(localAttempts)}
          onValueChange={(val) => {
            const ma = parseInt(val);
            setLocalAttempts(ma);
            mutation.mutate({ ar: 1, ma });
          }}
          disabled={mutation.isPending}
        >
          <SelectTrigger className="h-6 w-24 text-xs border-blue-500/30 bg-transparent text-blue-700 dark:text-blue-300">
            <SelectValue placeholder="Попыток" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <SelectItem key={n} value={String(n)} className="text-xs">
                {n} {n === 1 ? 'попытка' : n < 5 ? 'попытки' : 'попыток'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Switch
        id={`auto-restart-${tokenId}`}
        checked={localEnabled}
        onCheckedChange={(checked) => {
          setLocalEnabled(checked);
          mutation.mutate({ ar: checked ? 1 : 0, ma: localAttempts });
        }}
        disabled={mutation.isPending}
      />
    </div>
  );
}
