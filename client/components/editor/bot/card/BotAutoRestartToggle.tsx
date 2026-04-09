/**
 * @fileoverview Переключатель автоперезапуска бота при краше
 * Позволяет включить/выключить автоперезапуск и задать максимальное число попыток.
 * @module BotAutoRestartToggle
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
  const isEnabled = autoRestart === 1;
  const attempts = maxRestartAttempts ?? 3;
  const queryClient = useQueryClient();

  /** Мутация обновления настроек автоперезапуска */
  const mutation = useMutation({
    mutationFn: ({ ar, ma }: { ar: number; ma: number }) =>
      updateAutoRestart(projectId, tokenId, ar, ma),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens', projectId] });
    },
  });

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all ${className} ${
        isEnabled
          ? 'bg-blue-500/8 border-blue-500/30 dark:bg-blue-500/10 dark:border-blue-500/40'
          : 'bg-muted/40 border-border/50'
      }`}
    >
      <RefreshCw
        className={`w-4 h-4 flex-shrink-0 ${isEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}
      />
      <Label
        htmlFor={`auto-restart-${tokenId}`}
        className={`text-xs sm:text-sm font-semibold cursor-pointer flex-1 ${
          isEnabled ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'
        }`}
      >
        {isEnabled ? 'Автоперезапуск' : 'Без перезапуска'}
      </Label>

      {isEnabled && (
        <select
          value={attempts}
          onChange={(e) =>
            mutation.mutate({ ar: 1, ma: parseInt(e.target.value) })
          }
          disabled={mutation.isPending}
          className="text-xs bg-transparent border border-blue-500/30 rounded px-1 py-0.5 text-blue-700 dark:text-blue-300 cursor-pointer"
          aria-label="Максимум попыток перезапуска"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}x
            </option>
          ))}
        </select>
      )}

      <Switch
        id={`auto-restart-${tokenId}`}
        checked={isEnabled}
        onCheckedChange={(checked) =>
          mutation.mutate({ ar: checked ? 1 : 0, ma: attempts })
        }
        disabled={mutation.isPending}
      />
    </div>
  );
}
