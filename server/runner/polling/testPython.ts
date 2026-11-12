/** @fileoverview Выбор интерпретатора для адресных тестов polling локально и в CI. */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Выбирает явный интерпретатор, локальное окружение или команду из PATH.
 * @param env - Переменные тестового запуска
 * @param platform - Платформа тестового процесса
 * @param exists - Проверка наличия локального интерпретатора
 * @returns Команда Python без преобразования команд из PATH в абсолютные пути
 */
export function testPython(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
  exists: (path: string) => boolean = existsSync,
): string {
  const explicit = env.RUNNER_PYTHON?.trim() || env.PYTHON?.trim();
  if (explicit) return explicit;
  const local = resolve(platform === "win32" ? ".venv/Scripts/python.exe" : ".venv/bin/python");
  return exists(local) ? local : "python";
}
