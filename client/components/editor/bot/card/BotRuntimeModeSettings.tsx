/** @fileoverview Выбор режима жизни обработчика бота с пояснением памяти и задержек. */
import { useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';
import { BotRuntimeSelect, SLEEP_OPTIONS } from './BotRuntimeSelect';
import { SettingCard } from './SettingCard';
import { useBotRuntimeSettings, type BotRuntimeModeChoice } from './use-bot-runtime-settings';

/** Свойства настройки режима работы. */
interface BotRuntimeModeSettingsProps {
  /** Идентификатор проекта. */
  projectId: number;
  /** Идентификатор токена. */
  tokenId: number;
  /** Право изменения настроек. */
  canManage: boolean;
  /** Выбранный способ получения обновлений, включая несохранённый выбор. */
  launchMode: string | null;
  /** Регистрация отложенного изменения общей формой настроек. */
  onPendingChange?: (key: string, value: string) => void;
  /** Несохранённое значение из общей очереди, включая очистку при отмене. */
  pendingRuntimeMode?: string;
  /** Общая форма сохраняет изменения. */
  settingsSaving?: boolean;
}

/** Доступные режимы с понятными пояснениями. */
const MODES = [
  { value: 'direct', label: 'Нет', description: 'Обычный режим: обработчик постоянно в памяти.' },
  { value: 'process', label: 'Да', description: 'Освобождает память при простое. Первое сообщение пробуждает обработчик, поэтому ответ может задержаться.' },
] as const;

/**
 * Показывает сохранённый режим, ошибки загрузки и ограничения webhook.
 * @param props - Настройка конкретного бота и права пользователя.
 * @returns Поле выбора режима работы обработчика.
 */
export function BotRuntimeModeSettings({ projectId, tokenId, canManage, launchMode, onPendingChange, pendingRuntimeMode, settingsSaving = false }: BotRuntimeModeSettingsProps) {
  const { query, mutation } = useBotRuntimeSettings(projectId, tokenId);
  const [draft, setDraft] = useState<BotRuntimeModeChoice | null>(null);
  useEffect(() => { setDraft(null); }, [projectId, tokenId]);
  const savedChoice = query.data?.inheritSleepMode ? 'inherit' : query.data?.mode;
  const value = onPendingChange ? pendingRuntimeMode ?? savedChoice : draft ?? savedChoice;
  /** Пустая настройка проекта означает включённый режим сна. */
  const inheritedMode = query.data?.projectSleepMode ?? 'process';
  const effective = value === 'inherit' ? inheritedMode : value;
  const selected = MODES.find((mode) => mode.value === effective);
  const inheritedLabel = inheritedMode === 'direct' ? 'Нет' : 'Да';
  /** Показывает наличие старой настройки без подмены её одним из новых вариантов. */
  const legacyMode = effective === 'ondemand';
  const webhook = (launchMode ?? query.data?.launchMode) === 'webhook';
  const error = query.error ?? mutation.error;
  const descriptionId = `runtime-mode-description-${tokenId}`;

  /** Регистрирует изменение либо сохраняет его через API без перезапуска. */
  function changeMode(next: string) {
    const mode = next as BotRuntimeModeChoice;
    if (onPendingChange) onPendingChange('BOT_POLLING_MODE', mode);
    else {
      setDraft(mode);
      mutation.mutate(mode, { onSuccess: () => setDraft(null), onError: () => setDraft(null) });
    }
  }

  return (
    <SettingCard icon={Cpu} title="Режим сна" description="Освобождает память при простое" testId={`runtime-mode-${tokenId}`}>
      <div className="min-w-0 space-y-2">
        {query.isLoading ? <div className="h-8 animate-pulse rounded-md bg-muted" aria-label="Загрузка режима работы" /> : (
          <BotRuntimeSelect label="Режим сна" descriptionId={descriptionId}
            value={value === 'inherit' ? value : selected?.value ?? ''} onChange={changeMode}
            disabled={!canManage || query.isError || mutation.isPending || settingsSaving}
            placeholder={legacyMode ? 'Сохранён прежний режим' : 'Выберите «Да» или «Нет»'}
            options={[{ value: 'inherit', label: `Как в проекте · ${inheritedLabel}` }, ...SLEEP_OPTIONS]} />
        )}
        <div id={descriptionId} className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          {selected && <p>{selected.description}</p>}
          {legacyMode && <p>Прежний режим действует до сохранения нового выбора и перезапуска.</p>}
          {effective === 'process' && <p>{webhook ? 'Входящий webhook сохраняет сообщение в очереди.' : 'Общий приёмник продолжает получать сообщения.'} Для расписаний и фоновых задач выберите «Нет».</p>}
          <p>Изменение применяется после сохранения и перезапуска бота.</p>
          {value === 'inherit' && selected && <p>Режим сна при наследовании: {selected.label.toLowerCase()}.</p>}
          {!canManage && <p>Изменять режим может владелец или участник с правом управления.</p>}
        </div>
        {error && <div role="alert" className="text-xs text-destructive">{error instanceof Error ? error.message : 'Не удалось получить настройку'}{query.isError && <button type="button" className="ml-2 underline focus-visible:outline focus-visible:outline-2" onClick={() => void query.refetch()}>Повторить</button>}</div>}
      </div>
    </SettingCard>
  );
}
