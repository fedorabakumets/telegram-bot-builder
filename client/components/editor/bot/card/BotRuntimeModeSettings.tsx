/** @fileoverview Выбор режима жизни обработчика бота с пояснением памяти и задержек. */
import { useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SettingCard } from './SettingCard';
import { useBotRuntimeSettings, type BotRuntimeMode } from './use-bot-runtime-settings';

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
  { value: 'direct', label: 'Всегда активен', description: 'Обработчик постоянно в памяти. Ответ без ожидания пробуждения.' },
  { value: 'ondemand', label: 'Засыпает при простое', description: 'Сценарий выгружается после простоя. Общие библиотеки остаются в памяти; первый ответ может задержаться.' },
  { value: 'process', label: 'Освобождает память после простоя', description: 'Процесс обработчика завершается после простоя. При следующем сообщении запускается заново, поэтому первый ответ может задержаться.' },
] as const;

/**
 * Показывает сохранённый режим, ошибки загрузки и ограничения webhook.
 * @param props - Настройка конкретного бота и права пользователя.
 * @returns Поле выбора режима работы обработчика.
 */
export function BotRuntimeModeSettings({ projectId, tokenId, canManage, launchMode, onPendingChange, pendingRuntimeMode, settingsSaving = false }: BotRuntimeModeSettingsProps) {
  const { query, mutation } = useBotRuntimeSettings(projectId, tokenId);
  const [draft, setDraft] = useState<BotRuntimeMode | null>(null);
  useEffect(() => { setDraft(null); }, [projectId, tokenId]);
  const value = onPendingChange ? pendingRuntimeMode ?? query.data?.mode : draft ?? query.data?.mode;
  const selected = MODES.find((mode) => mode.value === value);
  const webhook = (launchMode ?? query.data?.launchMode) === 'webhook';
  const error = query.error ?? mutation.error;
  const descriptionId = `runtime-mode-description-${tokenId}`;

  /** Регистрирует изменение либо сохраняет его через API без перезапуска. */
  function changeMode(next: string) {
    const mode = next as BotRuntimeMode;
    if (onPendingChange) onPendingChange('BOT_POLLING_MODE', mode);
    else {
      setDraft(mode);
      mutation.mutate(mode, { onSuccess: () => setDraft(null), onError: () => setDraft(null) });
    }
  }

  return (
    <SettingCard icon={Cpu} title="Работа обработчика" description="Баланс памяти и скорости первого ответа" testId={`runtime-mode-${tokenId}`}>
      <div className="min-w-0 space-y-2">
        {query.isLoading ? <div className="h-8 animate-pulse rounded-md bg-muted" aria-label="Загрузка режима работы" /> : (
          <Select value={value} onValueChange={changeMode} disabled={!canManage || query.isError || mutation.isPending || settingsSaving}>
            <SelectTrigger className="h-auto min-h-8 w-full text-left text-xs [&>span]:whitespace-normal" aria-label="Режим работы обработчика" aria-describedby={descriptionId}>
              <SelectValue placeholder="Выберите режим работы" />
            </SelectTrigger>
            <SelectContent>
              {MODES.map((mode) => <SelectItem key={mode.value} value={mode.value} disabled={webhook && mode.value !== 'direct'} className="text-xs">{mode.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div id={descriptionId} className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          {selected && <p>{selected.description}</p>}
          {webhook && <p>Для webhook доступен режим «Всегда активен». Режимы со сном работают с polling.</p>}
          {value && value !== 'direct' && <p>Общий приёмник продолжает работать. Нулевой расход памяти не гарантируется. Для расписаний и фоновых задач выберите «Всегда активен».</p>}
          <p>Изменение применяется после сохранения и перезапуска бота.</p>
          {query.data?.source !== 'bot' && query.data && <p>Сейчас используется {query.data.source === 'server' ? 'настройка сервера' : 'режим по умолчанию'}.</p>}
          {!canManage && <p>Изменять режим может владелец или участник с правом управления.</p>}
        </div>
        {error && <div role="alert" className="text-xs text-destructive">{error instanceof Error ? error.message : 'Не удалось получить настройку'}{query.isError && <button type="button" className="ml-2 underline focus-visible:outline focus-visible:outline-2" onClick={() => void query.refetch()}>Повторить</button>}</div>}
      </div>
    </SettingCard>
  );
}
