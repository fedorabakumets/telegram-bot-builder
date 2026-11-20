/** @fileoverview Выбор способа получения обновлений для конкретного бота. */

/** Способ получения обновлений Telegram. */
export type BotLaunchMode = 'polling' | 'webhook';

/**
 * Выбирает режим проекта или индивидуальный режим бота.
 * @param projectDefaultLaunchMode - Режим по умолчанию для проекта.
 * @param tokenLaunchMode - Индивидуальный режим бота.
 * @param inheritLaunchMode - Явное наследование; старые записи сохраняют свой режим.
 * @returns Способ получения обновлений при следующем запуске.
 */
export function resolveBotLaunchMode(
  projectDefaultLaunchMode: string | null | undefined,
  tokenLaunchMode: string | null | undefined,
  inheritLaunchMode: boolean | null | undefined,
): BotLaunchMode {
  const mode = inheritLaunchMode === true ? projectDefaultLaunchMode : tokenLaunchMode;
  return mode === 'webhook' ? 'webhook' : 'polling';
}
