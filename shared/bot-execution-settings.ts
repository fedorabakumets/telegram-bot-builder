/** @fileoverview Разрешение наследуемых настроек обработчика и автоперезапуска. */

/** Режимы обработчика, доступные для всего проекта. */
export type ProjectSleepMode = 'direct' | 'process';

/**
 * Выбирает режим обработчика проекта для наследующего бота.
 * @param projectDefault - Значение проекта; пустое значение включает режим сна.
 * @param inherited - Признак наследования этого поля.
 * @returns Режим проекта или undefined для обычного разрешения токена и сервера.
 */
export function resolveProjectSleepMode(
  projectDefault?: string | null, inherited?: boolean | null,
): ProjectSleepMode | undefined {
  return inherited === true ? (projectDefault === 'direct' ? 'direct' : 'process') : undefined;
}

/** Поля проекта, определяющие автоперезапуск. */
interface ProjectRestartSettings {
  /** Автоперезапуск при ошибке бота. */
  defaultAutoRestart?: number | null;
  /** Лимит попыток автоперезапуска. */
  defaultMaxRestartAttempts?: number | null;
}

/** Индивидуальные значения и независимые признаки наследования бота. */
interface BotRestartSettings {
  /** Индивидуально включённый автоперезапуск. */
  autoRestart?: number | null;
  /** Индивидуальный лимит попыток. */
  maxRestartAttempts?: number | null;
  /** Использовать общее значение включения автоперезапуска. */
  inheritAutoRestart?: boolean | null;
  /** Использовать общий лимит попыток. */
  inheritMaxRestartAttempts?: boolean | null;
}

/**
 * Разрешает флаг автоперезапуска и лимит попыток независимо друг от друга.
 * @param project - Настройки проекта.
 * @param token - Индивидуальные настройки и признаки наследования.
 * @returns Действующие настройки автоперезапуска.
 */
export function resolveBotAutoRestart(
  project: ProjectRestartSettings | null | undefined, token: BotRestartSettings,
) {
  const autoRestart = token.inheritAutoRestart === true ? project?.defaultAutoRestart : token.autoRestart;
  const maxAttempts = token.inheritMaxRestartAttempts === true ? project?.defaultMaxRestartAttempts : token.maxRestartAttempts;
  return { autoRestart: autoRestart === 1, maxRestartAttempts: maxAttempts ?? 3 };
}
