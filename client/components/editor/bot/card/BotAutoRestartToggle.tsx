/** @fileoverview Независимые настройки включения и лимита автоперезапуска бота. */
import { RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { BotRuntimeSelect, RESTART_ATTEMPT_OPTIONS } from './BotRuntimeSelect';
import { resolveBotAutoRestart } from '@shared/bot-execution-settings';
import type { BotProject, BotToken } from '@shared/schema';
import { SettingCard } from './SettingCard';

/** Изменяемые поля автоперезапуска. */
type RestartKey = 'AUTO_RESTART' | 'MAX_RESTART_ATTEMPTS';

/** Свойства настройки автоперезапуска. */
interface BotAutoRestartToggleProps {
  /** Идентификатор проекта. */
  projectId: number;
  /** Индивидуальные значения и признаки наследования бота. */
  token: Pick<BotToken, 'id' | 'autoRestart' | 'maxRestartAttempts' | 'inheritAutoRestart' | 'inheritMaxRestartAttempts'>;
  /** Проектные значения. */
  defaults: Pick<BotProject, 'defaultAutoRestart' | 'defaultMaxRestartAttempts'>;
  /** Может ли пользователь менять настройки. */
  canManage: boolean;
  /** Выбор источника или флага в общей очереди. */
  pendingAutoRestart?: string;
  /** Выбор источника или лимита в общей очереди. */
  pendingMaxAttempts?: string;
  /** Выполняется сохранение общего черновика. */
  settingsSaving?: boolean;
  /** Регистрирует только изменённое поле. */
  onPendingChange?: (key: RestartKey, value: string) => void;
}

/**
 * Позволяет настроить включение и число попыток отдельно друг от друга.
 * @param props - Значения, права и очередь сохранения.
 * @returns Контролы автоперезапуска.
 */
export function BotAutoRestartToggle({
  projectId, token, defaults, canManage, pendingAutoRestart, pendingMaxAttempts, settingsSaving, onPendingChange,
}: BotAutoRestartToggleProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ key, value }: { key: RestartKey; value: string }) => {
      const field = key === 'AUTO_RESTART' ? 'autoRestart' : 'maxRestartAttempts';
      return apiRequest('PUT', `/api/projects/${projectId}/tokens/${token.id}/auto-restart`, {
        [field]: value === 'inherit' ? value : Number(value),
      });
    },
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] }),
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/launch-default`] }),
    ]),
  });
  const enabled = pendingAutoRestart ?? (token.inheritAutoRestart ? 'inherit' : String(token.autoRestart ?? 0));
  const attempts = pendingMaxAttempts ?? (token.inheritMaxRestartAttempts ? 'inherit' : String(token.maxRestartAttempts ?? 3));
  const effective = resolveBotAutoRestart(defaults, {
    inheritAutoRestart: enabled === 'inherit',
    autoRestart: Number(enabled),
    inheritMaxRestartAttempts: attempts === 'inherit',
    maxRestartAttempts: Number(attempts),
  });
  const disabled = !canManage || settingsSaving || mutation.isPending;

  /**
   * Добавляет изменение в общую форму или сохраняет отдельное поле.
   * @param key - Ключ изменённого поля.
   * @param value - Значение или признак наследования.
   */
  function change(key: RestartKey, value: string) {
    if (onPendingChange) onPendingChange(key, value);
    else mutation.mutate({ key, value });
  }

  return (
    <SettingCard
      icon={RefreshCw}
      title="Перезапуск при сбое"
      description={effective.autoRestart ? 'Бот перезапустится после сбоя' : 'Бот останется выключенным после сбоя'}
      active={effective.autoRestart}
    >
      <div className="space-y-2">
        <BotRuntimeSelect label="Перезапуск при сбое" value={enabled} disabled={disabled}
          options={[
            { value: 'inherit', label: `Как в проекте · ${defaults.defaultAutoRestart === 1 ? 'Включено' : 'Выключено'}` },
            { value: '1', label: 'Включено для бота' },
            { value: '0', label: 'Выключено для бота' },
          ]} onChange={(value) => change('AUTO_RESTART', value)} />
        <BotRuntimeSelect label="Максимум попыток перезапуска" value={attempts} disabled={disabled}
          options={[{ value: 'inherit', label: `Как в проекте · лимит ${defaults.defaultMaxRestartAttempts ?? 3}` }, ...RESTART_ATTEMPT_OPTIONS]}
          onChange={(value) => change('MAX_RESTART_ATTEMPTS', value)} />
        {!effective.autoRestart && <p className="text-xs text-muted-foreground">Лимит действует при включённом перезапуске.</p>}
        {mutation.error && <p role="alert" className="text-xs text-destructive">{mutation.error.message}</p>}
      </div>
    </SettingCard>
  );
}
