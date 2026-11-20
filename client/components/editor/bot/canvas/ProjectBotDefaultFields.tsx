/** @fileoverview Поля базового адреса, данных, журнала и поведения ботов проекта. */
import { Clock, FileText, Globe, ImageIcon, Inbox, RefreshCw, ShieldCheck, UserRoundCheck, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SettingCard } from '../card/SettingCard';
import { SettingsSection } from '../card/SettingsSection';
import { BotRuntimeSelect } from '../card/BotRuntimeSelect';
import { LOG_LEVELS, type LogLevel } from '../card/log-level-options';
import { normalizeRetentionDays, RETENTION_OPTIONS } from '../card/messages-retention-options';
import type { ProjectBotSettingDefaults } from './use-project-bot-setting-defaults';

/** Свойства полей расширенных настроек проекта. */
interface ProjectBotDefaultFieldsProps {
  /** Сохранённые значения с учётом черновика. */
  values: ProjectBotSettingDefaults;
  /** Запрещает изменение полей во время записи. */
  disabled: boolean;
  /** Обновляет отдельное поле черновика. */
  onChange: (patch: Partial<ProjectBotSettingDefaults>) => void;
}

/** Переключатели в разделе данных. */
const DATA_FLAGS = [
  { key: 'saveIncomingMedia', title: 'Сохранять входящие фото', icon: ImageIcon },
  { key: 'contentCache', title: 'Живое обновление контента', icon: RefreshCw },
] as const;

/** Переключатели в разделе поведения. */
const BEHAVIOR_FLAGS = [
  { key: 'catchAllHandlers', title: 'Catch-all обработчики', icon: Inbox },
  { key: 'trackUserBlocks', title: 'Отслеживать блокировки', icon: UserRoundCheck },
  { key: 'trackGroupMembership', title: 'Отслеживать группы', icon: Users },
  { key: 'protectContent', title: 'Защита от копирования', icon: ShieldCheck },
] as const;

/** Строковые значения срока для общего компонента списка. */
const HISTORY_OPTIONS = RETENTION_OPTIONS.map(({ value, label }) => ({
  value: String(value), label: value === 0 ? 'Без ограничения' : label,
}));

/**
 * Показывает поля в тех же разделах, что и настройки отдельного бота.
 * @param props - Значения и обработчик изменения.
 * @returns Разделы настройки проекта.
 */
export function ProjectBotDefaultFields({ values, disabled, onChange }: ProjectBotDefaultFieldsProps) {
  /** Показывает флаг политики и сохраняет только его изменение в черновик. */
  const renderFlag = ({ key, title, icon }: (typeof DATA_FLAGS | typeof BEHAVIOR_FLAGS)[number]) => (
    <SettingCard key={key} icon={icon} title={title} active={values[key] === 1}
      action={<Switch aria-label={title} checked={values[key] === 1} disabled={disabled}
        onCheckedChange={(checked) => onChange({ [key]: checked ? 1 : 0 })} />} />
  );
  return (
    <>
      <SettingsSection title="Webhook">
        <SettingCard icon={Globe} title="Базовый адрес webhook"
          description="Оставьте поле пустым, чтобы использовать адрес сервера. Путь и секрет создаются для каждого бота.">
          <Input type="url" autoComplete="off" aria-label="Базовый адрес webhook" placeholder="https://example.com"
            value={values.webhookBaseUrl ?? ''}
            onChange={(event) => onChange({ webhookBaseUrl: event.target.value || null })} />
        </SettingCard>
      </SettingsSection>
      <SettingsSection title="Данные">
        {renderFlag(DATA_FLAGS[0])}
        <SettingCard icon={Clock} title="Хранить сообщения" description="Старые сообщения удаляются по выбранному сроку.">
          <BotRuntimeSelect label="Хранить сообщения" value={String(values.messagesRetentionDays)}
            options={HISTORY_OPTIONS} disabled={disabled}
            onChange={(value) => onChange({ messagesRetentionDays: normalizeRetentionDays(Number(value)) })} />
        </SettingCard>
        {renderFlag(DATA_FLAGS[1])}
      </SettingsSection>
      <SettingsSection title="Логи и поведение">
        <SettingCard icon={FileText} title="Уровень логирования" description="Детализация вывода в терминал.">
          <BotRuntimeSelect label="Уровень логирования" value={values.logLevel} options={LOG_LEVELS}
            disabled={disabled} onChange={(value) => onChange({ logLevel: value as LogLevel })} />
        </SettingCard>
        {BEHAVIOR_FLAGS.map(renderFlag)}
      </SettingsSection>
    </>
  );
}
