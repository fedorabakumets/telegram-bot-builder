/**
 * @fileoverview Сетка настроек бота
 *
 * Компонент объединяет все настройки бота в единую сетку:
 * - Настройки хранения данных бота
 * - Переключатель автоперезапуска
 * - Список администраторов
 * - История запусков
 *
 * Таймер времени работы вынесен в карточку (BotCard) — над всеми переключателями.
 *
 * @module BotSettingsGrid
 */

import { BotInheritedSettings } from './BotInheritedSettings';
import { BotRuntimeModeSettings } from './BotRuntimeModeSettings';
import { BotAutoRestartToggle } from './BotAutoRestartToggle';
import { BotAdminIds } from '../profile/BotAdminIds';
import { ProjectCollaborators } from '../profile/ProjectCollaborators';
import { BotLaunchHistory } from './BotLaunchHistory';
import { BotLaunchSettings } from './BotLaunchSettings';
import { effectiveLaunchMode } from './bot-launch-helpers';
import { BotTokenSettings } from './BotTokenSettings';
import { BotUserbotSettings } from './BotUserbotSettings';
import { SettingsSection } from './SettingsSection';
import type { BotProject, BotToken } from '@shared/schema';
import { resolveProjectBotSettings } from '@shared/bot-inherited-settings';

/** Пропсы сетки настроек бота */
interface BotSettingsGridProps {
  /** ID проекта */
  projectId: number;
  /** Имеет ли текущий пользователь права управления (владелец или коллаборатор) */
  canManage: boolean;
  /** ID токена */
  tokenId: number;
  /** Имя бота (для передачи в историю запусков) */
  botName?: string;
  /** Включена ли база данных пользователей (1 — да, 0/null — нет) */
  userDatabaseEnabled: number | null;
  /** Данные токена для настроек автоперезапуска */
  token: BotToken;
  /** Проектные значения автоперезапуска. */
  restartDefaults: Pick<BotProject, 'defaultAutoRestart' | 'defaultMaxRestartAttempts'>;
  /** Общие значения наследуемых настроек. */
  inheritedDefaults: BotProject['botSettingDefaults'];
  /** Получает несохранённое значение из очереди. */
  getPendingValue?: (key: string) => string | undefined;
  /** Режим запуска бота */
  launchMode: string | null;
  /** Способ получения обновлений из настроек проекта. */
  projectLaunchMode?: string | null;
  /** Базовый URL для webhook */
  webhookBaseUrl: string | null;
  /** Секретный токен webhook */
  webhookSecretToken: string | null;
  /** Секрет вебхука сохранён на сервере и не раскрывается клиенту. */
  hasWebhookSecret?: boolean;
  /** Колбэк для добавления изменения в pending */
  onPendingChange?: (key: string, value: string) => void;
  /** Показывать блок истории запусков (на холсте история — отдельная вкладка) */
  showLaunchHistory?: boolean;
  /** Показывать коллабораторов (на холсте — отдельная вкладка) */
  showCollaborators?: boolean;
  /** Live-статус бота для истории (не показывать orphan как Онлайн) */
  isLiveRunning?: boolean;
  /** Несохранённый режим обработчика из общей очереди. */
  pendingRuntimeMode?: string;
  /** Несохранённый способ получения обновлений из общей очереди. */
  pendingLaunchMode?: string;
  /** Черновик включения автоперезапуска. */
  pendingAutoRestart?: string;
  /** Черновик числа попыток автоперезапуска. */
  pendingMaxAttempts?: string;
  /** Выполняется сохранение общей очереди. */
  settingsSaving?: boolean;
}

/**
 * Сетка настроек бота
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotSettingsGrid({
  projectId,
  tokenId,
  botName,
  userDatabaseEnabled,
  token,
  restartDefaults,
  inheritedDefaults,
  getPendingValue,
  launchMode,
  projectLaunchMode,
  webhookBaseUrl,
  webhookSecretToken,
  hasWebhookSecret,
  canManage,
  onPendingChange,
  showLaunchHistory = true,
  showCollaborators = true,
  isLiveRunning = false,
  pendingRuntimeMode,
  pendingLaunchMode,
  pendingAutoRestart,
  pendingMaxAttempts,
  settingsSaving,
}: BotSettingsGridProps) {
  const resolvedBotName = botName ?? `Бот ${tokenId}`;
  const launchModeChoice = pendingLaunchMode ?? launchMode;

  return (
    <div className="space-y-6">
      <SettingsSection title="Запуск">
        <BotTokenSettings
          projectId={projectId}
          tokenId={tokenId}
          token={token.token}
        />
        <BotLaunchSettings
          tokenId={tokenId}
          projectId={projectId}
          launchMode={launchModeChoice}
          projectLaunchMode={projectLaunchMode}
          webhookBaseUrl={getPendingValue?.('WEBHOOK_BASE_URL')
            ?? (token.inheritBotSettings?.includes('webhookBaseUrl') ? 'inherit' : webhookBaseUrl)}
          projectWebhookBaseUrl={resolveProjectBotSettings(inheritedDefaults).webhookBaseUrl}
          addressDisabled={!canManage || !!settingsSaving}
          webhookSecretToken={getPendingValue?.('WEBHOOK_SECRET_TOKEN') ?? webhookSecretToken}
          hasWebhookSecret={hasWebhookSecret}
          onPendingChange={onPendingChange}
        />
        <BotRuntimeModeSettings projectId={projectId} tokenId={tokenId} canManage={canManage}
          launchMode={effectiveLaunchMode(launchModeChoice, projectLaunchMode)} onPendingChange={onPendingChange}
          pendingRuntimeMode={pendingRuntimeMode} settingsSaving={settingsSaving} />
        <BotAutoRestartToggle
          projectId={projectId}
          token={token}
          defaults={restartDefaults}
          canManage={canManage}
          pendingAutoRestart={pendingAutoRestart}
          pendingMaxAttempts={pendingMaxAttempts}
          settingsSaving={settingsSaving}
          onPendingChange={onPendingChange}
        />
      </SettingsSection>

      <SettingsSection title="Данные">
        {userDatabaseEnabled === 1 ? (
          <BotInheritedSettings section="data" projectId={projectId} token={token} defaults={inheritedDefaults}
            disabled={!canManage || !!settingsSaving} getPendingValue={getPendingValue} onPendingChange={onPendingChange} />
        ) : (
          <p className="text-sm text-muted-foreground">База данных пользователей выключена в настройках проекта.</p>
        )}
      </SettingsSection>

      <SettingsSection title="Логи и поведение">
        <BotInheritedSettings section="behavior" projectId={projectId} token={token} defaults={inheritedDefaults}
          disabled={!canManage || !!settingsSaving} getPendingValue={getPendingValue} onPendingChange={onPendingChange} />
      </SettingsSection>

      <SettingsSection title="Администраторы">
        <BotAdminIds projectId={projectId} onPendingChange={onPendingChange} />
      </SettingsSection>

      {showCollaborators && (
        <SettingsSection title="Владельцы">
          <ProjectCollaborators projectId={projectId} canManage={canManage} />
        </SettingsSection>
      )}

      <SettingsSection title="Дополнительно">
        <BotUserbotSettings
          projectId={projectId}
          tokenId={tokenId}
          userbotEnabled={token.userbotEnabled ?? 0}
          userbotApiId={token.userbotApiId ?? null}
          userbotApiHash={token.userbotApiHash ?? null}
          userbotSessionString={token.userbotSessionString ?? null}
          onPendingChange={onPendingChange}
        />
      </SettingsSection>

      {showLaunchHistory && (
        <SettingsSection title="История запусков">
          <BotLaunchHistory
            tokenId={tokenId}
            projectId={projectId}
            botName={resolvedBotName}
            compact
            isLiveRunning={isLiveRunning}
          />
        </SettingsSection>
      )}
    </div>
  );
}
