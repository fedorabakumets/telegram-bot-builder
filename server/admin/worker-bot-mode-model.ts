/** @fileoverview Сопоставление настроек бота с подтверждённым режимом работающего экземпляра. */
import type { WorkerBotRuntimeActivity, WorkerBotRuntimeMode, WorkerBotRuntimeRow } from '../../shared/worker-bot-runtime';
import { resolveRuntimeModeSettings } from '../bots/runtimeModePolicy';

/** Публичная запись базы данных, не содержащая токенов и секретов. */
export interface WorkerBotModeRecord {
  /** Идентификатор бота. */
  tokenId: number;
  /** Идентификатор проекта. */
  projectId: number;
  /** Название проекта. */
  projectName: string;
  /** Отображаемое имя бота. */
  botName: string;
  /** Публичное имя пользователя. */
  botUsername: string | null;
  /** Настройка транспорта. */
  launchMode: string | null;
  /** Сохранённый статус либо отсутствие экземпляра. */
  status: string | null;
  /** Последнее намерение запуска. */
  desiredStatus: string | null;
  /** Собственная переменная режима без остальных переменных бота. */
  configuredMode: string | null;
}
/** Свежая телеметрия запуска, привязанная к идентификатору бота. */
export interface WorkerBotActualMode {
  /** Подтверждённый режим. */
  mode: WorkerBotRuntimeMode | null;
  /** Фактическая группа. */
  workerKey: number | null;
  /** Наблюдаемое состояние сценария. */
  activity: WorkerBotRuntimeActivity;
  /** Подтверждена регистрация работающего экземпляра. */
  running: boolean;
}

/** Возвращает известный режим; повреждённые настройки не превращает в рабочий режим. */
export function knownWorkerBotMode(value: unknown): WorkerBotRuntimeMode | null {
  return value === 'direct' || value === 'ondemand' || value === 'process' ? value : null;
}

/** Собирает строку; неизвестную телеметрию не подменяет выбранной настройкой. */
export function toWorkerBotRuntimeRow(record: WorkerBotModeRecord,
  actual: WorkerBotActualMode | undefined, env: NodeJS.ProcessEnv = process.env): WorkerBotRuntimeRow {
  const configuredMode = knownWorkerBotMode(record.configuredMode);
  const variables = configuredMode ? [{ key: 'BOT_POLLING_MODE', value: configuredMode }] : [];
  let selected: ReturnType<typeof resolveRuntimeModeSettings> | null = null;
  let configurationError: string | null = null;
  try {
    if (record.configuredMode !== null && configuredMode === null) throw new Error('Некорректный режим бота');
    selected = resolveRuntimeModeSettings(variables, record.launchMode, env, record.tokenId);
  } catch {
    configurationError = record.configuredMode !== null ? 'Некорректный режим бота' : 'Некорректный общий режим';
  }
  const launchMode = record.launchMode === 'webhook' ? 'webhook' : 'polling';
  const status = record.status ?? 'stopped';
  const running = actual?.running ?? status === 'running';
  const actualMode = actual?.running ? actual.mode : null;
  const restartRequired = !running ? false : actualMode === null || selected === null ? null : actualMode !== selected.mode;
  const activity = actual?.activity ?? (status === 'error' ? 'error' : !running ? 'stopped' : 'unknown');
  return { tokenId: record.tokenId, projectId: record.projectId, projectName: record.projectName,
    botName: record.botName, botUsername: record.botUsername, configuredMode, effectiveMode: selected?.mode ?? null,
    configurationError, source: selected?.source ?? (record.configuredMode !== null ? 'bot' : 'server'),
    launchMode, status, desiredStatus: record.desiredStatus,
    actualMode, workerKey: actual?.workerKey ?? null, activity, restartRequired,
    transportCompatible: selected !== null && (launchMode !== 'webhook' || selected.mode === 'direct') };
}
