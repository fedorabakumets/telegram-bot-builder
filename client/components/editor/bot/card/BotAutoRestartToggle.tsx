/**
 * @fileoverview Переключатель автоперезапуска бота при краше
 * Позволяет включить/выключить автоперезапуск и задать максимальное число попыток.
 * @module BotAutoRestartToggle
 */

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
import { useEffect, useState } from 'react';
import { SettingCard } from './SettingCard';

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
  /** Колбэк для pending (если передан — не сохраняет мгновенно) */
  onPendingChange?: (autoRestart: string, maxAttempts: string) => void;
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
  onPendingChange,
}: BotAutoRestartToggleProps) {
  const [localEnabled, setLocalEnabled] = useState(autoRestart === 1);
  const [localAttempts, setLocalAttempts] = useState(maxRestartAttempts ?? 3);
  const queryClient = useQueryClient();

  useEffect(() => {
    setLocalEnabled(autoRestart === 1);
    setLocalAttempts(maxRestartAttempts ?? 3);
  }, [autoRestart, maxRestartAttempts]);

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
    <SettingCard
      icon={RefreshCw}
      title="Перезапуск при сбое"
      description={
        localEnabled
          ? 'Бот автоматически перезапустится если упадёт с ошибкой'
          : 'Бот останется выключенным после сбоя'
      }
      active={localEnabled}
      className={className}
      action={
        <Switch
          id={`auto-restart-${tokenId}`}
          aria-label="Перезапуск при сбое"
          checked={localEnabled}
          onCheckedChange={(checked) => {
            setLocalEnabled(checked);
            if (onPendingChange) {
              onPendingChange(checked ? '1' : '0', String(localAttempts));
            } else {
              mutation.mutate({ ar: checked ? 1 : 0, ma: localAttempts });
            }
          }}
          disabled={mutation.isPending}
        />
      }
    >
      {localEnabled && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Максимум попыток</span>
          <Select
            value={String(localAttempts)}
            onValueChange={(val) => {
              const ma = parseInt(val);
              setLocalAttempts(ma);
              if (onPendingChange) {
                onPendingChange('1', String(ma));
              } else {
                mutation.mutate({ ar: 1, ma });
              }
            }}
            disabled={mutation.isPending}
          >
            <SelectTrigger className="h-7 w-28 text-xs">
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
        </div>
      )}
    </SettingCard>
  );
}
