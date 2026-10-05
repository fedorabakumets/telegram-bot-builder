/**
 * @fileoverview Значения из админки поверх переменных окружения.
 * Пустой оверлей оставляет process.env. Чужой объект env в тестах оверлей не трогает.
 * @module server/services/runtime-overlay
 */

/** Сохранённые в админке значения по имени переменной */
const overlay = new Map<string, string>();

/**
 * Заменяет оверлей целиком. Пустые строки не кладёт: тогда снова читается env.
 * @param values - Имя переменной → непустое значение
 */
export function setRuntimeOverlay(values: Record<string, string>): void {
  overlay.clear();
  for (const [name, value] of Object.entries(values)) {
    const trimmed = value.trim();
    if (trimmed) overlay.set(name, trimmed);
  }
}

/**
 * Читает настройку: из админки, если смотрим живой process.env и значение сохранено.
 * @param name - Имя переменной
 * @param env - Окружение; по умолчанию process.env
 * @returns Строка или undefined
 */
export function runtimeEnv(name: string, env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (env === process.env) {
    const saved = overlay.get(name);
    if (saved) return saved;
  }
  const raw = env[name];
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed || undefined;
}

/**
 * Включён ли флаг true/1/yes
 * @param name - Имя переменной
 * @param env - Окружение
 * @returns true, если значение одно из true/1/yes
 */
export function runtimeFlag(name: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const value = runtimeEnv(name, env)?.toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}
