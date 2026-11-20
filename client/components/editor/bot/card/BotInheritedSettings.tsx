/** @fileoverview Настройки данных и поведения бота с выбором источника значения. */
import { Camera, Clock3, FileText, Layers, Shield, UserRoundCheck, Users, Workflow } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resolveBotInheritedSettings, resolveProjectBotSettings } from '@shared/bot-inherited-settings';
import type { BotProject, BotToken } from '@shared/schema';
import { LOG_LEVELS } from './log-level-options';
import { RETENTION_OPTIONS } from './messages-retention-options';
import { SettingCard } from './SettingCard';
import { IncomingMediaStorageHint } from '../incoming-media-storage-hint';

/** Варианты явного включения или выключения. */
const FLAG_OPTIONS = [{ value: '1', label: 'Включено' }, { value: '0', label: 'Выключено' }];

/** Настройки, доступные при включённой базе пользователей. */
const DATA_CONTROLS = [
  { field: 'saveIncomingMedia', key: 'SAVE_INCOMING_MEDIA', title: 'Сохранять входящие фото', icon: Camera, options: FLAG_OPTIONS },
  { field: 'messagesRetentionDays', key: 'MESSAGES_RETENTION_DAYS', title: 'Хранить сообщения', icon: Clock3, options: RETENTION_OPTIONS, description: 'Очистка старых сообщений сохраняет статистику активности.' },
  { field: 'contentCache', key: 'CONTENT_CACHE', title: 'Живое обновление контента', icon: Layers, options: FLAG_OPTIONS },
] as const;

/** Настройки логов и поведения. */
const BEHAVIOR_CONTROLS = [
  { field: 'logLevel', key: 'LOG_LEVEL', title: 'Уровень логирования', icon: FileText, options: LOG_LEVELS, description: 'Детализация вывода в терминал' },
  { field: 'catchAllHandlers', key: 'CATCH_ALL_HANDLERS', title: 'Catch-all обработчики', icon: Workflow, options: FLAG_OPTIONS, description: 'Некоторые узлы сценария могут включать обработку всех сообщений независимо от этого значения.' },
  { field: 'trackUserBlocks', key: 'TRACK_USER_BLOCKS', title: 'Отслеживать блокировки', icon: UserRoundCheck, options: FLAG_OPTIONS, description: 'Отслеживает блокировки и разблокировки бота пользователями' },
  { field: 'trackGroupMembership', key: 'TRACK_GROUP_MEMBERSHIP', title: 'Отслеживать группы', icon: Users, options: FLAG_OPTIONS, description: 'Отслеживает добавление бота в группы и удаление из них' },
  { field: 'protectContent', key: 'PROTECT_CONTENT', title: 'Защита от копирования', icon: Shield, options: FLAG_OPTIONS, description: 'Запрещает пересылку и сохранение сообщений бота' },
] as const;

/** Свойства блока настроек с наследованием. */
interface BotInheritedSettingsProps {
  /** Какой раздел формы отображается. */
  section: 'data' | 'behavior';
  /** Проект для ссылки на сохранённые фото. */
  projectId: number;
  /** Индивидуальные настройки бота и источники полей. */
  token: BotToken;
  /** Проектные значения по умолчанию. */
  defaults: BotProject['botSettingDefaults'];
  /** Доступно ли редактирование настроек. */
  disabled: boolean;
  /** Возвращает выбранное, но ещё не сохранённое значение. */
  getPendingValue?: (key: string) => string | undefined;
  /** Вносит изменение в общую очередь. */
  onPendingChange?: (key: string, value: string) => void;
}

/**
 * Показывает фактическое проектное значение и позволяет переопределить каждое поле независимо.
 * @param props - Раздел, проектные и индивидуальные значения.
 * @returns Список настроек выбранного раздела.
 */
export function BotInheritedSettings({
  section, projectId, token, defaults, disabled, getPendingValue, onPendingChange,
}: BotInheritedSettingsProps) {
  const projectValues = resolveProjectBotSettings(defaults);
  const effectiveValues = resolveBotInheritedSettings(defaults, token);
  const controls = section === 'data' ? DATA_CONTROLS : BEHAVIOR_CONTROLS;
  return controls.map((control) => {
    const { field, key, title, icon, options } = control;
    const inherited = token.inheritBotSettings?.includes(field);
    const value = getPendingValue?.(key) ?? (inherited ? 'inherit' : String(effectiveValues[field]));
    const projectValue = projectValues[field];
    const projectLabel = options.find((option) => String(option.value) === String(projectValue))?.label;
    const legacyValue = value !== 'inherit' && !options.some((option) => String(option.value) === value);
    const selectedNumber = value === 'inherit' ? Number(projectValue) : Number(value);
    const savedRetention = Number(effectiveValues.messagesRetentionDays);
    const shortened = field === 'messagesRetentionDays' && selectedNumber > 0
      && (savedRetention === 0 || selectedNumber < savedRetention);
    const description = field === 'saveIncomingMedia'
      ? <IncomingMediaStorageHint projectId={projectId} enabled={selectedNumber === 1} />
      : 'description' in control ? control.description : undefined;
    return (
      <SettingCard key={key} icon={icon} title={title} description={description}>
        <Select value={value} disabled={disabled || !onPendingChange} onValueChange={(next) => onPendingChange?.(key, next)}>
          <SelectTrigger className="min-h-8 w-full text-left text-xs [&>span]:whitespace-normal" aria-label={title}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inherit">Как в проекте · {projectLabel ?? String(projectValue)}</SelectItem>
            {legacyValue && <SelectItem value={value} disabled>Своя настройка · {value === 'null' ? 'не задана' : value}</SelectItem>}
            {options.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>{option.label} · для бота</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {shortened && (
          <p role="status" className="mt-2 text-xs text-muted-foreground">
            При сокращении срока сообщения старше выбранного срока могут быть удалены автоматически.
          </p>
        )}
      </SettingCard>
    );
  });
}
