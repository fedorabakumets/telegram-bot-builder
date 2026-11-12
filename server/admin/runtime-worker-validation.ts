/** @fileoverview Проверка настроек воркеров до первой записи в базу. */

/** Допустимые значения перечислений без скрытых исправлений ввода. */
const ENUMS: Record<string, readonly string[]> = {
  WORKER_GROUPING: ["project", "owner", "shared"],
  WORKER_RUNTIME: ["process", "docker", "remote"],
  BOT_POLLING_MODE: ["direct", "ondemand", "process"],
};

/** Проверяет переданные настройки; пустое значение восстанавливает наследование окружения. */
export function validateWorkerSettings(input: Record<string, unknown>): void {
  for (const [key, raw] of Object.entries(input)) {
    if (raw === undefined || raw === null || raw === "") continue;
    if (typeof raw !== "string" && typeof raw !== "number" && typeof raw !== "boolean") {
      throw new Error(`Настройка ${key} должна быть строкой, числом или флагом`);
    }
    const text = String(raw).trim();
    if (!text) continue;
    if (["BOT_ON_DEMAND_IDLE_SECONDS", "BOT_ON_DEMAND_MAX_ACTIVE", "WORKER_CPUS", "WORKER_MEMORY_LIMIT"].includes(key)
      && typeof raw === "boolean") throw new Error(`Настройка ${key} должна быть числом`);
    if (ENUMS[key] && !ENUMS[key].includes(text)) throw new Error(`Недопустимое значение ${key}`);
    if (["USE_WORKER_POOL", "WORKER_DOCKER_ISOLATE", "WORKER_DOCKER_UPLOADS_READONLY"].includes(key)
      && !["true", "false", "1", "0", "yes", "no"].includes(text)) throw new Error(`Недопустимый флаг ${key}`);
    if (key === "BOT_ON_DEMAND_IDLE_SECONDS") {
      const number = Number(text);
      if (!Number.isFinite(number) || number < 0.1 || number > 86400) throw new Error("Время простоя должно быть от 0,1 до 86400 секунд");
    }
    if (key === "BOT_ON_DEMAND_MAX_ACTIVE") {
      const number = Number(text);
      if (!Number.isInteger(number) || number < 0 || number > 64) throw new Error("Укажите 0 без ограничений либо целое число от 1 до 64");
    }
    if (key === "WORKER_CPUS" && (!Number.isFinite(Number(text)) || Number(text) <= 0)) throw new Error("Лимит CPU должен быть положительным числом");
    if (key === "WORKER_MEMORY_LIMIT" && !/^\d+(?:\.\d+)?[bkmg]?$/i.test(text)) throw new Error("Лимит памяти задаётся числом с суффиксом b, k, m или g");
  }
}
