/** @fileoverview Собирает все возможные старые сессии до проверки владения аккаунтом. */

/** Переменная пользовательского окружения. */
interface LegacyEnvironmentVariable {
  /** Имя переменной. */ key: string;
  /** Значение переменной. */ value: string;
}

/**
 * Возвращает уникальные сессии из записи токена и всех вариантов пользовательского окружения.
 * @param stored - Сессия из записи токена.
 * @param variables - Раскрытые переменные бота.
 * @returns Все непустые значения для проверки владельца.
 */
export function legacySessionCandidates(stored: string | null | undefined, variables: LegacyEnvironmentVariable[]): string[] {
  return [...new Set([stored, ...variables.filter(({ key }) => key.toUpperCase() === 'USERBOT_SESSION_STRING')
    .map(({ value }) => value)].filter((value): value is string => typeof value === 'string' && value.trim().length > 0))];
}
